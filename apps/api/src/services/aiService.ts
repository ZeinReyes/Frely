/**
 * OpenRouter AI Service
 * Docs: https://openrouter.ai/docs
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const APP_URL            = process.env.FRONTEND_URL || 'http://localhost:3000';

// Fallback chain — first healthy model wins.
// If AI_MODEL is set in .env, it's added as first choice but still falls back to the rest.
const MODEL_FALLBACKS = [
  ...(process.env.AI_MODEL ? [process.env.AI_MODEL] : []),
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-3-27b-it:free',
  'deepseek/deepseek-r1-distill-qwen-14b:free',
].filter((v, i, arr) => arr.indexOf(v) === i); // dedupe

const RETRY_ATTEMPTS = 2;
const RETRY_BASE_MS  = 1000;

interface Message {
  role:    'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: { message: { content: string } }[];
  error?:  { message: string; code: number };
}

function sleep(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms));
}

// ─────────────────────────────────────────
// CORE COMPLETION (with fallback + retry)
// ─────────────────────────────────────────
export async function complete(
  messages: Message[],
  options?: { model?: string; maxTokens?: number; temperature?: number }
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured in .env');
  }

  // Caller-specified model is tried first, then falls back to the rest of the chain
  const models = options?.model
    ? [options.model, ...MODEL_FALLBACKS.filter(m => m !== options.model)]
    : MODEL_FALLBACKS;

  let lastError: Error = new Error('No models available');

  for (const model of models) {
    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      let data: OpenRouterResponse;

      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method:  'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type':  'application/json',
            'HTTP-Referer':  APP_URL,
            'X-Title':       'Frely',
          },
          body: JSON.stringify({
            model,
            max_tokens:  options?.maxTokens   || 2000,
            temperature: options?.temperature ?? 0.7,
            messages,
          }),
        });

        data = await response.json() as OpenRouterResponse;
      } catch (networkErr) {
        console.error(`[aiService] Network error for ${model}:`, networkErr);
        lastError = networkErr as Error;
        break;
      }

      const errCode    = data.error?.code;
      const errMessage = data.error?.message || 'Unknown error';

      if (errCode === 404 || errCode === 503) {
        console.warn(`[aiService] Model unavailable (${errCode}), skipping: ${model}`);
        lastError = new Error(errMessage);
        break;
      }

      if (errCode === 429) {
        if (attempt === RETRY_ATTEMPTS) {
          console.warn(`[aiService] Rate limit exhausted for ${model}, trying next model`);
          lastError = new Error(errMessage);
          break;
        }
        const delay = RETRY_BASE_MS * attempt;
        console.warn(`[aiService] Rate limited on ${model}, retrying in ${delay}ms (${attempt}/${RETRY_ATTEMPTS})`);
        await sleep(delay);
        continue;
      }

      if (data.error) {
        console.warn(`[aiService] Provider error on ${model} [code=${errCode}]: ${errMessage}`);
        if (attempt < RETRY_ATTEMPTS) {
          await sleep(RETRY_BASE_MS);
          continue;
        }
        lastError = new Error(`[${model}] ${errMessage}`);
        break;
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        console.warn(`[aiService] Empty response from ${model}`);
        lastError = new Error(`Empty response from ${model}`);
        break;
      }

      if (model !== models[0]) {
        console.info(`[aiService] Served by fallback model: ${model}`);
      }
      return content;
    }
  }

  throw lastError;
}

// ─────────────────────────────────────────
// GENERATE PROPOSAL
// ─────────────────────────────────────────
export interface ProposalAIInput {
  projectDescription: string;
  clientName:         string;
  freelancerName:     string;
  currency:           string;
}

export interface ProposalAIOutput {
  title:        string;
  introduction: string;
  scope:        string;
  terms:        string;
  lineItems:    { description: string; quantity: number; unitPrice: number; amount: number }[];
  notes:        string;
}

export async function generateProposal(input: ProposalAIInput): Promise<ProposalAIOutput> {
  const prompt = `You are a professional freelancer writing a business proposal. Generate a complete proposal based on this description:

Project: ${input.projectDescription}
Client: ${input.clientName}
Freelancer: ${input.freelancerName}
Currency: ${input.currency}

Respond with ONLY a valid JSON object (no markdown, no backticks) with this exact structure:
{
  "title": "proposal title",
  "introduction": "2-3 paragraph professional introduction",
  "scope": "detailed scope of work with deliverables",
  "terms": "payment terms, revision policy, timeline",
  "lineItems": [
    { "description": "item name", "quantity": 1, "unitPrice": 500, "amount": 500 }
  ],
  "notes": "any additional notes"
}

Make the pricing realistic for a freelancer. Include 3-5 line items.`;

  const result = await complete([{ role: 'user', content: prompt }], { temperature: 0.7 });

  try {
    return JSON.parse(result.replace(/```json|```/g, '').trim()) as ProposalAIOutput;
  } catch {
    throw new Error('Failed to parse AI proposal response');
  }
}

// ─────────────────────────────────────────
// GENERATE CONTRACT CLAUSES
// ─────────────────────────────────────────
export async function generateContractClauses(description: string): Promise<string> {
  const prompt = `You are a legal professional helping a freelancer write contract clauses. 
Generate professional contract clauses based on this request: "${description}"

IMPORTANT FORMATTING RULES:
- Do NOT use markdown formatting (no **, no *, no #, no bullet points with *)
- Use plain numbered format only: "1. CLAUSE NAME\n\nClause text here."
- Use plain text dashes (-) for sub-points if needed
- Write in plain prose, no bold, no italic
- Keep it concise and practical for a freelancer.`;

  return complete([{ role: 'user', content: prompt }], { temperature: 0.5 });
}

// ─────────────────────────────────────────
// GENERATE CLIENT EMAIL
// ─────────────────────────────────────────
export type EmailScenario =
  | 'follow_up_invoice'
  | 'project_update'
  | 'request_feedback'
  | 'project_completion'
  | 'payment_overdue'
  | 'custom';

export interface EmailAIInput {
  scenario:       EmailScenario;
  clientName:     string;
  freelancerName: string;
  context?:       string;
  invoiceNumber?: string;
  amount?:        string;
  projectName?:   string;
}

export async function generateClientEmail(input: EmailAIInput): Promise<{ subject: string; body: string }> {
  const scenarioDescriptions: Record<EmailScenario, string> = {
    follow_up_invoice:  `Follow up on unpaid invoice ${input.invoiceNumber || ''} for ${input.amount || ''}`,
    project_update:     `Project status update for ${input.projectName || 'the project'}`,
    request_feedback:   `Request feedback/testimonial from client`,
    project_completion: `Announce project completion for ${input.projectName || 'the project'}`,
    payment_overdue:    `Politely remind about overdue payment of ${input.amount || ''} for invoice ${input.invoiceNumber || ''}`,
    custom:             input.context || 'Write a professional email',
  };

  const prompt = `Write a professional, friendly email from a freelancer to a client.

Scenario: ${scenarioDescriptions[input.scenario]}
From: ${input.freelancerName}
To: ${input.clientName}
${input.context ? `Additional context: ${input.context}` : ''}

Respond with ONLY a valid JSON object (no markdown, no backticks):
{
  "subject": "email subject line",
  "body": "full email body (use \\n for line breaks)"
}

Keep it professional but warm. Be concise. Do not include placeholders like [Your Name].`;

  const result = await complete([{ role: 'user', content: prompt }], { temperature: 0.7 });

  try {
    return JSON.parse(result.replace(/```json|```/g, '').trim()) as { subject: string; body: string };
  } catch {
    throw new Error('Failed to parse AI email response');
  }
}

// ─────────────────────────────────────────
// GENERATE PROJECT SUMMARY
// ─────────────────────────────────────────
export interface ProjectSummaryInput {
  projectName:    string;
  clientName:     string;
  status:         string;
  progress:       number;
  tasksDone:      number;
  tasksTotal:     number;
  milestones:     { title: string; status: string }[];
  hoursLogged:    number;
  freelancerName: string;
  startDate?:     string;
  endDate?:       string;
}

export async function generateProjectSummary(input: ProjectSummaryInput): Promise<string> {
  const prompt = `Write a concise project status summary that a freelancer can send to their client.

Project: ${input.projectName}
Client: ${input.clientName}
Status: ${input.status}
Progress: ${input.progress}% complete
Tasks: ${input.tasksDone}/${input.tasksTotal} completed
Hours logged: ${input.hoursLogged}h
Freelancer Name: ${input.freelancerName}
${input.startDate ? `Start date: ${input.startDate}` : ''}
${input.endDate   ? `Due date: ${input.endDate}`     : ''}
Milestones: ${input.milestones.map(m => `${m.title} (${m.status})`).join(', ')}

Write a 2-3 paragraph professional summary. Be positive, clear, and informative.
Mention what's been completed, what's in progress, and what's next.
Do not use bullet points — write in prose.`;

  return complete([{ role: 'user', content: prompt }], { temperature: 0.6 });
}

// ─────────────────────────────────────────
// GENERATE INVOICE LINE ITEMS
// ─────────────────────────────────────────
export async function generateInvoiceItems(
  projectDescription: string,
  currency: string
): Promise<{ description: string; quantity: number; unitPrice: number; amount: number }[]> {
  const prompt = `A freelancer needs invoice line items for this work: "${projectDescription}"
Currency: ${currency}

Respond with ONLY a valid JSON array (no markdown, no backticks):
[
  { "description": "item", "quantity": 1, "unitPrice": 500, "amount": 500 }
]

Generate 2-5 realistic line items with fair pricing. No explanations.`;

  const result = await complete([{ role: 'user', content: prompt }], { temperature: 0.5 });

  try {
    return JSON.parse(result.replace(/```json|```/g, '').trim()) as { description: string; quantity: number; unitPrice: number; amount: number }[];
  } catch {
    throw new Error('Failed to parse AI line items response');
  }
}