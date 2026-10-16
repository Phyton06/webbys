# Webbys Mobile Calendar and Booking Flow

Objective: Improve mobile Agenda navigation and the local new-client/new-appointment flow. Branch: `webbys-replacement`.
Delivery: `ask-on-risk` with the user's prior `feature-branch-chain` preference; forecast ~1,100 authored lines; test runner: `npm test` (Vitest), plus `npm run check` and `npm run build`.

## Specs

### S1 — Mobile month calendar

User request: “el calendario se ve mal en movil, arregla eso con un calendario que se vea mas adecuado al dise;o”. Approved visual choice: “la opcion b”.

Acceptance: At mobile widths, render a compact month grid with a selected date and appointment indicators, followed by that date's appointment list. Date/month selection is keyboard-operable and preserves existing appointment status, reschedule, and availability actions. Keep the existing desktop day/week agenda behavior and weekly layout. Checks: month navigation/date-selection component tests, Agenda integration tests, `npm run check`, and browser inspection at 390px and 1440px.

### S2 — Local appointment modal, client creation, and generic link

User request: “al generar nueva cita que se haga desde un sweetalert, y ademas ahi cambiar el selector de cliente por un buscador con selector, osea combinado, ademas a su lado el boton para agregar un cliente nuevo y ya que finalice el agregar al cliente continue con la generacion de la cita y al terminar de hacer la cita que se genere un link para que se lo envie al cliente donde el cliente terminaria su registro, ya que aqui el registro debe ser sencillo solo el nombre y el numero telefonico”. The user clarified: “no, solo hay que simular esto que te acabo de contar osea hacer el flujo como si en realidad lo hiciera pero sin back frontend-only”; “solo con que genere un link generico, no nececsita funcionar, que siempre de el mismo”; and “usa la opcion 3 del modal propio, di solo de ejemplo sweetalert pero mejor propio”.

Acceptance: Use a custom, responsive Preact dialog rather than SweetAlert. It supports client text search plus selection and an adjacent add-client action. The add-client substep requires only name and phone; after saving, the new client is persisted locally, selected, and the booking draft resumes with its other choices intact. Saving an appointment continues to use the shared `validateBooking` path and local store. The success state displays a copyable generic link derived from the app origin plus fixed `/registro`; it is identical for all appointments, carries no personal data or token, and does not require a route, backend, or synchronization. Checks: modal, search, local persistence, client-step continuity, validation, generic-link consistency/copy tests; existing appointment/dashboard tests; full suite, type check, build, and browser checks at 390px and 1440px.

## Tasks

- [x] T1 (S1) inline — mobile month-grid calendar and selected-day appointments; status: complete; commit: `2c2b127`; Risk: none.
- [x] T2a (S2) inline — accessible searchable client combobox; status: complete; commit: `d483d93`; Risk: none.
- [x] T2b (S2) inline — custom booking dialog, client search/add, local persistence, and appointment-draft continuity; status: complete; commit: `62b571a`; Risk: none.
- [x] T2c (S2) inline — identical generic registration-link success state and copy action; status: complete; commit: `fb90d95`; Risk: none.

## Log

### L1 — Original user request

“2 detalles 1 el calendario se ve mal en movil, arregla eso con un calendario que se vea mas adecuado al dise;o y ademas, al generar nueva cita que se haga desde un sweetalert, y ademas ahi cambiar el selector de cliente por un buscador con selector, osea combinado, ademas a su lado el boton para agregar un cliente nuevo y ya que finalice el agregar al cliente continue con la generacion de la cita y al terminar de hacer la cita que se genere un link para que se lo envie al cliente donde el cliente terminaria su registro, ya que aqui el registro debe ser sencillo solo el nombre y el numero telefonico”

### L2 — Frontend-only clarification

“no, solo hay que simular esto que te acabo de contar osea hacer el flujo como si en realidad lo hiciera pero sin back frontend-only”

### L3 — Generic link behavior

“solo con que genere un link generico, no nececsita funcionar, que siempre de el mismo”

### L4 — Calendar layout selection

“la opcion b” — selected a compact mobile month grid with the selected day's appointment list below it.

### L5 — Modal approach and design approval

“usa la opcion 3 del modal propio, di solo de ejemplo sweetalert pero mejor propio”

“si hazlo” — approved the written mobile calendar and booking-flow design in `docs/superpowers/specs/2026-10-15-webbys-mobile-calendar-booking-design.md`.

### L6 — Implementation authorization

“hazlo” — approved proceeding with the implementation plan for the approved spec.

### L7 — T1 mobile calendar completion

RED: the month-calendar component test failed because `MobileMonthCalendar` did not exist; the Agenda integration test then failed because the mobile month calendar was not rendered. GREEN: mobile calendar and Agenda component tests passed 17 tests; the focused Agenda/Page integration suite passed 24 tests; `npm run check` reported 0 diagnostics. Browser inspection at 390px confirmed the month grid and selected-day list are usable without horizontal overflow; at 1440px the month grid is hidden and the prior day/week desktop layout remains. Commit: `2c2b127` (`feat(agenda): add mobile month calendar`), 412 changed lines. The slice is 12 lines over the approximate 400-line budget because the calendar component, responsive Agenda integration, and regression tests form one cohesive behavior; no artificial split was made. `Risk: none` — date selection does not change the appointment data contract or availability rules, and existing desktop day/week behavior remains covered.

### L8 — T2 implementation start

T1 is complete locally in commit `2c2b127`. Begin T2 test-first; do not add backend, registration route, or SweetAlert dependency.

### L9 — T2 work-unit decomposition

The initial T2 diff combines a reusable client combobox with the end-to-end booking flow. T2a isolates the keyboard-accessible combobox; T2b delivers the modal and local client creation with appointment continuity; T2c adds the copyable generic-link success state. Implementation stays inline, local-only, and does not add a backend or registration route.

### L10 — T2a client combobox

RED: the three `ClientCombobox` tests failed because the module did not exist; a follow-up keyboard test failed because ArrowDown skipped the first result, and the empty-result announcement test failed because it was not exposed as a status region. GREEN: `npm test -- src/components/ClientCombobox.test.tsx` passed all 5 tests. Commit: `d483d93` (`feat(agenda): add searchable client selection`), 221 changed lines. `Risk: none` — the component is client-only UI and consumes existing `ClientRecord` fields without changing their storage shape.

### L11 — T2b/T2c work-unit sizing

The initial combined diff for modal, client creation, local persistence, appointment-draft continuity, and generic link was approximately 417 lines. The generic-link success state was moved to T2c so it can be verified and reviewed as a distinct behavior.

### L12 — T2b local client booking flow

RED: client-combobox tests failed while the component was absent; the AgendaPage flow test failed because a new booking did not open a dialog. GREEN: focused ClientCombobox, AppointmentForm, AgendaPanel, AgendaPage, AdminPage, and availability tests passed (55 tests); `npm run check` reported 0 diagnostics. The full appointment flow persists only the entered client name/phone, returns to the retained date/service/time draft, and saves the appointment through existing availability validation. Commit: `62b571a` (`feat(agenda): add local client booking modal`), 416 changed lines. The 16-line overage is the honest behavior-cohesive modal/client-local-save/draft-resume slice; no artificial split was made. `Risk: none` — existing local storage schema and booking validation contract are unchanged and covered by integration tests.

### L13 — T2c generic link completion

RED: the `AppointmentRegistrationLink` tests failed because the component did not exist. GREEN: generic-link tests verify the fixed origin-based `/registro` path, absence of client/appointment data, copy success, and a manual-selection fallback when clipboard access fails; AgendaPage tests verify new bookings surface the same link. Focused registration-link, form, and AgendaPage tests passed 16 tests, and `npm run check` reported 0 diagnostics. Commit: `fb90d95` (`feat(agenda): show generic registration link`), 101 changed lines. `Risk: none` — the generic URL is constant and adds no route, backend, token, or remote data flow.

### L14 — Feature completion and delivery boundary

Final verification: `npm test -- --reporter=dot` passed 112 tests across 19 files; `npm run check` reported 0 diagnostics; `npm run build` emitted `/`, `/admin/`, `/agenda/`, and `/login/`. Browser checks at 390px and 1440px showed the responsive calendar/modal without horizontal overflow; the local booking flow was manually exercised through client creation, appointment save, generic-link display, and clipboard confirmation. Work-unit commits: T1 `2c2b127`, T2a `d483d93`, T2b `62b571a`, T2c `fb90d95`. Remote `main` remains snapshot `bd8d89a`; no new commit from this feature was pushed.
