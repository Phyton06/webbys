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

- [x] T1 — Define notification types, audience snapshots, validation, and versioned isolated storage; route: inline; status: complete; commit: `5a85b4d` (7 store tests, RED → GREEN).
- [x] T2 — Add the minimal message-only service worker and user-gesture local notification test/permission state; route: inline; status: complete; commit: `ed2242d`; independent verification: no blockers found; advisory: malformed-input and missing-port branches lack dedicated tests.
- [x] T3 — Build the history-first protected Notifications page, composer/preview, audience search/segments, scheduling, simulated history, navigation, and responsive styles; route: inline; status: complete; commit: `30c42ca`.
- [x] T4 — Run full verification, inspect UI only within the authorized local scope, update the task log, and close the feature; route: inline; status: complete; commit: `08ecb2c`.

## Log

- L1: Original request: “podria hacer que las notificaciones push si funcionen pero solo localmente osea en el celular que lo pruebe para que vea como queda?”
- L2: User approved the local device test, history-first composer layout, existing search/dropdown/calendar patterns, and local persistence. Actual push and recipient delivery remain out of scope.
- L3: User selected `stacked-to-main` as the Notifications delivery strategy. No push/PR is authorized. Engram task mirror pending because the MCP cannot resolve an authoritative runtime session.
- L4: Implementation plan is `docs/superpowers/plans/2026-10-17-webbys-notifications.md`; work will follow the inline ODD route, with an independent verifier required for the service-worker/runtime task.
- L5: T1 local storage/model tests passed (7); commit `5a85b4d`. T2 permission and worker message tests passed (7), Astro check has 0 diagnostics; commit `ed2242d`.
- L4: T1 added the versioned independent notification envelope, audience resolution, and validation; invalid saves are rejected without rewriting stored bytes. Focused test: `npm test -- src/services/notifications-store.test.ts` (7 passed); Astro check: 0 diagnostics. Commit: `5a85b4d`.
- L4: Implementation plan written to `docs/superpowers/plans/2026-10-17-webbys-notifications.md`; ODD route is direct inline (no writer parallelism trigger). High-risk service-worker behavior requires an independent verifier before delivery.
- L6: Independent verifier found no T2 blockers: permission is requested only from the explicit button path; the worker only accepts the named message; device test does not call notification/Agenda persistence. Advisory: wrong-type fields and missing message port are not separately tested.
- L7: T3 implemented history-first route, protected navigation, composer/preview, searchable recipients and segments, date picker, local schedules, explicit due simulation, and responsive styles. Browser smoke check confirmed history-first and composer views, date-calendar interaction, searchable recipient select/remove, dropdown dismissal, and no horizontal overflow at 390px. Verification: 39 feature tests passed (including follow-up dropdown behavior); full suite 252 tests passed; `npm run check` has 0 diagnostics; static build generated 12 routes; `git diff --check` passed. Physical-device notification not performed.
- L8: Scheduled records remain valid after their due time so they can be displayed and explicitly simulated; only the composer rejects scheduling a new notice in the past.
- L9: Browser interaction exposed that wrapping the custom Dropdown in a native `<label>` caused the label to re-activate the trigger after an option was selected. Replaced those wrappers with divs; browser smoke test now selects the recipient kind, opens the next selector, searches “Diego”, and selects/removes recipients as expected.
- L10: Final full suite: 252 tests passed across 36 files; Astro check: 0 diagnostics; static build: 12 routes; `git diff --check` passed. Local device permission/OS display was not tested on a physical device.
- L11: Impeccable detector run once on changed UI targets; returned `[]` with no findings.
- L12: T3 committed as `30c42ca feat(notifications): add history-first notification center`. Engram mirror remains pending because the memory tool cannot resolve the authoritative OpenCode session.
- Risk: item 5 (service-worker registration and browser notification permission have device/environment effects, but are gated behind explicit user action and independently verified).
