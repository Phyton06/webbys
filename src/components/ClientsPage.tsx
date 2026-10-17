import { useMemo, useState } from 'preact/hooks';
import { createAgendaSeed } from '../data/agenda-demo';
import { AGENDA_LOAD_STATUS, type AgendaLoadResult, type AgendaState, type ClientRecord } from '../types/agenda';
import type { AppointmentRecord, AppointmentStatus } from '../types/domain';
import { loadAgendaState, saveAgendaState } from '../services/agenda-store';
import { AdminGate } from './AdminGate';
import { AdminShell } from './AdminShell';
import { BackLink } from './BackLink';
import { ClientForm } from './ClientForm';
import { Dropdown } from './Dropdown';
import '../styles/clients.css';

const clientStatusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
];

const clientSortOptions = [
  { value: 'name-asc', label: 'Nombre A-Z' },
  { value: 'name-desc', label: 'Nombre Z-A' },
];

const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

type ClientStatusFilter = 'all' | 'active' | 'inactive';
type ClientSort = 'name-asc' | 'name-desc';

function loadInitialAgenda(now: Date): AgendaLoadResult {
  try {
    return loadAgendaState(window.localStorage, now);
  } catch {
    return { state: createAgendaSeed(now), status: AGENDA_LOAD_STATUS.INVALID };
  }
}

function isActive(client: ClientRecord): boolean {
  return client.active !== false;
}

function formatAppointmentDate(value: string): string {
  return new Intl.DateTimeFormat('es', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

function sortAppointments(appointments: AppointmentRecord[]): AppointmentRecord[] {
  return [...appointments].sort((first, second) => first.startsAt.localeCompare(second.startsAt));
}

export function ClientsPage() {
  const [initial] = useState(() => {
    const now = new Date();
    return { now, agenda: loadInitialAgenda(now) };
  });
  const [state, setState] = useState(initial.agenda.state);
  const [storageWarning, setStorageWarning] = useState(initial.agenda.status === AGENDA_LOAD_STATUS.INVALID);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>('all');
  const [sort, setSort] = useState<ClientSort>('name-asc');
  const [selectedClientId, setSelectedClientId] = useState<string>();
  const [editingClient, setEditingClient] = useState<ClientRecord>();
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDeactivationId, setPendingDeactivationId] = useState<string>();
  const [announcement, setAnnouncement] = useState('');
  const [announcementIsError, setAnnouncementIsError] = useState(false);

  const selectedClient = state.clients.find(({ id }) => id === selectedClientId);
  const visibleClients = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es');
    const filtered = state.clients
      .filter((client) => statusFilter === 'all'
        || (statusFilter === 'active' ? isActive(client) : !isActive(client)))
      .filter(({ name, phone, email }) => (
        !normalizedQuery
        || name.toLocaleLowerCase('es').includes(normalizedQuery)
        || phone?.toLocaleLowerCase('es').includes(normalizedQuery)
        || email?.toLocaleLowerCase('es').includes(normalizedQuery)
      ));
    const direction = sort === 'name-asc' ? 1 : -1;
    return filtered.sort((first, second) => direction * first.name.localeCompare(second.name, 'es', { sensitivity: 'base' })
      || first.id.localeCompare(second.id));
  }, [query, sort, state.clients, statusFilter]);

  function persistState(next: AgendaState): boolean {
    try {
      saveAgendaState(window.localStorage, next);
      setState(next);
      setStorageWarning(false);
      return true;
    } catch {
      setStorageWarning(true);
      return false;
    }
  }

  function beginCreate() {
    setEditingClient(undefined);
    setFormOpen(true);
    setAnnouncement('');
    setAnnouncementIsError(false);
  }

  function beginEdit(client: ClientRecord) {
    setEditingClient(client);
    setFormOpen(true);
    setAnnouncement('');
    setAnnouncementIsError(false);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingClient(undefined);
  }

  function setClientActive(client: ClientRecord, active: boolean) {
    const nextClients = state.clients.map((current) => current.id === client.id
      ? { ...current, active }
      : current);
    if (!persistState({ ...state, clients: nextClients })) {
      setAnnouncement(active
        ? 'No se pudo reactivar el cliente. Revisa el almacenamiento e inténtalo de nuevo.'
        : 'No se pudo desactivar el cliente. Revisa el almacenamiento e inténtalo de nuevo.');
      setAnnouncementIsError(true);
      return;
    }
    setPendingDeactivationId(undefined);
    setAnnouncement(active ? 'Cliente reactivado.' : 'Cliente desactivado.');
    setAnnouncementIsError(false);
  }

  function renderClientRow(client: ClientRecord) {
    const active = isActive(client);
    const pending = pendingDeactivationId === client.id;
    const appointmentCount = state.appointments.filter(({ clientId }) => clientId === client.id).length;
    return (
      <li class="client-list-item" key={client.id}>
        <article class="client-row" aria-label={`Cliente ${client.name}`}>
          <div class="client-row-identity">
            <strong>{client.name}</strong>
            <span>{client.phone || 'Sin teléfono'}</span>
            {client.email && <span>{client.email}</span>}
          </div>
          <span class={`client-status${active ? ' is-active' : ' is-inactive'}`}>{active ? 'Activo' : 'Inactivo'}</span>
          <span class="client-appointment-count">{appointmentCount} {appointmentCount === 1 ? 'cita' : 'citas'}</span>
          <div class="client-row-actions">
            <button class="client-text-action" type="button" aria-label={`Ver perfil de ${client.name}`} onClick={() => { setSelectedClientId(client.id); setAnnouncement(''); }}>
              Ver perfil
            </button>
            <button class="client-text-action" type="button" aria-label={`Editar cliente ${client.name}`} onClick={() => beginEdit(client)}>
              Editar
            </button>
            <button class="client-text-action" type="button" aria-label={`${active ? 'Desactivar' : 'Reactivar'} cliente ${client.name}`} onClick={() => active ? setPendingDeactivationId(client.id) : setClientActive(client, true)}>
              {active ? 'Desactivar' : 'Reactivar'}
            </button>
          </div>
        </article>
        {pending && (
          <section class="client-deactivation-confirmation" role="alertdialog" aria-label={`Confirmar desactivación de ${client.name}`}>
            <p>¿Desactivar a {client.name}? Se conservará su historial de citas.</p>
            <div>
              <button type="button" class="availability-save-button" onClick={() => setClientActive(client, false)}>Confirmar desactivación</button>
              <button type="button" class="appointment-form-cancel" onClick={() => setPendingDeactivationId(undefined)}>Cancelar</button>
            </div>
          </section>
        )}
      </li>
    );
  }

  function renderProfile(client: ClientRecord) {
    const appointments = sortAppointments(state.appointments.filter(({ clientId }) => clientId === client.id));
    return (
      <section class="client-profile" aria-labelledby="client-profile-title">
        <header class="agenda-heading client-profile-heading">
          <div class="client-profile-title-row">
            <div class="view-title-row">
              <BackLink ariaLabel="Volver a Clientes" onClick={() => setSelectedClientId(undefined)} />
              <div>
                <h1 id="client-profile-title">{client.name}</h1>
                <p class={`client-status${isActive(client) ? ' is-active' : ' is-inactive'}`}>{isActive(client) ? 'Cliente activo' : 'Cliente inactivo'}</p>
              </div>
            </div>
            <div class="client-profile-actions">
              <button class="appointment-form-cancel" type="button" onClick={() => beginEdit(client)}>Editar cliente</button>
              <button class="client-text-action" type="button" onClick={() => isActive(client) ? setPendingDeactivationId(client.id) : setClientActive(client, true)}>
                {isActive(client) ? 'Desactivar cliente' : 'Reactivar cliente'}
              </button>
            </div>
          </div>
        </header>

        {pendingDeactivationId === client.id && (
          <section class="client-deactivation-confirmation" role="alertdialog" aria-label={`Confirmar desactivación de ${client.name}`}>
            <p>¿Desactivar a {client.name}? Se conservará su historial de citas.</p>
            <div>
              <button type="button" class="availability-save-button" onClick={() => setClientActive(client, false)}>Confirmar desactivación</button>
              <button type="button" class="appointment-form-cancel" onClick={() => setPendingDeactivationId(undefined)}>Cancelar</button>
            </div>
          </section>
        )}

        <section class="client-profile-contact" aria-labelledby="client-contact-title">
          <h2 id="client-contact-title">Datos de contacto</h2>
          <dl>
            <div><dt>Teléfono</dt><dd>{client.phone || 'Sin teléfono'}</dd></div>
            <div><dt>Correo electrónico</dt><dd>{client.email || 'Sin correo electrónico'}</dd></div>
          </dl>
        </section>

        <section class="client-history-section" aria-label="Historial de citas">
          <header><h2>Historial de citas</h2><span>{appointments.length}</span></header>
          {appointments.length > 0 ? (
            <ol class="client-appointment-history">
              {appointments.map((appointment) => (
                <li key={appointment.id}>
                  <time dateTime={appointment.startsAt}>{formatAppointmentDate(appointment.startsAt)}</time>
                  <span>{appointment.serviceName} · {appointment.barberName}</span>
                  <span class={`client-history-status status-${appointment.status}`}>{appointmentStatusLabels[appointment.status]}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p class="agenda-empty">Este cliente aún no tiene citas.</p>
          )}
        </section>

        <section class="client-history-section" aria-label="Historial de compras">
          <header><h2>Historial de compras</h2></header>
          <p class="agenda-empty">Las ventas aún no están vinculadas a clientes.</p>
        </section>
      </section>
    );
  }

  function handleCreateEdit(client: ClientRecord): boolean {
    const current = state.clients.find(({ id }) => id === client.id);
    const nextClients = current
      ? state.clients.map((entry) => entry.id === client.id ? client : entry)
      : [...state.clients, client];
    if (!persistState({ ...state, clients: nextClients })) return false;
    setAnnouncement(current ? 'Cambios del cliente guardados.' : 'Cliente agregado.');
    setAnnouncementIsError(false);
    if (!current) setSelectedClientId(client.id);
    return true;
  }

  return (
    <AdminGate>
      <AdminShell activeSection="Clientes">
        <section class="clients-page" aria-labelledby="clients-title">
          {storageWarning && <p class="admin-store-warning" role="status">No se pudieron leer los datos guardados. Revisa el almacenamiento del navegador.</p>}
          {!selectedClient && (
            <header class="agenda-heading clients-page-heading">
              <div>
                <h1 id="clients-title">Clientes</h1>
                <p>Consulta y administra los datos de contacto y el historial de tus clientes.</p>
              </div>
              <button class="availability-save-button" type="button" onClick={beginCreate}>Nuevo cliente</button>
            </header>
          )}

          {selectedClient ? renderProfile(selectedClient) : (
            <>
              <div class="clients-toolbar">
                <label class="appointment-form-control clients-search-control">
                  <span>Buscar</span>
                  <input type="search" aria-label="Buscar clientes" placeholder="Nombre, teléfono o correo" value={query} onInput={(event) => setQuery((event.currentTarget as HTMLInputElement).value)} />
                </label>
                <div class="clients-filter-control">
                  <span>Estado</span>
                  <Dropdown label="Estado" value={statusFilter} options={clientStatusOptions} onChange={(value) => setStatusFilter(value as ClientStatusFilter)} />
                </div>
                <div class="clients-filter-control">
                  <span>Ordenar</span>
                  <Dropdown label="Orden" value={sort} options={clientSortOptions} onChange={(value) => setSort(value as ClientSort)} />
                </div>
              </div>
              <p class="clients-result-count" role="status">{visibleClients.length} {visibleClients.length === 1 ? 'cliente' : 'clientes'}</p>
              {visibleClients.length > 0 ? (
                <ul class="client-list" aria-label="Lista de clientes">
                  {visibleClients.map(renderClientRow)}
                </ul>
              ) : (
                <p class="agenda-empty clients-empty-state">{state.clients.length === 0 ? 'Aún no hay clientes registrados.' : 'No hay clientes que coincidan con estos filtros.'}</p>
              )}
            </>
          )}

          {announcement && <p class={announcementIsError ? 'availability-error' : 'availability-announcement'} role={announcementIsError ? 'alert' : 'status'} aria-live={announcementIsError ? 'assertive' : 'polite'}>{announcement}</p>}
        </section>
          {formOpen && <ClientForm client={editingClient} onSave={handleCreateEdit} onCancel={closeForm} />}
      </AdminShell>
    </AdminGate>
  );
}
