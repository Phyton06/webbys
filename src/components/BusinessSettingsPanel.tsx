import { useEffect, useState } from 'preact/hooks';
import {
  BUSINESS_WEEKDAYS,
  NOTIFICATION_PREFERENCE_CATEGORIES,
  type BusinessDayHours,
  type BusinessSettings,
  type BusinessSettingsSection,
  type BusinessWeekday,
  type CurrencyCode,
  type NotificationPreferenceCategory,
} from '../types/business-settings';
import {
  createDefaultBusinessSettings,
  loadBusinessSettings,
  saveBusinessSettingsSection,
  validateBusinessSettings,
} from '../services/business-settings-store';
import { TIME_OPTIONS } from '../services/time-options';
import { sitePath } from '../lib/site-path';
import { Dropdown, type DropdownOption } from './Dropdown';
import '../styles/business-settings.css';

const weekdayLabels: Record<BusinessWeekday, string> = {
  monday: 'lunes',
  tuesday: 'martes',
  wednesday: 'miércoles',
  thursday: 'jueves',
  friday: 'viernes',
  saturday: 'sábado',
  sunday: 'domingo',
};

const currencyOptions: DropdownOption<CurrencyCode>[] = [
  { value: 'MXN', label: 'Peso mexicano (MXN)' },
  { value: 'USD', label: 'Dólar estadounidense (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
];

const dayStatusOptions: DropdownOption<BusinessDayHours['status']>[] = [
  { value: 'unconfigured', label: 'Sin configurar' },
  { value: 'open', label: 'Abierto' },
  { value: 'closed', label: 'Cerrado' },
];

const notificationPreferenceLabels: Record<NotificationPreferenceCategory, string> = {
  product: 'Avisos de productos',
  service: 'Avisos de servicios',
  promotion: 'Avisos de promociones',
  general: 'Avisos generales',
  change: 'Cambios importantes',
};

const sectionTitles: Record<BusinessSettingsSection, string> = {
  business: 'Perfil del negocio',
  administrator: 'Perfil administrativo',
  currency: 'Moneda',
  hours: 'Horario general',
  notificationPreferences: 'Preferencias de notificación',
};

interface BusinessSettingsPanelProps {
  section: BusinessSettingsSection | null;
}

function loadInitialSettings() {
  try {
    return loadBusinessSettings(window.localStorage);
  } catch {
    return { settings: createDefaultBusinessSettings(), status: 'invalid' as const };
  }
}

function hasInvalidOpenHours(hours: BusinessSettings['hours']): boolean {
  return BUSINESS_WEEKDAYS.some((weekday) => {
    const day = hours[weekday];
    return day.status === 'open'
      && (!/^([01]\d|2[0-3]):[0-5]\d$/.test(day.opensAt)
        || !/^([01]\d|2[0-3]):[0-5]\d$/.test(day.closesAt)
        || day.closesAt <= day.opensAt);
  });
}

export function BusinessSettingsPanel({ section }: BusinessSettingsPanelProps) {
  const [initial] = useState(loadInitialSettings);
  const [draft, setDraft] = useState<BusinessSettings>(initial.settings);
  const [baseline, setBaseline] = useState<BusinessSettings>(initial.settings);
  const [storageWarning, setStorageWarning] = useState(initial.status === 'invalid');
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    setError('');
    setAnnouncement('');
  }, [section]);

  function updateDraft(update: (current: BusinessSettings) => BusinessSettings) {
    setDraft(update);
    setError('');
    setAnnouncement('');
  }

  function updateBusiness<K extends keyof BusinessSettings['business']>(key: K, value: BusinessSettings['business'][K]) {
    updateDraft((current) => ({ ...current, business: { ...current.business, [key]: value } }));
  }

  function updateAdministrator<K extends keyof BusinessSettings['administrator']>(key: K, value: BusinessSettings['administrator'][K]) {
    updateDraft((current) => ({ ...current, administrator: { ...current.administrator, [key]: value } }));
  }

  function updateDayStatus(weekday: BusinessWeekday, status: BusinessDayHours['status']) {
    updateDraft((current) => {
      const previous = current.hours[weekday];
      const next: BusinessDayHours = status === 'open'
        ? previous.status === 'open' ? previous : { status: 'open', opensAt: '09:00', closesAt: '18:00' }
        : { status };
      return { ...current, hours: { ...current.hours, [weekday]: next } };
    });
  }

  function updateOpenTime(weekday: BusinessWeekday, key: 'opensAt' | 'closesAt', value: string) {
    updateDraft((current) => {
      const previous = current.hours[weekday];
      if (previous.status !== 'open') return current;
      return { ...current, hours: { ...current.hours, [weekday]: { ...previous, [key]: value } } };
    });
  }

  function updatePreference(category: NotificationPreferenceCategory, enabled: boolean) {
    updateDraft((current) => ({
      ...current,
      notificationPreferences: { ...current.notificationPreferences, [category]: enabled },
    }));
  }

  function updateCurrency(value: CurrencyCode) {
    updateDraft((current) => ({ ...current, currency: value }));
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!section) return;

    if (section === 'hours' && hasInvalidOpenHours(draft.hours)) {
      setError('Revisa las horas de apertura y cierre; el cierre debe ser posterior.');
      setAnnouncement('');
      return;
    }

    let stored: ReturnType<typeof loadBusinessSettings>;
    try {
      stored = loadBusinessSettings(window.localStorage);
    } catch {
      stored = { settings: createDefaultBusinessSettings(), status: 'invalid' as const };
    }

    const merged: BusinessSettings = { ...stored.settings, [section]: draft[section] };
    if (!validateBusinessSettings(merged)) {
      setError('Revisa los datos de configuración antes de guardar.');
      setAnnouncement('');
      return;
    }

    try {
      saveBusinessSettingsSection(window.localStorage, draft, section);
      setBaseline(merged);
      setStorageWarning(false);
      setError('');
      setAnnouncement('Configuración guardada localmente.');
    } catch {
      setError('No se pudo guardar la configuración. Revisa el almacenamiento e inténtalo de nuevo.');
      setAnnouncement('');
    }
  }

  if (!section) return null;

  const sectionDirty = JSON.stringify(draft[section]) !== JSON.stringify(baseline[section]);

  return (
    <section class="business-settings-panel" aria-labelledby="business-settings-title">
      <header class="business-settings-heading">
        <div>
          <h2 id="business-settings-title">{sectionTitles[section]}</h2>
          <p>Los cambios se guardan en este navegador.</p>
        </div>
      </header>
      {storageWarning && <p class="admin-store-warning" role="status">No se pudieron leer los datos de configuración guardados. Revisa el almacenamiento del navegador.</p>}

      <form class="business-settings-form" onSubmit={handleSubmit}>
        <div class="business-settings-section">
          {section === 'business' && (
            <div class="business-profile-layout">
              <div class="business-profile-fields">
                <label class="appointment-form-control">
                  <span>Nombre del negocio</span>
                  <input required aria-label="Nombre del negocio" value={draft.business.name} onInput={(event) => updateBusiness('name', event.currentTarget.value)} />
                </label>
                <label class="appointment-form-control">
                  <span>Dirección</span>
                  <input aria-label="Dirección del negocio" value={draft.business.address} onInput={(event) => updateBusiness('address', event.currentTarget.value)} />
                </label>
                <label class="appointment-form-control">
                  <span>Teléfono</span>
                  <input type="tel" aria-label="Teléfono del negocio" value={draft.business.phone} onInput={(event) => updateBusiness('phone', event.currentTarget.value)} />
                </label>
                <label class="appointment-form-control">
                  <span>Correo electrónico</span>
                  <input type="email" aria-label="Correo del negocio" value={draft.business.email} onInput={(event) => updateBusiness('email', event.currentTarget.value)} />
                </label>
              </div>
              <figure class="business-current-logo">
                <figcaption>Logotipo actual</figcaption>
                <img src={sitePath('/logo.jpeg')} alt="Logotipo actual del negocio" />
              </figure>
            </div>
          )}

          {section === 'administrator' && (
            <div class="business-profile-fields">
              <label class="appointment-form-control">
                <span>Nombre</span>
                <input aria-label="Nombre del administrador" value={draft.administrator.displayName} onInput={(event) => updateAdministrator('displayName', event.currentTarget.value)} />
              </label>
              <label class="appointment-form-control">
                <span>Correo electrónico</span>
                <input type="email" aria-label="Correo del administrador" value={draft.administrator.email} onInput={(event) => updateAdministrator('email', event.currentTarget.value)} />
              </label>
              <label class="appointment-form-control">
                <span>Teléfono</span>
                <input type="tel" aria-label="Teléfono del administrador" value={draft.administrator.phone} onInput={(event) => updateAdministrator('phone', event.currentTarget.value)} />
              </label>
            </div>
          )}

          {section === 'currency' && (
            <>
              <p>El formato se aplica en la aplicación; los importes guardados no se convierten.</p>
              <div class="business-currency-control">
                <span>Moneda de visualización</span>
                <Dropdown label="Moneda" value={draft.currency} options={currencyOptions} onChange={updateCurrency} />
              </div>
            </>
          )}

          {section === 'hours' && (
            <>
              <p>Solo informativo. No cambia la disponibilidad de citas ni los horarios individuales de los barberos.</p>
              <div class="business-hours-grid">
                {BUSINESS_WEEKDAYS.map((weekday) => {
                  const day = draft.hours[weekday];
                  const label = weekdayLabels[weekday];
                  return (
                    <fieldset class="business-hours-day" key={weekday}>
                      <legend>{label}</legend>
                      <div class="business-hours-status">
                        <span>Estado</span>
                        <Dropdown label={`Horario general ${label}`} value={day.status} options={dayStatusOptions} onChange={(status) => updateDayStatus(weekday, status)} />
                      </div>
                      {day.status === 'open' && (
                        <div class="business-hours-times">
                          <div class="business-hours-time">
                            <span>Apertura</span>
                            <Dropdown label={`Apertura del ${label}`} value={day.opensAt} options={TIME_OPTIONS} onChange={(value) => updateOpenTime(weekday, 'opensAt', value)} />
                          </div>
                          <div class="business-hours-time">
                            <span>Cierre</span>
                            <Dropdown label={`Cierre del ${label}`} value={day.closesAt} options={TIME_OPTIONS} onChange={(value) => updateOpenTime(weekday, 'closesAt', value)} />
                          </div>
                        </div>
                      )}
                    </fieldset>
                  );
                })}
              </div>
            </>
          )}

          {section === 'notificationPreferences' && (
            <>
              <p>Se guardan localmente para futuras integraciones. No activan envíos ni modifican la prueba de este dispositivo.</p>
              <div class="business-notification-preferences">
                {NOTIFICATION_PREFERENCE_CATEGORIES.map((category) => (
                  <label class="business-notification-preference" key={category}>
                    <input type="checkbox" checked={draft.notificationPreferences[category]} aria-label={notificationPreferenceLabels[category]} onChange={(event) => updatePreference(category, event.currentTarget.checked)} />
                    <span>{notificationPreferenceLabels[category]}</span>
                  </label>
                ))}
              </div>
              <p class="business-theme-note">Tema actual: oscuro</p>
            </>
          )}
        </div>

        {error && <p class="availability-error" role="alert">{error}</p>}
        <p class="availability-announcement" role="status" aria-live="polite">{announcement}</p>
        <div class="business-settings-actions">
          {sectionDirty && <p class="business-dirty-note">Cambios sin guardar</p>}
          <button class="availability-save-button" type="submit">Guardar cambios</button>
        </div>
      </form>
    </section>
  );
}
