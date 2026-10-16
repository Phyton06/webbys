# Webbys First Stage Implementation Plan

> **For agentic workers:** Implement inline task-by-task from this plan. Keep tests and documentation with the behavior. Do not commit unless the user asks.

**Goal:** Build the first usable frontend-only stage of Webbys: simulated admin login, responsive navigation, and a coherent demo dashboard.

**Architecture:** Astro owns routes and static page structure. Preact is used only for interactive islands. Typed synthetic fixtures feed pure dashboard calculations through a replaceable service boundary; browser storage holds only a clearly simulated session.

**Tech Stack:** Astro, strict TypeScript, Preact, Vitest, Testing Library for Preact, Lucide Preact icons, CSS, Web App Manifest.

## Global Constraints

- Astro framework principal.
- TypeScript estricto y código mantenible.
- PWA con manifest e iconos; no service worker until offline behavior is specified.
- Frontend exclusivamente; no backend, endpoints reales, authentication provider, database, or real notification delivery.
- Do not turn the whole application into a SPA.
- Every visible control in this stage has a working, coherent simulated behavior.
- Demonstration data is explicitly labeled and internally consistent.
- Visual contract is in `docs/superpowers/specs/2026-10-14-webbys-first-stage-design.md`; product truth is in `PRODUCT.md`; full future scope is `task.md`.

---

## File map

- `package.json` — project metadata, dependencies, and check scripts.
- `.gitignore` — excludes installed, generated, and local review artifacts.
- `astro.config.mjs`, `tsconfig.json` — Astro/Preact and strict TypeScript configuration.
- `src/styles/tokens.css` — color, type, spacing, focus, and responsive tokens.
- `src/layouts/AppLayout.astro` — shared document shell, viewport metadata, manifest link, and global styles.
- `src/pages/index.astro`, `src/pages/login.astro`, `src/pages/admin.astro` — entry, sign-in, and authenticated dashboard routes.
- `src/components/AdminPage.tsx` — client-time demo data, session gate, and admin screen composition.
- `src/types/domain.ts` — customer-facing domain types needed by this slice: sales and appointment demo records.
- `src/data/demo.ts` — deterministic synthetic fixtures and date-relative demo data factory.
- `src/services/dashboard.ts` — pure summary and chart-series calculations over injected data.
- `src/lib/demo-auth.ts` — form validation and browser-session operations, with injectable storage for tests.
- `src/components/LoginForm.tsx` — validated simulated sign-in, password visibility, feedback, and demo entry.
- `src/components/AdminShell.tsx` — responsive mobile bottom navigation, desktop side navigation, demo status, and sign-out.
- `src/components/DashboardPanel.tsx` — period control, summary, chart, upcoming appointments, recent activity.
- `src/**/*.test.ts`, `src/**/*.test.tsx` — pure-logic and user-visible behavior tests.
- `public/manifest.webmanifest`, `public/icons/webbys.svg`, `public/icons/webbys-maskable.svg`, and their 192px/512px PNG exports — PWA metadata and authored icons with embedded origin provenance.
- `README.md` — setup, checks, demo entry, and explicit simulation limitations.

## Task 1: Establish Astro foundation and test runner

**Files:** `.gitignore`, `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `src/styles/tokens.css`, `src/layouts/AppLayout.astro`, `src/pages/index.astro`, `public/manifest.webmanifest`, `public/icons/webbys.svg`, `README.md`.

**Interfaces:** Astro routes render `AppLayout`; layout imports global tokens and links the manifest. Preact components are hydrated only where interactivity is required.

- [x] Run `npm init -y` in the existing folder and retain all existing documents; add scripts `dev`, `build`, `check`, and `test` to the generated `package.json`.
- [x] Add `.gitignore` rules for dependencies, build output, generated Astro files, local browser snapshots, and review captures.
- [x] Install Astro, `@astrojs/preact`, Preact, `lucide-preact`, TypeScript 6, `@astrojs/check`, Vitest, jsdom, and `@testing-library/preact`.
- [x] Configure the Preact integration in `astro.config.mjs`, automatic Preact JSX in Vitest, and strict TypeScript using Astro's strict preset.
- [x] Configure Vitest for `jsdom` and test files under `src/`.
- [x] Add `AppLayout.astro` with Spanish UI semantics, viewport metadata, `manifest.webmanifest` link, and `tokens.css` import.
- [x] Record the approved direction contract in `.impeccable/surfaces/src-pages-admin-astro.md` before implementing the admin UI.
- [x] Define neutral/charcoal surfaces, red action/state roles, readable type and spacing tokens, reduced-motion behavior, and visible focus styles in `tokens.css`.
- [x] Add a minimal home route that links to login, a manifest with standalone display, correctly scoped start URL, name, theme color, and authored 192x192, 512x512, and maskable PNG icons derived from local SVG artwork.
- [x] Add README instructions including `npm install`, `npm run dev`, `npm run check`, `npm test`, `npm run build`, and the fact that auth/data are simulated.
- [x] Run initial foundation `npm run check`, `npm run test -- --passWithNoTests`, and `npm run build`; all three completed successfully.

## Task 2: Implement demo authentication with TDD

**Files:** `src/lib/demo-auth.ts`, `src/lib/demo-auth.test.ts`, `src/components/LoginForm.tsx`, `src/components/LoginForm.test.tsx`, `src/components/AdminGate.tsx`, `src/components/AdminGate.test.tsx`, `src/components/AdminPage.tsx`, `src/pages/login.astro`, `src/pages/admin.astro`.

**Interfaces:**

- `validateCredentials(input: { email: string; password: string }): { email?: string; password?: string }` returns field errors; an email must be valid and password must be at least 8 characters.
- `startDemoSession(storage: Pick<Storage, 'setItem'>): void`, `hasDemoSession(storage: Pick<Storage, 'getItem'>): boolean`, and `endDemoSession(storage: Pick<Storage, 'removeItem'>): void` operate only on a namespaced demo key.
- `LoginForm` calls injected pure validation, sets a demo session on valid submit, and navigates to `/admin/`.

- [x] Write and observe RED for invalid email and short password field-error tests; implement `validateCredentials` and observe GREEN.
- [x] Write and observe RED for starting, reading, and clearing demo sessions; implement namespaced storage helpers and observe GREEN while preserving unrelated keys.
- [x] Write and observe RED for login form validation, password visibility, demo entry/loading, and Google/Facebook simulated-flow interactions; implement `LoginForm` and observe GREEN.
- [x] Render the login route with an explicit simulation notice and Google/Facebook buttons that never contact a provider.
- [x] Add `AdminGate` and an `admin.astro` client-only page that withholds the dashboard without a demo session and redirects to `/login/`.
- [x] Run focused auth and component tests and `npm run check`; observed tests PASS and zero Astro/TypeScript diagnostics.

## Task 3: Build responsive navigation and sign-out

**Files:** `src/components/AdminShell.tsx`, `src/components/AdminShell.test.tsx`, `src/components/AdminPage.tsx`, `src/pages/admin.astro`, `src/styles/admin.css`, `README.md`.

**Interfaces:** `AdminShell` accepts children and an optional test callback `onSignOut?: () => void`; production sign-out clears only the demo session and returns to `/login/`. Unimplemented destinations announce that they are unavailable rather than impersonating working links.

- [x] Write and observe RED for active dashboard navigation, honest unavailable-module feedback, the mobile “Más secciones” menu, and demo sign-out.
- [x] Implement mobile bottom navigation and desktop side navigation with Lucide icons, accessible names, current-page state, explicit future-module feedback, and a keyboard skip link.
- [x] Implement sign-out by calling `endDemoSession` and returning to `/login/`.
- [x] Run `npm test -- src/components/AdminShell.test.tsx src/lib/demo-auth.test.ts`; observed PASS, with session-key isolation covered by Task 2.
- [x] Inspect 390px and 1440px shells; both document widths match their viewports and the admin content scrolls in a separate region from the persistent mobile navigation.

## Task 4: Add coherent dashboard fixtures and calculations with TDD

**Files:** `src/types/domain.ts`, `src/data/demo.ts`, `src/services/dashboard.ts`, `src/services/dashboard.test.ts`.

**Interfaces:**

- `SaleRecord` contains `id`, `occurredAt`, `items`, `grossTotal`, `discountTotal`, and `netTotal`.
- `AppointmentRecord` contains `id`, `startsAt`, `clientName`, `barberName`, `serviceName`, `status`, and `durationMinutes`.
- `createDemoData(now: Date): { sales: SaleRecord[]; appointments: AppointmentRecord[] }` returns synthetic dated records relative to the provided date.
- `DashboardRange = 'day' | 'week' | 'month'`; week means Monday through Sunday in the browser's local timezone and month means the local calendar month.
- `getDashboardSummary(sales: SaleRecord[], appointments: AppointmentRecord[], range: DashboardRange, now: Date): { grossSales: number; discounts: number; netSales: number; saleCount: number; appointmentCount: number; pendingCount: number; confirmedCount: number; completedCount: number; cancelledCount: number }` computes values from the inputs.
- `getSalesSeries(sales: SaleRecord[], range: DashboardRange, now: Date): Array<{ label: string; value: number }>` returns chronological buckets for day, week, or month.

- [x] Write and observe RED for range boundaries, gross/discount/net arithmetic, appointment status counts, and chronological chart buckets using a fixed `now`.
- [x] Treat day as the local calendar day, week as Monday–Sunday, and month as the local calendar month; `$` remains a demo-only symbol.
- [x] Implement typed records, pure date bucketing, sales calculations, and separate daily appointment counts; focused tests passed.
- [x] Add coverage proving outside-range sales do not affect totals and that item, gross, discount, and net totals reconcile.
- [x] Create readable synthetic sales and appointment data and label it “Datos de demostración”.
- [x] Run focused service tests; all passed. Astro/TypeScript checks are recorded under the final verification task.

## Task 5: Render the functional dashboard

**Files:** `src/components/DashboardPanel.tsx`, `src/components/DashboardPanel.test.tsx`, `src/components/AdminPage.tsx`, `src/pages/admin.astro`, `src/styles/admin.css`, `src/styles/dashboard.css`.

**Interfaces:** `DashboardPanel` receives the data returned by `createDemoData(now)` and uses `getDashboardSummary` / `getSalesSeries`; its period selector accepts `day | week | month`.

- [x] Write and observe RED for period changes updating the summary and chart from the same injected records.
- [x] Write and observe RED for future appointments in chronological order with text status, not color alone.
- [x] Write and observe RED for empty chart, appointment, and activity states.
- [x] Implement `DashboardPanel.tsx` with summary values, local day/week/month selector, SVG chart with responsive labels and accessible text alternatives, upcoming timeline, and recent activity.
- [x] Surface the next upcoming appointment in the top summary so the mobile first viewport includes the timeline's leading item.
- [x] Show today's appointment and pending counts beside the next appointment in the top summary.
- [x] Use one synthetic dataset for KPI, chart, and appointment content; no metric contradicts the fixtures.
- [x] Show explicit, data-driven empty states; do not fake network loading.
- [x] Rerun focused tests and observe PASS.

## Task 6: Verify and close the first stage

**Files:** Changed files from Tasks 1–5; `README.md` only if command or interaction documentation needs correction.

- [x] Run `npm test`; all 6 files and 27 tests PASS.
- [x] Run `npm run check`; Astro/TypeScript report 0 errors, 0 warnings, and 0 hints.
- [x] Run `npm run build`; static build completes with `/`, `/login/`, and `/admin/`.
- [x] Verify the no-session admin redirect, demo entry, period-filtered totals, and sign-out in a browser.
- [x] Inspect mobile (390px) and desktop (1440px) screenshots for hierarchy, navigation, focus, contrast, touch targets, and horizontal overflow; both viewports have no horizontal document overflow.
- [x] Run the Impeccable detector once; its `Arial` font warning was fixed by removing that declaration. No post-fix detector rerun was made.
- [x] Verify the manifest and 192px/512px/maskable PNG icons in the built output. The app does not claim offline support or real authentication.
- [x] Independent security review found no code blockers. Its first scratch probe hit the temp-disk quota; the isolated follow-up ran `npm test`, `npm run check`, and `npm run build` successfully without installing packages.
- [x] Write and read back `DESIGN.md` and `.impeccable/design.json`; validate canonical sections, token references, color ramps, and component references.
- [x] Finish review completed manually because the dedicated finish-reviewer and documenter agents were unavailable; review disposition: ship.
