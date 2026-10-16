import { useMemo, useState } from 'preact/hooks';
import {
  AGENDA_LOAD_STATUS,
  EMPLOYEE_INVITATION_STATUS,
  EMPLOYEE_ROLE,
  type AgendaLoadResult,
  type AgendaState,
  type EmployeeRecord,
} from '../types/agenda';
import type { AppointmentRecord, AppointmentStatus } from '../types/domain';
import { createAgendaSeed } from '../data/agenda-demo';
import { loadAgendaState, saveAgendaState } from '../services/agenda-store';
import { canDeactivateEmployee, normalizeEmployees, syncBarberProjection } from '../services/employees';
import { AdminGate } from './AdminGate';
import { AdminShell } from './AdminShell';
import { Dropdown } from './Dropdown';
import { EmployeeForm } from './EmployeeForm';
import '../styles/employees.css';

const EMPLOYEE_FILTER = {
  ALL: 'all',
  ADMINISTRATOR: 'administrator',
  BARBER: 'barber',
  ASSISTANT: 'assistant',
} as const;

const EMPLOYEE_STATUS_FILTER = {
  ALL: 'all',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

const EMPLOYEE_SORT = {
  NAME_ASC: 'name-asc',
  NAME_DESC: 'name-desc',
} as const;

const employeeRoleLabels: Record<EmployeeRecord['role'], string> = {
  [EMPLOYEE_ROLE.ADMINISTRATOR]: 'Administrador',
  [EMPLOYEE_ROLE.BARBER]: 'Barbero',
  [EMPLOYEE_ROLE.ASSISTANT]: 'Asistente',
};

const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const roleFilterOptions = [
  { value: EMPLOYEE_FILTER.ALL, label: 'Todos' },
  { value: EMPLOYEE_FILTER.ADMINISTRATOR, label: 'Administradores' },
  { value: EMPLOYEE_FILTER.BARBER, label: 'Barberos' },
  { value: EMPLOYEE_FILTER.ASSISTANT, label: 'Asistentes' },
];

const statusFilterOptions = [
  { value: EMPLOYEE_STATUS_FILTER.ALL, label: 'Todos' },
  { value: EMPLOYEE_STATUS_FILTER.ACTIVE, label: 'Activos' },
  { value: EMPLOYEE_STATUS_FILTER.INACTIVE, label: 'Inactivos' },
];

const sortOptions = [
  { value: EMPLOYEE_SORT.NAME_ASC, label: 'Nombre A-Z' },
  { value: EMPLOYEE_SORT.NAME_DESC, label: 'Nombre Z-A' },
];

const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

type EmployeeFilter = (typeof EMPLOYEE_FILTER)[keyof typeof EMPLOYEE_FILTER];
type EmployeeStatusFilter = (typeof EMPLOYEE_STATUS_FILTER)[keyof typeof EMPLOYEE_STATUS_FILTER];
type EmployeeSort = (typeof EMPLOYEE_SORT)[keyof typeof EMPLOYEE_SORT];

interface EmployeesPageProps {
  now?: Date;
}

function loadInitialAgenda(now: Date): AgendaLoadResult {
  try {
    return loadAgendaState(window.localStorage, now);
  } catch {
    return { state: createAgendaSeed(now), status: AGENDA_LOAD_STATUS.INVALID };
  }
}

function isEmployeeActive(employee: EmployeeRecord): boolean {
  return employee.active;
}

function isLastActiveAdministrator(employee: EmployeeRecord, employees: EmployeeRecord[]): boolean {
  return employee.active
    && employee.role === EMPLOYEE_ROLE.ADMINISTRATOR
    && !canDeactivateEmployee(employee.id, employees);
}

function formatAppointmentDate(value: string): string {
  return new Intl.DateTimeFormat('es', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

function sortAppointments(appointments: AppointmentRecord[]): AppointmentRecord[] {
  return [...appointments].sort((first, second) => first.startsAt.localeCompare(second.startsAt));
}

export function EmployeesPage({ now = new Date() }: EmployeesPageProps) {
  const [initial] = useState(() => ({ now, agenda: loadInitialAgenda(now) }));
  const [state, setState] = useState(initial.agenda.state);
  const [storageWarning, setStorageWarning] = useState(initial.agenda.status === AGENDA_LOAD_STATUS.INVALID);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<EmployeeFilter>(EMPLOYEE_FILTER.ALL);
  const [statusFilter, setStatusFilter] = useState<EmployeeStatusFilter>(EMPLOYEE_STATUS_FILTER.ALL);
  const [sort, setSort] = useState<EmployeeSort>(EMPLOYEE_SORT.NAME_ASC);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>();
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord>();
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDeactivationId, setPendingDeactivationId] = useState<string>();
  const [announcement, setAnnouncement] = useState('');
  const [announcementIsError, setAnnouncementIsError] = useState(false);

  const employees = state.employees ?? normalizeEmployees(undefined, state.barbers);
  const selectedEmployee = employees.find(({ id }) => id === selectedEmployeeId);
  const visibleEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es');
    const filtered = employees
      .filter((employee) => roleFilter === EMPLOYEE_FILTER.ALL || employee.role === roleFilter)
      .filter((employee) => statusFilter === EMPLOYEE_STATUS_FILTER.ALL
        || (statusFilter === EMPLOYEE_STATUS_FILTER.ACTIVE ? isEmployeeActive(employee) : !isEmployeeActive(employee)))
      .filter(({ name, phone }) => (
        !normalizedQuery
        || name.toLocaleLowerCase('es').includes(normalizedQuery)
        || phone.toLocaleLowerCase('es').includes(normalizedQuery)
      ));
    const direction = sort === EMPLOYEE_SORT.NAME_ASC ? 1 : -1;
    return filtered.sort((first, second) => direction * first.name.localeCompare(second.name, 'es', { sensitivity: 'base' })
      || first.id.localeCompare(second.id));
  }, [employees, query, roleFilter, sort, statusFilter]);

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
    setEditingEmployee(undefined);
    setFormOpen(true);
    setAnnouncement('');
    setAnnouncementIsError(false);
  }

  function beginEdit(employee: EmployeeRecord) {
    setEditingEmployee(employee);
    setFormOpen(true);
    setAnnouncement('');
    setAnnouncementIsError(false);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingEmployee(undefined);
  }

  function setEmployeeActive(employee: EmployeeRecord, active: boolean) {
    if (!active && !canDeactivateEmployee(employee.id, employees)) {
      setAnnouncement('Debe permanecer al menos un administrador activo.');
      setAnnouncementIsError(true);
      return;
    }
    const nextEmployees = employees.map((current) => current.id === employee.id ? { ...current, active } : current);
    const nextState: AgendaState = {
      ...state,
      employees: nextEmployees,
      barbers: syncBarberProjection(nextEmployees, state.barbers),
    };
    if (!persistState(nextState)) {
      setAnnouncement(active
        ? 'No se pudo reactivar el empleado. Revisa el almacenamiento e inténtalo de nuevo.'
        : 'No se pudo desactivar el empleado. Revisa el almacenamiento e inténtalo de nuevo.');
      setAnnouncementIsError(true);
      return;
    }
    setPendingDeactivationId(undefined);
    setAnnouncement(active ? 'Empleado reactivado.' : 'Empleado desactivado.');
    setAnnouncementIsError(false);
  }

  function renderDeactivationConfirmation(employee: EmployeeRecord) {
    if (pendingDeactivationId !== employee.id) return null;
    return (
      <section class="employee-deactivation-confirmation" aria-labelledby={`employee-deactivation-heading-${employee.id}`}>
        <h2 id={`employee-deactivation-heading-${employee.id}`}>Confirmar desactivación de {employee.name}</h2>
        <p>¿Desactivar a {employee.name}? Se conservarán su historial y sus horarios de barbero.</p>
        <div>
          <button class="availability-save-button" type="button" onClick={() => setEmployeeActive(employee, false)}>Confirmar desactivación</button>
          <button class="appointment-form-cancel" type="button" onClick={() => setPendingDeactivationId(undefined)}>Cancelar</button>
        </div>
      </section>
    );
  }

  function openProfile(employeeId: string) {
    setSelectedEmployeeId(employeeId);
    setAnnouncement('');
    const workspace = document.querySelector('.admin-workspace');
    if (workspace instanceof HTMLElement) workspace.scrollTop = 0;
  }

  function renderEmployeeRow(employee: EmployeeRecord) {
    const active = isEmployeeActive(employee);
    const canDeactivate = canDeactivateEmployee(employee.id, employees);
    const protectedLastAdministrator = isLastActiveAdministrator(employee, employees);
    const appointmentCount = state.appointments.filter(({ barberId }) => barberId === employee.id).length;
    return (
      <li class="employee-list-item" key={employee.id}>
        <article class="employee-row" aria-label={`Empleado ${employee.name}`}>
          <div class="employee-row-identity">
            <strong>{employee.name}</strong>
            <span>{employee.phone || 'Sin teléfono registrado'}</span>
          </div>
          <span class="employee-role-label">{employeeRoleLabels[employee.role]}</span>
          <span class={`employee-status${active ? ' is-active' : ' is-inactive'}`}>{active ? 'Activo' : 'Inactivo'}</span>
          <span class={`employee-invitation-status is-${employee.invitationStatus}`}>
            Registro {employee.invitationStatus === EMPLOYEE_INVITATION_STATUS.COMPLETED ? 'completado' : 'pendiente'}
          </span>
          <span class="employee-appointment-count">{appointmentCount} {appointmentCount === 1 ? 'cita' : 'citas'}</span>
          <div class="employee-row-actions">
            <button class="employee-text-action" type="button" aria-label={`Ver perfil de ${employee.name}`} onClick={() => openProfile(employee.id)}>
              Ver perfil
            </button>
            <button class="employee-text-action" type="button" aria-label={`Editar empleado ${employee.name}`} onClick={() => beginEdit(employee)}>
              Editar
            </button>
            {active ? (
              <button
                class="employee-text-action"
                type="button"
                aria-label={`Desactivar empleado ${employee.name}`}
                disabled={!canDeactivate}
                onClick={() => setPendingDeactivationId(employee.id)}
              >
                Desactivar
              </button>
            ) : (
              <button class="employee-text-action" type="button" aria-label={`Reactivar empleado ${employee.name}`} onClick={() => setEmployeeActive(employee, true)}>
                Reactivar
              </button>
            )}
          </div>
          {protectedLastAdministrator && <p class="employee-guard-note">Debe permanecer al menos un administrador activo.</p>}
        </article>
        {renderDeactivationConfirmation(employee)}
      </li>
    );
  }

  function renderProfile(employee: EmployeeRecord) {
    const appointments = sortAppointments(state.appointments.filter(({ barberId }) => barberId === employee.id));
    const schedule = state.schedules.find(({ barberId }) => barberId === employee.id);
    const exceptions = state.exceptions.filter(({ barberId }) => barberId === employee.id);
    const active = isEmployeeActive(employee);
    const canDeactivate = canDeactivateEmployee(employee.id, employees);
    const protectedLastAdministrator = isLastActiveAdministrator(employee, employees);

    return (
      <section class="employee-profile" aria-labelledby="employee-profile-title">
        <header class="agenda-heading employee-profile-heading">
          <button class="employee-text-action employee-profile-back" type="button" onClick={() => setSelectedEmployeeId(undefined)}>Volver a empleados</button>
          <div class="employee-profile-title-row">
            <div>
              <h1 id="employee-profile-title">{employee.name}</h1>
              <p class="employee-profile-role">{employeeRoleLabels[employee.role]}</p>
              <span class={`employee-status${active ? ' is-active' : ' is-inactive'}`}>{active ? 'Activo' : 'Inactivo'}</span>
            </div>
            <div class="employee-profile-actions">
              <button class="appointment-form-cancel" type="button" onClick={() => beginEdit(employee)}>Editar empleado</button>
              {active ? (
                <button class="employee-text-action" type="button" disabled={!canDeactivate} onClick={() => setPendingDeactivationId(employee.id)}>
                  Desactivar empleado
                </button>
              ) : (
                <button class="employee-text-action" type="button" onClick={() => setEmployeeActive(employee, true)}>Reactivar empleado</button>
              )}
            </div>
          </div>
        </header>

        {pendingDeactivationId === employee.id && renderDeactivationConfirmation(employee)}
        {protectedLastAdministrator && <p class="employee-guard-note" role="status">Debe permanecer al menos un administrador activo.</p>}

        <section class="employee-profile-contact" aria-labelledby="employee-contact-title">
          <h2 id="employee-contact-title">Datos de contacto</h2>
          <dl>
            <div><dt>Teléfono</dt><dd>{employee.phone || 'Sin teléfono registrado'}</dd></div>
            <div><dt>Estado del registro</dt><dd>{employee.invitationStatus === EMPLOYEE_INVITATION_STATUS.COMPLETED ? 'Completado' : 'Pendiente'}</dd></div>
          </dl>
        </section>

        <section class="employee-history-section" aria-label="Historial de citas">
          <header><h2>Historial de citas</h2><span>{appointments.length}</span></header>
          {appointments.length > 0 ? (
            <ol class="employee-appointment-history">
              {appointments.map((appointment) => (
                <li key={appointment.id}>
                  <time dateTime={appointment.startsAt}>{formatAppointmentDate(appointment.startsAt)}</time>
                  <span>{appointment.clientName} · {appointment.serviceName}</span>
                  <span class={`employee-history-status status-${appointment.status}`}>{appointmentStatusLabels[appointment.status]}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p class="agenda-empty">Este empleado aún no tiene citas vinculadas.</p>
          )}
        </section>

        {employee.role === EMPLOYEE_ROLE.BARBER && (
          <section class="employee-availability-section" aria-label={`Disponibilidad de ${employee.name}`}>
            <header><h2>Disponibilidad</h2></header>
            {schedule?.days.length ? (
              <ul class="employee-schedule-list">
                {schedule.days.map((day) => (
                  <li key={day.weekday}>
                    <strong>{weekdays[day.weekday] ?? 'Día'}</strong>
                    <span>{day.working.map(({ start, end }) => `${start}–${end}`).join(', ')}</span>
                    {day.breaks.length > 0 && <span>Descansos: {day.breaks.map(({ start, end }) => `${start}–${end}`).join(', ')}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p class="agenda-empty">Aún no hay horarios configurados para este barbero.</p>
            )}
            {exceptions.length > 0 && (
              <div class="employee-exceptions">
                <h3>Excepciones por fecha</h3>
                <ul class="employee-schedule-list">
                  {exceptions.map((exception) => (
                    <li key={exception.date}>
                      <time dateTime={exception.date}>{exception.date}</time>
                      <strong>{exception.unavailable ? 'Día libre' : 'Horario especial'}</strong>
                      {!exception.unavailable && exception.working?.length ? (
                        <span>Horario: {exception.working.map(({ start, end }) => `${start}–${end}`).join(', ')}</span>
                      ) : null}
                      {!exception.unavailable && exception.breaks?.length ? (
                        <span>Descansos: {exception.breaks.map(({ start, end }) => `${start}–${end}`).join(', ')}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </section>
    );
  }

  function handleCreateEdit(employee: EmployeeRecord): boolean {
    const current = employees.find(({ id }) => id === employee.id);
    const nextEmployees = current
      ? employees.map((entry) => entry.id === employee.id ? employee : entry)
      : [...employees, employee];
    const nextState: AgendaState = {
      ...state,
      employees: nextEmployees,
      barbers: syncBarberProjection(nextEmployees, state.barbers),
    };
    if (!persistState(nextState)) return false;
    setAnnouncement('');
    setAnnouncementIsError(false);
    if (!current) setSelectedEmployeeId(employee.id);
    return true;
  }

  return (
    <AdminGate>
      <AdminShell activeSection="Empleados">
        <section class="employees-page" aria-labelledby="employees-title">
          {storageWarning && <p class="admin-store-warning" role="status">No se pudieron leer los datos guardados. Revisa el almacenamiento del navegador.</p>}
          {!selectedEmployee && (
            <header class="agenda-heading employees-page-heading">
              <div>
                <h1 id="employees-title">Empleados</h1>
                <p>Consulta y administra los roles, el contacto y la disponibilidad de tu equipo.</p>
              </div>
              <button class="availability-save-button" type="button" onClick={beginCreate}>Nuevo empleado</button>
            </header>
          )}

          {selectedEmployee ? renderProfile(selectedEmployee) : (
            <>
              <div class="employees-toolbar">
                <label class="appointment-form-control employees-search-control">
                  <span>Buscar</span>
                  <input type="search" aria-label="Buscar empleados" placeholder="Nombre o teléfono" value={query} onInput={(event) => setQuery((event.currentTarget as HTMLInputElement).value)} />
                </label>
                <div class="employees-filter-control">
                  <span>Rol</span>
                  <Dropdown label="Rol" value={roleFilter} options={roleFilterOptions} onChange={(value) => setRoleFilter(value as EmployeeFilter)} />
                </div>
                <div class="employees-filter-control">
                  <span>Estado</span>
                  <Dropdown label="Estado" value={statusFilter} options={statusFilterOptions} onChange={(value) => setStatusFilter(value as EmployeeStatusFilter)} />
                </div>
                <div class="employees-filter-control">
                  <span>Ordenar</span>
                  <Dropdown label="Orden" value={sort} options={sortOptions} onChange={(value) => setSort(value as EmployeeSort)} />
                </div>
              </div>
              <p class="employees-result-count" role="status">{visibleEmployees.length} {visibleEmployees.length === 1 ? 'empleado' : 'empleados'}</p>
              {visibleEmployees.length > 0 ? (
                <ul class="employee-list" aria-label="Lista de empleados">
                  {visibleEmployees.map(renderEmployeeRow)}
                </ul>
              ) : (
                <p class="agenda-empty employees-empty-state">{employees.length === 0 ? 'Aún no hay empleados registrados.' : 'No hay empleados que coincidan con estos filtros.'}</p>
              )}
            </>
          )}

          {announcement && <p class={announcementIsError ? 'availability-error' : 'availability-announcement'} role={announcementIsError ? 'alert' : 'status'} aria-live={announcementIsError ? 'assertive' : 'polite'}>{announcement}</p>}
        </section>
        {formOpen && (
          <EmployeeForm
            employee={editingEmployee}
            roleLocked={editingEmployee ? isLastActiveAdministrator(editingEmployee, employees) : false}
            onSave={handleCreateEdit}
            onCancel={closeForm}
          />
        )}
      </AdminShell>
    </AdminGate>
  );
}
