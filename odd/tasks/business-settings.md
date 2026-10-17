# Webbys Business Settings

Objective: Complete Configuration with local business/profile settings while preserving barber-specific availability.
Branch: `feat/business-settings`; delivery strategy: `stacked-to-main` (user-selected); forecast: ~500 authored changed lines; runner: Vitest (`npm test`), Astro (`npm run check`, `npm run build`).

## Specs

### S1 — Business and administrator profile

User requirement: “Nombre de la barbería.” / “Logotipo.” / “Dirección y datos de contacto.” / “Datos del perfil administrativo.”

Edit business name/address/contact and administrator display name/email/phone. Show the current logo read-only, as decided: “Solo mostrar el actual”. Store the new settings in an independent versioned local browser store; do not add real authentication or remote sync. Test defaults, valid saves, reload, and rejected-save byte preservation.

### S2 — General hours and barber availability

User requirement: “Horarios generales del establecimiento.” / “Los horarios generales del establecimiento no deben sustituir los horarios individuales de los barberos.”

Manage an informational weekday open/closed schedule in business settings; do not apply it to appointment availability. Preserve the existing per-barber schedules/exceptions and Agenda storage. User decision: “Solo informativo”. Test hours validation, storage isolation, and unchanged slot generation.

### S3 — Currency display

User requirement: “Moneda.”

Initial currency: “MXN”. User decision: “Aplicar formato global”. Apply MXN/USD/EUR formatting to dashboard, products, services, promotions, appointment estimates, and sales, without converting or modifying numeric values. Test formatting for each currency and each affected consumer; assert source numeric values remain unchanged.

### S4 — Preferences and local-only constraints

User requirement: “Preferencias visuales y de notificaciones.”

User decision: “Solo preferencias funcionales”. Persist notification-category preferences locally for future integration only; do not send, subscribe, or affect simulated or device-test flows. Retain the current dark theme without adding another theme. No backend, public API, or remote account sync. Test local preference persistence and no changes to notification history or Agenda.

Assumption: initialize all category preferences as disabled until the administrator opts in; this preference does not cause any delivery in this phase.

## Tasks

- [ ] T1 — Add business settings types, validation, independent versioned persistence, and tests; route: inline; status: pending; commit: pending.
- [ ] T2 — Add shared currency formatting and update all affected monetary displays with regression tests; route: inline; status: pending; commit: pending.
- [ ] T3 — Extend the existing Settings page with business/profile fields, read-only logo, general hours, and local notification preferences; route: inline; status: pending; commit: pending.
- [ ] T4 — Run full verification, independent risk assessment as required, update progress, and close; route: inline; status: pending; commit: pending.

## Log

- L1: User request: “si hazlo”. This approves preparing the business-settings phase specification after Notifications.
- L2: The user selected a read-only existing logo, global currency formatting without conversion, MXN initial currency, informational general hours, and functional local notification preferences with the current theme unchanged.
- L3: Design approved: separate local store; keep existing barber schedules and Agenda persistence untouched.
- L4: Spec self-review found no placeholders or internal contradictions; spec/task commit: `f331e5a`. Engram mirror save was attempted but the service could not resolve the authoritative runtime session; local task document is preserved and mirror is pending.
- L5: Implementation plan saved to `docs/superpowers/plans/2026-10-17-webbys-business-settings.md`; route remains direct inline because the units are sequential and no parallel writer trigger applies. Plan coverage was checked against S1–S4; notification preferences default off as an explicitly labeled opt-in implementation assumption.
- L6: User selected `stacked-to-main` for delivery slices if the feature exceeds the review budget. This choice does not authorize push or PR creation.
