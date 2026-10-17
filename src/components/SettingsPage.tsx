import { useState } from 'preact/hooks';
import { createAgendaSeed } from '../data/agenda-demo';
import { AGENDA_LOAD_STATUS, type AgendaLoadResult, type AgendaState } from '../types/agenda';
import type { BusinessSettingsSection, SettingsCategory } from '../types/business-settings';
import { loadAgendaState, saveAgendaState } from '../services/agenda-store';
import { AdminGate } from './AdminGate';
import { AdminShell } from './AdminShell';
import { BarberAvailabilityPanel } from './BarberAvailabilityPanel';
import { AvailabilityExceptionEditor } from './AvailabilityExceptionEditor';
import { BusinessSettingsPanel } from './BusinessSettingsPanel';
import '../styles/business-settings.css';

const CATEGORY_ORDER: SettingsCategory[] = [
  'business',
  'administrator',
  'currency',
  'hours',
  'notificationPreferences',
  'barber-schedules',
  'date-exceptions',
];

const categoryLabels: Record<SettingsCategory, string> = {
  business: 'Perfil del negocio',
  administrator: 'Perfil administrativo',
  currency: 'Moneda',
  hours: 'Horario general',
  notificationPreferences: 'Preferencias de notificación',
  'barber-schedules': 'Horarios del equipo',
  'date-exceptions': 'Excepciones por fecha',
};

function isBusinessSection(category: SettingsCategory): category is BusinessSettingsSection {
  return category !== 'barber-schedules' && category !== 'date-exceptions';
}

function loadInitialAgenda(now: Date): AgendaLoadResult {
  try {
    return loadAgendaState(window.localStorage, now);
  } catch {
    return { state: createAgendaSeed(now), status: AGENDA_LOAD_STATUS.INVALID };
  }
}

export function SettingsPage() {
  const [initial] = useState(() => {
    const now = new Date();
    return { now, agenda: loadInitialAgenda(now) };
  });
  const [state, setState] = useState(initial.agenda.state);
  const [storageWarning, setStorageWarning] = useState(initial.agenda.status === AGENDA_LOAD_STATUS.INVALID);
  const [category, setCategory] = useState<SettingsCategory>('business');

  function persistState(next: AgendaState): boolean {
    try {
      saveAgendaState(window.localStorage, next);
      setState(next);
      setStorageWarning(false);
      return true;
    } catch {
      return false;
    }
  }

  return (
    <AdminGate>
      <AdminShell activeSection="Configuración">
        {storageWarning && <p class="admin-store-warning" role="status">No se pudieron leer los datos guardados. Revisa el almacenamiento del navegador.</p>}
        <section class="settings-page" aria-labelledby="settings-title">
          <header class="agenda-heading">
            <div>
              <h1 id="settings-title">Configuración</h1>
              <p>Administra la información del negocio, preferencias y horarios.</p>
            </div>
          </header>
          <div class="settings-categories">
            <nav class="settings-category-nav" aria-label="Categorías de configuración">
              {CATEGORY_ORDER.map((option) => (
                <button
                  key={option}
                  type="button"
                  class={`settings-category-button${option === category ? ' is-active' : ''}`}
                  aria-current={option === category ? 'page' : undefined}
                  onClick={() => setCategory(option)}
                >
                  {categoryLabels[option]}
                </button>
              ))}
            </nav>
            <div class="settings-category-content">
              <div hidden={category !== 'barber-schedules'}>
                <BarberAvailabilityPanel
                  barbers={state.barbers}
                  schedules={state.schedules}
                  onSave={(schedules) => persistState({ ...state, schedules })}
                />
              </div>
              <div hidden={category !== 'date-exceptions'}>
                <AvailabilityExceptionEditor
                  barbers={state.barbers}
                  exceptions={state.exceptions}
                  onSave={(exceptions) => persistState({ ...state, exceptions })}
                />
              </div>
              <BusinessSettingsPanel section={isBusinessSection(category) ? category : null} />
            </div>
          </div>
        </section>
      </AdminShell>
    </AdminGate>
  );
}
