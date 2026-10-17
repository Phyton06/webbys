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

### S5 — Configuration categories and per-category saving

User request: “ok esta bien pero siento que esta todo mal organizado estando todo asi, quiero que hagamos opciones para cada cosa”

User decisions: “opcion 1” / “Guardar por categoría” / “si hazlo”.

Replace the long Settings page with a desktop sidebar and mobile custom category Dropdown for Perfil del negocio, Perfil administrativo, Moneda, Horario general, Preferencias de notificación, Horarios del equipo, and Excepciones por fecha. Open Perfil del negocio by default. Show one category at a time; keep in-session drafts when switching; save only the selected category. Never save pending values from another category. Business preferences remain in the business settings store; team hours/exceptions remain in Agenda storage and retain their own save handlers.

Assumption: unsaved drafts remain only in component memory and are discarded on reload; the last saved values are restored.

## Tasks

- [x] T1 — Add business settings types, validation, independent versioned persistence, and tests; route: inline; status: complete for S5 section-level persistence; baseline commit: `d1306ae`; follow-up commit: pending.
- [x] T2 — Add shared currency formatting and update all affected monetary displays with regression tests; route: inline; status: complete; commits: `6281ed1`, `caf55a1`.
- [ ] T3 — Reorganize Settings into category navigation with independent saves; route: inline; status: reopened for S5; baseline commit: `fed1102`; follow-up commit: pending.
- [ ] T4 — Re-run complete verification after S5 and close the updated candidate; route: inline; status: reopened for S5; baseline verification: `a7e9a02`; follow-up commit: pending.

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
- L13: User feedback: “ok esta bien pero siento que esta todo mal organizado estando todo asi, quiero que hagamos opciones para cada cosa”.
- L14: User selected “opcion 1” (desktop category sidebar, mobile category Dropdown) and “Guardar por categoría”.
- L15: User approved updating the design and plan: “si hazlo”.
- L16: S5 reopens T1, T3, and T4 only; the implemented settings data, currency consumers, and their completed tests remain valid.
- L17: Added the T1 S5 helper to persist one settings section while merging with current saved state; invalid envelopes fail without replacing bytes. Store tests: 19 passed; Astro check: zero diagnostics. RDD remains off. Follow-up commit pending.
- Risk: none for the completed S1–S4 implementation; its monetary consumers/settings behavior are covered and persisted amounts, Agenda schedules, appointment availability, and notification delivery remain unchanged. Reassess after the S5 follow-up closes.
