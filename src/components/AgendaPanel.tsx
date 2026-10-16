import { ChevronLeft, ChevronRight } from 'lucide-preact';
import { useState } from 'preact/hooks';
import type { AppointmentRecord, AppointmentStatus } from '../types/domain';
import type { AgendaState } from '../types/agenda';
import { ALL_BARBERS, AgendaAvailabilityPanel } from './AgendaAvailabilityPanel';
import { AppointmentForm } from './AppointmentForm';
import { Dropdown } from './Dropdown';
import '../styles/agenda.css';

const AGENDA_VIEW = {
  DAY: 'day',
  WEEK: 'week',
} as const;

const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

interface AgendaPanelProps {
  state: AgendaState;
  now?: Date;
  onAppointmentSave?: (appointment: AppointmentRecord) => boolean;
}

const APPOINTMENT_FORM_STATE = {
  CLOSED: 'closed',
  CREATE: 'create',
  EDIT: 'edit',
} as const;

type AppointmentFormState = (typeof APPOINTMENT_FORM_STATE)[keyof typeof APPOINTMENT_FORM_STATE];

function localDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function parseLocalDate(value: string): Date {
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getWeekDates(date: Date): Date[] {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });
}

function formatDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('es', options).format(date);
}

function formatDayTitle(date: Date): string {
  const value = formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' });
  return value.charAt(0).toLocaleUpperCase('es') + value.slice(1);
}

function formatWeekTitle(start: Date, end: Date): string {
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `Semana del ${start.getDate()} al ${formatDate(end, { day: 'numeric', month: 'long' })}`;
  }
  const includesYear = start.getFullYear() !== end.getFullYear();
  const startLabel = formatDate(start, { day: 'numeric', month: 'long', ...(includesYear ? { year: 'numeric' } : {}) });
  const endLabel = formatDate(end, { day: 'numeric', month: 'long', ...(includesYear ? { year: 'numeric' } : {}) });
  return `Semana del ${startLabel} al ${endLabel}`;
}

function formatTime(value: string): string {
  return formatDate(new Date(value), { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
}

function appointmentsForDate(
  appointments: AppointmentRecord[],
  date: string,
  barberId: string,
): AppointmentRecord[] {
  return appointments
    .filter((appointment) => localDateKey(new Date(appointment.startsAt)) === date)
    .filter((appointment) => barberId === ALL_BARBERS || appointment.barberId === barberId)
    .sort((first, second) => first.startsAt.localeCompare(second.startsAt));
}

function AppointmentDisclosure({ appointment, onReschedule }: { appointment: AppointmentRecord; onReschedule?: () => void }) {
  const statusLabel = appointmentStatusLabels[appointment.status];

  return (
    <li class={`agenda-appointment status-${appointment.status}`}>
      <details>
        <summary>
          <time dateTime={appointment.startsAt}>{formatTime(appointment.startsAt)}</time>
          <strong>{appointment.clientName}</strong>
          <span class="agenda-status-label">{statusLabel}</span>
        </summary>
        <dl class="agenda-appointment-details">
          <div>
            <dt>Servicio</dt>
            <dd>{appointment.serviceName}</dd>
          </div>
          <div>
            <dt>Barbero</dt>
            <dd>{appointment.barberName}</dd>
          </div>
          <div>
            <dt>Duración</dt>
            <dd>{appointment.durationMinutes} min</dd>
          </div>
        </dl>
        {onReschedule && (appointment.status === 'pending' || appointment.status === 'confirmed') && (
          <button
            class="agenda-reschedule-button"
            type="button"
            aria-label={`Reprogramar cita de ${appointment.clientName}`}
            onClick={onReschedule}
          >
            Reprogramar cita
          </button>
        )}
      </details>
    </li>
  );
}

export function AgendaPanel({ state, now = new Date(), onAppointmentSave }: AgendaPanelProps) {
  const [view, setView] = useState<(typeof AGENDA_VIEW)[keyof typeof AGENDA_VIEW]>(AGENDA_VIEW.DAY);
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(now));
  const [selectedBarber, setSelectedBarber] = useState(ALL_BARBERS);
  const [appointmentFormState, setAppointmentFormState] = useState<AppointmentFormState>(APPOINTMENT_FORM_STATE.CLOSED);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentRecord | undefined>();
  const [formAnnouncement, setFormAnnouncement] = useState('');
  const selectedDateValue = parseLocalDate(selectedDate);
  const weekDates = getWeekDates(selectedDateValue);
  const weekStart = weekDates[0] ?? selectedDateValue;
  const weekEnd = weekDates[6] ?? selectedDateValue;
  const dayAppointments = appointmentsForDate(state.appointments, selectedDate, selectedBarber);
  const barberOptions = [
    { value: ALL_BARBERS, label: 'Todos' },
    ...state.barbers.map(({ id, name }) => ({ value: id, label: name })),
  ];

  function navigateDate(direction: -1 | 1) {
    const nextDate = new Date(selectedDateValue);
    nextDate.setDate(nextDate.getDate() + direction * (view === AGENDA_VIEW.DAY ? 1 : 7));
    setSelectedDate(localDateKey(nextDate));
  }

  function openCreateForm() {
    setEditingAppointment(undefined);
    setFormAnnouncement('');
    setAppointmentFormState(APPOINTMENT_FORM_STATE.CREATE);
  }

  function openEditForm(appointment: AppointmentRecord) {
    setEditingAppointment(appointment);
    setFormAnnouncement('');
    setAppointmentFormState(APPOINTMENT_FORM_STATE.EDIT);
  }

  function saveAppointment(appointment: AppointmentRecord): boolean {
    if (!onAppointmentSave || !onAppointmentSave(appointment)) return false;
    setFormAnnouncement(editingAppointment ? 'Cambios de la cita guardados.' : 'Cita guardada.');
    setAppointmentFormState(APPOINTMENT_FORM_STATE.CLOSED);
    setEditingAppointment(undefined);
    return true;
  }

  function closeAppointmentForm() {
    setAppointmentFormState(APPOINTMENT_FORM_STATE.CLOSED);
    setEditingAppointment(undefined);
  }

  return (
    <section class="agenda-panel" aria-labelledby="agenda-title">
      <header class="agenda-heading">
        <div>
          <h1 id="agenda-title">Agenda</h1>
          <p>Consulta las citas del equipo por fecha y barbero.</p>
        </div>
      </header>

      <div class="agenda-toolbar">
        <div class="agenda-view-switch" role="group" aria-label="Vista de agenda">
          <button type="button" aria-pressed={view === AGENDA_VIEW.DAY} onClick={() => setView(AGENDA_VIEW.DAY)}>Día</button>
          <button type="button" aria-pressed={view === AGENDA_VIEW.WEEK} onClick={() => setView(AGENDA_VIEW.WEEK)}>Semana</button>
        </div>

        <label class="agenda-date-control">
          <span>Fecha</span>
          <input
            type="date"
            aria-label="Fecha de la agenda"
            value={selectedDate}
            onInput={(event) => {
              const value = (event.currentTarget as HTMLInputElement).value;
              if (/^\d{4}-\d{2}-\d{2}$/.test(value)) setSelectedDate(value);
            }}
          />
        </label>

        <div class="agenda-barber-control">
          <span>Barbero</span>
          <Dropdown
            label="Barbero"
            value={selectedBarber}
            options={barberOptions}
            onChange={setSelectedBarber}
          />
        </div>

      </div>

      <div class="agenda-date-navigation">
        <button
          type="button"
          class="agenda-date-arrow"
          aria-label={view === AGENDA_VIEW.DAY ? 'Día anterior' : 'Semana anterior'}
          onClick={() => navigateDate(-1)}
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h2>{view === AGENDA_VIEW.DAY ? formatDayTitle(selectedDateValue) : formatWeekTitle(weekStart, weekEnd)}</h2>
        <button
          type="button"
          class="agenda-date-arrow"
          aria-label={view === AGENDA_VIEW.DAY ? 'Día siguiente' : 'Semana siguiente'}
          onClick={() => navigateDate(1)}
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>

      {view === AGENDA_VIEW.DAY ? (
        <div class="agenda-day-content">
          <section class="agenda-day-view" aria-label="Agenda diaria">
            {onAppointmentSave && (
              <button class="agenda-new-appointment" type="button" onClick={openCreateForm}>Nueva cita</button>
            )}
            {dayAppointments.length > 0 ? (
              <ol class="agenda-appointment-list">
                {dayAppointments.map((appointment) => (
                  <AppointmentDisclosure
                    appointment={appointment}
                    onReschedule={onAppointmentSave ? () => {
                      openEditForm(appointment);
                    } : undefined}
                    key={appointment.id}
                  />
                ))}
              </ol>
            ) : (
              <p class="agenda-empty">No hay citas para esta fecha.</p>
            )}
            {appointmentFormState !== APPOINTMENT_FORM_STATE.CLOSED && onAppointmentSave && (
              <AppointmentForm
                state={state}
                appointment={editingAppointment}
                now={now}
                onSave={saveAppointment}
                onCancel={closeAppointmentForm}
              />
            )}
            {formAnnouncement && <p class="availability-announcement" role="status" aria-live="polite">{formAnnouncement}</p>}
          </section>

          <AgendaAvailabilityPanel state={state} date={selectedDate} barberId={selectedBarber} now={now} />
        </div>
      ) : (
        <section class="agenda-week-grid" role="region" aria-label="Agenda semanal">
          {weekDates.map((day) => {
            const dayKey = localDateKey(day);
            const appointments = appointmentsForDate(state.appointments, dayKey, selectedBarber);

            return (
              <section class="agenda-week-day" role="group" aria-label={formatDayTitle(day)} key={dayKey}>
                <button
                  class={`agenda-week-day-heading${dayKey === selectedDate ? ' is-selected' : ''}`}
                  type="button"
                  aria-pressed={dayKey === selectedDate}
                  onClick={() => setSelectedDate(dayKey)}
                >
                  <span>{formatDate(day, { weekday: 'long' })}</span>
                  <strong>{formatDate(day, { day: 'numeric', month: 'short' })}</strong>
                  <span>{appointments.length} {appointments.length === 1 ? 'cita' : 'citas'}</span>
                </button>
                {appointments.length > 0 ? (
                  <ol class="agenda-appointment-list">
                    {appointments.map((appointment) => (
                      <AppointmentDisclosure
                        appointment={appointment}
                        onReschedule={onAppointmentSave ? () => openEditForm(appointment) : undefined}
                        key={appointment.id}
                      />
                    ))}
                  </ol>
                ) : (
                  <p class="agenda-week-empty">Sin citas</p>
                )}
              </section>
            );
          })}
        </section>
      )}
    </section>
  );
}
