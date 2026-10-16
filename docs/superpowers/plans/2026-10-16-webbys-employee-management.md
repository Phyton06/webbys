# Employees and Roles Implementation Plan

> **For agentic workers:** Execute this plan task-by-task in order. Keep each task's tests and documentation with its work-unit commit. Use test-first RED → GREEN → REFACTOR.

**Goal:** Build the approved Employees module for staff CRUD, roles, local invitation tracking, and barber compatibility.

**Architecture:** Keep employee role/status rules in a pure TypeScript service. Add employees as an optional additive field on the existing Agenda v1 state; normalize legacy barbers in memory and serialize the employee records on the next successful save. Retain `AgendaState.barbers` as the history-preserving scheduling projection, with employee IDs as barber IDs, and filter active Barber employees only at new-booking boundaries. Astro hosts a Preact Employees page using the existing AdminShell, ClientForm/ClientsPage patterns, agenda persistence, and fixed registration-link component.

**Tech Stack:** Astro 7, Preact 10, TypeScript 6, Vitest 5, localStorage, existing lucide-preact icons, and the shared custom `Dropdown`.

**Delivery:** The feature document selects `ask-on-risk` with the user's `feature-branch-chain` strategy. Keep work on `feat/employees-management`; remote publication remains separately unauthorized.

## Global Constraints

- Employees are created with only a name, phone number, and assigned role.
- Roles are Administrator, Barber, and Assistant.
- All invitations use the same fixed `{application-origin}/registro` link; no employee identifier or token is included.
- Invitation completion is local and manually controlled; opening or copying the link never marks it complete.
- Preserve existing barber IDs, appointments, schedules, and date exceptions through role and activation changes.
- Exclude inactive staff and non-Barber roles from new bookings; keep an existing appointment's assigned barber selectable while editing it.
- Deactivation is reversible; do not hard-delete staff or scheduling history.
- Do not deactivate the last active Administrator.
- Do not add backend services, authentication, email/password fields, remote storage, or a registration route.
- User-facing copy stays Spanish and must follow the current mobile-first charcoal/red design system.
- Do not push, create remote branches, or open PRs.

---

## File map

- `src/types/agenda.ts` — define employee role/invitation unions and `EmployeeRecord`; add optional `employees` to `AgendaState` for compile-time legacy compatibility.
- `src/services/employees.ts` — normalize legacy barbers, retain/update the barber projection, filter bookable barbers, and guard last-admin deactivation.
- `src/services/employees.test.ts` — pure migration/projection/eligibility/guard tests.
- `src/services/agenda-store.ts` — validate optional employee records, migrate legacy state in memory, and persist normalized state without changing the storage version.
- `src/services/agenda-store.test.ts` — legacy migration, raw-byte preservation, invalid employees, save/load round trip, and history integrity.
- `src/data/agenda-demo.ts` — seed the three existing barbers as employees with identical IDs, active Barber role, completed registration status, and empty phone when legacy demo data has none.
- `src/data/agenda-demo.test.ts` — assert seed employee/barber identity and role consistency.
- `src/components/EmployeesPage.tsx` — load shared agenda state, directory/profile selection, CRUD actions, safe deactivation, save feedback, linked appointment history, and barber schedule details.
- `src/components/EmployeesPage.test.tsx` — directory search/filter/sort, profile details/history, CRUD, activation, role, invitation, and last-admin behavior.
- `src/components/EmployeeForm.tsx` — create/edit employee fields, role and invitation status, save/cancel, and generic-link confirmation after creation. Activation changes remain in the guarded EmployeesPage action.
- `src/components/EmployeeForm.test.tsx` — required name/phone/role, callback behavior, fixed generic link, and save failure.
- `src/components/AppointmentForm.tsx` — use employee eligibility to filter barber options for new appointments while retaining the currently assigned barber during edits.
- `src/components/AppointmentForm.test.tsx` — active Barber filtering and existing inactive/non-Barber barber preservation during edit.
- `src/components/AgendaAvailabilityPanel.tsx` — display open starts for active Barber employees only.
- `src/components/AgendaAvailabilityPanel.test.tsx` — exclude inactive and non-Barber staff while preserving eligible barber slots.
- `src/components/AgendaPage.tsx` — no independent employee store; continue passing the shared normalized `AgendaState` to Agenda.
- `src/components/SettingsPage.tsx` — retain schedule administration for history-preserving barber records; only narrow choices if an explicit active-booking boundary requires it.
- `src/components/AdminShell.tsx` and `src/components/AdminShell.test.tsx` — add the Employees route link and active section behavior for desktop/mobile navigation.
- `src/pages/empleados.astro` — add protected static Employees route using existing `AppLayout` and island conventions.
- `src/styles/employees.css` — responsive directory, profile, status, and form presentation using existing tokens.
- `.impeccable/surfaces/src-pages-empleados-astro.md` — Operate-surface direction contract inherited from the approved Clients visual system.
- `src/styles/admin.css` or `src/styles/clients.css` — only adjust shared styles if the existing styles cannot support the Employees page; avoid unrelated restyling.
- `DESIGN.md` — document employee list/profile, role/activation, and generic invitation-link semantics.

## Tasks

### Task 1: Employee domain and legacy agenda persistence

**Files:** Modify `src/types/agenda.ts`, `src/services/agenda-store.ts`, `src/services/agenda-store.test.ts`, `src/data/agenda-demo.ts`, and `src/data/agenda-demo.test.ts`; create `src/services/employees.ts` and `src/services/employees.test.ts`.

**Interfaces:**

```ts
export const EMPLOYEE_ROLE = {
  ADMINISTRATOR: 'administrator',
  BARBER: 'barber',
  ASSISTANT: 'assistant',
} as const;
export type EmployeeRole = (typeof EMPLOYEE_ROLE)[keyof typeof EMPLOYEE_ROLE];

export const EMPLOYEE_INVITATION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
} as const;
export type EmployeeInvitationStatus = (typeof EMPLOYEE_INVITATION_STATUS)[keyof typeof EMPLOYEE_INVITATION_STATUS];

export interface EmployeeRecord {
  id: string;
  name: string;
  phone: string;
  role: EmployeeRole;
  active: boolean;
  invitationStatus: EmployeeInvitationStatus;
}

export interface AgendaState {
  // Existing fields remain unchanged.
  employees?: EmployeeRecord[];
}

export function normalizeEmployees(
  employees: EmployeeRecord[] | undefined,
  barbers: BarberRecord[],
): EmployeeRecord[];

export function syncBarberProjection(
  employees: EmployeeRecord[],
  existingBarbers: BarberRecord[],
): BarberRecord[];

export function getBookableBarbers(
  employees: EmployeeRecord[] | undefined,
  barbers: BarberRecord[],
  includeBarberId?: string,
): BarberRecord[];

export function canDeactivateEmployee(employeeId: string, employees: EmployeeRecord[]): boolean;
```

- [x] **Step 1: Add failing domain tests.** Assert legacy barbers normalize to active Barber employees with the same IDs and completed invitation state; existing employee records win over normalization; a Barber role adds a barber projection; changing role retains the old barber ID/name projection; bookable results contain only active Barber employees plus an optional currently assigned barber; the last active Administrator cannot be deactivated, but an Administrator can be deactivated when another active Administrator remains.
- [x] **Step 2: Run `npm test -- src/services/employees.test.ts`;** observed the expected failure because `src/services/employees.ts` did not exist.
- [x] **Step 3: Add the employee unions/interface and pure helper implementations.** Generate no identifiers in the helpers. Preserve old barber records by ID and update their display names from matching employees.
- [x] **Step 4: Add failing storage tests.** A raw version-1 envelope without `employees` demonstrated the missing in-memory normalization; tests also cover invalid role/status/duplicate IDs, employee round trip on save, and unchanged appointments/schedules/exceptions.
- [x] **Step 5: Validate `employees` only when present and normalize valid legacy Agenda state in memory.** Kept `AGENDA_STORAGE_VERSION` at 1, added employees on a deliberate save, and rejected invalid employee arrays without overwriting stored bytes.
- [x] **Step 6: Seed employees from the existing barber records.** Kept the exact IDs (`barber-1`, `barber-2`, `barber-3`), marked demo records active with Barber role and completed registration, and used an empty phone string where demo barber phone data does not exist.
- [x] **Step 7: Run focused persistence and seed tests.** `npm test -- src/services/employees.test.ts src/services/agenda-store.test.ts src/data/agenda-demo.test.ts` passed 25/25.
- [x] **Step 8: Run `npm run check`;** observed 0 errors, warnings, and hints.
- [x] **Step 9: Record the persisted-format risk and commit Task 1** with domain helpers, normalization, seeds, and tests together. Verified the active global author as `Luis Angel Cardona Becerra <luis.lncb51@gmail.com>`. After Task 1's own checks, independent verification of legacy normalization/history preservation passed. Commit: `f122661`.

### Task 2: Employees directory, profile, CRUD, and invitation

**Files:** Create `src/components/EmployeesPage.tsx`, `src/components/EmployeesPage.test.tsx`, `src/components/EmployeeForm.tsx`, `src/components/EmployeeForm.test.tsx`, and `src/styles/employees.css`; reuse `src/components/AppointmentRegistrationLink.tsx` and patterns from `ClientsPage.tsx`/`ClientForm.tsx`; modify `DESIGN.md` only for the user-visible employee rules.

**Interfaces:**

```ts
interface EmployeeFormProps {
  employee?: EmployeeRecord;
  roleLocked?: boolean;
  onSave: (employee: EmployeeRecord) => boolean;
  onCancel: () => void;
}

interface EmployeesPageProps {
  now?: Date;
}
```

- [x] **Step 1: Add failing `EmployeeForm` tests.** Assert create collects only name, phone, and role; rejects missing values; edit keeps the stable ID and invitation status; a failed save keeps the form open with an alert; a successful new employee displays the shared `/registro` link and does not encode the employee ID. Keep activation exclusively in the `EmployeesPage` action so the last-admin guard cannot be bypassed.
- [x] **Step 2: Run `npm test -- src/components/EmployeeForm.test.tsx`;** observed the expected missing-component failure before implementation.
- [x] **Step 3: Implement controlled English identifiers and Spanish copy for the form.** New records use `employee-${crypto.randomUUID()}`, start active with pending registration, and have no email/password fields. Editing preserves the ID. Link presentation is shared and explicitly generic; never mark the invitation complete from copy/open.
- [x] **Step 4: Add failing `EmployeesPage` tests.** Tests cover employee list search by name/phone, role/active filters, sort, profile fields, only that employee's appointments, barber schedule/date exceptions, save failure preserving state, reversible deactivation, reactivation, role edits, manual pending/completed toggle, and last-admin action/role changes disabled with explanatory text.
- [x] **Step 5: Implement `EmployeesPage` around `loadAgendaState`/`saveAgendaState`.** Every successful mutation builds one next AgendaState, synchronizes the barber projection, writes once, and updates React state only after the write succeeds. Never hard-delete an employee.
- [x] **Step 6: Build profile relations from stable IDs.** Match appointments by `barberId === employee.id`; show schedules and exceptions only when employee role is Barber, while preserving historical records for inactive/changed-role employees.
- [x] **Step 7: Add mobile-first responsive styles and accessibility.** Used existing design tokens, semantic headings, visible focus, labels, modal focus management, and status text; action controls are responsive.
- [x] **Step 8: Run `npm test -- src/components/EmployeeForm.test.tsx src/components/EmployeesPage.test.tsx`;** passed 14/14.
- [x] **Step 9: Update `DESIGN.md` with the Employees navigation, profile, role/status, and generic invitation behavior.** The user-facing behavior now follows the approved design.
- [x] **Step 10: Commit Task 2** with tests, styles, and documentation in the same work unit. Commit: `40d1e34` (`feat(employees): add employee directory and profile`), 1,328 changed lines; kept as one integrated directory/profile workflow rather than splitting by file type.

### Task 3: Barber identity and booking eligibility integration

**Files:** Modify `src/components/AppointmentForm.tsx`, `src/components/AppointmentForm.test.tsx`, `src/components/AgendaAvailabilityPanel.tsx`, `src/components/AgendaAvailabilityPanel.test.tsx`, `src/services/employees.ts`, and its tests only where behavior is required.

**Interfaces:**

- `AppointmentForm` obtains options from `getBookableBarbers(state.employees, state.barbers, appointment?.barberId)`.
- `AgendaAvailabilityPanel` offers open starts only for `getBookableBarbers(state.employees, state.barbers)`.
- `AgendaState.barbers` retains prior IDs, so `agenda-store` appointment/schedule/exception foreign-key validation remains satisfied.

- [x] **Step 1: Add failing booking tests.** Assert inactive Barbers and active Assistants/Administrators are absent from new appointment options; an existing appointment edit retains its assigned inactive or changed-role barber; all current active Barber options and valid available slots remain unchanged.
- [x] **Step 2: Run `npm test -- src/components/AppointmentForm.test.tsx src/components/AgendaAvailabilityPanel.test.tsx`;** observed 3 expected eligibility failures before the integration change.
- [x] **Step 3: Apply the pure `getBookableBarbers` helper at the new-booking selector boundaries.** No IDs were removed from `AgendaState.barbers`, schedules, exceptions, or appointments.
- [x] **Step 4: Verify role changes and deactivation preserve stored appointment history and schedule/exception records.** An independent scratch probe confirmed the barber references and availability/history fingerprints remain unchanged.
- [x] **Step 5: Run focused booking/availability/persistence tests and `npm run check`;** `npm test -- src/services/employees.test.ts src/components/AppointmentForm.test.tsx src/components/AgendaAvailabilityPanel.test.tsx` passed 19/19 and Astro reported 0 diagnostics.
- [x] **Step 6: Commit Task 3** with booking and history regression tests. Independent verification of booking eligibility and history preservation passed in a fresh scratch copy. Commit: `0e18f00`.

### Task 4: Employees route, navigation, final checks, and proof

**Files:** Modify `src/components/AdminShell.tsx`, `src/components/AdminShell.test.tsx`, `DESIGN.md`, and project/task documentation; create `src/pages/empleados.astro`; update `odd/tasks/employees-management.md` and its Engram mirror.

**Interfaces:**

- `AdminShell` accepts active section `Empleados` and links desktop/mobile navigation to `/empleados/`.
- `src/pages/empleados.astro` mounts `EmployeesPage` under the existing `AppLayout` and `AdminGate` conventions.

- [ ] **Step 1: Add failing navigation tests** for active Employees links in desktop and mobile menus and correct `aria-current` behavior.
- [ ] **Step 2: Run `npm test -- src/components/AdminShell.test.tsx`;** expected result: Employees route tests fail before navigation integration.
- [ ] **Step 3: Add the protected static route and navigation link.** Preserve all current route behavior and use the existing admin gate rather than a new auth path.
- [ ] **Step 4: Run focused navigation, employee, booking, availability, store, and seed suites;** expected result: all affected tests pass.
- [ ] **Step 5: Run `npm test`, `npm run check`, and `npm run build`;** record every failure honestly. Existing unrelated failures are not fixed unless they block the approved feature or user authorizes scope expansion.
- [ ] **Step 6: Inspect responsive layouts at 390px and 1440px** using Playwright only for visual/design review; verify no horizontal overflow, usable action buttons, and readable profile/invitation states.
- [ ] **Step 7: Record each task's commit, test results, risk line, and verification result in the feature document and mirror.** Treat unavailable proof as blocked, not PASS. No push or PR operation is authorized.

## Plan self-review

- S1 maps to Task 1; S2/S4 map to Task 2; S3 maps to Task 3; S5 and overall proof map to Task 4.
- The migration is additive and retains version 1; no bytes are rewritten during read-only normalization.
- Existing barber IDs stay in the compatibility projection even when an employee changes role or becomes inactive; new booking filters are applied at selector boundaries only.
- The fixed URL is shared, has no token, and never changes invitation status automatically.
- Last-admin protection is tested in both the pure service and the user-facing action.
- All new route and copy requirements are covered without adding a backend, auth, email, password, or registration route.
