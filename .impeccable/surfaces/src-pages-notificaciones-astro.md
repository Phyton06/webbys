---
version: 1
slug: "src-pages-notificaciones-astro"
primary_target: "src/pages/notificaciones.astro"
related_targets: []
---

## Surface

**Path:** `src/pages/notificaciones.astro`
**Mode:** Operate
**Audience:** Webbys administrator using the mobile-first PWA.
**Job:** Start from notification history, then draft, schedule, preview, or locally test a notification.
**Constraints:** Recipient sends are local simulations. Device test is a system notification only on the administrator's current device after explicit permission. No backend, subscription, real push, or automatic schedule.

## Direction contract

**THESIS:** History is the default working view; the composer is opened intentionally, and local device testing never masquerades as recipient delivery.

**OWN-WORLD:** Inherit the existing Webbys charcoal surfaces, restrained action red, neutral high-contrast text, compact data hierarchy, visible focus, and reusable admin components. Do not add a new palette or decorative motif.

**STORY:** The administrator reviews drafts, scheduled items, and simulated sends; “Nueva notificación” opens a composer where audience, message, schedule, and preview can be checked before saving or simulating.

**FIRST VIEWPORT:** Keep `AdminShell`. Lead with the Notifications heading, one primary “Nueva notificación” action, a compact status filter, and recent history. When composing, put recipients/content beside the device-style preview on wide screens; stack those areas on phones.

**FORM:** The chosen structure is option 1 (composer with preview) modified to open on History. Reuse the existing searchable recipient combobox, custom `Dropdown`, and collapsed `MobileMonthCalendar` popover. Signature interaction is the explicit permission-gated “Probar en este dispositivo” local system-notification test. Concept-seed: `5660d2c4`.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
