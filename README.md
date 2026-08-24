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

## What's included

A full job-management system in the spirit of Fergus, built around the core principle that
**Cost, Profit and Cash must never be confused**:

- **Dashboard** — business running costs, labour utilisation, job profitability, sales pipeline and
  cash position in one screen, with traffic-light alerts pulled from every module below. Doubles as
  the "Monday morning" view of the business.
- **Customers & Sites** — customer records with contacts, billing details and payment terms; each
  customer can have multiple sites (site ≠ billing address), each with access notes and hazards.
- **Assets & recurring jobs** — customer equipment (switchboards, RCDs, emergency lights, etc.) with
  service intervals and due dates, and recurring job templates with a manual "generate job now" action.
- **Enquiries** — a sales-pipeline status board (New → Ready to quote → Converted/Lost) with one-click
  convert-to-job.
- **Quotes** — saved, versioned, line-itemised quotes (sections, cost/sell per line, draft → sent →
  accepted/declined) distinct from the quick **Quote calculator**, which prices a job on the spot from
  the current break-even labour rate at 10/15/20/25/30% or a custom margin.
- **Jobs** — the central record: budget vs actual, forecast final cost/profit/margin (actual +
  committed + remaining-budget estimate — a standard earned-value approach), percentage-complete/WIP,
  job cash position, invoices & payments, sortable by margin.
- **Job Phases** — break a job into stages, each with its own budget vs actual roll-up.
- **Variations** — scope changes priced cost-plus-markup, tracked pending/approved/declined; only
  APPROVED variations ever affect a job's contract value or budget, and the original quote is never
  altered.
- **Suppliers & Purchase Orders** — POs carry committed cost against a job (or phase) before the bill
  arrives; recording a supplier invoice against a PO posts a matching actual cost automatically.
- **Invoicing** — deposit/progress/final/variation/retention invoices; charge-up jobs can pull their
  unbilled actual costs onto an invoice with a markup; a progress-claim summary (revised contract,
  claimed to date, remaining, retention held) appears on jobs with a retention percentage set.
- **Scheduling** — a weekly dispatch board (employee × day) for quote visits, work, shutdowns,
  inspections etc., linked to a job/phase and employee.
- **Forms & Certificates** — a form builder (text/number/date/yes-no/dropdown/signature fields) that
  doubles as certificates when flagged; fill any active template out against a job.
- **Employees & Payroll** — true weekly cost (gross wage + super + on-costs) and true cost per
  billable hour; a weekly payroll screen auto-calculating wages/super/on-costs from actual hours.
- **Overheads register** — every expense category from the spec, converted to weekly/monthly/annual
  equivalents. This is the *planned/recurring* model used for the break-even rate.
- **Expenses** — actual, dated general-business spend that feeds the management P&L, separate from
  the planned overheads register above.
- **Break-even calculator** — total weekly running cost ÷ billable hours, plus a target-margin
  calculator (margin, not markup — the two are never the same number).
- **13/52-week cashflow forecast** — recurring payroll/super/overheads roll forward automatically,
  plus one-off items and expected invoice collections, with negative weeks flagged.
- **Reports** — job profitability ranking, a simplified management P&L, employee productivity, sales
  pipeline conversion, and purchasing/supplier spend.
- **Budget vs actual** — a monthly comparison per overhead category (plus wages/super) reusing the
  Overheads register as the budget and recorded Expenses/payroll as the actual — nothing to enter twice.
- **Audit trail** — status changes, invoices, payments, variation and PO decisions, and job creation
  all log to a per-job timeline.
- **Settings** — target margin, target utilisation and the current bank balance (the cashflow
  forecast's starting point).
- **User accounts & role-based access** — real login (email + password, DB-backed sessions). Three
  roles: **Admin** (everything, including managing users), **Office** (everything except user
  management), and **Field** (jobs, scheduling, forms/certificates and stock only — no pricing,
  payroll, or other financial data, enforced both in navigation and at the route level). The very
  first visit creates the initial Admin account; every other user is added from Settings → Users.
- **Stock / warehouse** — materials and equipment with on-hand quantity, reorder levels and unit
  cost; receive, adjust or issue stock to a job (issuing posts a materials cost entry automatically).
  Items can be looked up by scanning a barcode with a phone camera (via the browser's native
  `BarcodeDetector` API where supported) or by typing the code in — the Dashboard flags any item at
  or below its reorder level.

### Deliberately out of scope

A few things genuinely can't be built here, or are significant enough to need an explicit decision
first rather than being silently built in:

- **Xero / accounting integration** — needs your own Xero developer API credentials.
- **A native mobile app** — every screen here is mobile-responsive and works from a phone browser
  instead, but a true offline-capable native app is a separate build.
- **Real notification delivery (email/SMS)** — needs SMTP/Twilio-style credentials. What exists
  instead is in-app alerts (Dashboard) computed live from current data — overdue follow-ups, stalled
  quotes, POs/variations awaiting a decision, assets overdue for service, low stock, and the original
  cost/margin/cash alerts.

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

The very first visit to the app (with no users yet) shows a one-time "Create your admin account"
screen instead of the dashboard — that account can then add everyone else from Settings → Users.

Other useful commands:

```bash
npm test                     # run the calculation engine's unit tests
npm run build                # production build + typecheck
```

### Loading demo data instead

If you'd rather explore the app with realistic sample data first (customers & sites, employees,
jobs at every stage with phases/variations/POs, invoices, an overdue payment, payroll history,
enquiries, form templates, assets and a recurring job template), run:

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
