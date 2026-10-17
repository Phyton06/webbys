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

- [x] T1 — Add business settings types, validation, independent versioned persistence, and tests; route: inline; status: complete; commit: `d1306ae` (17 tests, RED → GREEN).
- [x] T2 — Add shared currency formatting and update all affected monetary displays with regression tests; route: inline; status: complete; commits: `6281ed1`, `caf55a1`.
- [x] T3 — Extend the existing Settings page with business/profile fields, read-only logo, general hours, and local notification preferences; route: inline; status: complete; commit: `fed1102` (25 settings/store tests passed).
- [x] T4 — Run full verification, independent risk assessment as required, update progress, and close; route: inline; status: complete; verification work-unit commit: `a7e9a02`.

## Log

- L1: User request: “si hazlo”. This approves preparing the business-settings phase specification after Notifications.
- L2: The user selected a read-only existing logo, global currency formatting without conversion, MXN initial currency, informational general hours, and functional local notification preferences with the current theme unchanged.
- L3: Design approved: separate local store; keep existing barber schedules and Agenda persistence untouched.
- L4: Spec self-review found no placeholders or internal contradictions; spec/task commit: `f331e5a`. Engram mirror save was attempted but the service could not resolve the authoritative runtime session; local task document is preserved and mirror is pending.
- L5: Implementation plan saved to `docs/superpowers/plans/2026-10-17-webbys-business-settings.md`; route remains direct inline because the units are sequential and no parallel writer trigger applies. Plan coverage was checked against S1–S4; notification preferences default off as an explicitly labeled opt-in implementation assumption.
- L6: User selected `stacked-to-main` for delivery slices if the feature exceeds the review budget. This choice does not authorize push or PR creation.
- L7: T1 implements a separate schema-versioned settings envelope, explicit default/unconfigured states, strict weekday/currency/preference validation, and invalid-byte preservation. `npm test -- src/services/business-settings-store.test.ts`: 17 passed; `npm run check`: zero diagnostics. RDD status was read as off (global); no review lifecycle was started. Commit: `d1306ae`.
- L8: T2 introduced the `Intl.NumberFormat('es-MX')` currency service and applied settings to Dashboard, Products, Services, Promotions/target picker, AppointmentForm, and Sales. No numeric state or Agenda data is changed by formatting. Focused suite: 58 passed across 7 files; Astro check: zero diagnostics; RED → GREEN observed. Commit: `6281ed1`.
- L9: T3 extended the existing Configuration screen with business/admin profiles, read-only current logo, unconfigured/open/closed informational business hours, global currency selector, locally persisted category preferences, and unchanged barber schedule/exception panels. `npm test -- src/components/BusinessSettingsPanel.test.tsx src/components/SettingsPage.test.tsx src/services/business-settings-store.test.ts`: 25 passed; Astro check: zero diagnostics. Commit: `fed1102`.
- L10: T2 build verification exposed that directly reading `window.localStorage` during Astro server prerender throws on Products. Added the SSR-safe `getCurrentBusinessCurrency()` fallback and test; focused 7-file suite now has 59 passed, Astro check has zero diagnostics, and build produced 12 routes. Risk remains `none` because the added display path is covered and does not mutate stored amounts.
- L11: Final verification: `npm test` (288 tests, 39 files); `npm run check` (zero diagnostics); `npm run build` (12 static routes); `git diff --check` passed. Impeccable detector returned `[]`. RDD remains off by global choice. No push/PR authorized for this phase; Engram mirror remains pending because the service cannot resolve an authoritative runtime session.
- L12: T4 verification record committed as `a7e9a02 docs(settings): record business settings verification`.
- Risk: none (all changed monetary consumers and settings behavior have focused coverage; persisted monetary values, Agenda schedules, appointment availability, and notification delivery remain unchanged).
