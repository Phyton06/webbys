# Webbys Employees and Roles

Objective: Manage employee records, roles, invitation status, and barber scheduling identity. Branch: `feat/employees-management`.
Delivery: `ask-on-risk` with user-selected `feature-branch-chain`, forecast ~900 authored changed lines; test runner: `npm test` (Vitest), plus `npm run check` and `npm run build`.

## Specs

### S1 — Employee records and legacy compatibility

Authorized scope quotes from `task.md`: “Implementa un CRUD completo de empleados.” “Los roles disponibles son:” “Administrador.” “Barbero.” “Asistente.” The user's exact field constraint: “los empleados se deben registrar parecido a los clientes, solo nombre y numero ademas del rol, ya que se registre genera el link”.

Acceptance: employee records contain name, phone, role, active state, and local invitation status; employee IDs remain stable. Existing barber IDs remain the same IDs used by schedules and appointments. Legacy Agenda v1 state without employees loads as active Barber employees without rewriting stored bytes on read. Role or activation changes preserve appointments, schedules, and exceptions. Checks: store normalization, invalid-data preservation, and referential-integrity tests.

### S2 — Employee directory, profiles, and lifecycle

Authorized scope quotes from `task.md`: “Crear empleados.” “Asignar y modificar roles.” “Editar datos personales y de contacto.” “Activar o desactivar cuentas.” “Consultar información del empleado.” The user approved a responsive directory/profile flow similar to Clients and reversible deactivation.

Acceptance: create with only name, phone, and role; search/filter/sort; view and edit profile; deactivate/reactivate without hard deletion; show role, active state, invitation status, appointment history, and barber availability when relevant. Never deactivate the last active Administrator. Do not add employee email, password, hard-delete, backend, or authentication.

### S3 — Barber compatibility and booking eligibility

Authorized scope quotes from `task.md`: “Consultar su agenda y disponibilidad cuando corresponda.” User-approved decisions: “Los barberos conservan sus IDs y horarios actuales.” “Un barbero nuevo no tendría disponibilidad hasta configurarla.” Inactive staff and employees whose role is no longer Barber are excluded from new bookings; existing appointments and their barber identity remain intact.

Acceptance: the agenda/store projection retains IDs needed by existing appointments, schedules, and exceptions; employee names stay synchronized with barber display records. Active Barber employees appear for new bookings only. An existing barber remains selectable while editing an appointment already assigned to that barber. Checks: booking selector and persisted history/schedule regression tests.

### S4 — Generic registration link and last-admin protection

The user explicitly selected “Mismo link fijo” for employees, overriding the original unique-link wording in `task.md`: “El empleado recibirá un enlace único para completar sus datos de acceso y su perfil.”

Acceptance: after employee creation, show the same fixed `{application-origin}/registro` link used by Clients, with no unique token or employee data in its URL. Copying/opening it does not claim registration completion; pending/completed state is explicitly local and manually controlled. Prevent deactivation of the last active Administrator and explain the blocked action. Checks: link equality/copy/state tests and last-admin guard tests.

### S5 — Route, responsive UI, and project constraints

Acceptance: add `/empleados/` under the existing protected shell, with the Clients design system and mobile-first responsive directory/profile forms. Keep all UI copy Spanish, controls keyboard accessible, and save errors visible. No remote operations, new account system, registration route, or actual invitation delivery. Checks: component/navigation tests, `npm run check`, `npm run build`, and responsive visual review.

## Tasks

- [x] T1 (S1) inline — employee domain records, legacy store normalization, barber compatibility projection, seed data, and persistence tests; status: complete; commit: `f122661`; independent verification: pass; Risk: item 1 (additive persisted employee records and legacy normalization).
- [x] T2 (S2, S4) inline — responsive employee directory/profile CRUD, invitations, generic link feedback, role/status editing, and last-admin guard; status: complete; commits: `40d1e34`, `0511a24`; Risk: none.
- [x] T3 (S3) inline — barber eligibility filtering and employee/agenda synchronization with history preservation; status: complete; commit: `0e18f00`; independent verification: pass; Risk: item 3 (shared booking-selector contract).
- [x] T4 (S5) inline — protected route/navigation, docs, responsive review, and full checks; status: complete; commit: `2984b44`; independent verification: pass; Risk: none.

## Log

### L1 — Original user requirements and approvals

“bien entonces ahora si continua con la siguiente fase”

“los empleados se deben registrar parecido a los clientes, solo nombre y numero ademas del rol, ya que se registre genera el link”

“Mismo link fijo”

“si lo apruebo”

“si hazlo”

The user approved a unified employee/barber identity that preserves existing barber IDs and schedules, a shared fixed registration link, local simulated invitation state, reversible deactivation, and protection against deactivating the last active Administrator.

### L2 — Starting baseline

The local feature branch starts from the published `main` snapshot `1498415`, which contains Agenda and Clients. Prior recovery work remains preserved on `feat/webbys-production-ui`; no remote branch or push is authorized for this feature. RDD mode is globally off. The approved design is `docs/superpowers/specs/2026-10-16-webbys-employee-management-design.md`; implementation plan: `docs/superpowers/plans/2026-10-16-webbys-employee-management.md`. Before source edits, the task and design were reconciled with the persisted Agenda store and booking-selector call sites.

### L3 — Delivery strategy

The user selected “Feature-branch chain (Recommended)” for this feature after the ~900-line forecast. Keep work on `feat/employees-management`; organize future review slices by coherent work unit. This does not authorize pushes, remote branches, or pull requests.

### L4 — T1 employee domain and legacy storage

RED: the employee helper tests failed because `src/services/employees.ts` did not exist; the legacy migration and seed tests failed because no employee records were returned. GREEN: focused employee, agenda-store, and seed tests passed 25/25; `npm run check` reported 0 errors, warnings, or hints. The independent verifier used a fresh scratch copy and confirmed exact SHA-256 equality before/after legacy load and rejected-record load, plus identical appointment/schedule/exception fingerprints against baseline `1498415`. No stored bytes or history were changed by read normalization. Commit: `f122661` (`feat(employees): add employee domain and storage compatibility`), 328 changed lines. `Risk: item 1` — the version-1 shape gains an additive employee collection; invalid and legacy records are covered through the public store adapter.

### L5 — T2 Employees directory and profile

RED: `EmployeeForm` and `EmployeesPage` tests failed before their components existed; a later assertion caught duplicated save announcements, and a last-admin role-edit test confirmed the role control must be locked as well as deactivation. GREEN: EmployeeForm/EmployeesPage focused tests passed 14/14; `npm run check` reported 0 errors, warnings, or hints. Coverage includes name/phone search, role/active filters, sorting, linked appointments, weekly schedule/date exceptions, create/edit, generic link display, manual invitation status, last-admin protection, reversible deactivation, and save-failure preservation. Commit: `40d1e34` (`feat(employees): add employee directory and profile`), 1,328 changed lines. The over-400-line slice is kept as one integrated directory/profile CRUD workflow with its form, responsive presentation, and regression tests. `Risk: none` — this UI consumes the existing local storage boundary without changing its format or shared public booking contract.

### L6 — T3 Barber booking eligibility

RED: the new appointment and availability-panel tests failed because all retained barber records were still selectable, including inactive and non-Barber staff. GREEN: `npm test -- src/services/employees.test.ts src/components/AppointmentForm.test.tsx src/components/AgendaAvailabilityPanel.test.tsx` passed 19/19; `npm run check` reported 0 errors, warnings, or hints. New bookings and open-slot displays filter to active Barbers; editing retains the assigned inactive/changed-role barber. An independent verifier in a fresh scratch copy passed its focused tests and check, confirmed all-active seeded candidate/slot output matches baseline `1498415`, and confirmed appointment/schedule/exception fingerprints remain identical. Commit: `0e18f00` (`feat(agenda): filter bookings by employee role`), 127 changed lines. `Risk: item 3` — shared booking selector contract changes are tested through AppointmentForm and AgendaAvailabilityPanel; historical barber references remain preserved.

### L7 — T4 Employees route and final verification

RED: `AdminShell` tests failed because Employees was still an unavailable module and had no route link. GREEN: AdminShell tests passed 9/9; the full suite passed 169/169; `npm run check` reported 0 errors, warnings, and hints; `npm run build` emitted seven routes including `/empleados/`. Visual review at 390px and 1440px showed no horizontal overflow; the create dialog keeps Save/Cancel adjacent, the generic-link confirmation is readable, and the profile returns to the top of the scrollable workspace. The final `impeccable detect --json` returned `[]`. An independent verifier in a fresh scratch copy returned S1-S5 met with all required suite/check/build commands passing and no blockers. It noted browser keyboard behavior was not independently exercised; component tests cover accessible controls, and Playwright was limited to visual/design review. The specialized Impeccable finish-reviewer agent could not be launched because it is not installed; screenshots were reviewed inline and by the independent verifier. Commit: `2984b44` (`feat(employees): add protected employees route`), 69 changed lines. `Risk: none` — the route/navigation addition is covered by component tests and uses the existing protected AdminGate.

### L8 — Local feature-branch review slices

User-selected `feature-branch-chain` is recorded without creating remote PRs or pushing. Ordered local review slices if/when remote publication is separately authorized: T1 `f122661` + documentation record `d4bbaa3`; T2 `40d1e34`, `0511a24` + `5e61f08` and its pending follow-up record; T3 `0e18f00` + `8f7eb6e`; T4 `2984b44` + its pending documentation record. T2 is one integrated 1,328-line CRUD/profile work unit; it was not split by file type. No remote PRs or push were created.

### L9 — T2 mobile form action fit

The visual capture at 390px showed the primary “Guardar empleado” label wrapping inside the two-column Save/Cancel row. A scoped style keeps both employee-form actions on one line; the refreshed 390px capture shows adjacent equal-height buttons and no horizontal overflow. Focused EmployeeForm tests passed 5/5, `npm run check` reported 0 diagnostics, and `npm run build` generated seven routes. Commit: `0511a24` (`fix(employees): keep mobile form actions on one line`), 19 changed lines. `Risk: none` — presentation-only adjustment.
