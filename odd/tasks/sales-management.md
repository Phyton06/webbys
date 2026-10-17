# Webbys Sales Management

Objective: Deliver a read-only Sales register and promotion reporting on branch `feat/sales-management`.
Delivery: `feature-branch-chain` (user-selected); test runner: Vitest (`npm test`), Astro (`npm run check`, `npm run build`).

## Specs

### S1 — Read-only sales

User requirement: “no, este usuario no quiero que registre ventas, solo vea los registros”

The administrator can inspect generated sales records through a protected `/ventas/` page, a record detail view, text search, and filters by date, employee, product, service, and promotion. There is no create/edit/cancel/refund workflow, no writable sales storage, and no stock mutation. Verify page interactions and assert that the product inventory snapshot is unchanged by all available page actions.

### S2 — Sales and promotion reporting

User requirement: “si la opcion 1”

Provide read-only summaries for gross sales, discounts, net sales, record count, and average ticket; chart daily net sales and break down products, services, employees, and promotions. Promotion analytics must separate explicit promotion-attributed sales from records whose timestamps merely overlap a promotion's validity dates; overlap must not be represented as causal attribution. Verify calculations and classifications through pure service tests.

### S3 — Approved direction

User requirement: “hazlo”

Use the approved read-only register-and-analytics direction. Add only the data fields needed to make generated records coherent for the views; retain the existing demo-data source and avoid backend, payment processing, manual sale entry, and inventory side effects. Verify with focused tests, full tests, Astro check, and build.

## Tasks

- [x] T1 — Define and test read-only sale snapshots and generated fixtures; route: inline; status: complete; commit: `481e79d` (RED → GREEN: `src/services/dashboard.test.ts`).
- [x] T2 — Implement deterministic filters, daily trend, summaries, breakdowns, and explicit-attribution versus date-overlap reporting; route: inline; status: complete; commits: `6c3b00a` plus attribution/trend follow-up (RED → GREEN: `src/services/sales.test.ts`).
- [x] T3 — Build the protected Sales register, search/date/catalog filters, detail view, analytics, and navigation; route: inline; status: complete; commit: `e457c83` (27 focused tests pass).
- [x] T4 — Verify the full feature and record final check results; route: inline; status: complete; evidence: 226 tests pass, Astro check 0 diagnostics, build creates 11 routes, diff check clean.

## Log

- L1: Original request: “si la opcion 1” / “hazlo”. The user clarified that sales are view-only; no manual recording.
- L2: User approved a read-only sales register plus analytics. Sale creation, inventory changes, and causal claims from date overlap are out of scope.
- L3: Promotions delivery commit `e760774` was pushed to `origin/main` before starting this phase. Engram task mirror is pending because the MCP reports no authoritative runtime session; preserve this local document and resynchronize when available.
- L4: Approved design commit: `90e4339`. Implementation plan: `docs/superpowers/plans/2026-10-17-webbys-sales.md`, committed as `87d1e4e`. Implementation route is inline.
- L5: T1 added optional sale item/employee/payment/status/promotion snapshots and realistic date-relative fixture catalog IDs. `src/services/sales.ts` now provides deterministic filtering, totals, breakdowns, and separate explicit-attribution/date-overlap insights. Focused checks passed: 13 tests across `src/services/dashboard.test.ts` and `src/services/sales.test.ts`; Astro check has 0 diagnostics. Work-unit commits: `481e79d`, `6c3b00a`.
- L6: Query refinements are in `f703287`; the protected register, detail, filters, summary, trend, breakdowns, and navigation are in `e457c83`. User selected delivery strategy “Cadena de rama feature” (`feature-branch-chain`). No Sales push or PR was authorized.
- L7: Final verification passed: `npm test` (226 tests), `npm run check` (0 errors/warnings/hints), `npm run build` (11 routes including `/ventas/`), and `git diff --check`. Responsive inspection at 1280px and 390px found no horizontal overflow. The Impeccable detector produced one typography advisory; it was corrected with the documented token, and not rerun because this visual pass is limited to one detector run.
- L8: Independent `gentle-ai-verify` verdict: S1–S3 met, no reproducible blockers; service tests (15), UI/navigation tests (19), and Astro check passed in scratch. It did not independently hash storage, but the page test asserts the Agenda bytes stay unchanged after search/detail actions, and source review found no write path.
