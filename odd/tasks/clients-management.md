# Webbys Client Management

Objective: Add a frontend-only Clients administration module using the established Webbys interface. Branch: `webbys-replacement`.
Delivery: `ask-on-risk` with the user's prior `feature-branch-chain` preference; forecast ~900 authored lines; test runner: `npm test` (Vitest), plus `npm run check` and `npm run build`.

## Specs

### S1 — Client list and navigation

User requirements: “Listar clientes.” “Buscar por nombre, teléfono o correo.” “Filtrar y ordenar resultados.”

Acceptance: Add a working `/clientes/` route, mark Clientes active in desktop and mobile navigation, and preserve the four mobile navigation slots. Render the client directory using the existing dark/red design system with responsive list rows, search by name/phone/email, status filter, and deterministic sort. Checks: navigation, route, responsive list, and search/filter/sort tests; Playwright visual review at 390px and 1440px.

### S2 — Client records and lifecycle

User requirements: “Editar información.” “Desactivar o eliminar registros con confirmación, según corresponda.” “El administrador debe poder registrar inicialmente a un cliente proporcionando únicamente:” “Nombre.” “Número de teléfono.”

Acceptance: Create clients with required name/phone and optional email; edit records without changing IDs or breaking appointment references. Support reversible deactivation, confirmation, and reactivation. Old stored records without email/active fields remain valid and default to active. Inactive clients remain visible in history/profile but are excluded from new appointment selection. Persist changes through the shared local agenda store. Checks: legacy storage compatibility, add/edit/deactivate/reactivate behavior, preserved appointment references, and client-combobox tests.

### S3 — Client profile and histories

User requirements: “Consultar el perfil y el historial de citas.” “Consultar el historial de compras cuando existan ventas registradas.”

Acceptance: Selecting a client shows a profile on `/clientes/` with contact details and associated appointment history, plus a clear return to the directory. Because `SaleRecord` currently has no client association, show a truthful empty purchase-history state; do not fabricate data or change the sales model in this task. Checks: profile navigation, appointment filtering, and purchase empty-state tests.

### S4 — Frontend-only registration placeholder

User clarification: “es lo mismo, y dije que era un link unico y fijo por ahora que es solo front, pero en el futuro si sera unico, por el momento haz lo mismo que antes”.

Acceptance: After client creation, show the same copyable `{application-origin}/registro` placeholder used by the appointment flow. The URL is fixed and identical for every client, contains no client identifier/token, and performs no registration submission or synchronization. Do not build a registration route in this phase. Checks: fixed-link equality/copy behavior and confirmation that no client data is encoded in the URL.

## Tasks

- [ ] T1 (S2, S4) inline — backward-compatible client metadata and shared local persistence; status: pending; commit: pending; Risk: item 1 (persisted client fields).
- [ ] T2 (S1, S2) inline — Clients route, responsive directory, search/filter/sort, create/edit/deactivate/reactivate, and inactive-client booking exclusion; status: pending; commit: pending; Risk: item 3 (shared client selector contract).
- [ ] T3 (S3, S4) inline — client profile, appointment history, purchase empty state, and reusable generic registration-link feedback; status: pending; commit: pending; Risk: none.

## Log

### L1 — User request

“si hazlo, recuerda reutilizar los dise;os que ya estan establecidos, a menos que sea algo nuevo”

### L2 — Scope confirmation

“si hazlo” — approved proceeding with the Clients phase and the proposed responsive directory/profile direction.

### L3 — Invitation-link clarification

“es lo mismo, y dije que era un link unico y fijo por ahora que es solo front, pero en el futuro si sera unico, por el momento haz lo mismo que antes”

The fixed generic link remains identical for now; unique per-client invitations and a registration route are future work.

### L4 — Baseline and design

The existing `ClientRecord` stores only id/name/optional phone. `agenda-store` validates existing records and appointment references in version 1 of the shared local agenda envelope. `SaleRecord` has no client association. The design document is `docs/superpowers/specs/2026-10-16-webbys-client-management-design.md`; user review is pending before implementation.
