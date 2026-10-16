# Webbys Client Management

Objective: Add a frontend-only Clients administration module using the established Webbys interface. Branch: `webbys-replacement`.
Delivery: `ask-on-risk` with the user's prior `feature-branch-chain` preference; forecast ~900 authored lines; test runner: `npm test` (Vitest), plus `npm run check` and `npm run build`.

## Specs

### S1 — Client list and navigation

User requirements: “Listar clientes.” “Buscar por nombre, teléfono o correo.” “Filtrar y ordenar resultados.”

Acceptance: Add a working `/clientes/` route, mark Clientes active in desktop and mobile navigation, and preserve the four mobile navigation slots. Render the client directory using the existing dark/red design system with responsive list rows, search by name/phone/email, status filter, and deterministic sort. Checks: navigation, route, responsive list, and search/filter/sort tests; Playwright visual review at 390px and 1440px.

### S2 — Client records and lifecycle

User requirements: “Editar información.” “Desactivar o eliminar registros con confirmación, según corresponda.” “El administrador debe poder registrar inicialmente a un cliente proporcionando únicamente:” “Nombre.” “Número de teléfono.”

Acceptance: Create clients with name and phone only; do not show or collect email in the new-client form. Existing client email remains optional and editable, and email continues to be searchable. Edit records without changing IDs or breaking appointment references. Support reversible deactivation, confirmation, and reactivation. Old stored records without email/active fields remain valid and default to active. Inactive clients remain visible in history/profile and are excluded from new appointment selection; an inactive client already attached to the appointment being edited remains selectable for that edit. Persist changes through the shared local agenda store. Client and appointment modals use a clearly styled close action and place Cancel beside the primary save action. Checks: legacy storage compatibility, add/edit/deactivate/reactivate behavior, preserved appointment references, and client-combobox tests.

### S3 — Client profile and histories

User requirements: “Consultar el perfil y el historial de citas.” “Consultar el historial de compras cuando existan ventas registradas.”

Acceptance: Selecting a client shows a profile on `/clientes/` with contact details and associated appointment history, plus a clear return to the directory. Because `SaleRecord` currently has no client association, show a truthful empty purchase-history state; do not fabricate data or change the sales model in this task. Checks: profile navigation, appointment filtering, and purchase empty-state tests.

### S4 — Frontend-only registration placeholder

User clarification: “es lo mismo, y dije que era un link unico y fijo por ahora que es solo front, pero en el futuro si sera unico, por el momento haz lo mismo que antes”.

Acceptance: After client creation, show the same copyable `{application-origin}/registro` placeholder used by the appointment flow. The URL is fixed and identical for every client, contains no client identifier/token, and performs no registration submission or synchronization. Do not build a registration route in this phase. Checks: fixed-link equality/copy behavior and confirmation that no client data is encoded in the URL.

## Tasks

- [x] T1 (S2, S4) inline — backward-compatible client metadata and shared local persistence; status: complete; commit: `14c3c40`; Risk: item 1 (persisted client fields).
- [ ] T2 (S1, S2) inline — Clients route, responsive directory, search/filter/sort, create/edit/deactivate/reactivate, inactive-client booking exclusion, and consistent modal actions; status: implementation and checks complete; user authorized delivery with S4 independent runtime proof unavailable; commit: pending; Risk: item 3 (shared client selector contract).
- [ ] T3 (S3, S4) inline — client profile, appointment history, purchase empty state, and reusable generic registration-link feedback; status: implementation and checks complete; user authorized delivery with S4 independent runtime proof unavailable; commit: pending; Risk: none.

## Log

### L1 — User request

“si hazlo, recuerda reutilizar los dise;os que ya estan establecidos, a menos que sea algo nuevo”

### L2 — Scope confirmation

“si hazlo” — approved proceeding with the Clients phase and the proposed responsive directory/profile direction.

### L3 — Invitation-link clarification

“es lo mismo, y dije que era un link unico y fijo por ahora que es solo front, pero en el futuro si sera unico, por el momento haz lo mismo que antes”

The fixed generic link remains identical for now; unique per-client invitations and a registration route are future work.

### L4 — Baseline and design

The existing `ClientRecord` stores only id/name/optional phone. `agenda-store` validates existing records and appointment references in version 1 of the shared local agenda envelope. `SaleRecord` has no client association. The design document `docs/superpowers/specs/2026-10-16-webbys-client-management-design.md` was approved by the user before planning.

### L5 — Implementation plan

The plan is kept in this feature document so there is one ODD source of truth.

#### T1 — Backward-compatible client fields and persistence

Files: `src/types/agenda.ts`, `src/services/agenda-store.ts`, and `src/services/agenda-store.test.ts`.

Interface produced: `ClientRecord` remains `{ id: string; name: string; phone?: string }` with additive optional `email?: string` and `active?: boolean`. Missing `active` means active; missing email remains valid.

1. Add failing store tests for accepting legacy client objects with no email or active field, accepting valid optional email/active values, and rejecting malformed supplied values without overwriting the original serialized storage.
2. Run `npm test -- src/services/agenda-store.test.ts --reporter=dot` and confirm the new compatibility/validation assertions fail for the intended reason.
3. Add optional `email?: string` and `active?: boolean` fields to `ClientRecord`; extend `isClient` to validate each field only when present. Treat missing active as active in consumers; do not change storage key/version or rewrite data on load.
4. Re-run the store tests and the focused Agenda/AppointmentForm tests. Confirm older stored records remain byte-for-byte unchanged until a deliberate save and appointment references still validate.
5. Commit T1 with its focused tests. Risk: item 1 (persisted client records gain optional metadata).

#### T2 — Responsive client directory and CRUD

Files: `src/components/AdminShell.tsx`, `src/components/AdminShell.test.tsx`, `src/components/AppointmentForm.tsx`, new `src/pages/clientes.astro`, `src/components/ClientsPage.tsx`, new `src/components/ClientsPage.test.tsx`, new `src/components/ClientForm.tsx`, new `src/components/ClientForm.test.tsx`, `src/styles/agenda.css`, and new `src/styles/clients.css`.

Interfaces produced: `ClientFormProps` is `{ client?: ClientRecord; onSave: (client: ClientRecord) => boolean; onCancel: () => void }`. Add optional `includeInactiveClientId?: string` to `ClientComboboxProps`; new bookings omit inactive clients, while appointment edits may include the inactive client already attached to that appointment. `/clientes/` owns its state through `loadAgendaState`/`saveAgendaState` and renders `ClientsPage` under `AdminGate`/`AdminShell`.

1. Add failing tests for a working Clientes desktop/mobile route and active navigation, list rendering, name/phone/email search, active/inactive filtering, deterministic name sorting, create/edit, and reversible deactivation with confirmation. Include regression assertions for the existing four-slot mobile navigation and More menu.
2. Run the focused new component and shell tests; confirm failures are from missing route/UI/behavior rather than test setup.
3. Add `/clientes/` using the established `AppLayout`, `AdminGate`, and `AdminShell`. Load/persist `AgendaState` with the existing `loadAgendaState`/`saveAgendaState` APIs. Keep new page CSS on existing Webbys charcoal/red tokens and established responsive form/list patterns.
4. Add a custom accessible client form dialog requiring name and phone, accepting optional email only when editing, retaining the client ID on edits, and setting new records active. Deactivate/reactivate in place so appointments continue to reference the same client; filter inactive clients from new-booking `ClientCombobox` choices while retaining the inactive client selected on an existing appointment edit. Style modal close/cancel actions consistently across `ClientForm` and `AppointmentForm`, with Save and Cancel adjacent.
5. Re-run focused tests and existing ClientCombobox/AppointmentForm/AgendaPage suites. Commit T2 with its tests and styles. Risk: item 3 (the shared client selector now excludes inactive records).

#### T3 — Client profile, history, and fixed link

Files: `src/components/ClientsPage.tsx`, `src/components/ClientsPage.test.tsx`, and `src/components/AppointmentRegistrationLink.tsx` only if its existing reusable interface needs a narrow adjustment.

Interface consumed: T3 uses the `ClientRecord` from T1, the route state and save callbacks from T2, and the existing no-props `AppointmentRegistrationLink` component for the fixed link.

1. Add failing tests that selecting a client shows their contact details and only their chronological appointment history; inactive profiles remain viewable; purchases show an honest empty state because sales do not currently reference clients; creating a client exposes the same generic link for every client without client-specific URL data.
2. Run the focused client-profile tests and verify they fail on the absent profile/history behavior.
3. Implement the profile/detail state within `/clientes/` with a keyboard-operable return action, existing appointment status labels, and a purchase-history empty state. Reuse the current generic registration-link behavior without adding a registration route, invite tokens, backend calls, or client-specific query parameters.
4. Run focused tests, full `npm test -- --reporter=dot`, `npm run check`, and `npm run build`. Run the Impeccable detector once for changed UI targets and use Playwright only for responsive visual review at 390px and 1440px.
5. Have an independent verifier inspect the complete feature document, baseline commit, exact diff, and storage/selector probe commands because T1/T2 include high-risk items 1 and 3. Record observed checks and verifier result here, then commit T3. Risk: none — profile is a local read of already validated client/appointment state and reports unavailable purchase associations honestly.

After all three tasks, record the final worktree/build and browser visual-check results, linked commits, and remaining sales-to-client association as out of scope for this phase. Never push, open a PR, merge, or rewrite the published `main` history without the user's explicit instruction.

### L6 — T1 persisted client metadata

RED: `npm test -- src/services/agenda-store.test.ts --reporter=dot` failed both new malformed optional-field cases because the current store accepted a numeric email and string active flag as valid. GREEN: the focused store suite passed 8/8 after adding optional `email` and `active` fields and validating them only when present. Existing legacy clients remain valid without either field; storage key/version and load-time bytes are unchanged. `npm run check` passed with 0 errors, warnings, or hints; `git diff --check` passed. Commit: `14c3c40` (`fix(clients): validate optional client metadata`). Risk: item 1 — optional client metadata expands the persisted shape while preserving backward compatibility.

### L7 — T2/T3 implementation and initial verification blocker

GREEN: focused client/admin tests passed 23/23 before page implementation; then ClientsPage/ClientForm tests passed 9/9. Full `npm test -- --reporter=dot` passed 132 tests across 22 files; `npm run check` reported 0 errors, warnings, or hints; `npm run build` emitted `/clientes/` and all existing routes. Playwright visual review at 390px and 1440px confirmed the established admin styling, responsive directory/profile, and accessible create dialog. The Impeccable detector returned no findings.

An initial independent-verification attempt could not access the feature spec or baseline in its scratch copy, so it returned S1–S4 unverified. A later verification used the explicit repository root and valid baseline; see L11 for its findings. Risk: item 1 (persisted client metadata) and item 3 (inactive-client filtering in the shared appointment selector).

### L8 — Client form refinement

User request: “solo quiero que en nuevo cliente se elimine el campo del correo, solo nombre y telefono, ademas estiliza mas el boton de cerrar y cancelar aqui [Image 1]  igual el de cancelar puede estar  al lado del de guardar cliente”

Update only the new-client form: require name and phone, omit the email field on creation, retain optional email editing for existing records, style the close/cancel controls in the established palette, and place Cancel beside Save. Add this correction to T2 and verify the form visually on mobile. Risk: none — this is a local form-field/layout refinement; stored client email remains backward-compatible.

### L9 — Client form refinement verification

RED: `npm test -- src/components/ClientForm.test.tsx -t 'creates a client' --reporter=dot` failed because the new-client dialog still exposed the email field. GREEN: `npm test -- src/components/ClientForm.test.tsx --reporter=dot` passed 2/2; email remains on the edit form. Playwright screenshots at 390px and 1440px confirmed two fields on creation, improved Close styling, and Save/Cancel side-by-side without horizontal overflow. Final full verification passed: 134 tests; `npm run check` with 0 diagnostics; `npm run build` generated `/clientes/` and all existing routes; `git diff --check` clean. Impeccable detector returned no findings. T2/T3 remain uncommitted pending independent verification. Risk: none — only create-form fields and button presentation changed; existing stored email and edit behavior remain covered.

### L10 — Exact client-history and link-equality regression probes

Added a focused test that seeds two appointments for the selected client plus one for another client and asserts the profile shows only the matching records in chronological order; the focused probe passed 1/1. Added a client-creation test confirming two different clients receive the identical generic URL. Existing `AppointmentRegistrationLink` tests verify copy and clipboard fallback. Full suite passed 134/134; Astro check and build remain clean.

### L11 — Independent verification

The independent verifier checked the exact checkout root and baseline `14c3c40` using scratch candidate and baseline copies with the local dependency tree mounted read-only. It returned S1–S3 met; S4's registration URL shape was verified, and it noted equal URL values across clients/copy integration as a test gap. L10 closes that test gap; the parent reran the full suite successfully after adding it. The verifier found no candidate-caused blocker; its note about Playwright was not applicable because Playwright was used by the parent only for the user-authorized visual review. T2/T3 are ready for their work-unit commit. Risk: item 1 (persisted optional client fields) and item 3 (inactive-client filtering in the shared booking selector).

### L12 — S4 independent recheck unavailable

A focused verifier recheck was launched for the S4 fixed-link equality/copy probe. The verifier confirmed by source inspection that the link uses only the application origin and fixed `/registro`, and that the new client flow reuses the no-props link component. However, its scratch candidate could not resolve the Vitest CLI even with the workspace dependency symlink, so the targeted command exited before tests ran. Treat the S4 independent runtime verdict as unavailable, not PASS. Parent tests passed 134/134 including the two-client URL equality test and existing clipboard-success/fallback tests; visual review and full build/check are green. No further verifier retry was planned for this cycle.

### L13 — Consistent close and cancel styling across modals

User request: “bien eso tambien aplicalo a los demas modales, como el de agenda que tiene el mismo problema”

Applied the shared styled Close button and two-column Save/Cancel actions to appointment create/edit, its nested add-client dialog, and client create/edit. Playwright at 390px and 1440px confirmed the actions remain adjacent with no horizontal overflow. The focused AppointmentForm/ClientForm suite passed 11/11; full test suite passed 134/134; Astro Check reported 0 diagnostics; build generated all six routes. No booking behavior or persisted data changed.

### L14 — User authorized delivery with S4 proof limitation

User request: “perfecto, haz commit pushea a main y pasemos a la siguiente fase”

The user was informed that S4's independent scratch runtime check remained unavailable. They explicitly authorized committing and pushing the Clients work anyway. Preserve the verification result as unavailable; do not report an independent S4 PASS. Commits/push and next-phase scope remain to be recorded after execution.
