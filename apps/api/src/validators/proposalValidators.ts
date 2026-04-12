import { z } from 'zod';

// ─────────────────────────────────────────
// PROPOSAL
// ─────────────────────────────────────────
export const lineItemSchema = z.object({
  description: z.string().min(1).max(200),
  quantity:    z.number().positive(),
  unitPrice:   z.number().positive(),
  amount:      z.number().positive(),
});

export const createProposalSchema = z.object({
  clientId:     z.string().uuid('Invalid client ID'),
  projectId:    z.string().uuid().optional(),
  title:        z.string().min(1).max(200).trim(),
  introduction: z.string().max(5000).optional(),
  scope:        z.string().max(5000).optional(),
  terms:        z.string().max(5000).optional(),
  lineItems:    z.array(lineItemSchema).min(1, 'At least one line item required'),
  currency:     z.string().length(3).default('USD'),
  validUntil:   z.string().datetime().optional(),
  notes:        z.string().max(2000).optional(),
});

export const updateProposalSchema = createProposalSchema.partial();

export const sendProposalSchema = z.object({
  message: z.string().max(2000).optional(),
});

// ─────────────────────────────────────────
// CONTRACT
// ─────────────────────────────────────────
export const paymentMilestoneSchema = z.object({
  label:   z.string(),
  percent: z.number().min(1).max(100),
  dueOn:   z.string().optional(), // 'signing', 'completion', or ISO date
});

export const createContractSchema = z.object({
  clientId:          z.string().uuid('Invalid client ID'),
  projectId:         z.string().uuid().optional(),
  proposalId:        z.string().uuid().optional(),
  title:             z.string().min(1).max(200).trim(),
  body:              z.string().min(1, 'Contract body is required'),
  currency:          z.string().length(3).default('USD'),
  value:             z.number().positive().optional(),
  startDate:         z.string().datetime().optional(),
  endDate:           z.string().datetime().optional(),
  paymentSchedule: z.enum(['UPFRONT', 'SPLIT_50_50', 'MILESTONE', 'CUSTOM']).optional(),
  depositPercent:    z.number().min(1).max(100).optional(),
  paymentMilestones: z.array(paymentMilestoneSchema).optional(),
});

export const updateContractSchema = createContractSchema.partial();

export const signContractSchema = z.object({
  signatureName: z.string().min(1, 'Signature name is required').max(100),
  signatureDate: z.string().datetime().optional(),
});

export type LineItemInput        = z.infer<typeof lineItemSchema>;
export type CreateProposalInput  = z.infer<typeof createProposalSchema>;
export type UpdateProposalInput  = z.infer<typeof updateProposalSchema>;
export type CreateContractInput  = z.infer<typeof createContractSchema>;
export type UpdateContractInput  = z.infer<typeof updateContractSchema>;
export type SignContractInput    = z.infer<typeof signContractSchema>;
