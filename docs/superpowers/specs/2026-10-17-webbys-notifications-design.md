# Webbys Notifications Design

## Goal

Add an administrator Notifications module for drafting, scheduling, previewing, and reviewing local simulated notifications, plus a user-triggered system-notification test on the current device.

## User decisions

- The user asked: “podria hacer que las notificaciones push si funcionen pero solo localmente osea en el celular que lo pruebe para que vea como queda?”
- The user approved the local device test: “si hazlo”
- The user selected the history-first version of layout 1: “creo que la 1 pero historial debe aparecer primero cuando entras no el de crear”
- The user required existing control patterns: “perfecto, solo recuerda usar los buscadores, desplegables y calendarios como los vamos usando”
- The user approved local persistence: “ok hazlo”
- The user approved the design specification: “hazlo”

## Approved scope

- Add a protected `/notificaciones/` route linked from desktop navigation and the mobile More menu.
- Open on **Historial** by default. A prominent “Nueva notificación” action opens the composer; the composer keeps the selected-message preview alongside the form on larger screens and stacks it on phones.
- Let administrators choose clients or employees, target available active/role segments, or search/select specific recipients. Use the existing custom searchable dropdown/combobox, `Dropdown`, and removable-selection patterns; never use native select popups.
- Compose a title and message, preview it, save a draft, schedule it for a local date/time, or explicitly mark an immediate/scheduled record as **simulated**. Keep scheduled records pending until an administrator explicitly simulates them; do not run a timer or claim automatic delivery.
- Persist notification drafts, schedules, and history in an independent versioned localStorage key. Store recipient IDs and name snapshots only; do not copy recipient phone numbers or email addresses.
- Add “Probar en este dispositivo” to request browser notification permission only after an explicit button click and display the current preview locally on that device using a minimal service worker. Report unsupported, insecure-origin, denied, or failed states clearly.
- Reuse the existing `MobileMonthCalendar` date-picker trigger/popover for scheduled dates and the shared time/control styling.

## Non-goals and constraints

- No server, API, database, subscription registration, VAPID keys, push-service delivery, recipient-device delivery, or automatic scheduler.
- The local device test is **not** a push subscription and does not count as a notification sent to recipients or alter notification history/status.
- The service worker handles only the user-triggered local-test message; it does not intercept/cache application fetches and has no `push` event handler.
- The interface must state that scheduled and immediate recipient sends are simulations and that actual push is not configured.
- Request notification permission only from the test button's user gesture; never prompt on page load.
- The local device test requires a secure origin (HTTPS; localhost only when served on that same device). Do not set up tunnels, deploy, or expose the local server without separate authorization.

## Data and interaction design

Use an independent `webbys:notifications:v1` localStorage envelope rather than changing Agenda's storage shape. A notification record includes a stable ID, title, body, category, creation timestamp, recipient mode/segment, selected recipient ID/name snapshots where applicable, optional scheduled local date/time, status (`draft`, `scheduled`, or `simulated`), and optional simulation timestamp. Validate before writing and leave persisted bytes unchanged after invalid input or storage errors.

The entry view shows history and status filters first. “Nueva notificación” opens the composer with recipient selection, title/body fields, schedule choice, and a customer-style preview. Saving a draft or schedule updates only the local notifications envelope. Simulating an immediate or due scheduled message changes its local status and timestamp but does not dispatch anything. The separate device-test button requests permission on demand, registers the minimal worker if necessary, and asks it to display the current title/body on the administrator's device; its result is announced separately from send status.

## Verification

- Test notification record validation, recipient snapshots/segments, schedule boundaries, simulated status, and isolated localStorage persistence including unchanged bytes on rejected data.
- Test history-first entry, composer preview, search/select/remove recipients, custom date/time selection, draft/schedule/simulate actions, and visible simulated-delivery language.
- Test permission default/granted/denied/unsupported paths; verify the local test does not update notification history, recipient state, or sales/inventory data.
- Verify the service worker only handles the explicit test message and does not add fetch caching or a push handler.
- Run focused tests, full Vitest, Astro check, build, and the one-pass Impeccable detector. Test a physical-device notification only from a secure origin when the user provides/authorizes one; otherwise record it as environment-limited.
