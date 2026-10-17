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

User decisions: “opcion 1” / “Guardar por categoría” / “si hazlo” / “También en escritorio”.

Replace the long Settings page with a category menu first: each option is a button with an icon that opens its category and removes every menu button, with a back action returning to the menu. Show one category at a time; keep in-session drafts when switching; save only the selected category. Never save pending values from another category. Business preferences remain in the business settings store; team hours/exceptions remain in Agenda storage and retain their own save handlers.

Assumption: unsaved drafts remain only in component memory and are discarded on reload; the last saved values are restored.

### S6 — System-styled controls in configuration screens

User request: “oye en excepciones por fecha tanto el selector de hora fin e inicio y tambien el calendario no tiene estilo, quiero que le pongas estilo de el sistema”

Follow-up request: “ok ahora esos estilos aplicalos al resto de pantallas en configuracion”

The **Excepciones por fecha** category selects its date with the shared trigger button and `MobileMonthCalendar` popover used by the appointment form, instead of a raw browser date input. Start/end times for special working hours and breaks use the custom `Dropdown` with 15-minute steps instead of raw browser time inputs, keeping their `aria-invalid`/`aria-describedby` wiring. The same dropdown replaces every remaining native time input in configuration: the weekly **Horarios del equipo** intervals (working and breaks per weekday) and the **Horario general** opening/closing times, all sharing one time option list. Switching a general-hours day to `Abierto` seeds 09:00–18:00, and adding an interval seeds its standard times (working 09:00–18:00, breaks 13:00–14:00) instead of an empty value. The dropdown menu scrolls to the active option when opened and shows the raw value when it is not in the option list. The picker popover re-enables the month calendar inside it, which the agenda media query was hiding on desktop in both the date exceptions editor and the appointment form picker.

## Tasks

- [x] T1 — Add business settings types, validation, independent versioned persistence, and tests; route: inline; status: complete; baseline commit: `d1306ae`; follow-up commits: `d3e1f4a`, `34d1059`.
- [x] T2 — Add shared currency formatting and update all affected monetary displays with regression tests; route: inline; status: complete; commits: `6281ed1`, `caf55a1`.
- [x] T3 — Reorganize Settings into category navigation with independent saves; route: inline; status: complete; baseline commit: `fed1102`; follow-up commits: `10cb798`, `6b118cf`, `36c3975`.
- [x] T4 — Re-run complete verification after S5 and close the updated candidate; route: inline; status: complete; baseline verification: `a7e9a02`; verification commit: `2804885`.
- [x] T5 — Style the date-exception controls with the shared system components; route: inline; status: complete; baseline commit: `c4f376d`; commits: `f98cf66`, `485daa6`.

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
- L17: Added the T1 S5 helper to persist one settings section while merging with current saved state. Store tests: 19 passed; Astro check: zero diagnostics. Commit `d3e1f4a`.
- L18: Implemented the S5 UI: desktop category sidebar, mobile category Dropdown, one visible category at a time, section-scoped saves with in-memory drafts, and the Agenda editors kept in their own hidden categories. Focused suite 32 passed; full suite 295 passed; Astro check zero diagnostics; build 12 routes. Commit `10cb798`.
- L19: Reviewing the T1 helper exposed a dead end: refusing to overwrite unreadable stored bytes removed the only recovery path the old full save provided. `saveBusinessSettingsSection` now merges over default settings when the envelope is unreadable, so an explicit save replaces corrupt bytes; the panel warning clears after that save. Tests updated; commit `34d1059`.
- L20: Final S5 verification: `npm test` (296 tests, 39 files); `npm run check` (zero diagnostics); `npm run build` (12 static routes); `git diff --check` passed; Impeccable detector on `SettingsPage.tsx`, `BusinessSettingsPanel.tsx`, `business-settings.css`, and the built `/configuracion/` page returned no findings. RDD remains off by global choice; Engram mirror remains pending because the service cannot resolve an authoritative runtime session.
- L21: User correction: “no quiero que sea un selector asi, quiero que sean primero botones y cuando ya preciones uno aparezca toda las opciones y dezparezcan las opciones no asi como lo aplicaste”.
- L22: User selected the button row at every screen size (“También en escritorio”): category buttons above the content; pressing one shows its option and hides the others; no sidebar and no Dropdown.
- L23: Replaced the desktop sidebar and mobile `Dropdown` with one wrapping button row at every size; `SettingsPage.test.tsx` updated (RED observed: the selector-absent assertion failed first). Focused 20 passed; full suite 296/39; `npm run check` zero diagnostics; build 12 routes; `git diff --check` clean; Impeccable on the running `/configuracion/` page exit 0 with no findings; real-browser check confirmed the row and category switching on desktop and mobile. Commit `6b118cf`.
- L24: User correction: “no me referia a eso, debe estar ocultas las opciones de abajo, cada boton debe enviar a la opcion y quitar todos los botones, ademas dale un estilo con icono a cada opcion para que se vea estetico, algo asi como facebook”.
- L25: Rebuilt the navigation as a drill-down: the menu is the first view (icon, label, chevron per category via `lucide-preact`), pressing one hides every menu button and shows only that category, and a back action (`Configuración`) returns to the menu; panels stay mounted so drafts survive. Four `SettingsPage` tests rewritten including a new back/forward draft test (RED observed: 5 failures first). Focused 21 passed; full suite 297/39; `npm run check` zero diagnostics; build 12 routes; `git diff --check` clean; Impeccable on the running `/configuracion/` page exit 0 with no findings; real-browser check confirmed menu, icon rows, drill-in, and back on desktop and mobile. Commit `36c3975`.
- L26: User follow-up request: “oye en excepciones por fecha tanto el selector de hora fin e inicio y tambien el calendario no tiene estilo, quiero que le pongas estilo de el sistema”.
- L27: Replaced the raw browser date/time inputs of the date-exception editor with the shared system controls: the date uses the same trigger and `MobileMonthCalendar` popover as the appointment form, and start/end times (special hours and breaks) use the custom `Dropdown` with 15-minute steps; `Dropdown` gained optional `aria-invalid`/`aria-describedby` support and scrolls its menu to the active option, and the picker popover now re-enables the month calendar that the agenda media query was hiding on desktop (the same bug affected the appointment form picker). Tests were rewritten first (RED observed: 7 failures); focused 14 passed; full suite 297/39; `npm run check` zero diagnostics; build 12 routes; `git diff --check` clean; Impeccable on the running `/configuracion/` page exit 0 with no findings; real-browser check confirmed the calendar popover, the time dropdowns with scroll-to-active, day/time selection updating the triggers, and desktop + mobile layouts. Commit `f98cf66`.
- L28: User follow-up request: “ok ahora esos estilos aplicalos al resto de pantallas en configuracion”.
- L29: Extended the system time dropdown to every remaining native time input in configuration: the weekly team-schedule intervals (28 controls across 7 days) and the general opening/closing hours. Added the shared `TIME_OPTIONS` module, seeded standard times when adding an interval (working 09:00–18:00, breaks 13:00–14:00) or setting a general-hours day to `Abierto` (09:00–18:00), and made `Dropdown` show the raw value instead of the first option when the value is not in the list. Tests rewritten first (RED observed: 8 failures); focused 33 passed across 5 files; full suite 297/39; `npm run check` zero diagnostics; build 12 routes; `git diff --check` clean; Impeccable on the running `/configuracion/` page exit 0 with no findings; real-browser check confirmed the schedule dropdowns, scroll-to-active, seeded intervals, the general-hours seed on `Abierto`, and desktop + mobile layouts. Commit `485daa6`.
- L30: User authorized publishing: “bien haz commit y pushea a main por cli, despues continuemos con la siguiente fase”. Pushed the 22 commits of `feat/business-settings` to `origin/main` with the git CLI, fast-forwarding it from `65a1072`; no PR opened.
- Risk: none for S1–S6. S5 changes configuration UI structure and the section-merge write path; both have focused coverage, the stored envelope schema is unchanged, and persisted amounts, Agenda schedules, appointment availability, and notification delivery remain untouched. The menu drill-down follow-ups are UI navigation only: save paths, stored schema, and Agenda behavior are unchanged. S6 replaces browser inputs with existing system components and adds optional `Dropdown` props; stored exception values keep their `HH:MM` format, and the popover CSS fix is scoped to the shared date picker. The S6 extension applies the same dropdown to the weekly schedules and general hours; stored `HH:MM` formats, Agenda availability behavior, and informational-only general hours are unchanged.
