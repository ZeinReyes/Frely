# Frely
 
**Your work. Your clients. One place.**
 
Frely is a full-stack SaaS platform built for freelancers to manage their entire business in one place — client onboarding, project tracking, kanban boards, contracts, invoices, payments, file sharing, and a branded client portal.
 
---
 
## Features
 
- **Client Management** — CRM with lead pipeline, health scores, and client portal
- **Project & Task Management** — Kanban boards with milestone tracking and real-time progress
- **Client Portal** — Branded, white-labeled portal where clients can view progress, files, and invoices
- **Proposals & Contracts** — Drag-and-drop proposal builder with e-signature support
- **Invoices & Payments** — Milestone-based billing, Stripe integration, and automated reminders
- **File Management** — Cloudinary-powered file sharing with version history
- **Time Tracker** — Billable/non-billable time tracking per task and project
- **AI Features** — Claude-powered proposal generation, task suggestions, and scope creep detection
- **Analytics Dashboard** — Revenue forecasting, client profitability, and cash flow insights
- **Notifications** — Real-time alerts for task updates, invoice reminders, and client activity
 
---
 
## Tech Stack
 
**Frontend**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- ShadCN UI
- Zustand + React Query
- Better Auth (client)
 
**Backend**
- Node.js + Express
- TypeScript
- PostgreSQL + Prisma ORM
- Better Auth v1
- BullMQ + Redis
- Stripe
- Cloudinary
- Brevo (email)
- Anthropic Claude API
 
---
 
## Project Structure
 
```
Frely/
├── apps/
│   ├── web/          # Next.js 14 frontend
│   └── api/          # Node.js / Express backend
└── infrastructure/   # Terraform (future deployment)
```
 
---
 
## Getting Started
 
### Prerequisites
 
- Node.js 20+
- PostgreSQL 15+
- Redis (optional for Module 1)
 
### Installation
 
```bash
# Clone the repo
git clone https://github.com/ZeinReyes/Frely.git
cd Frely
 
# Install dependencies
npm install
```
 
### Environment Setup
 
```bash
# Copy env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```
 
Fill in your values in `apps/api/.env`:
 
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Random 32-char secret (`openssl rand -hex 32`) |
| `BREVO_API_KEY` | Brevo email API key |
| `BREVO_FROM_EMAIL` | Sender email address |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
 
### Database Setup
 
```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma generate
```
 
### Run Development Servers
 
```bash
# Terminal 1 — API (http://localhost:5000)
npm run dev:api
 
# Terminal 2 — Web (http://localhost:3000)
npm run dev:web
```
 
---
 
## Development Progress
 
| # | Module | Status |
|---|---|---|
| 1 | Project Setup + Auth | ✅ Complete |
| 2 | Client Management (CRM) | ✅ Upcoming |
| 3 | Project & Task Management | ✅ Upcoming |
| 4 | Milestone Tracking | ✅ Upcoming |
| 5 | Time Tracker | ✅ Upcoming |
| 6 | File Management | ✅ Upcoming |
| 7 | Client Portal | ✅ Upcoming |
| 8 | Proposals & Contracts | ✅ Upcoming |
| 9 | Invoices & Payments | ✅ Upcoming |
| 10 | Payment Reminders | ✅ Upcoming |
| 11 | Notifications | ✅ Upcoming |
| 12 | AI Features | 🔲 Upcoming |
| 13 | Analytics Dashboard | 🔲 Upcoming |
| 14 | Settings & White-labeling | 🔲 Upcoming |
| 15 | CI/CD + Deployment | 🔲 Upcoming |
