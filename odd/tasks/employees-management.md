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

- [ ] T1 (S1) inline — employee domain records, legacy store normalization, barber compatibility projection, seed data, and persistence tests; status: pending; Risk: item 1 (additive persisted employee records and legacy normalization).
- [ ] T2 (S2, S4) inline — responsive employee directory/profile CRUD, invitations, generic link feedback, role/status editing, and last-admin guard; status: pending; Risk: none.
- [ ] T3 (S3) inline — barber eligibility filtering and employee/agenda synchronization with history preservation; status: pending; Risk: item 3 (shared booking-selector contract).
- [ ] T4 (S5) inline — protected route/navigation, docs, and full checks; status: pending; Risk: none.

## Log

### L1 — Original user requirements and approvals

“bien entonces ahora si continua con la siguiente fase”

“los empleados se deben registrar parecido a los clientes, solo nombre y numero ademas del rol, ya que se registre genera el link”

“Mismo link fijo”

“si lo apruebo”

“si hazlo”

The user approved a unified employee/barber identity that preserves existing barber IDs and schedules, a shared fixed registration link, local simulated invitation state, reversible deactivation, and protection against deactivating the last active Administrator.

### L2 — Starting baseline

The local feature branch starts from the published `main` snapshot `1498415`, which contains Agenda and Clients. Prior recovery work remains preserved on `feat/webbys-production-ui`; no remote branch or push is authorized for this feature. RDD mode is globally off. The approved design is `docs/superpowers/specs/2026-10-16-webbys-employee-management-design.md`; implementation plan: `docs/superpowers/plans/2026-10-16-webbys-employee-management.md`. Before implementation, reconcile this task file with the approved design and inspect the actual persisted-store and booking-selector code.

### L3 — Delivery strategy

The user selected “Feature-branch chain (Recommended)” for this feature after the ~900-line forecast. Keep work on `feat/employees-management`; organize future review slices by coherent work unit. This does not authorize pushes, remote branches, or pull requests.
