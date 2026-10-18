import { useState } from 'preact/hooks';
import { createAgendaSeed } from '../data/agenda-demo';
import { createDemoData } from '../data/demo';
import { AGENDA_LOAD_STATUS, type AgendaLoadResult } from '../types/agenda';
import { loadAgendaState } from '../services/agenda-store';
import { AdminGate } from './AdminGate';
import { AdminShell } from './AdminShell';
import { DashboardPanel } from './DashboardPanel';

function loadInitialAgenda(now: Date): AgendaLoadResult {
  try {
    return loadAgendaState(window.localStorage, now);
  } catch {
    return { state: createAgendaSeed(now), status: AGENDA_LOAD_STATUS.INVALID };
  }
}

export function AdminPage() {
  const [initial] = useState(() => {
    const now = new Date();
    return { now, agenda: loadInitialAgenda(now) };
  });
  const data = {
    ...createDemoData(initial.now),
    sales: initial.agenda.state.sales ?? createDemoData(initial.now).sales,
    appointments: initial.agenda.state.appointments,
  };

  return (
    <AdminGate>
      <AdminShell>
        {initial.agenda.status === AGENDA_LOAD_STATUS.INVALID && (
          <p class="admin-store-warning" role="status">
            No se pudieron leer los datos guardados. Revisa el almacenamiento del navegador.
          </p>
        )}
        <DashboardPanel data={data} now={initial.now} />
      </AdminShell>
    </AdminGate>
  );
}
