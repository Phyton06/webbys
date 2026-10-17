# Webbys Business Settings Design

## Goal

Complete the existing Configuration module with locally persisted business and administrator profile settings, general operating hours, currency preference, and functional notification preferences, while preserving the existing per-barber availability controls.

## User decisions

- The user approved continuing with the next phase: “si hazlo”.
- For the logo, the user chose: “Solo mostrar el actual”. Keep the existing logo visible and read-only.
- For currency behavior, the user chose: “Aplicar formato global”. Apply the selected currency format across displayed amounts without converting or modifying stored numbers.
- The user selected the initial currency: “MXN”.
- For general business hours, the user chose: “Solo informativo”. They do not constrain appointment availability.
- For preferences, the user chose: “Solo preferencias funcionales”. Persist local notification preferences; retain the current visual theme and do not add a light theme.
- The user approved the recommended design: a separate local settings store, existing barber schedules unchanged, and no real notification delivery.

## Approved scope

### Business and administrator profile

- Extend `/configuracion/` with editable business name, address, phone, and email; show the existing logo without an upload or replacement control.
- Add administrator profile fields for display name, email, and phone. These are local profile details only; they do not change authentication or authorization.
- Persist this information in a separate versioned localStorage envelope under `webbys:business-settings:v1`; do not extend or rewrite the Agenda envelope.
- Seed the displayed business name from the current visible business identity. Leave optional profile/contact fields unset until entered; do not invent a real address or contact.

### General business hours

- Represent each weekday as either closed or an opening/closing time interval. Validate times and reject invalid ranges before writing.
- These hours are informational in this phase. They do not replace or constrain the existing schedules/exceptions for individual barbers and do not change appointment slot generation.
- Keep existing barber availability and exception editors intact and backed by the current Agenda store.

### Currency

- Persist a currency preference with MXN as the initial value; provide MXN, USD, and EUR as the initial supported options.
- Apply the selected currency formatting to all existing monetary displays in the dashboard, products, services, promotions, appointment price estimate, and sales.
- Currency changes only display formatting. They do not convert, round-and-save, or otherwise mutate stored prices, sales, discounts, or promotion values.
- Keep locale formatting consistent with the existing Spanish interface.

### Notification and visual preferences

- Persist local notification-category preferences for product, service, promotion, general, and change notices.
- Preferences are saved locally as future integration settings; they do not send notifications, create subscriptions, alter simulated sends, or affect the explicitly triggered local-device test.
- Keep the current dark visual theme. Do not introduce a light theme or claim that a theme preference can be changed.

## Out of scope

- Backend, account synchronization, real authentication/profile updates, cloud storage, or public APIs.
- Editing or uploading the logo.
- Automatic currency conversion or changing numeric values already stored in the application.
- Applying general business hours to appointment availability.
- Actual push delivery, automatic notification dispatch, subscriptions, or changing the local device test behavior.
- A new light theme or global visual redesign.

## Acceptance criteria

1. Existing `/configuracion/` barber schedules and date exceptions continue to work and persist through the existing Agenda store without data loss.
2. Business/profile settings and weekday opening hours persist in a separate versioned key, survive remount, and never mutate Agenda bytes on their own.
3. Invalid settings are rejected without replacing existing stored bytes.
4. The current logo is visible and cannot be replaced in this UI.
5. The initial currency is MXN. Changing currency updates every monetary display listed above, but the serialized numeric source values remain byte-for-byte unchanged.
6. General hours are described as informational and do not affect generated appointment slots.
7. Notification-category preference toggles persist locally and do not trigger delivery or change notification testing/simulated-send records.
8. Settings controls reuse existing custom dropdown, form, search, and responsive patterns where relevant.
9. The full existing test suite, Astro type check, and static build pass.

## Verification

- Unit-test settings schema validation, defaults, versioned persistence, invalid-write byte preservation, and business-hour validation.
- Test currency formatting for MXN/USD/EUR and unchanged numeric values; test every changed monetary consumer.
- Test the Settings page's separate storage boundaries, form persistence, read-only logo, informational hours, and notification preference toggles.
- Run `npm test`, `npm run check`, `npm run build`, and `git diff --check`.
