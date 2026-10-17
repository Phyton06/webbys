# Webbys Notifications Management

Objective: Add a history-first, frontend-only Notifications module with simulated sends and a local device test.
Branch: `feat/notifications-management`; delivery strategy: `stacked-to-main` (user-selected); forecast: ~600 authored changed lines; runner: Vitest (`npm test`), Astro (`npm run check`, `npm run build`).

## Specs

### S1 — Draft, schedule, and simulated send

User requirements: “Diseña un módulo para que el administrador pueda preparar y gestionar notificaciones destinadas a los clientes o empleados.” / “Programar una notificación o enviarla inmediatamente de forma simulada.”

Provide title/body, preview, audience type and available segments/specific people. Persist drafts, schedules, and history locally in a separate versioned notification store. Immediate or due sends can only become locally “simulated” after an explicit action; scheduled items do not send automatically. No real recipient delivery. Test validation, storage integrity, recipient snapshots, dates, and status transitions.

### S2 — Local device notification test

User requirement: “podria hacer que las notificaciones push si funcionen pero solo localmente osea en el celular que lo pruebe para que vea como queda?”; approval: “si hazlo”

Add a user-triggered “Probar en este dispositivo” action that requests permission on click and uses a minimal service worker to display the current preview on this device only. This is not Web Push, does not require or create subscriptions, does not contact recipients, and does not affect simulated-send records. Explain HTTPS/secure-context, permission-denied, unsupported, and failure cases. Test permission/feature-detection handling and the no-history-mutation invariant.

### S3 — History-first layout and established controls

User requirements: “creo que la 1 pero historial debe aparecer primero cuando entras no el de crear” / “perfecto, solo recuerda usar los buscadores, desplegables y calendarios como los vamos usando”

The Notifications route opens on history; “Nueva notificación” opens the composer with preview beside it on wide screens and stacked on phones. Reuse the project's existing searchable recipient combobox, custom `Dropdown`, and collapsed `MobileMonthCalendar` interaction; selected recipients are removable. Test default view, responsive structure, and these controls.

### S4 — Local-only boundaries

User requirements: “solo localmente” / “ok hazlo”

No backend, API, actual push, scheduled background delivery, or deployed/tunneled preview. Use a separate localStorage key and do not alter Agenda, recipient contacts, sales, or stock when testing a device notification. Test persisted bytes and all non-mutation boundaries.

## Tasks

- [ ] T1 — Define notification types, audience snapshots, validation, and versioned isolated storage; route: inline; status: pending; commit: pending.
- [ ] T2 — Add the minimal message-only service worker and user-gesture local notification test/permission state; route: inline; status: pending; commit: pending; verification: high-risk item 5 independent verifier required.
- [ ] T3 — Build the history-first protected Notifications page, composer/preview, audience search/segments, scheduling, simulated history, navigation, and responsive styles; route: inline; status: pending; commit: pending.
- [ ] T4 — Run full verification, inspect UI only within the authorized local scope, update the task log, and close the feature; route: inline; status: pending; commit: pending.

## Log

- L1: Original request: “podria hacer que las notificaciones push si funcionen pero solo localmente osea en el celular que lo pruebe para que vea como queda?”
- L2: User approved the local device test, history-first composer layout, existing search/dropdown/calendar patterns, and local persistence. Actual push and recipient delivery remain out of scope.
- L3: User selected `stacked-to-main` as the Notifications delivery strategy. No push/PR is authorized. Engram task mirror pending because the MCP cannot resolve an authoritative runtime session.
