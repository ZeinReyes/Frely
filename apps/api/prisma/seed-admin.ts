import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding admin data...');

  // ── Landing Content ──────────────────────
  const landingContent = [
    {
      key:   'hero',
      value: {
        badge:    'Built for Filipino Freelancers',
        title:    'Your work. Your clients. One place.',
        subtitle: 'Frely is the all-in-one freelance platform — manage clients, projects, proposals, invoices, and more. Powered by AI.',
        cta1:     'Start for free',
        cta2:     'See how it works',
        note:     'No credit card required · Free forever plan',
      },
    },
    {
      key:   'stats',
      value: [
        { stat: '10+ hrs/week', label: 'saved on admin work' },
        { stat: '2× faster',    label: 'invoice payments' },
        { stat: '100% free',    label: 'to get started' },
      ],
    },
    {
      key:   'features',
      value: [
        { icon: 'Users',        title: 'Client Management',    desc: 'Track clients, health scores, and portal access in one beautiful dashboard.' },
        { icon: 'FolderKanban', title: 'Project & Kanban',      desc: 'Manage tasks with drag-and-drop boards, milestones, and progress tracking.' },
        { icon: 'FileText',     title: 'Proposals & Contracts', desc: 'Create professional proposals and send contracts for digital signing.' },
        { icon: 'Receipt',      title: 'Invoicing',             desc: 'Send invoices and get paid via GCash, Maya, PayPal, or credit card.' },
        { icon: 'Clock',        title: 'Time Tracking',         desc: 'Log billable hours per project with a built-in live timer.' },
        { icon: 'Bot',          title: 'AI Assistant',          desc: 'Generate proposals, emails, and contract clauses with AI in seconds.' },
        { icon: 'BarChart2',    title: 'Analytics',             desc: 'Track revenue, top clients, on-time rates, and business performance.' },
        { icon: 'Globe',        title: 'Client Portal',         desc: 'Give clients a branded portal to track progress and approve milestones.' },
      ],
    },
    {
      key:   'testimonials',
      value: [
        { name: 'Maria Santos',   role: 'UI/UX Designer, Cebu',      avatar: 'MS', text: 'Frely replaced 4 different tools I was juggling. Everything in one place — my clients love it.' },
        { name: 'Carlo Reyes',    role: 'Full-stack Developer',       avatar: 'CR', text: 'The AI proposal generator saves me at least 3 hours every week. Game changer for my workflow.' },
        { name: 'Ana Villanueva', role: 'Freelance Copywriter, BGC',  avatar: 'AV', text: 'My clients are impressed by the portal. It makes me look way more professional than before.' },
      ],
    },
    {
      key:   'cta',
      value: {
        title:    'Ready to level up your freelance business?',
        subtitle: 'Join thousands of Filipino freelancers already earning more with Frely.',
        cta1:     'Get started for free',
        cta2:     'Sign in to your account',
      },
    },
  ];

  for (const item of landingContent) {
    await prisma.landingContent.upsert({
      where:  { key: item.key },
      update: { value: item.value as never },
      create: { key: item.key, value: item.value as never },
    });
    console.log(`✅ Landing content: ${item.key}`);
  }

  // ── Plan Configs ─────────────────────────
  const plans = [
    {
      name:        'STARTER',
      displayName: 'Starter',
      description: 'Perfect for getting started',
      price:       0,
      period:      'forever',
      isPopular:   false,
      isVisible:   true,
      features:    ['3 clients', '3 projects', '5 invoices/month', 'AI features', 'Client portal', 'Time tracking', 'Basic analytics'],
      limits:      { clients: 3, projects: 3, invoices: 5 },
      sortOrder:   0,
    },
    {
      name:        'SOLO',
      displayName: 'Solo',
      description: 'For growing freelancers',
      price:       29900,
      period:      'month',
      isPopular:   false,
      isVisible:   true,
      features:    ['15 clients', '15 projects', '30 invoices/month', 'Everything in Starter', 'Payment reminders', 'Priority support'],
      limits:      { clients: 15, projects: 15, invoices: 30 },
      sortOrder:   1,
    },
    {
      name:        'PRO',
      displayName: 'Pro',
      description: 'For serious freelancers',
      price:       69900,
      period:      'month',
      isPopular:   true,
      isVisible:   true,
      features:    ['Unlimited clients', 'Unlimited projects', 'Unlimited invoices', 'Everything in Solo', 'White-labeling', 'Custom brand colors', '3 team members 🔜'],
      limits:      { clients: -1, projects: -1, invoices: -1 },
      sortOrder:   2,
    },
    {
      name:        'AGENCY',
      displayName: 'Agency',
      description: 'For teams and agencies',
      price:       149900,
      period:      'month',
      isPopular:   false,
      isVisible:   true,
      features:    ['Everything in Pro', 'Unlimited everything', '10 team members 🔜', 'Dedicated support', 'Custom domain 🔜', 'API access 🔜'],
      limits:      { clients: -1, projects: -1, invoices: -1 },
      sortOrder:   3,
    },
  ];

  for (const plan of plans) {
    await prisma.planConfig.upsert({
      where:  { name: plan.name },
      update: plan as never,
      create: plan as never,
    });
    console.log(`✅ Plan config: ${plan.name}`);
  }

  console.log('✅ Admin seed complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
