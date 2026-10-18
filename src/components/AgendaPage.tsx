import { useState } from 'preact/hooks';
import { createAgendaSeed } from '../data/agenda-demo';
import { AGENDA_LOAD_STATUS, type AgendaLoadResult, type AgendaState, type ClientRecord } from '../types/agenda';
import { loadAgendaState, saveAgendaState } from '../services/agenda-store';
import { AdminGate } from './AdminGate';
import { RoleShell } from './RoleShell';
import { AgendaPanel } from './AgendaPanel';

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
  const [storageWarning, setStorageWarning] = useState(initial.agenda.status === AGENDA_LOAD_STATUS.INVALID);
  const [initialClientId] = useState(() => {
    try {
      const clientId = new URLSearchParams(window.location.search).get('clientId') ?? undefined;
      return clientId && initial.agenda.state.clients.some(({ id }) => id === clientId) ? clientId : undefined;
    } catch {
      return undefined;
    }
  });

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
    <AdminGate role="any">
      <RoleShell activeSection="Agenda">
        {storageWarning && (
          <p class="admin-store-warning" role="status">
            No se pudieron leer los datos guardados. Revisa el almacenamiento del navegador.
          </p>
        )}
        <AgendaPanel state={state} now={initial.now} initialClientId={initialClientId} onAppointmentSave={saveAppointment} onClientSave={saveClient} />
      </RoleShell>
    </AdminGate>
  );
}
