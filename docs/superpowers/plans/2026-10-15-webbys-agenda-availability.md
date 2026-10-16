# Webbys Agenda and Availability Implementation Plan

> **For agentic workers:** Execute this plan task-by-task in order. Keep each task's tests and documentation with its work-unit commit. Use test-first RED → GREEN → REFACTOR.

**Goal:** Build a mobile-first barber agenda and availability editor that offers 15-minute starts and enforces complete-service availability from one tested rules engine.

**Architecture:** Keep schedule policy in pure TypeScript services, with a local-storage adapter for browser persistence. Astro routes host Preact pages; shared shell navigation connects Dashboard and Agenda, while both views load the same appointment records.

**Tech Stack:** Astro 7, Preact 10, strict TypeScript 6, Vitest 5, existing lucide-preact icons and shared custom `Dropdown`.

## Global Constraints

- The interface remains frontend-only and uses local synthetic data.
- Do not add a backend, authentication service, remote persistence, payment service, or push delivery.
- Offer starts in 15-minute increments and require the full combined service duration to fit.
- The same pure availability rules generate candidate slots and validate final saves.
- A date exception replaces the recurring weekly schedule on that local calendar date.
- Pending and confirmed appointments block time; cancelled appointments release it.
- Persist local changes behind a small adapter; keep scheduling rules out of UI components.
- User-facing interface copy remains Spanish and must not disclose demo/synthetic status.
- Preserve the existing charcoal/red design and use the shared custom `Dropdown` for menus.

---

## File map

- `src/types/domain.ts` — shared appointment record consumed by Dashboard and Agenda.
- `src/types/agenda.ts` — barber/client/service records, barber schedules, availability exceptions, and agenda state types.
- `src/services/availability.ts` — pure slot generation and booking validation.
- `src/services/availability.test.ts` — boundary and conflict tests for the scheduling rules.
- `src/data/agenda-demo.ts` — coherent barber, client, service, schedule, exception, and appointment fixtures.
- `src/data/agenda-demo.test.ts` — fixture relationships and seeded conflict/availability coverage.
- `src/services/agenda-store.ts` — storage adapter for loading/saving persisted schedule data.
- `src/services/agenda-store.test.ts` — serialization, missing-state, and malformed-state tests.
- `src/components/AdminPage.tsx` — load persisted appointments for the dashboard.
- `src/components/AgendaPage.tsx` — protected Agenda shell, view tabs, and shared persisted state.
- `src/components/AgendaPage.test.tsx` — editor navigation and persistence integration.
- `src/components/AgendaPanel.tsx` — day/week views, date navigation, barber and service filters, appointment list/details, and computed open starts.
- `src/components/AgendaAvailabilityPanel.tsx` — service-duration choice and grouped open starts from the shared availability engine.
- `src/components/AgendaAvailabilityPanel.test.tsx` — selected-service recomputation and conflict-free open starts.
- `src/components/AgendaPanel.test.tsx` — accessible view/filter/navigation and appointment behavior.
- `src/components/BarberAvailabilityPanel.tsx` — recurring weekly hours, breaks, and days-off editor.
- `src/components/BarberAvailabilityPanel.test.tsx` — editor validation and persisted updates.
- `src/components/AvailabilityExceptionEditor.tsx` — date-specific days off and replacement hours.
- `src/components/AvailabilityExceptionEditor.test.tsx` — exception precedence, add/edit/remove, and persistence tests.
- `src/components/AppointmentForm.tsx` — booking/rescheduling form with calculated duration, price, and availability.
- `src/components/AppointmentForm.test.tsx` — complete-duration availability, revalidation, save, and error behavior.
- `src/components/AdminShell.tsx` — shared active navigation and real Agenda links.
- `src/pages/agenda.astro` — static Astro route mounting the Agenda Preact island.
- `src/styles/agenda.css` — responsive calendar, appointment, and schedule-editor styles.
- `DESIGN.md` — add the Agenda-specific responsive and status conventions.

## Tasks

### Task 1: Central availability domain

**Files:** Modify `src/types/domain.ts`; create `src/types/agenda.ts`, `src/services/availability.ts`, and `src/services/availability.test.ts`; modify `src/data/demo.ts` and its related tests to supply stable IDs to existing appointment records.

**Interfaces:**
- `AppointmentRecord` retains `id`, `startsAt`, `clientName`, `barberName`, `serviceName`, `status`, and `durationMinutes`, and gains `clientId`, `barberId`, and `serviceIds`.
- `TimeInterval = { start: string; end: string }` uses local `HH:mm` wall-clock values.
- `BarberSchedule = { barberId: string; days: { weekday: number; working: TimeInterval[]; breaks: TimeInterval[] }[] }`, where weekday follows JavaScript `Date.getDay()` (Sunday `0`).
- `AvailabilityException = { barberId: string; date: string; unavailable: boolean; working?: TimeInterval[]; breaks?: TimeInterval[] }`, where date is local `YYYY-MM-DD`.
- `BookingCandidate = { id?: string; barberId: string; startsAt: string; durationMinutes: number }`; `startsAt` is an ISO timestamp interpreted in the browser's local timezone.
- `validateBooking(candidate, schedules, exceptions, appointments, now): BookingValidation` returns `{ valid: true }` or `{ valid: false; reason: 'invalid-date' | 'invalid-time-increment' | 'past' | 'barber-off' | 'outside-working-hours' | 'break-conflict' | 'appointment-conflict' }`. If `candidate.id` matches an existing appointment during rescheduling, validation ignores that appointment only.
- `getAvailableSlots(date, barberId, durationMinutes, schedules, exceptions, appointments, now): string[]` returns local `HH:mm` values on 15-minute boundaries and uses `validateBooking` for each candidate.
- `ScheduleValidation = { valid: true } | { valid: false; reason: 'invalid-interval' | 'overlapping-working-intervals' | 'break-outside-working-hours' | 'overlapping-breaks' }`.
- `validateScheduleIntervals(working, breaks): ScheduleValidation` checks valid `HH:mm` intervals, rejects overlapping working/break intervals, and requires each break to fit in one working interval.

- [ ] **Step 1: Write failing availability tests.** Cover an ordinary valid slot, a start not on a 15-minute boundary, full duration ending exactly at closing, duration extending past closing, a break overlap, a non-working weekday, an exception replacing a normal workday, a day-off exception, pending/confirmed collision, cancelled appointment not blocking, a past start, overlapping work intervals, and a break outside work hours.
- [ ] **Step 2: Run the focused tests and confirm expected failures.** Run `npm test -- src/services/availability.test.ts`; expected result is failure because availability exports do not yet exist.
- [ ] **Step 3: Add the shared schedule/appointment types and ID-bearing fixture appointments.** Keep existing dashboard labels and status values intact; update test factories to include valid stable identifiers.
- [ ] **Step 4: Implement local-time parsing, interval checks, exception precedence, conflict checks, `validateBooking`, and 15-minute `getAvailableSlots`.** Keep helpers private unless tests need to exercise behavior through the public API.
- [ ] **Step 5: Run focused domain and existing dashboard tests.** Run `npm test -- src/services/availability.test.ts src/services/dashboard.test.ts src/components/DashboardPanel.test.tsx`; expected result is all pass, including existing dashboard totals and upcoming sorting.
- [ ] **Step 6: Run `npm run check`.** Expected result: 0 errors, warnings, and hints.
- [ ] **Step 7: Commit the domain and fixture contract.** Use `feat(agenda): enforce barber availability` after the chain strategy is selected.

### Task 2: Local agenda repository and coherent seed data

**Files:** Create `src/data/agenda-demo.ts`, `src/data/agenda-demo.test.ts`, `src/services/agenda-store.ts`, `src/services/agenda-store.test.ts`, and `src/components/AdminPage.test.tsx`; modify `src/components/AdminPage.tsx` and `src/styles/dashboard.css`.

**Interfaces:**
- `AgendaState = { barbers: BarberRecord[]; clients: ClientRecord[]; services: ServiceRecord[]; schedules: BarberSchedule[]; exceptions: AvailabilityException[]; appointments: AppointmentRecord[] }`.
- `AgendaLoadResult = { state: AgendaState; status: 'loaded' | 'seeded' | 'invalid' }`; invalid storage returns a seed while leaving the original stored bytes untouched.
- `createAgendaSeed(now: Date): AgendaState` supplies stable barbers, clients, services and appointments with at least one break, day off, date exception, and appointment conflict.
- `loadAgendaState(storage: Pick<Storage, 'getItem' | 'setItem'>, now: Date): { state: AgendaState; status: 'loaded' | 'seeded' | 'invalid' }` loads valid saved state or returns initial state plus a recovery status.
- `saveAgendaState(storage: Pick<Storage, 'setItem'>, state: AgendaState): void` serializes one versioned state document under a namespaced key.
- Browser storage access remains outside the pure availability module.

- [ ] **Step 1: Write failing fixture and storage tests.** Fixture assertions cover linked barber/client/service IDs, breaks, weekly days off, both date-exception forms, and a reserved interval rejected by the shared availability service. Storage assertions cover absent state seeding, valid versioned round-trip, malformed and unsupported versions preserved without overwrite, blocked reads, and write errors.
- [ ] **Step 2: Run `npm test -- src/data/agenda-demo.test.ts src/services/agenda-store.test.ts` and confirm failure because the fixture/store modules are missing.**
- [ ] **Step 3: Create the agenda types and fixtures.** Define flat barber, client, and service record interfaces plus `AgendaState`; seed data with stable IDs matching appointment records, coherent service durations/prices, workdays, breaks, and date exceptions.
- [ ] **Step 4: Run `npm test -- src/data/agenda-demo.test.ts`; expected result is fixture tests pass while store tests remain blocked until the adapter exists.**
- [ ] **Step 5: Commit the fixtures as a standalone slice.** Use `feat(agenda): seed coherent schedule fixtures`.
- [ ] **Step 6: Implement the versioned local storage adapter.** Validate the envelope version and referenced record IDs before loading; on invalid stored data, return a seed with recovery status and preserve original serialized bytes until a deliberate successful save.
- [ ] **Step 7: Run `npm test -- src/services/agenda-store.test.ts`; expected result is persistence and preservation tests pass.**
- [ ] **Step 8: Commit the storage adapter.** Use `feat(agenda): persist agenda state locally`.
- [ ] **Step 9: Load saved appointments into the dashboard.** Initialize the existing dashboard from the adapter while retaining sales data and summary behavior; show an accessible status if stored state is unreadable.
- [ ] **Step 10: Run dashboard, storage, and auth-gate tests.** Run `npm test -- src/components/AdminPage.test.tsx src/services/agenda-store.test.ts src/services/dashboard.test.ts src/components/DashboardPanel.test.tsx src/components/AdminGate.test.tsx`; expected result is all pass.
- [ ] **Step 11: Commit dashboard persistence wiring.** Use `feat(dashboard): use persisted agenda appointments`.

### Task 3: Agenda route, navigation, and calendar views

**Files:** Create `src/components/AgendaPage.tsx`, `src/components/AgendaPanel.tsx`, `src/components/AgendaPanel.test.tsx`, `src/pages/agenda.astro`, and `src/styles/agenda.css`; modify `src/components/AdminShell.tsx`, `src/components/AdminShell.test.tsx`, `src/pages/admin.astro` only if shared stylesheet placement is needed.

**Interfaces:**
- `AdminShell` accepts `activeSection: 'Inicio' | 'Agenda'`, defaulting to `'Inicio'`; navigation entries link to `/admin/` and `/agenda/` and expose `aria-current="page"` only for the active route.
- `AgendaPanel` receives `state: AgendaState` and `now?: Date`; it is read-only until later tasks wire controlled appointment and schedule edits.
- The day view computes starts for the selected service duration, grouped by the selected barber or all barbers, using `getAvailableSlots` from the same domain service as final booking validation.
- `AgendaAvailabilityPanel` receives `state: AgendaState`, `date: string`, `barberId: string`, and `now: Date`; its service selector changes slot duration and updates grouped slot lists.
- Day view is the mobile default; week view shows a readable seven-day schedule and never forces a horizontal page overflow.

- [ ] **Step 1: Write failing navigation and calendar tests.** Assert Agenda route navigation is a link on desktop/mobile, the active item is marked, day/week controls switch content, date controls change the displayed day, barber filter supports all barbers and one barber, appointment states have visible text, appointment details can be expanded, empty days render clearly, and computed open starts update when the selected service duration changes while conflicting starts remain absent.
- [ ] **Step 2: Run focused tests and confirm expected failures.** Run `npm test -- src/components/AdminShell.test.tsx src/components/AgendaPanel.test.tsx`.
- [ ] **Step 3: Add `/agenda/` Astro route and protected Preact page.** Use the shared `AppLayout`, `AdminGate`, and `AdminShell`; do not create a parallel auth path.
- [ ] **Step 4: Make shared navigation route-aware.** Replace Agenda placeholder actions with real `/agenda/` links and preserve all other modules' existing unavailable behavior.
- [ ] **Step 5: Implement mobile day timeline and date/barber/service filters.** Derive displayed appointments from `AgendaState`; display start time, client, service, barber, and text status. Show expandable available 15-minute starts for the selected service, grouped by barber, using the central availability service.
- [ ] **Step 6: Implement week navigation without a wide mobile table.** Provide seven day selections in a wrapping/scroll-safe layout and a readable per-day appointment list; open starts remain in the focused day view.
- [ ] **Step 7: Add responsive styles and keyboard-visible focus.** Reuse tokens, red only for selected/high-priority state, and semantic labels for date/week controls.
- [ ] **Step 8: Run focused route/navigation tests plus `npm run check`.** Expected result is all focused tests pass and Astro reports 0 diagnostics.
- [ ] **Step 9: Commit the protected route, responsive views, and service-aware open slots in five child-sized slices.** Keep tests with behavior. Planned commits: `refactor(admin): share controls across admin routes`; `feat(agenda): show service-aware available starts`; `feat(agenda): add day and week appointment views`; `style(agenda): render responsive calendar layout`; `feat(agenda): connect protected calendar route`.

### Task 4: Barber working-hours and exception editor

- **T4a files:** Create `src/components/BarberAvailabilityPanel.tsx` and `src/components/BarberAvailabilityPanel.test.tsx`.
- **T4a interface:** `BarberAvailabilityPanel` accepts `barbers`, `schedules`, and `onSave(schedules): boolean`; it edits a local draft and publishes only after complete schedule validation.
- [ ] **Step 1: Write failing weekly-schedule tests.** Cover weekday enable/disable, shift edits, adding/removing a second work interval, editing breaks, rejected overlaps and out-of-shift breaks, and no save on invalid data.
- [ ] **Step 2: Run `npm test -- src/components/BarberAvailabilityPanel.test.tsx`; confirm failure because the editor is missing.**
- [ ] **Step 3: Implement the controlled weekly schedule editor.** Use labeled time inputs in 15-minute increments, native weekday checkboxes, and the shared custom `Dropdown` for barber selection.
- [ ] **Step 4: Validate every work/break interval through `validateScheduleIntervals`; associate validation errors with the time controls and do not call `onSave` on failure.**
- [ ] **Step 5: Run the weekly editor and availability tests.** Run `npm test -- src/components/BarberAvailabilityPanel.test.tsx src/services/availability.test.ts`; expected result: all pass.
- [ ] **Step 6: Commit weekly schedule editing.** Use `feat(agenda): edit weekly barber schedules`.

- **T4b files:** Create `src/components/AvailabilityExceptionEditor.tsx` and `src/components/AvailabilityExceptionEditor.test.tsx`.
- **T4b interface:** `AvailabilityExceptionEditor` accepts `barbers`, `exceptions`, and `onSave(exceptions): boolean`; it stages date-specific changes in a local draft.
- [ ] **Step 7: Write failing exception tests.** Cover day-off override, replacement working hours and breaks, updating rather than duplicating the barber/date pair, and staged removal that persists only after explicit save.
- [ ] **Step 8: Run `npm test -- src/components/AvailabilityExceptionEditor.test.tsx`; confirm failure because the editor is missing.**
- [ ] **Step 9: Implement day-off and replacement-hours exception editing.** Validate replacement intervals, keep recurring schedules unchanged, and retain removals as drafts until the save action.
- [ ] **Step 10: Verify saved exception precedence using `getAvailableSlots`.** A day-off override removes all slots; replacement hours are the only intervals considered on that date.
- [ ] **Step 11: Run exception, availability, and storage tests.** Run `npm test -- src/components/AvailabilityExceptionEditor.test.tsx src/services/availability.test.ts src/services/agenda-store.test.ts`; expected result: all pass.
- [ ] **Step 12: Commit date-specific exception editing.** Use `feat(agenda): manage date-specific availability exceptions`.

- **T4c files:** Modify `src/components/AgendaPage.tsx` and `src/styles/agenda.css`; create `src/components/AgendaPage.test.tsx`.
- **T4c interface:** `AgendaPage` owns the loaded `AgendaState`; successful editor saves call `saveAgendaState`, update page state, and immediately recalculate calendar availability. Failed storage writes leave state unchanged and show form feedback.
- [ ] **Step 13: Add a failing AgendaPage test for editor navigation and persistent weekly schedule/exception saves.** Also assert that a saved schedule change changes open times after returning to Citas.
- [ ] **Step 14: Run `npm test -- src/components/AgendaPage.test.tsx`; expected failure is unavailable Citas/Disponibilidad controls.**
- [ ] **Step 15: Add Citas/Disponibilidad navigation and persist successful editor saves through the existing storage adapter.** Keep both views mounted but hide the inactive one so unsaved drafts are not silently lost when switching tabs.
- [ ] **Step 16: Style the view switch, weekly rows, date exception form, controls, errors, and save confirmation using existing design tokens.** Preserve mobile layout without horizontal scrolling and provide visible keyboard focus.
- [ ] **Step 17: Run AgendaPage, editor, storage, and availability tests plus `npm run check`.** Expected result: all focused tests pass and Astro reports 0 diagnostics.
- [ ] **Step 18: Inspect the weekly schedule and exception editor at 390px and 1440px.** Verify controls fit, no horizontal overflow, and invalid input feedback is readable and associated with its fields.
- [ ] **Step 19: Commit persistence integration and editor presentation.** Use `feat(agenda): persist barber availability settings` for page wiring and `style(agenda): style availability editors` for the presentation/accessibility slice.

### Task 5a: Validated appointment form

**Files:** Create `src/components/AppointmentForm.tsx` and `src/components/AppointmentForm.test.tsx`; modify `src/services/availability.ts`, `src/services/agenda-store.ts`, and `src/types/domain.ts` only as required for rescheduling exclusion and appointment notes.

**Interfaces:**
- `AppointmentForm` accepts `state`, `appointment?: AppointmentRecord`, `now`, `onSave(nextAppointment): boolean`, and `onCancel()`.
- Selected service IDs resolve against local service fixtures; combined duration and estimated price are sums of selected service duration and price.
- Any change in date, barber, or services recomputes available 15-minute starts using `getAvailableSlots`.
- Submit always invokes `validateBooking` with the latest state; invalid submissions remain unsaved and map typed validation reasons to Spanish feedback.
- Rescheduling excludes the appointment being edited when calculating available starts as well as during final validation.

- [x] **Step 1: Write failing booking-form tests.** Cover service duration/price calculation, selected barber/date/service changing the slot list, creating a valid appointment, rejecting a stale now-conflicted slot without persistence, rejecting a duration that crosses a break or shift end, and rescheduling without conflicting with the appointment being edited.
- [x] **Step 2: Run `npm test -- src/components/AppointmentForm.test.tsx` and confirm expected failures.**
- [x] **Step 3: Implement the form's controlled inputs, multi-service selection, estimates, and errors.** New bookings select an existing client; selected service duration and price add together; all display text remains Spanish.
- [x] **Step 4: Recompute starts for barber/date/service changes and exclude the edited appointment during rescheduling.** Add the optional `ignoreAppointmentId` argument to `getAvailableSlots` and make it pass the candidate ID into `validateBooking`.
- [x] **Step 5: Revalidate at submit and return false from the form callback when persistence is rejected.** Keep the form open and show a Spanish storage error if `onSave` returns false.
- [x] **Step 6: Run focused tests and type checks.** Run `npm test -- src/components/AppointmentForm.test.tsx src/services/availability.test.ts` and `npm run check`; expected result: all pass and 0 diagnostics.
- [x] **Step 7: Commit the form and its API contract in one child-sized slice.** Include `AppointmentForm`, its test, `getAvailableSlots` self-appointment exclusion, and optional appointment notes/type validation. Use `feat(agenda): add validated appointment form`; commit `d770b3c`.

### Task 5b: Agenda create/reschedule integration

**Files:** Modify `src/components/AgendaPanel.tsx`, `src/components/AgendaPanel.test.tsx`, `src/components/AgendaPage.tsx`, and `src/components/AgendaPage.test.tsx`.

**Interfaces:**
- `AgendaPanel` accepts optional `onAppointmentSave(appointment): boolean`; it opens a form for new and existing appointment records.
- `AgendaPage` upserts by stable appointment ID and persists via `saveAgendaState`; failed persistence leaves prior state unchanged and the form open with an error.

- [x] **Step 1: Write failing AgendaPanel integration tests.** Assert a new-cita action opens the form, a selected valid appointment is delivered to `onAppointmentSave`, reprogramming keeps the same ID, and cancel closes without saving.
- [x] **Step 2: Run `npm test -- src/components/AgendaPanel.test.tsx -t "opens a booking form"`; confirm expected failure before UI integration.**
- [x] **Step 3: Wire new and reschedule actions into the day appointment list.** Offer rescheduling only for pending and confirmed appointments.
- [x] **Step 4: Upsert and persist through `AgendaPage`.** Preserve existing sales data; on storage failure show an error and keep the form available for retry.
- [x] **Step 5: Verify a created appointment is visible in Agenda and survives reload for Dashboard.** Run `npm test -- src/components/AgendaPanel.test.tsx src/components/AgendaPage.test.tsx src/components/AdminPage.test.tsx`.
- [x] **Step 6: Commit Agenda integration.** T5b integration and lifecycle regression coverage are included in `50d9cac` (`feat(agenda): complete appointment lifecycle`).

### Task 6: Appointment lifecycle, cross-view persistence, and final proof

**Files:** Modify `src/components/AgendaPanel.tsx`, `src/components/AgendaPanel.test.tsx`, `src/components/AgendaPage.tsx`, `src/components/DashboardPanel.tsx`, `DESIGN.md`; create or extend integration tests in `src/components/AgendaPanel.test.tsx`.

**Interfaces:**
- Status actions accept only the existing `AppointmentStatus` values.
- Pending and confirmed appointments remain blocking; completed history remains visible; cancellation persists a cancelled status and makes the interval available again.
- Dashboard and Agenda load the same saved `AppointmentRecord[]` while sales data remains unchanged.

- [x] **Step 1: Write failing lifecycle tests.** Cover confirming a pending appointment, completing a confirmed appointment, cancelling an appointment, verifying a cancelled interval is returned by `getAvailableSlots`, and reloading the page state so Agenda and Dashboard show the same appointment list.
- [x] **Step 2: Run `npm test -- src/components/AgendaPanel.test.tsx src/components/DashboardPanel.test.tsx` and confirm the new lifecycle assertions fail for missing actions/state synchronization.**
- [x] **Step 3: Implement appointment detail and status actions.** Keep status text accessible, and ensure cancellation immediately updates the controlled `AgendaState` and shared persisted store.
- [x] **Step 4: Connect Dashboard and Agenda reads to the same stored appointment collection.** Preserve current sales summary calculations and chronological upcoming-appointment behavior.
- [x] **Step 5: Document Agenda layout and status semantics in `DESIGN.md`.** Include mobile day-first behavior, 15-minute choices, text status alongside color, and exception precedence.
- [x] **Step 6: Run focused lifecycle, availability, dashboard, and storage tests.** Run `npm test -- src/components/AgendaPanel.test.tsx src/components/DashboardPanel.test.tsx src/services/availability.test.ts src/services/agenda-store.test.ts`; expected result is all pass.
- [x] **Step 7: Run `npm test`, `npm run check`, and `npm run build`.** Expected result: all tests pass, zero Astro diagnostics, and all static routes build including `/agenda/`.
- [x] **Step 8: Inspect one mobile and one desktop browser render.** Verify day/week navigation, dropdown appearance, no horizontal overflow at 390px, and schedule editor/form fit at 1440px.
- [x] **Step 9: Commit the lifecycle and final verified integration.** Use `feat(agenda): complete appointment lifecycle`; commit `50d9cac` (254 changed lines including tests and documentation).

## Delivery and rollback

- ODD task route: direct inline for seven work units (T1–T4, T5a, T5b, T6); no parallel disjoint write units are planned.
- Delivery strategy: `ask-on-risk` (default); the user selected `feature-branch-chain`. Updated forecast is approximately 3,700 authored changed lines, excluding generated output. Keep every child slice within 400 additions plus deletions; if any single work unit exceeds that budget, make one honest, behavior-cohesive split before its commit.
- Planned chain: original implementation slices were planned around `feat/webbys-production-ui`; the user later explicitly replaced remote `main` with current project snapshot `bd8d89a`. The remaining lifecycle commit `50d9cac` is local on `webbys-replacement` and has not been pushed. No PR was created; further publishing requires explicit authorization.
- Observed slices: T1a `d07385d` = 146 lines; T1b `596b90b` = 238; T1c `49d36dd` = 93; T2a `846618a` = 161; T2b `549c9ec` = 249; T2c `e9a264f` = 74; T3a `6cf516a` = 177; T3b `22a75bc` = 146; T3c `f6046e4` = 341; T3d `9fe8a98` = 380; T3e `d61d8a3` = 173; T4a `d038047` = 328; T4b `38f1895` = 343; T4c `fd9bfc5` = 149; T4d `c0dd68b` = 333. All observed slices are under 400 changed lines.
- Dependency diagram: `main → tracker feat/webbys-production-ui → 📍T1a interval model → T1b booking validation → T1c slot generation → T2a seed fixtures → T2b persistence → T2c Dashboard wiring → T3a shared controls → T3b open times → T3c calendar views → T3d responsive styling → T3e protected route/nav → T4a weekly schedules → T4b date exceptions → T4c persisted Agenda settings → T4d editor accessibility/styles → T5a form → T5b create/reschedule integration → T6 lifecycle/final proof`.
- Current PR boundary: none. The current lifecycle work-unit commit is local only; no follow-up remote operation was authorized in this continuation.
- Runtime verification: local `npm test`, `npm run check`, `npm run build`, and Playwright browser inspection; no remote service boundary exists.
- Rollback is by work unit: revert a task's named commit to remove only that layer, retaining earlier tested schedule capabilities.

## Plan self-review

- Domain tests cover every availability invariant and use one validator for generation and final save.
- All design areas map to plan tasks: central rules (1), persistence/data (2), agenda views/navigation/open times (3), schedule editor (4), booking form (5a), create/reschedule integration (5b), and lifecycle/cross-view persistence/final proof (6). T1 through T4 were split into cohesive sub-400-line commits based on observed changed-line counts.
- Every code task begins with focused failing tests and names exact focused commands.
- `AppointmentRecord` keeps the dashboard's existing display fields while adding stable relationship IDs; existing dashboard summary and ordering tests remain in Task 1 and Task 2 verification.
- User selected Feature Branch Chain for review slices. This choice does not authorize remote branch creation, PR creation, or other remote operations.
- No implementation design placeholders remain.
