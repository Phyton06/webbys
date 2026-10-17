import { useState } from 'preact/hooks';
import {
  BUSINESS_WEEKDAYS,
  NOTIFICATION_PREFERENCE_CATEGORIES,
  type BusinessDayHours,
  type BusinessSettings,
  type BusinessWeekday,
  type CurrencyCode,
  type NotificationPreferenceCategory,
} from '../types/business-settings';
import { loadBusinessSettings, saveBusinessSettings, validateBusinessSettings } from '../services/business-settings-store';
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

function loadInitialSettings() {
  try {
    return loadBusinessSettings(window.localStorage);
  } catch {
    return { settings: undefined, status: 'invalid' as const };
  }
}

export function BusinessSettingsPanel() {
  const [initial] = useState(loadInitialSettings);
  const [settings, setSettings] = useState<BusinessSettings>(initial.settings ?? {
    business: { name: "Webby's Barbershop", address: '', phone: '', email: '' },
    administrator: { displayName: '', email: '', phone: '' },
    hours: Object.fromEntries(BUSINESS_WEEKDAYS.map((weekday) => [weekday, { status: 'unconfigured' }])) as BusinessSettings['hours'],
    currency: 'MXN',
    notificationPreferences: { product: false, service: false, promotion: false, general: false, change: false },
  });
  const [storageWarning, setStorageWarning] = useState(initial.status === 'invalid');
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');

  function updateBusiness<K extends keyof BusinessSettings['business']>(key: K, value: BusinessSettings['business'][K]) {
    setSettings((current) => ({ ...current, business: { ...current.business, [key]: value } }));
    setError('');
    setAnnouncement('');
  }

  function updateAdministrator<K extends keyof BusinessSettings['administrator']>(key: K, value: BusinessSettings['administrator'][K]) {
    setSettings((current) => ({ ...current, administrator: { ...current.administrator, [key]: value } }));
    setError('');
    setAnnouncement('');
  }

  function updateDayStatus(weekday: BusinessWeekday, status: BusinessDayHours['status']) {
    setSettings((current) => {
      const previous = current.hours[weekday];
      const next: BusinessDayHours = status === 'open'
        ? previous.status === 'open' ? previous : { status: 'open', opensAt: '', closesAt: '' }
        : { status };
      return { ...current, hours: { ...current.hours, [weekday]: next } };
    });
    setError('');
    setAnnouncement('');
  }

  function updateOpenTime(weekday: BusinessWeekday, key: 'opensAt' | 'closesAt', value: string) {
    setSettings((current) => {
      const previous = current.hours[weekday];
      if (previous.status !== 'open') return current;
      return { ...current, hours: { ...current.hours, [weekday]: { ...previous, [key]: value } } };
    });
    setError('');
    setAnnouncement('');
  }

  function updatePreference(category: NotificationPreferenceCategory, enabled: boolean) {
    setSettings((current) => ({
      ...current,
      notificationPreferences: { ...current.notificationPreferences, [category]: enabled },
    }));
    setError('');
    setAnnouncement('');
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const hasInvalidOpenHours = BUSINESS_WEEKDAYS.some((weekday) => {
      const day = settings.hours[weekday];
      return day.status === 'open'
        && (!/^([01]\d|2[0-3]):[0-5]\d$/.test(day.opensAt)
          || !/^([01]\d|2[0-3]):[0-5]\d$/.test(day.closesAt)
          || day.closesAt <= day.opensAt);
    });
    if (hasInvalidOpenHours) {
      setError('Revisa las horas de apertura y cierre; el cierre debe ser posterior.');
      setAnnouncement('');
      return;
    }
    if (!validateBusinessSettings(settings)) {
      setError('Revisa los datos de configuración antes de guardar.');
      setAnnouncement('');
      return;
    }

    try {
      saveBusinessSettings(window.localStorage, settings);
      setStorageWarning(false);
      setError('');
      setAnnouncement('Configuración guardada localmente.');
    } catch {
      setError('No se pudo guardar la configuración. Revisa el almacenamiento e inténtalo de nuevo.');
      setAnnouncement('');
    }
  }

  return (
    <section class="business-settings-panel" aria-labelledby="business-settings-title">
      <header class="business-settings-heading">
        <div>
          <h2 id="business-settings-title">Datos del negocio y perfil</h2>
          <p>Los cambios se guardan en este navegador.</p>
        </div>
      </header>
      {storageWarning && <p class="admin-store-warning" role="status">No se pudieron leer los datos de configuración guardados. Revisa el almacenamiento del navegador.</p>}

      <form class="business-settings-form" onSubmit={handleSubmit}>
        <section class="business-settings-section" aria-labelledby="business-profile-title">
          <h3 id="business-profile-title">Perfil del negocio</h3>
          <div class="business-profile-layout">
            <div class="business-profile-fields">
              <label class="appointment-form-control">
                <span>Nombre del negocio</span>
                <input required aria-label="Nombre del negocio" value={settings.business.name} onInput={(event) => updateBusiness('name', event.currentTarget.value)} />
              </label>
              <label class="appointment-form-control">
                <span>Dirección</span>
                <input aria-label="Dirección del negocio" value={settings.business.address} onInput={(event) => updateBusiness('address', event.currentTarget.value)} />
              </label>
              <label class="appointment-form-control">
                <span>Teléfono</span>
                <input type="tel" aria-label="Teléfono del negocio" value={settings.business.phone} onInput={(event) => updateBusiness('phone', event.currentTarget.value)} />
              </label>
              <label class="appointment-form-control">
                <span>Correo electrónico</span>
                <input type="email" aria-label="Correo del negocio" value={settings.business.email} onInput={(event) => updateBusiness('email', event.currentTarget.value)} />
              </label>
            </div>
            <figure class="business-current-logo">
              <figcaption>Logotipo actual</figcaption>
              <img src="/logo.jpeg" alt="Logotipo actual del negocio" />
            </figure>
          </div>
        </section>

        <section class="business-settings-section" aria-labelledby="administrator-profile-title">
          <h3 id="administrator-profile-title">Perfil administrativo</h3>
          <div class="business-profile-fields">
            <label class="appointment-form-control">
              <span>Nombre</span>
              <input aria-label="Nombre del administrador" value={settings.administrator.displayName} onInput={(event) => updateAdministrator('displayName', event.currentTarget.value)} />
            </label>
            <label class="appointment-form-control">
              <span>Correo electrónico</span>
              <input type="email" aria-label="Correo del administrador" value={settings.administrator.email} onInput={(event) => updateAdministrator('email', event.currentTarget.value)} />
            </label>
            <label class="appointment-form-control">
              <span>Teléfono</span>
              <input type="tel" aria-label="Teléfono del administrador" value={settings.administrator.phone} onInput={(event) => updateAdministrator('phone', event.currentTarget.value)} />
            </label>
          </div>
        </section>

        <section class="business-settings-section" aria-labelledby="currency-title">
          <h3 id="currency-title">Moneda</h3>
          <p>El formato se aplica en la aplicación; los importes guardados no se convierten.</p>
          <div class="business-currency-control">
            <span>Moneda de visualización</span>
            <Dropdown label="Moneda" value={settings.currency} options={currencyOptions} onChange={(value) => { setSettings((current) => ({ ...current, currency: value })); setAnnouncement(''); }} />
          </div>
        </section>

        <section class="business-settings-section" aria-labelledby="business-hours-title">
          <h3 id="business-hours-title">Horario general del establecimiento</h3>
          <p>Solo informativo. No cambia la disponibilidad de citas ni los horarios individuales de los barberos.</p>
          <div class="business-hours-grid">
            {BUSINESS_WEEKDAYS.map((weekday) => {
              const day = settings.hours[weekday];
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
                      <label>
                        <span>Apertura</span>
                        <input type="time" required aria-label={`Apertura del ${label}`} value={day.opensAt} onInput={(event) => updateOpenTime(weekday, 'opensAt', event.currentTarget.value)} />
                      </label>
                      <label>
                        <span>Cierre</span>
                        <input type="time" required aria-label={`Cierre del ${label}`} value={day.closesAt} onInput={(event) => updateOpenTime(weekday, 'closesAt', event.currentTarget.value)} />
                      </label>
                    </div>
                  )}
                </fieldset>
              );
            })}
          </div>
        </section>

        <section class="business-settings-section" aria-labelledby="notification-preferences-title">
          <h3 id="notification-preferences-title">Preferencias de notificación</h3>
          <p>Se guardan localmente para futuras integraciones. No activan envíos ni modifican la prueba de este dispositivo.</p>
          <div class="business-notification-preferences">
            {NOTIFICATION_PREFERENCE_CATEGORIES.map((category) => (
              <label class="business-notification-preference" key={category}>
                <input type="checkbox" checked={settings.notificationPreferences[category]} aria-label={notificationPreferenceLabels[category]} onChange={(event) => updatePreference(category, event.currentTarget.checked)} />
                <span>{notificationPreferenceLabels[category]}</span>
              </label>
            ))}
          </div>
          <p class="business-theme-note">Tema actual: oscuro</p>
        </section>

        {error && <p class="availability-error" role="alert">{error}</p>}
        <p class="availability-announcement" role="status" aria-live="polite">{announcement}</p>
        <div class="business-settings-actions">
          <button class="availability-save-button" type="submit">Guardar configuración</button>
        </div>
      </form>
    </section>
  );
}
