# Assistant profile and POS phase
Objective: Add the assistant role to the existing Webbys barber-shop PWA, preserving the administrator experience.
Branch: `feat/assistant-profile-pos` · Delivery: ask-on-risk · Test runner: `npm test`; essential project check: `npm run build`.

## Specs

### S1 — Assistant role, access, layout, and dashboard
Source: `task 2.md`, sections 3–6 and Stage 2 (lines 63–223, 809–817).
Implement the demonstration assistant sign-in alongside the existing admin sign-in; route by role; centralize authorization for pages and actions; preserve the administrator modules; create the assistant mobile navigation and a dashboard calculated from shared demo data. Follow the task's exact credentials and access restrictions; this remains frontend-only simulated authentication, not production security.
Acceptance: both demo roles reach their intended panels; assistant access to restricted admin modules is denied; sign-out works; the assistant dashboard uses shared records and the mobile layout remains usable.
Checks: focused auth/permission tests; `npm run build`.

### S2 — Appointment-centered point of sale
Source: `task 2.md`, sections 7–11 and Stage 3 (lines 225–493, 818–828).
Implement the shared appointment-based checkout, eligible appointment search, add-on products/services, valid promotions, totals, simulated payment, receipt, duplicate prevention, and secondary product-only quick sale. Keep appointment service and payment states separate and update shared inventory and sales data consistently.
Acceptance: eligible appointments populate checkout automatically; simulated sales update the shared records once and cannot charge a paid/cancelled appointment again; quick sale does not require an appointment.
Checks: focused checkout, inventory, discount, and duplicate-sale tests; `npm run build`.

### S3 — Shared-data integration and essential regression verification
Source: `task 2.md`, sections 12–20 and Stages 4–6 (lines 494–857).
Integrate the assistant with the existing agenda, clients, products, services, promotions, and sales stores and permissions; do not duplicate scheduling or create role-specific catalogs. Preserve administrator behavior and verify only the essential paths specified by the task.
Acceptance: assistant operations are reflected in the existing administrator data; authorization restrictions hold; essential app checks pass.
Checks: focused tests for changed behavior and `npm run build`.

## Tasks
- T1 — S1 — inline — implemented; `d0a1e9d`; focused verification passed
- T2 — S2 — inline — implemented; focused checks pass — awaiting work-unit commit
- T3 — S3 — implemented; independent test coverage mapped; manual visual review accepted — awaiting work-unit commit

## Log

### L1 — Original request
"lee el archivo task 2.md para continuar con la otra fase en este proyecto"

### L2 — Verification scope
"ojo este proyecto es sencillo asi que solo haz las verificaciones escenciales"
Use proportionate essential checks; do not add broad or repetitive validation.

### L3 — Continue authorization (2026-10-17)
"adelante"

### L4 — Visual review fallback (2026-10-17)
"Aceptar revisión manual"

### L5 — Delivery strategy (2026-10-17)
"Apilar PRs a main"

### Progress
- `task 2.md` is the user-owned phase specification and remains untracked; preserve it.
- Baseline: the administrator PWA already had shared agenda, client, catalog, promotion, and sales modules; assistant credentials and role-specific navigation were absent.
- Current implementation is on `feat/assistant-profile-pos`; unrelated untracked `.impeccable/questions/` and `.superpowers/` are preserved.
- T1 complete: exact demo role credentials, persisted session roles, assistant dashboard/mobile shell, shared-operation role access, restricted administrator modules, read-only active promotions, profile route, quick actions, appointment/client-profile charge links, and client-profile appointment creation with the client preselected.
- T2 complete: appointment-first cashier queue, add-on products/services, barber availability checks for services not yet performed, applicable active promotions, simulated cash/card/transfer, cash change, product-only quick sale, receipt/print/share, and duplicate prevention.
- T3 integration: shared sales update inventory, paid status, administrator sales and analytics; clients and agenda offer the same cashier flow; customer profiles show linked purchase records. Older state remains valid because sales and payment fields are optional in the existing AgendaState envelope.
- Final essential checks: 18 focused test files, 150 tests passed; `npm run build` passed with 0 errors, warnings, or hints and produced 16 routes. Login, dashboard, cashier, and mobile/desktop views were inspected in the production preview. The pre-existing dev server returned a stale Vite dependency 504, so visual inspection used the production preview instead.
- Detector findings: cashier type-ramp advisories were normalized. Remaining advisories reference pre-existing rules in `src/styles/agenda.css` and are non-blocking.
- T2 storage decision: store committed sales and optional appointment payment status in the existing versioned AgendaState envelope so inventory, payment, and sale record persist with one localStorage write. Legacy records remain valid because the new fields are optional; focused service tests cover duplicate prevention and rejected-payment state preservation.
- Added `.impeccable/surfaces/src-pages-cobrar-astro.md` documenting the appointment-first Operate surface within Webbys' existing visual system; no new visual identity or external service is introduced.
- Receipt-driven development is globally off, so no native review lifecycle applies. The independent verifier mapped S1–S3 assertions to tests/source and found no unmet behavior in the scoped automated probes; it passed 18 test files/150 tests and the build in a scratch copy. Baseline comparison was not run. The dedicated visual finish-reviewer agent was unavailable; the user accepted manual mobile/desktop preview inspection as the fallback, not an independent finish verdict.
- The feature exceeds 400 authored changed lines. User selected `stacked-to-main`; planned slice order is T1 assistant access/shell → T2 cashier transaction/UI → T3 shared agenda/client/admin integration. No PR or push has been authorized or created. Local work-unit commits are authorized.
- T1 work-unit commit `d0a1e9d` (`feat(assistant): add role-based operations dashboard`) contains login, role gates, assistant dashboard/shell/profile, and shared operational access. Focused verification passed 11 files/89 tests; the staged whitespace check passed.
