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

export interface BusinessSettingsEnvelope { schemaVersion: 1; settings: BusinessSettings; }
export type BusinessSettingsLoadStatus = 'default' | 'loaded' | 'invalid';
export interface BusinessSettingsLoadResult { settings: BusinessSettings; status: BusinessSettingsLoadStatus; }

export function createDefaultBusinessSettings(): BusinessSettings;
export function validateBusinessSettings(value: unknown): value is BusinessSettings;
export function loadBusinessSettings(storage: Pick<Storage, 'getItem'>): BusinessSettingsLoadResult;
export function saveBusinessSettings(storage: Pick<Storage, 'setItem'>, settings: BusinessSettings): void;
export function formatCurrency(amount: number, currency: CurrencyCode): string;
export function readBusinessCurrency(storage: Pick<Storage, 'getItem'>): CurrencyCode;
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

- [ ] Write failing tests proving default business identity is `Webby's Barbershop`, default currency is MXN, optional contact/profile fields are blank, each weekday is unconfigured, and notification preferences default off.
- [ ] Write failing tests accepting valid open/closed/unconfigured weekday states and rejecting invalid currency codes, malformed hours, open times where `closesAt <= opensAt`, invalid profile field types, and missing preference categories.
- [ ] Write failing storage tests for missing key, valid schema version 1, corrupt JSON, wrong schema version, invalid settings, storage read exceptions, and invalid saves preserving the exact pre-existing bytes.
- [ ] Implement `createDefaultBusinessSettings`, `validateBusinessSettings`, `loadBusinessSettings`, and `saveBusinessSettings` using `webbys:business-settings:v1`. Loading must not rewrite invalid bytes; saving must validate before calling `setItem`.
- [ ] Run `npm test -- src/services/business-settings-store.test.ts`; confirm the new tests fail before the implementation and pass after it.
- [ ] Run `npm run check`; expect zero diagnostics.
- [ ] Commit: `feat(settings): add isolated business settings store`.

### Task 2: Shared currency formatting across monetary consumers

**Files:** `src/services/currency.ts`, `src/services/currency.test.ts`, `src/components/DashboardPanel.tsx` / `.test.tsx`, `src/components/ProductsPage.tsx` / `.test.tsx`, `src/components/ServicesPage.tsx` / `.test.tsx`, `src/components/PromotionTargetCombobox.tsx` (covered through `src/components/PromotionsPage.test.tsx`), `src/components/PromotionsPage.tsx` / `.test.tsx`, `src/components/AppointmentForm.tsx` / `.test.tsx`, `src/components/SalesPage.tsx` / `.test.tsx`.

- [ ] Add failing formatter tests for zero, integer, and decimal MXN/USD/EUR amounts using `Intl.NumberFormat('es-MX', { style: 'currency', currency })`.
- [ ] Assert the formatter contract before implementation:

```ts
it.each(['MXN', 'USD', 'EUR'] as const)('formats %s using the Spanish-Mexico locale', (currency) => {
  const expected = new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(1234.5);
  expect(formatCurrency(1234.5, currency)).toBe(expected);
});
```

- [ ] Add consumer assertions that a non-default saved currency appears consistently in each monetary screen while the underlying price, sale, discount, and promotion numbers remain unchanged.
- [ ] Implement `formatCurrency(amount, currency)` and `readBusinessCurrency(storage)` in `src/services/currency.ts`; the latter reads the validated setting and falls back to MXN without writing storage.
- [ ] Replace hard-coded `$` formatting in the listed components with the shared formatter and the currency loaded on component initialization. Do not change calculation inputs, serialized numbers, rounding rules, or sale/stock/appointment behavior.
- [ ] For each page test, seed `webbys:business-settings:v1` with a valid USD setting before mounting, assert the visible amount uses the USD format, and compare the stored numeric prices/sales before and after rendering.
- [ ] Update only existing tests whose expected visible currency format is intentionally changed; retain assertions that source numeric values and totals are unchanged.
- [ ] Run `npm test -- src/services/currency.test.ts src/components/DashboardPanel.test.tsx src/components/ProductsPage.test.tsx src/components/ServicesPage.test.tsx src/components/PromotionsPage.test.tsx src/components/AppointmentForm.test.tsx src/components/SalesPage.test.tsx`.
- [ ] Run `npm run check`; expect zero diagnostics.
- [ ] Commit: `feat(settings): apply selected currency formatting`.

### Task 3: Configuration profile, hours, and preference controls

**Files:** `src/components/BusinessSettingsPanel.tsx`, `src/components/BusinessSettingsPanel.test.tsx`, `src/components/SettingsPage.tsx`, `src/components/SettingsPage.test.tsx`, `src/styles/business-settings.css`.

- [ ] Add failing component tests for editable business name/address/phone/email and administrator display name/email/phone, a visible read-only current logo, currency dropdown defaulting to MXN, and save/reload persistence.
- [ ] Add failing tests for each weekday's `Sin configurar`/`Cerrado`/opening and closing time states, rejecting invalid open intervals, and successful saves not changing generated barber appointment slots.
- [ ] Add failing tests for local category preference toggles persisting across remount and not mutating Agenda bytes, notification history bytes, or device-test state.
- [ ] Add failing integration tests proving existing per-barber schedules/exceptions still load, save, and survive independent business settings updates.
- [ ] Assert the separated write paths explicitly:

```tsx
const agendaBytesBeforeSettingsSave = localStorage.getItem(AGENDA_STORAGE_KEY);
fireEvent.input(screen.getByLabelText('Correo del negocio'), { target: { value: 'tienda@example.test' } });
fireEvent.click(screen.getByRole('button', { name: 'Guardar configuración' }));
expect(localStorage.getItem(BUSINESS_SETTINGS_STORAGE_KEY)).not.toBeNull();
expect(localStorage.getItem(AGENDA_STORAGE_KEY)).toBe(agendaBytesBeforeSettingsSave);
```

- [ ] Implement `BusinessSettingsPanel` using the store and existing form, Dropdown, and token patterns. Show the current logo as read-only; keep general hours explicitly informational and notification preferences labeled as local preferences that do not dispatch notices.
- [ ] Render `BusinessSettingsPanel` in the existing `/configuracion/` view alongside the existing schedule and exception panels. Do not move those panels or change their Agenda-store write path.
- [ ] Run `npm test -- src/components/BusinessSettingsPanel.test.tsx src/components/SettingsPage.test.tsx`.
- [ ] Run `npm run check`; expect zero diagnostics.
- [ ] Commit: `feat(settings): complete business configuration page`.

### Task 4: Full verification and close

**Files:** `odd/tasks/business-settings.md`, this plan, and any focused test fixtures changed by earlier tasks.

- [ ] Run `npm test`, `npm run check`, `npm run build`, and `git diff --check`; record exact results and failures.
- [ ] Verify every requirement in `docs/superpowers/specs/2026-10-16-webbys-business-settings-design.md`, including preserved Agenda storage, all global currency consumers, no conversion, and no notification delivery.
- [ ] If the native RDD switch is enabled, follow the repository's native assessment/status contract for each work-unit commit; never toggle RDD or infer consent.
- [ ] Record the final result and commit identity in `odd/tasks/business-settings.md`; do not push or open a PR without separate authorization.

## Known Decisions and Assumptions

- Existing `SettingsPage` stores barber schedules/exceptions in `webbys:agenda:v1`; business settings must remain separate.
- Initial business name is copied from the current visible identity, `Webby's Barbershop`; optional contact/profile data remains blank until entered.
- Weekdays initially use an explicit `unconfigured` state so no business opening hours are invented.
- Notification-category preferences start disabled until the user explicitly enables them. They are local future-integration preferences, not delivery controls.
- The initial currency is MXN; USD and EUR are the other initial options. Changing currency is presentation-only.
- Monetary displays currently appear in Dashboard, Products, Services, Promotions/target picker, AppointmentForm, and Sales; the shared formatter must cover every listed consumer.

## Verification and Delivery

- Focused store: `npm test -- src/services/business-settings-store.test.ts`.
- Focused currency consumers: the Task 2 command above.
- Focused settings UI: `npm test -- src/components/BusinessSettingsPanel.test.tsx src/components/SettingsPage.test.tsx`.
- Full closure: `npm test && npm run check && npm run build && git diff --check`.
- RDD is user-owned. Read status only when applicable; do not enable, disable, or bypass it as part of this implementation plan.
