import { useState } from 'preact/hooks';
import { createAgendaSeed } from '../data/agenda-demo';
import { AGENDA_LOAD_STATUS, type AgendaLoadResult, type AgendaState } from '../types/agenda';
import { loadAgendaState, saveAgendaState } from '../services/agenda-store';
import { AdminGate } from './AdminGate';
import { AdminShell } from './AdminShell';
import { BarberAvailabilityPanel } from './BarberAvailabilityPanel';
import { AvailabilityExceptionEditor } from './AvailabilityExceptionEditor';
import { BusinessSettingsPanel } from './BusinessSettingsPanel';

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
          <BusinessSettingsPanel />
          <BarberAvailabilityPanel
            barbers={state.barbers}
            schedules={state.schedules}
            onSave={(schedules) => persistState({ ...state, schedules })}
          />
          <AvailabilityExceptionEditor
            barbers={state.barbers}
            exceptions={state.exceptions}
            onSave={(exceptions) => persistState({ ...state, exceptions })}
          />
        </section>
      </AdminShell>
    </AdminGate>
  );
}
