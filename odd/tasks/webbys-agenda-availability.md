# Webbys Agenda and Availability

Objective: Build the Agenda and barber availability module. Branch: `feat/webbys-production-ui`.
Delivery: `ask-on-risk` with user-selected `feature-branch-chain`, forecast ~4,700 authored lines; test runner: `npm test` (Vitest), plus `npm run check` and `npm run build`.

## Specs

### S1 — Agenda navigation and views

Authorized scope quotes from `task.md`: “Vista diaria.” “Vista semanal.” “Filtro por barbero.” “Vista conjunta de todos los barberos.” Agenda route integrates with the current protected shell.

Acceptance: daily and weekly agenda views, selected date, all-barbers and single-barber filters, status text, and mobile layout without horizontal overflow. Checks: Agenda/navigation tests; `npm run check`; browser layout inspection.

### S2 — Single availability source

Authorized scope quotes from `task.md`: “Días de trabajo.” “Hora de inicio y finalización de cada jornada.” “Pausas y descansos.” “Días libres.” “Excepciones de disponibilidad para fechas específicas.” “No debe ser posible crear una cita fuera del horario laboral de un barbero, en un día en el que no trabaja, durante sus descansos ni cuando ya tenga otra cita que se solape.” “Utiliza una única fuente de verdad para los horarios laborales, los descansos, las citas existentes y las excepciones.”

Acceptance: weekly schedules, breaks, days off, replacement date exceptions, conflict checking, and 15-minute starts all use the same tested local-time rules. User-approved decision: candidate starts occur every 15 minutes, with the complete service duration validated. Checks: availability unit tests for all boundaries and conflict cases.

### S3 — Booking lifecycle

Authorized scope quotes from `task.md`: “Crear citas manualmente.” “Reprogramar citas.” “Cancelar citas.” “Cambiar su estado: pendiente, confirmada, completada o cancelada.” “Antes de permitir guardar una cita, valida nuevamente que el barbero esté disponible durante toda la duración del servicio.” “Cuando cambie el barbero, la fecha o los servicios, actualiza los horarios disponibles.”

Acceptance: local appointment create/reschedule/status/cancel operations; date, barber, and service selection recompute choices; save performs final validation; cancelled records release their interval. Checks: form/integration tests and persistence tests.

### S4 — Coherent frontend data and persistence

Authorized scope quotes from `task.md`: “Utiliza datos de demostración suficientes para probar conflictos, horarios disponibles y cambios de cita.” “Persistencia local de los cambios cuando resulte conveniente.”

Acceptance: local fixtures cover schedule boundaries and related IDs; saved schedule/appointment state reloads consistently in Agenda and Dashboard. No backend or remote calls. Checks: store, dashboard regression, and appointment tests.

### S5 — Existing product constraints

Authorized scope quotes from `task.md`: “Diseño mobile-first real, no una interfaz de escritorio reducida.” “Accesibilidad básica para controles y formularios.”

Acceptance: Spanish interface uses existing charcoal/red tokens, keyboard-operable controls, visible focus, text appointment states, and responsive mobile/desktop layouts. Do not expose demo/synthetic disclosures in visible UI, per the user's prior request. Checks: component tests, `npm run check`, `npm run build`, and browser inspection at 390px and 1440px.

## Tasks

- [x] T1 (S2, S4) inline — central schedule types, availability engine, and deterministic tests; status: complete; commits: `d07385d`, `596b90b`, `49d36dd`; Risk: none.
- [x] T2 (S2, S4) inline — coherent schedule fixtures and local persistence shared with Dashboard; status: complete; commits: `846618a`, `549c9ec`, `e9a264f`; Risk: none.
- [x] T3 (S1, S2, S5) inline — protected Agenda route, shared navigation, responsive day/week views, and computed open starts; status: complete; commits: `6cf516a`, `22a75bc`, `f6046e4`, `9fe8a98`, `d61d8a3`; Risk: none.
- [x] T4 (S2, S5) inline — weekly barber schedule and date-exception editor; status: complete; commits: `d038047`, `38f1895`, `fd9bfc5`, `c0dd68b`; Risk: none.
- [x] T5a (S3) inline — validated appointment form with service estimates and save-time rule checks; status: complete; commit: `d770b3c`; Risk: none.
- [ ] T5b (S3, S4, S5) inline — create/reschedule wiring, local persistence, and cross-view regression; status: in_progress; commit: pending.
- [ ] T6 (S3, S4, S5) inline — appointment status/cancellation lifecycle, dashboard synchronization, documentation, full checks, and browser proof; commit: pending.

## Log

### L1 — Original user request

“perfecto ahora si sigamos con la siguiente fase”

### L2 — Confirmed scheduling increment

“si me parece” — accepted 15-minute appointment starts with validation that the whole service duration fits.

### L3 — Design approval

“hazlo” — approved documenting the agenda and availability design.

### L4 — Specification approval

“procede” — approved proceeding from the written design specification to planning.

### L5 — Current evidence and next step

Design spec: `docs/superpowers/specs/2026-10-15-webbys-agenda-availability-design.md`. Implementation plan: `docs/superpowers/plans/2026-10-15-webbys-agenda-availability.md`. Feature baseline: `80628d4`; plan/tracker commit: `574feb3`. Current status: seven inline work units planned; user selected `feature-branch-chain` on 2026-10-15. The current local branch is `webbys-replacement`; the user explicitly authorized replacing repository `Phyton06/webbys` main with snapshot `bd8d89a`. No PR or further remote operation is part of this continuation. T1 through T4 and T5a are complete; T5b/T6 remain in progress until the verified lifecycle work-unit commit. The source checkout's commit object is corrupt, so this clean clone is the current implementation workspace.

### L6 — Delivery strategy

“Feature Branch Chain (Recommended)” — selected a review chain while keeping integration in the current feature branch; remote operations remain separately unauthorized.

### L7 — T1 verification and boundary

RED: `npm test -- src/services/availability.test.ts` failed before the scheduling module existed; later, validator and slot tests each failed because their exports were not implemented. GREEN: the focused availability/dashboard tests passed (31 tests), `npm run check` reported 0 diagnostics, and `npm test` passed all 52 tests. Commits: `d07385d` (146 lines, schedule interval model), `596b90b` (238 lines, appointment conflict validation), and `49d36dd` (93 lines, slot generation); each slice is under 400 changed lines. The original unsplit commit `7fbbc19` is preserved on local branch `backup/agenda-availability-t1`. `Risk: none` — interval, booking, and slot rules have deterministic tests; existing dashboard calculations and ordering remain covered.

### L8 — Authorized local history split

“Autorizar división local (Recommended)” — authorized preserving the original unpublished commit on a local backup ref and rebuilding T1 as smaller commits; no remote operations were authorized.

### L9 — T2 verification and commits

RED: `npm test -- src/services/agenda-store.test.ts` failed while fixture/store modules were absent; the Dashboard integration test failed because it still showed transient appointments instead of persisted records. GREEN: fixture tests (2), store tests (6), Dashboard integration (1), focused Dashboard/auth tests, and `npm run check` (0 diagnostics) passed; full `npm test` passed all 61 tests. Commits: `846618a` (161 lines, coherent fixtures), `549c9ec` (249 lines, safe local persistence), and `e9a264f` (74 lines, persisted Dashboard appointments); each slice is below 400 changed lines. `Risk: none` — malformed stored bytes are preserved and tested; existing dashboard behavior remains covered.

### L10 — T3 verification and commits

RED: navigation tests failed while Agenda was still a placeholder; AgendaPanel tests initially failed because the component and route did not exist; service-aware slot tests failed until the panel was added. GREEN: focused navigation/panel tests passed, `npm run build` produced the Agenda static route, and final `npm test` passed all 70 tests. Commits: `6cf516a` (177 lines, shared admin controls/styles), `22a75bc` (146, service-aware open starts), `f6046e4` (341, day/week appointment views), `9fe8a98` (380, responsive calendar styles), and `d61d8a3` (173, protected route/navigation); all slices are below 400 changed lines. `Risk: none` — navigation, date/barber/service filters, status labels, appointment disclosures, and full-duration slot display are covered by tests.

### L11 — T3 completed

Visual verification: mobile at 390px and desktop at 1440px showed the day/week calendar, grouped available-slot counts, and no horizontal overflow; the production build emitted all four static routes. The manual detector produced design-token advisories only; no blocking structural findings. T4 is next.

### L12 — T4 verification and commits

RED: weekly-editor tests failed before `BarberAvailabilityPanel` existed; exception tests failed before `AvailabilityExceptionEditor` existed; AgendaPage integration tests failed while the Citas/Disponibilidad switch and persisted schedule update were missing. GREEN: focused editor/Page tests passed, `npm run check` reported 0 diagnostics, and full `npm test` passed all 84 tests; `npm run build` emitted all four routes. Commits: `d038047` (328 lines, weekly schedule editor), `38f1895` (343, date exceptions), `fd9bfc5` (149, persisted Agenda settings), and `c0dd68b` (333, editor styling and accessible field errors); every slice is under 400 changed lines. `Risk: none` — stored changes use the existing versioned local adapter and interval tests cover the rules.

### L13 — T4 completed

Visual checks at 390px and 1440px confirmed the weekly schedule and exception editors fit without horizontal overflow. Browser verification found the inactive availability section retained computed `display:grid` despite its `hidden` attribute; the scoped `[hidden]` rule now produces `display:none` until selected. `T4` is complete; T5 is next.

### L15 — T5a appointment form

RED: `npm test -- src/components/AppointmentForm.test.tsx` initially failed because the form module did not exist; after implementation, rescheduling tests exposed that available-slot generation did not exclude the appointment being edited. GREEN: all 6 form tests and 22 availability tests pass; `npm run check` reports 0 diagnostics. Commit: `d770b3c` (`feat(agenda): add validated appointment form`), 337 changed lines. `Risk: none` — booking save revalidates availability and the interface operates solely on local records.

### L16 — User continuation request

“bien ahora si continuemos con el resto de la tarea”

### L17 — T5b/T6 implementation and verification in progress

T5b integration in published snapshot `bd8d89a` includes create/reschedule persistence; added regression checks cover stable reschedule identity, cancel-without-save, and shared persisted appointments in Dashboard. T6 RED: the three status-transition tests failed because appointment status actions did not exist; a weekly-view test also failed because successful status feedback was not announced outside the daily view. GREEN: status transitions now cover pending→confirmed, confirmed→completed/cancelled; cancellation retains the record and existing availability tests prove cancelled intervals no longer block. Dashboard reads the same persisted appointment collection and excludes cancelled records from upcoming appointments. Browser checks at 390px and 1440px found no horizontal overflow; a live weekly-view confirm action announced “Estado actualizado: Confirmada.” Focused Agenda/availability integration tests passed 42 tests; full suite passed 99 tests, `npm run check` reported 0 diagnostics, and `npm run build` emitted all four routes. Work-unit commit and final task closure remain pending.
