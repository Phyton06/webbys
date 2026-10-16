import { useState } from 'preact/hooks';
import { createAgendaSeed } from '../data/agenda-demo';
import { AGENDA_LOAD_STATUS, type AgendaLoadResult, type AgendaState, type ClientRecord } from '../types/agenda';
import { loadAgendaState, saveAgendaState } from '../services/agenda-store';
import { AdminGate } from './AdminGate';
import { AdminShell } from './AdminShell';
import { AgendaPanel } from './AgendaPanel';
import { BarberAvailabilityPanel } from './BarberAvailabilityPanel';
import { AvailabilityExceptionEditor } from './AvailabilityExceptionEditor';

const AGENDA_PAGE_VIEW = {
  APPOINTMENTS: 'appointments',
  AVAILABILITY: 'availability',
} as const;

function loadInitialAgenda(now: Date): AgendaLoadResult {
  try {
    return loadAgendaState(window.localStorage, now);
  } catch {
    return { state: createAgendaSeed(now), status: AGENDA_LOAD_STATUS.INVALID };
  }
}

export function AgendaPage() {
  const [initial] = useState(() => {
    const now = new Date();
    return { now, agenda: loadInitialAgenda(now) };
  });
  const [state, setState] = useState(initial.agenda.state);
  const [view, setView] = useState<(typeof AGENDA_PAGE_VIEW)[keyof typeof AGENDA_PAGE_VIEW]>(AGENDA_PAGE_VIEW.APPOINTMENTS);
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

  function saveSchedules(schedules: AgendaState['schedules']): boolean {
    return persistState({ ...state, schedules });
  }

  function saveExceptions(exceptions: AgendaState['exceptions']): boolean {
    return persistState({ ...state, exceptions });
  }

  function saveAppointment(appointment: AgendaState['appointments'][number]): boolean {
    const appointments = appointment.id && state.appointments.some(({ id }) => id === appointment.id)
      ? state.appointments.map((existing) => existing.id === appointment.id ? appointment : existing)
      : [...state.appointments, appointment];
    return persistState({ ...state, appointments });
  }

  function saveClient(client: ClientRecord): boolean {
    if (state.clients.some(({ id }) => id === client.id)) return false;
    return persistState({ ...state, clients: [...state.clients, client] });
  }

  return (
    <AdminGate>
      <AdminShell activeSection="Agenda">
        {storageWarning && (
          <p class="admin-store-warning" role="status">
            No se pudieron leer los datos guardados. Revisa el almacenamiento del navegador.
          </p>
        )}
        <div class="agenda-page-switch" role="group" aria-label="Sección de agenda">
          <button
            type="button"
            aria-pressed={view === AGENDA_PAGE_VIEW.APPOINTMENTS}
            onClick={() => setView(AGENDA_PAGE_VIEW.APPOINTMENTS)}
          >
            Citas
          </button>
          <button
            type="button"
            aria-pressed={view === AGENDA_PAGE_VIEW.AVAILABILITY}
            onClick={() => setView(AGENDA_PAGE_VIEW.AVAILABILITY)}
          >
            Disponibilidad
          </button>
        </div>
        <div hidden={view !== AGENDA_PAGE_VIEW.APPOINTMENTS}>
          <AgendaPanel state={state} now={initial.now} onAppointmentSave={saveAppointment} onClientSave={saveClient} />
        </div>
        <div class="agenda-availability-page" hidden={view !== AGENDA_PAGE_VIEW.AVAILABILITY}>
          <BarberAvailabilityPanel barbers={state.barbers} schedules={state.schedules} onSave={saveSchedules} />
          <AvailabilityExceptionEditor barbers={state.barbers} exceptions={state.exceptions} onSave={saveExceptions} />
        </div>
      </AdminShell>
    </AdminGate>
  );
}
