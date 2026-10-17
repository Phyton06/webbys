# Webbys Business Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete `/configuracion/` with independently persisted business/profile data, informational business hours, MXN-default currency formatting across the app, and local notification preferences.

**Architecture:** Keep the existing barber schedule and exception editors on `webbys:agenda:v1`. Store business settings in a separate validated `webbys:business-settings:v1` envelope and read its currency preference through a shared formatter in monetary consumers. Extend Configuration with a focused business settings panel; no preference triggers delivery or changes appointment availability.

**Tech Stack:** Astro, Preact, TypeScript, Vitest, localStorage, existing `Dropdown`, `AdminGate`, `AdminShell`, and CSS tokens.

**Delivery:** `stacked-to-main` (user-selected); no push or PR without separate authorization.

## Global Constraints

- “These hours are informational in this phase. They do not replace or constrain the existing schedules/exceptions for individual barbers and do not change appointment slot generation.”
- “Currency changes only display formatting. They do not convert, round-and-save, or otherwise mutate stored prices, sales, discounts, or promotion values.”
- “Preferences are saved locally as future integration settings; they do not send notifications, create subscriptions, alter simulated sends, or affect the explicitly triggered local-device test.”
- The current logo is read-only; no upload or replacement control.
- Keep the current dark theme; add no light theme.
- Business/profile data uses the separate key `webbys:business-settings:v1`; do not extend or rewrite the Agenda envelope.
- Initial currency is MXN. Initial notification category preferences are off (opt-in default; implementation assumption because no saved preference exists).
- Do not add backend, API, account synchronization, real authentication, remote storage, push delivery, or automatic notification dispatch.

---

## File Structure

- `src/types/business-settings.ts` — currency, business contact/profile, weekday hours, preferences, settings envelope, and load result types.
- `src/services/business-settings-store.ts` / `.test.ts` — defaults, validation, versioned persistence, and read-only rejection behavior.
- `src/services/currency.ts` / `.test.ts` — shared Spanish currency formatting and stored-currency lookup.
- `src/components/BusinessSettingsPanel.tsx` / `.test.tsx` — business/profile forms, read-only logo, informational hours, currency selection, and notification preference toggles.
- `src/components/SettingsPage.tsx` / `.test.tsx` — integrate the new panel without changing existing Agenda persistence or per-barber editors.
- `src/components/DashboardPanel.tsx` / `.test.tsx` — use selected currency for dashboard totals and activity amounts.
- `src/components/ProductsPage.tsx` / `.test.tsx` — selected currency for sale and cost prices.
- `src/components/ServicesPage.tsx` / `.test.tsx` — selected currency for service prices.
- `src/components/PromotionTargetCombobox.tsx` / related tests — selected currency in target labels and results.
- `src/components/PromotionsPage.tsx` / `.test.tsx` — selected currency in prices and promotion previews.
- `src/components/AppointmentForm.tsx` / `.test.tsx` — selected currency in estimated appointment price.
- `src/components/SalesPage.tsx` / `.test.tsx` — selected currency in summaries, trend labels, sale details, and breakdowns.
- `src/styles/business-settings.css` — responsive styles using existing design tokens and form patterns.
- `odd/tasks/business-settings.md` — requirements, task status, checks, and work-unit commit identities.

## Interfaces

```ts
export type CurrencyCode = 'MXN' | 'USD' | 'EUR';
export type BusinessWeekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export const BUSINESS_WEEKDAYS: readonly BusinessWeekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export type BusinessDayHours =
  | { status: 'unconfigured' }
  | { status: 'closed' }
  | { status: 'open'; opensAt: string; closesAt: string };

export interface BusinessContact {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface AdministratorProfile {
  displayName: string;
  email: string;
  phone: string;
}

export type NotificationPreferenceCategory = 'product' | 'service' | 'promotion' | 'general' | 'change';
export const NOTIFICATION_PREFERENCE_CATEGORIES: readonly NotificationPreferenceCategory[] = ['product', 'service', 'promotion', 'general', 'change'];

export interface BusinessSettings {
  business: BusinessContact;
  administrator: AdministratorProfile;
  hours: Record<BusinessWeekday, BusinessDayHours>;
  currency: CurrencyCode;
  notificationPreferences: Record<NotificationPreferenceCategory, boolean>;
}

export type BusinessSettingsSection = keyof BusinessSettings;
export type SettingsCategory = BusinessSettingsSection | 'barber-schedules' | 'date-exceptions';

export interface BusinessSettingsEnvelope { schemaVersion: 1; settings: BusinessSettings; }
export type BusinessSettingsLoadStatus = 'default' | 'loaded' | 'invalid';
export interface BusinessSettingsLoadResult { settings: BusinessSettings; status: BusinessSettingsLoadStatus; }

export function createDefaultBusinessSettings(): BusinessSettings;
export function validateBusinessSettings(value: unknown): value is BusinessSettings;
export function loadBusinessSettings(storage: Pick<Storage, 'getItem'>): BusinessSettingsLoadResult;
export function saveBusinessSettings(storage: Pick<Storage, 'setItem'>, settings: BusinessSettings): void;
export function saveBusinessSettingsSection(storage: Pick<Storage, 'getItem' | 'setItem'>, settings: BusinessSettings, section: BusinessSettingsSection): void;
export function formatCurrency(amount: number, currency: CurrencyCode): string;
export function readBusinessCurrency(storage: Pick<Storage, 'getItem'>): CurrencyCode;
export function getCurrentBusinessCurrency(): CurrencyCode;
```

### Task 1 type/default and validation sketch

```ts
export function createDefaultBusinessSettings(): BusinessSettings {
  const hours = Object.fromEntries(BUSINESS_WEEKDAYS.map((day) => [day, { status: 'unconfigured' }])) as Record<BusinessWeekday, BusinessDayHours>;
  return {
    business: { name: "Webby's Barbershop", address: '', phone: '', email: '' },
    administrator: { displayName: '', email: '', phone: '' },
    hours,
    currency: 'MXN',
    notificationPreferences: { product: false, service: false, promotion: false, general: false, change: false },
  };
}

function isTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBusinessDayHours(value: unknown): value is BusinessDayHours {
  if (!isRecord(value)) return false;
  if (value.status === 'unconfigured' || value.status === 'closed') return true;
  return value.status === 'open' && isTime(value.opensAt) && isTime(value.closesAt)
    && value.closesAt > value.opensAt;
}
```

In the full validator, also check all six profile/contact fields are strings, currency is exactly `MXN`, `USD`, or `EUR`, every weekday exists and passes `isBusinessDayHours`, and the five notification preference values are booleans. Use a discriminated `isEnvelope` guard requiring `schemaVersion === 1` and `validateBusinessSettings(envelope.settings)`.

Task 1's RED test uses the public store API:

```ts
it('loads a default MXN profile without writing an envelope', () => {
  const result = loadBusinessSettings(localStorage);
  expect(result.status).toBe('default');
  expect(result.settings.currency).toBe('MXN');
  expect(localStorage.getItem(BUSINESS_SETTINGS_STORAGE_KEY)).toBeNull();
});
```

## Implementation Sketches

`src/services/business-settings-store.ts` uses one envelope key and does not write during load:

```ts
export const BUSINESS_SETTINGS_STORAGE_KEY = 'webbys:business-settings:v1';

export function loadBusinessSettings(storage: Pick<Storage, 'getItem'>): BusinessSettingsLoadResult {
  let serialized: string | null;
  try {
    serialized = storage.getItem(BUSINESS_SETTINGS_STORAGE_KEY);
  } catch {
    return { settings: createDefaultBusinessSettings(), status: 'invalid' };
  }
  if (serialized === null) return { settings: createDefaultBusinessSettings(), status: 'default' };
  try {
    const envelope: unknown = JSON.parse(serialized);
    if (isEnvelope(envelope)) return { settings: envelope.settings, status: 'loaded' };
  } catch {
    // Leave invalid stored bytes untouched until an explicit valid save.
  }
  return { settings: createDefaultBusinessSettings(), status: 'invalid' };
}

export function saveBusinessSettings(storage: Pick<Storage, 'setItem'>, settings: BusinessSettings): void {
  if (!validateBusinessSettings(settings)) throw new Error('Revisa los datos de configuración.');
  storage.setItem(BUSINESS_SETTINGS_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, settings }));
}

export function saveBusinessSettingsSection(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  draft: BusinessSettings,
  section: BusinessSettingsSection,
): void {
  const stored = loadBusinessSettings(storage);
  if (stored.status === 'invalid') throw new Error('No se pueden guardar los cambios hasta revisar los datos guardados.');
  saveBusinessSettings(storage, { ...stored.settings, [section]: draft[section] });
}
```

The store tests call the public functions and assert that rejected writes leave the exact prior bytes intact:

```ts
it('preserves existing bytes when settings are invalid', () => {
  const before = JSON.stringify({ schemaVersion: 1, settings: createDefaultBusinessSettings() });
  localStorage.setItem(BUSINESS_SETTINGS_STORAGE_KEY, before);
  const invalid = { ...createDefaultBusinessSettings(), currency: 'ABC' } as unknown as BusinessSettings;

  expect(() => saveBusinessSettings(localStorage, invalid)).toThrow('Revisa los datos de configuración.');
  expect(localStorage.getItem(BUSINESS_SETTINGS_STORAGE_KEY)).toBe(before);
});
```

The currency functions are presentation-only and do not write business data:

```ts
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount);
}

export function readBusinessCurrency(storage: Pick<Storage, 'getItem'>): CurrencyCode {
  return loadBusinessSettings(storage).settings.currency;
}

export function getCurrentBusinessCurrency(): CurrencyCode {
  if (typeof window === 'undefined') return 'MXN';
  try {
    return readBusinessCurrency(window.localStorage);
  } catch {
    return 'MXN';
  }
}
```

`BusinessSettingsPanel` owns editable form state and persists only on explicit submit. It receives no `AgendaState`:

```tsx
const [settings, setSettings] = useState(() => loadBusinessSettings(window.localStorage).settings);
const [error, setError] = useState('');

function updateBusinessName(name: string) {
  setSettings((current) => ({ ...current, business: { ...current.business, name } }));
}

function handleSubmit(event: SubmitEvent) {
  event.preventDefault();
  try {
    saveBusinessSettings(window.localStorage, settings);
    setError('');
  } catch {
    setError('No se pudo guardar la configuración. Revisa el almacenamiento e inténtalo de nuevo.');
  }
}

return <form onSubmit={handleSubmit}>
  <label><span>Nombre del negocio</span><input value={settings.business.name} onInput={(event) => updateBusinessName(event.currentTarget.value)} /></label>
  <span>Logotipo actual</span><img src="/logo.jpeg" alt="Logotipo actual del negocio" />
  {error && <p role="alert">{error}</p>}
  <button type="submit">Guardar configuración</button>
</form>;
```

In `BusinessSettingsPanel`, `updateCurrency(value: CurrencyCode)` changes only `settings.currency`; weekday and notification handlers replace only the selected key in their settings record. Render seven day controls from `BUSINESS_WEEKDAYS`; each uses an unconfigured/closed/open status, with time inputs visible only for an open day. Render five checkboxes from `NOTIFICATION_PREFERENCE_CATEGORIES`. The current logo has no interactive control. `handleSubmit` reports storage errors without discarding the in-memory draft.

## Tasks

### Task 1: Settings model, validation, and isolated persistence

**Files:** `src/types/business-settings.ts`, `src/services/business-settings-store.ts`, `src/services/business-settings-store.test.ts`.

**S5 follow-up:** `T1` is reopened only to add/test `saveBusinessSettingsSection`, preserving other persisted settings groups and replacing unreadable envelopes only on an explicit save.

- [x] Write failing tests proving default business identity is `Webby's Barbershop`, default currency is MXN, optional contact/profile fields are blank, each weekday is unconfigured, and notification preferences default off.
- [x] Write failing tests accepting valid open/closed/unconfigured weekday states and rejecting invalid currency codes, malformed hours, open times where `closesAt <= opensAt`, invalid profile field types, and missing preference categories.
- [x] Write failing storage tests for missing key, valid schema version 1, corrupt JSON, wrong schema version, invalid settings, storage read exceptions, and invalid saves preserving the exact pre-existing bytes.
- [x] Implement `createDefaultBusinessSettings`, `validateBusinessSettings`, `loadBusinessSettings`, and `saveBusinessSettings` using `webbys:business-settings:v1`. Loading does not rewrite invalid bytes; saving validates before calling `setItem`.
- [x] Run `npm test -- src/services/business-settings-store.test.ts` (17 passed) and `npm run check` (zero diagnostics); RED → GREEN observed.
- [x] Commit: `d1306ae feat(settings): add isolated business settings store`.
- [x] Add a failing test that saving one category merges only that category with existing settings; other saved categories remain unchanged.
- [x] Implement `saveBusinessSettingsSection` using `loadBusinessSettings`; merge only `draft[section]` over the stored settings and call `saveBusinessSettings`.
- [x] Fall back to default settings as the merge base when stored bytes are unreadable, so an explicit save replaces corrupt bytes instead of leaving settings unrecoverable.
- [x] Run `npm test -- src/services/business-settings-store.test.ts` (19 passed) and `npm run check` (zero diagnostics).
- [x] Commit the S5 store follow-up: `d3e1f4a feat(settings): save business sections independently`; unreadable-storage recovery: `34d1059 fix(settings): recover unreadable settings on explicit save`.

### Task 2: Shared currency formatting across monetary consumers

**Files:** `src/services/currency.ts`, `src/services/currency.test.ts`, `src/components/DashboardPanel.tsx` / `.test.tsx`, `src/components/ProductsPage.tsx` / `.test.tsx`, `src/components/ServicesPage.tsx` / `.test.tsx`, `src/components/PromotionTargetCombobox.tsx` (covered through `src/components/PromotionsPage.test.tsx`), `src/components/PromotionsPage.tsx` / `.test.tsx`, `src/components/AppointmentForm.tsx` / `.test.tsx`, `src/components/SalesPage.tsx` / `.test.tsx`.

- [x] Add failing formatter tests for zero, integer, and decimal MXN/USD/EUR amounts using `Intl.NumberFormat('es-MX', { style: 'currency', currency })`.
- [x] Assert the formatter contract before implementation:

```ts
it.each(['MXN', 'USD', 'EUR'] as const)('formats %s using the Spanish-Mexico locale', (currency) => {
  const expected = new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(1234.5);
  expect(formatCurrency(1234.5, currency)).toBe(expected);
});
```

- [x] Add consumer assertions that a non-default saved currency appears consistently in each monetary screen while the underlying price, sale, discount, and promotion numbers remain unchanged.
- [x] Implement `formatCurrency(amount, currency)`, `readBusinessCurrency(storage)`, and `getCurrentBusinessCurrency()` in `src/services/currency.ts`; server rendering and inaccessible localStorage safely fall back to MXN without writing storage.
- [x] Replace hard-coded currency formatting in Dashboard, Products, Services, Promotions/target picker, AppointmentForm, and Sales. No calculation inputs, serialized numbers, rounding rules, stock, or appointment behavior changed.
- [x] Add consumer tests seeding `webbys:business-settings:v1` with USD and asserting display changes without numeric mutation.
- [x] Update existing visible currency expectations while preserving assertions that source numeric values and totals are unchanged.
- [x] Run the focused 7-file currency consumer suite (59 passed), `npm run check` (zero diagnostics), and `npm run build` (12 routes). A first build exposed a server-render `window` access; TDD added coverage and `getCurrentBusinessCurrency()` fixed the SSR fallback.
- [x] Commit: `6281ed1 feat(settings): apply selected currency formatting`.

### Task 3: Configuration profile, hours, and preference controls

**Files:** `src/components/BusinessSettingsPanel.tsx`, `src/components/BusinessSettingsPanel.test.tsx`, `src/components/SettingsPage.tsx`, `src/components/SettingsPage.test.tsx`, `src/styles/business-settings.css`.

**S5 follow-up:** `T3` is reopened only for the approved category navigation and category-specific saves. Keep the current data model and current feature behavior; move controls into the selected category without changing their existing semantics.

- [x] Add failing component tests for editable business name/address/phone/email and administrator display name/email/phone, a visible read-only current logo, currency dropdown defaulting to MXN, and save/reload persistence.
- [x] Add failing tests for each weekday's `Sin configurar`/`Cerrado`/opening and closing time states, rejecting invalid open intervals, and successful saves not changing generated barber appointment slots.
- [x] Add failing tests for local category preference toggles persisting across remount and not mutating Agenda bytes, notification history bytes, or device-test state.
- [x] Add integration tests proving existing per-barber schedules/exceptions still load, save, and survive independent business settings updates.
- [ ] Assert the separated write paths explicitly:

```tsx
const agendaBytesBeforeSettingsSave = localStorage.getItem(AGENDA_STORAGE_KEY);
fireEvent.input(screen.getByLabelText('Correo del negocio'), { target: { value: 'tienda@example.test' } });
fireEvent.click(screen.getByRole('button', { name: 'Guardar configuración' }));
expect(localStorage.getItem(BUSINESS_SETTINGS_STORAGE_KEY)).not.toBeNull();
expect(localStorage.getItem(AGENDA_STORAGE_KEY)).toBe(agendaBytesBeforeSettingsSave);
```

- [x] Implement `BusinessSettingsPanel` using the store and existing form, Dropdown, and token patterns. The logo is read-only; hours are informational; preferences do not dispatch notices.
- [x] Render `BusinessSettingsPanel` in the existing `/configuracion/` view alongside existing schedule and exception panels. Existing Agenda write paths remain unchanged.
- [x] Run `npm test -- src/components/BusinessSettingsPanel.test.tsx src/components/SettingsPage.test.tsx src/services/business-settings-store.test.ts` (25 passed).
- [x] Run `npm run check` (zero diagnostics).
- [x] Commit: `fed1102 feat(settings): complete business configuration page`.
- [x] Add failing tests for all seven menu categories, the default Perfil del negocio category, desktop menu selection, mobile custom Dropdown selection, and only the selected category being visible.
- [x] Add failing tests proving each business settings category has its own Save action, saving one category does not persist another category's unsaved draft, and switching categories preserves the in-memory draft.
- [x] Add failing integration tests that Horarios del equipo and Excepciones por fecha remain separate categories with their existing Agenda save behavior.
- [x] Implement `SettingsCategory` navigation in `SettingsPage`: desktop sidebar, mobile `Dropdown`, active category defaults to `business`, and all category panels remain mounted with inactive panels hidden so existing editor drafts survive navigation.
- [x] Refactor `BusinessSettingsPanel` to render only the selected business settings category and a section-scoped Save action. Keep its full draft in memory while the category changes.
- [x] Implement section saves with `saveBusinessSettingsSection`; merge only the active business section into the latest stored settings, preserve other persisted sections, and do not persist unsaved drafts from other sections.
- [x] Place `BarberAvailabilityPanel` and `AvailabilityExceptionEditor` in their own hidden/shown categories without changing their `webbys:agenda:v1` save callbacks.
- [x] Run `npm test -- src/components/BusinessSettingsPanel.test.tsx src/components/SettingsPage.test.tsx src/services/business-settings-store.test.ts`; 32 focused tests passed, then the full suite at 296 tests.
- [x] Run `npm run check`; zero diagnostics.
- [x] Commit the S5 UI follow-up: `10cb798 feat(settings): reorganize configuration into categories`; legacy navigation coverage updated in `AgendaPage.test.tsx` and `SettingsPage.test.tsx`.
- [x] User follow-up (S5): replaced the desktop sidebar and mobile `Dropdown` with one wrapping button row above the content at every size; `SettingsPage.test.tsx` updated; focused 20 passed, full suite 296 passed, check zero diagnostics, build 12 routes; commit `6b118cf`.
- [x] User follow-up 2 (S5): rebuilt the navigation as a drill-down — menu-first view with icon buttons, opening one removes every menu button and shows only that category, back action returns to the menu, drafts survive; focused 21 passed, full suite 297 passed, check zero diagnostics, build 12 routes; commit `36c3975`.
- [x] User follow-up 3 (S6): the date-exception editor now uses the shared system controls — date via the `MobileMonthCalendar` popover, start/end times via the custom `Dropdown` (15-minute steps, menu scrolls to the active option), and the picker popover re-enables the month calendar the agenda media query hid on desktop; tests rewritten first (RED 7 failures), focused 14 passed, full suite 297 passed, check zero diagnostics, build 12 routes; commit `f98cf66`.
- [x] User follow-up 4 (S6): applied the system time dropdown to every remaining native time input in configuration — weekly team-schedule intervals (28 controls) and general opening/closing hours share the `TIME_OPTIONS` list, adding an interval or setting a day to `Abierto` seeds standard times, and `Dropdown` shows the raw value when it is not in the list; tests rewritten first (RED 8 failures), focused 33 passed, full suite 297 passed, check zero diagnostics, build 12 routes; commit `485daa6`.

### Task 4: Full verification and close

**Files:** `odd/tasks/business-settings.md`, this plan, and any focused test fixtures changed by earlier tasks.

- [x] Run `npm test` (288 tests/39 files), `npm run check` (zero diagnostics), `npm run build` (12 static routes), and `git diff --check` (passed).
- [x] Verify every requirement in `docs/superpowers/specs/2026-10-16-webbys-business-settings-design.md`, including preserved Agenda storage, all global currency consumers, no conversion, and no notification delivery.
- [x] RDD was read as off (global); no review lifecycle or mode changes were performed.
- [x] Record final result in `odd/tasks/business-settings.md`; verification work-unit commit: `a7e9a02`. No push or PR was performed.
- [x] Rerun full tests (296 tests/39 files), Astro check (zero diagnostics), static build (12 routes), and `git diff --check` after the S5 follow-up.
- [x] Run the Impeccable detector on `SettingsPage.tsx`, `BusinessSettingsPanel.tsx`, the stylesheet, and the built `/configuracion/` page; no findings returned.
- [x] Record follow-up verification and commits in `odd/tasks/business-settings.md`; no push or PR without separate authorization.

## Known Decisions and Assumptions

- Existing `SettingsPage` stores barber schedules/exceptions in `webbys:agenda:v1`; business settings must remain separate.
- Initial business name is copied from the current visible identity, `Webby's Barbershop`; optional contact/profile data remains blank until entered.
- Weekdays initially use an explicit `unconfigured` state so no business opening hours are invented.
- Notification-category preferences start disabled until the user explicitly enables them. They are local future-integration preferences, not delivery controls.
- The initial currency is MXN; USD and EUR are the other initial options. Changing currency is presentation-only.
- Monetary displays currently appear in Dashboard, Products, Services, Promotions/target picker, AppointmentForm, and Sales; the shared formatter must cover every listed consumer.
- The S5 organization presents the category menu first (icon, label, and chevron buttons) and opens one category at a time with a back action to the menu; no sidebar or Dropdown. Each business settings category has its own Save action, and unsaved drafts live only in component memory.
- Final UI detector run over SettingsPage, BusinessSettingsPanel, its stylesheet, and the built `/configuracion/` page after S5 returned no findings.

## Verification and Delivery

- Focused store: `npm test -- src/services/business-settings-store.test.ts`.
- Focused currency consumers: the Task 2 command above.
- Focused settings UI: `npm test -- src/components/BusinessSettingsPanel.test.tsx src/components/SettingsPage.test.tsx`.
- Full closure: `npm test && npm run check && npm run build && git diff --check`.
- RDD is user-owned. Read status only when applicable; do not enable, disable, or bypass it as part of this implementation plan.
