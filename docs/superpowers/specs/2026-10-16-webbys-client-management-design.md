# Webbys Client Management

## User-approved direction

Extend the established Webbys charcoal-and-red administration UI with a mobile-first Clients module. Reuse `AdminShell`, existing form controls, the app's typography, spacing, surfaces, and responsive patterns; do not create a separate visual identity.

The `/clientes/` page presents a searchable, filterable, sortable client list. Selecting a client switches the same route into a profile view with a clear return action, preserving the mobile app-like navigation. Add and edit use the existing custom Preact dialog pattern. Desktop may use the available width for denser rows; mobile uses readable full-width client rows and touch-sized actions.

## Data and behavior

- Keep the existing agenda store as the single local source of truth for clients and appointments. Add optional email and active-state fields to `ClientRecord`; old records without these fields remain valid and count as active. Do not change the storage key or envelope version.
- Create clients with name and phone; email is optional. Search covers name, phone, and email. Filtering and sorting operate on the current local client collection.
- Editing preserves client identity and appointment references. Deactivation is reversible and preserves appointment history; inactive clients are not offered for new appointments but remain available in profile/history views.
- Client profiles list associated appointments from the shared agenda state. The current sale model has no client association, so show an honest empty purchase-history state rather than inventing client purchases or altering the sales model in this phase.
- Show the same fixed, copyable `{application-origin}/registro` placeholder used by the booking flow. It is intentionally identical for all clients, carries no token, and does not create a registration route or imply server submission. A unique invitation flow is future work.

## Verification and risk

Test storage compatibility for legacy clients, add/edit/deactivate/reactivate behavior, search/filter/sort, appointment-history association, fixed-link behavior, and exclusion of inactive clients from new-booking choices. Run the focused tests, full Vitest suite, `npm run check`, and `npm run build`; visually inspect the new module at 390px and 1440px with Playwright for design only. The additive persisted client fields and changed shared booking selector are high-risk (persisted format/shared contract) and require independent verification after implementation.

Risk: item 1 (backward-compatible client metadata is added to persisted agenda state); item 3 (inactive-client filtering changes the shared client-selection contract used by appointment creation).
