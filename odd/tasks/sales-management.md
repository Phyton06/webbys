# Webbys Sales Management

Objective: Deliver a read-only Sales register and promotion reporting on branch `feat/sales-management`.
Delivery: `ask-on-risk`; test runner: Vitest (`npm test`), Astro (`npm run check`, `npm run build`).

## Specs

### S1 — Read-only sales

User requirement: “no, este usuario no quiero que registre ventas, solo vea los registros”

The administrator can inspect generated sales records through a protected `/ventas/` page, a record detail view, text search, and filters by date, employee, product, service, and promotion. There is no create/edit/cancel/refund workflow, no writable sales storage, and no stock mutation. Verify page interactions and assert that the product inventory snapshot is unchanged by all available page actions.

### S2 — Sales and promotion reporting

User requirement: “si la opcion 1”

Provide read-only period summaries and breakdowns for gross sales, discounts, net sales, and record count. Promotion analytics must separate explicit promotion-attributed sales from records whose timestamps merely overlap a promotion's validity dates; overlap must not be represented as causal attribution. Verify calculations and classifications through pure service tests.

### S3 — Approved direction

User requirement: “hazlo”

Use the approved read-only register-and-analytics direction. Add only the data fields needed to make generated records coherent for the views; retain the existing demo-data source and avoid backend, payment processing, manual sale entry, and inventory side effects. Verify with focused tests, full tests, Astro check, and build.

## Tasks

- [x] T1 — Define and test read-only sales record snapshots and deterministic reporting; route: inline; status: complete; commits: `481e79d`, `6c3b00a` (RED → GREEN: `src/services/dashboard.test.ts`, `src/services/sales.test.ts`).
- [ ] T2 — Build the protected Sales register, search/filters, and record detail; route: inline; status: pending; commit: pending.
- [ ] T3 — Add sales-period, product/service/employee, and explicitly attributed versus date-overlap promotion insights; route: inline; status: pending; commit: pending.
- [ ] T4 — Verify the full feature, update design/implementation docs, and record the final check results; route: inline; status: pending; commit: pending.

## Log

- L1: Original request: “si la opcion 1” / “hazlo”. The user clarified that sales are view-only; no manual recording.
- L2: User approved a read-only sales register plus analytics. Sale creation, inventory changes, and causal claims from date overlap are out of scope.
- L3: Promotions delivery commit `e760774` was pushed to `origin/main` before starting this phase. Engram task mirror is pending because the MCP reports no authoritative runtime session; preserve this local document and resynchronize when available.
- L4: Approved design commit: `90e4339`. Implementation plan: `docs/superpowers/plans/2026-10-17-webbys-sales.md`, committed as `87d1e4e`. Implementation route is inline.
- L5: T1 added optional sale item/employee/payment/status/promotion snapshots and realistic date-relative fixture catalog IDs. `src/services/sales.ts` now provides deterministic filtering, totals, breakdowns, and separate explicit-attribution/date-overlap insights. Focused checks passed: 13 tests across `src/services/dashboard.test.ts` and `src/services/sales.test.ts`; Astro check has 0 diagnostics. Work-unit commits: `481e79d`, `6c3b00a`.
