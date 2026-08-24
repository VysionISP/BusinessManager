# Electrical Business Manager

A business-management app for an electrical contracting business that answers one question:
**what does the business actually cost to run, what do we need to charge, and are our jobs
actually making money?**

It keeps three things deliberately separate throughout, per the product's core principle:

- **Cost** — what it genuinely costs the business to do the work.
- **Profit** — what a job earns after those costs.
- **Cash** — when money actually moves in and out of the bank.

A profitable job can still cause a cash crisis while it's underway — the app is built so those
two concepts are never confused.

## What's included (V1 / MVP scope)

- **Dashboard** — business running costs, labour utilisation, job profitability and cash position
  in one screen, with traffic-light alerts. Doubles as the "Monday morning" view of the business.
- **Employees** — true weekly cost (gross wage + super + on-costs) and true cost per billable hour.
- **Weekly payroll** — actual hours per employee per week, auto-calculating wages/super/on-costs.
- **Overheads register** — every expense category from the spec, converted to weekly/monthly/annual
  equivalents regardless of how it's billed. This is the *planned/recurring* model used to work out
  the break-even rate (insurance, rego, subscriptions, etc.).
- **Expenses** — actual, dated general-business spend (not tied to a job) that feeds straight into
  the management P&L, separate from the planned overheads register above.
- **Break-even calculator** — total weekly running cost ÷ billable hours = break-even rate, plus a
  target-margin calculator (margin, not markup).
- **Quote calculator** — direct job cost at the current break-even labour rate, quoted at 10/15/20/25/30%
  or a custom margin, with a one-click "create job from this quote".
- **Jobs** — budget vs actual, forecast final cost/profit/margin, percentage-complete/WIP, job cash
  position, invoices & payments, sortable by margin.
- **13/52-week cashflow forecast** — recurring payroll/super/overheads roll forward automatically,
  plus one-off items and expected invoice collections, with negative weeks flagged.
- **Reports** — job profitability ranking, a simplified management P&L, and employee productivity.
- **Settings** — target margin, target utilisation and the current bank balance (the cashflow
  forecast's starting point).

### Deliberately out of scope for V1

Per the spec's own "minimum viable version" guidance, the following are real, useful, and meant to
follow once the core calculations above are proven out — not because they're unimportant:

- Xero / job-management / bank-feed / fuel-card integrations.
- User permissions & role-based access (currently single-user).
- Monthly budget-vs-actual variance reporting for overhead categories.
- A dedicated Monday dashboard — the main dashboard already answers all seven of its questions.

## Tech stack

- **Next.js (App Router) + TypeScript + Tailwind CSS** — server-rendered pages, Server Actions for
  all mutations (no separate API layer to keep in sync).
- **Prisma + SQLite** — zero-config relational database, file-based (`prisma/dev.db`), easy to
  inspect and back up. Swapping to Postgres later is a one-line datasource change.
- **Vitest** — unit tests for the calculation engine (`src/lib/calculations.ts`), including the
  worked examples from the spec (e.g. $14,000/week ÷ 120 billable hours = $116.67/hr break-even;
  20% margin on that rate = $145.84/hr).

All business logic lives in `src/lib/calculations.ts` as pure, unit-tested functions — every page
composes those functions rather than recalculating anything inline, so the numbers on the dashboard,
the job detail page, and the reports page can never silently disagree with each other.

## Getting started

```bash
cp .env.example .env         # local SQLite file, nothing secret in it
npm install                  # also runs `prisma generate`
npm run db:migrate           # apply the schema (creates prisma/dev.db, starts empty)
npm run dev                  # http://localhost:3000
```

That's it — the database starts completely empty, ready for your own employees, overheads, jobs
and expenses. Add your real data through the app itself (Employees, Overheads, Jobs, etc.).

Other useful commands:

```bash
npm test                     # run the calculation engine's unit tests
npm run build                # production build + typecheck
```

### Loading demo data instead

If you'd rather explore the app with realistic sample data first (employees, jobs at every stage,
invoices, an overdue payment, payroll history), run:

```bash
npm run db:seed
```

This **wipes and replaces everything** in the database with the demo dataset — don't run it once
you've started entering real data. To go back to a clean slate at any point (demo data or your own),
delete the local database file and re-apply the schema:

```bash
rm prisma/dev.db
npm run db:migrate
```

## Data model

See `prisma/schema.prisma`. SQLite has no native enum support in Prisma, so "enum-like" fields
(job status, cost category, expense frequency, etc.) are plain strings constrained by the
TypeScript unions in `src/lib/types.ts`.
