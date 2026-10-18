import { useState } from 'preact/hooks';
import { BarChart3, CalendarDays, CheckCircle2, Clock3, CreditCard, Home, LogOut, UserRound } from 'lucide-preact';
import { AdminGate } from './AdminGate';
import { AvailabilityExceptionEditor } from './AvailabilityExceptionEditor';
import { BarberAvailabilityPanel } from './BarberAvailabilityPanel';
import { Dropdown } from './Dropdown';
import { MobileMonthCalendar } from './MobileMonthCalendar';
import { pageRecords, RecordPagination, RECORD_PAGE_SIZE } from './RecordPagination';
import { AGENDA_LOAD_STATUS, type AgendaState, type AvailabilityException, type BarberSchedule } from '../types/agenda';
import { loadAgendaState, saveAgendaState } from '../services/agenda-store';
import { validateBooking } from '../services/availability';
import { getEffectiveAppointmentStatus } from '../services/appointment-lifecycle';
import { getBarberStatistics } from '../services/barber-statistics';
import { formatCurrency, getCurrentBusinessCurrency } from '../services/currency';
import type { AppointmentStatus } from '../types/domain';
import { sitePath } from '../lib/site-path';
import { endDemoSession } from '../lib/demo-auth';
import '../styles/admin.css';
import '../styles/agenda.css';
import '../styles/assistant-shell.css';
import '../styles/assistant.css';
import '../styles/business-settings.css';
import '../styles/barber.css';

const BARBER_ID = 'barber-1';
type StatisticsPeriod = 'today' | 'week' | 'month' | 'custom';
type BarberView = 'home' | 'agenda' | 'schedule' | 'statistics' | 'profile';

const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatAppointmentTime(value: string): string {
  return new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value));
}

function getStatisticsRange(period: StatisticsPeriod, now: Date, customStart: string, customEnd: string) {
  if (period === 'custom') return { start: customStart, end: customEnd };
  if (period === 'today') return { start: dateKey(now), end: dateKey(now) };
  if (period === 'month') {
    return {
      start: dateKey(new Date(now.getFullYear(), now.getMonth(), 1)),
      end: dateKey(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start: dateKey(start), end: dateKey(end) };
}

export function BarberPage({ now = new Date() }: { now?: Date }) {
  const [view, setView] = useState<BarberView>('home');
  const [statisticsPeriod, setStatisticsPeriod] = useState<StatisticsPeriod>('week');
  const [customStartDate, setCustomStartDate] = useState(() => dateKey(now));
  const [customEndDate, setCustomEndDate] = useState(() => dateKey(now));
  const [agendaDate, setAgendaDate] = useState(() => dateKey(now));
  const [agendaPage, setAgendaPage] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => dateKey(now));
  const [currency] = useState(getCurrentBusinessCurrency);
  const [state, setState] = useState(() => {
    try { return loadAgendaState(window.localStorage, now).state; }
    catch { return undefined; }
  });
  const [scheduleConflict, setScheduleConflict] = useState<string[]>([]);
  let result;
  try { result = loadAgendaState(window.localStorage, now); } catch { result = undefined; }
  const agenda = state ?? result?.state;
  const appointments = agenda?.appointments
    .filter(({ barberId }) => barberId === BARBER_ID)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt)) ?? [];
  const appointmentsForSelectedDay = appointments.filter((appointment) => dateKey(new Date(appointment.startsAt)) === agendaDate);
  const agendaPageCount = Math.ceil(appointmentsForSelectedDay.length / RECORD_PAGE_SIZE);
  const visibleAgendaAppointments = pageRecords(appointmentsForSelectedDay, Math.min(agendaPage, Math.max(0, agendaPageCount - 1)));
  const barber = agenda?.barbers.find(({ id }) => id === BARBER_ID);
  const range = getStatisticsRange(statisticsPeriod, now, customStartDate, customEndDate);
  const invalidCustomRange = statisticsPeriod === 'custom'
    && (!/^\d{4}-\d{2}-\d{2}$/.test(range.start) || !/^\d{4}-\d{2}-\d{2}$/.test(range.end) || range.start > range.end);
  const statistics = agenda ? getBarberStatistics(agenda, BARBER_ID, range.start, range.end, now) : undefined;
  const todayKey = dateKey(now);
  const todayAppointments = appointments.filter((appointment) => dateKey(new Date(appointment.startsAt)) === todayKey);
  const todayStatistics = agenda ? getBarberStatistics(agenda, BARBER_ID, todayKey, todayKey, now) : undefined;
  const nextAppointment = appointments.find((appointment) => {
    const status = getEffectiveAppointmentStatus(appointment, now);
    return new Date(appointment.startsAt).getTime() >= now.getTime() && (status === 'pending' || status === 'confirmed');
  });
  const pendingPaymentCount = todayAppointments.filter((appointment) => appointment.paymentStatus !== 'paid'
    && getEffectiveAppointmentStatus(appointment, now) !== 'cancelled').length;

  function saveAvailability(schedules: BarberSchedule[], exceptions: AvailabilityException[]) {
    if (!agenda) return false;
    const conflicts = agenda.appointments.filter((appointment) => appointment.barberId === BARBER_ID
      && ['pending', 'confirmed'].includes(getEffectiveAppointmentStatus(appointment, now))
      && new Date(appointment.startsAt) > now
      && !validateBooking({
        id: appointment.id,
        barberId: appointment.barberId,
        startsAt: appointment.startsAt,
        durationMinutes: appointment.durationMinutes,
      }, schedules, exceptions, agenda.appointments, now).valid);
    if (conflicts.length) {
      setScheduleConflict(conflicts.map(({ clientName, startsAt }) => `${clientName} · ${new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(startsAt))}`));
      return false;
    }
    const next: AgendaState = { ...agenda, schedules, exceptions };
    try {
      saveAgendaState(window.localStorage, next);
      setState(next);
      setScheduleConflict([]);
      return true;
    } catch { return false; }
  }

  function signOut() {
    endDemoSession(window.localStorage);
    window.location.assign(sitePath('/login/'));
  }

  const navigationItems: Array<{ view: BarberView; label: string; icon: typeof Home }> = [
    { view: 'home', label: 'Inicio', icon: Home },
    { view: 'agenda', label: 'Mi agenda', icon: CalendarDays },
    { view: 'statistics', label: 'Estadísticas', icon: BarChart3 },
    { view: 'profile', label: 'Mi perfil', icon: UserRound },
  ];

  function renderNavigation(mobile = false) {
    return navigationItems.map(({ view: targetView, label, icon: Icon }) => (
      <button
        class={`${mobile ? '' : 'barber-sidebar-link '}${view === targetView ? 'is-active' : ''}`}
        type="button"
        aria-pressed={view === targetView}
        onClick={() => setView(targetView)}
        key={targetView}
      >
        <Icon size={mobile ? 19 : 18} aria-hidden="true" />
        <span>{label}</span>
      </button>
    ));
  }

  function renderAppointments(items: typeof appointments, variant: 'next' | 'list' = 'list') {
    return items.length ? <ul class={`assistant-appointment-list${variant === 'next' ? ' barber-next-appointment-list' : ''}`}>{items.map((appointment) => {
      const status = getEffectiveAppointmentStatus(appointment, now);
      return <li key={appointment.id}>
        <time dateTime={appointment.startsAt}>{formatAppointmentTime(appointment.startsAt)}</time>
        <div><strong>{appointment.clientName}</strong><span>{appointment.serviceName} · {appointment.barberName}</span></div>
        <div class="barber-appointment-meta">
          <span class={`assistant-status assistant-status-${status}`}>{appointmentStatusLabels[status]}</span>
          <span class="barber-appointment-duration">{appointment.durationMinutes} min</span>
        </div>
      </li>;
    })}</ul> : <p class="barber-empty-state">No hay citas en este periodo.</p>;
  }

  return <AdminGate role="barber">
    <div class="assistant-app barber-app">
      <a class="assistant-skip-link" href="#barber-main">Saltar al contenido</a>
      <aside class="assistant-sidebar barber-sidebar">
        <a class="assistant-brand" href={sitePath('/barbero/')} aria-label="Webby's Barbershop, inicio">
          <img src={sitePath('/logo.jpeg')} alt="" />Webby's Barbershop
        </a>
        <p>MI ESPACIO</p>
        <nav aria-label="Navegación de escritorio del barbero">{renderNavigation()}</nav>
        <button class="assistant-sidebar-signout" type="button" onClick={signOut}><LogOut size={18} aria-hidden="true" />Cerrar sesión</button>
      </aside>
      <div class="assistant-workspace">
        <header class="assistant-topbar">
          <a class="assistant-mobile-brand" href={sitePath('/barbero/')} aria-label="Webby's Barbershop, inicio">
            <img src={sitePath('/logo.jpeg')} alt="" />Webby's Barbershop
          </a>
          <div class="assistant-topbar-spacer" />
          <span class="assistant-account">Perfil de barbero</span>
          <span class="assistant-avatar" aria-label={`Perfil de ${barber?.name ?? 'barbero'}`}>{barber?.name.slice(0, 1) ?? 'B'}</span>
          <button type="button" aria-label="Cerrar sesión" onClick={signOut}><LogOut size={17} aria-hidden="true" /><span>Cerrar sesión</span></button>
        </header>
        <main class="assistant-content" id="barber-main" tabIndex={-1}>
          <div class="barber-page">
            {scheduleConflict.length > 0 && <div role="alert" class="barber-conflict-alert"><p>No se guardó el cambio porque afecta estas citas futuras:</p><ul>{scheduleConflict.map((conflict) => <li key={conflict}>{conflict}</li>)}</ul><p>Reprograma o cancela las citas antes de cambiar el horario.</p></div>}
            {result?.status === AGENDA_LOAD_STATUS.INVALID && <p class="admin-store-warning" role="status">No se pudieron cargar los datos guardados; se muestra la agenda disponible.</p>}
            {view === 'home' && <section class="assistant-dashboard barber-dashboard" aria-labelledby="barber-home-title">
              <header class="assistant-heading">
                <h1 id="barber-home-title">Jornada de hoy</h1>
                <p>{barber?.name ?? 'Barbero'} · {new Intl.DateTimeFormat('es-MX', { dateStyle: 'full' }).format(now)}.</p>
              </header>
              <section class="assistant-metrics" aria-label="Resumen de mi jornada">
                <article><span><CalendarDays size={16} aria-hidden="true" />Citas de hoy</span><strong>{todayAppointments.filter((appointment) => getEffectiveAppointmentStatus(appointment, now) !== 'cancelled').length}</strong></article>
                <article><span><Clock3 size={16} aria-hidden="true" />Pendientes</span><strong>{todayStatistics?.pendingCount ?? 0}</strong></article>
                <article><span><CheckCircle2 size={16} aria-hidden="true" />Completadas</span><strong>{todayStatistics?.completedCount ?? 0}</strong></article>
                <article><span><CreditCard size={16} aria-hidden="true" />Pendientes de cobro</span><strong>{pendingPaymentCount}</strong></article>
              </section>
              <section class="assistant-upcoming" aria-labelledby="barber-next-appointment-title">
                <h2 id="barber-next-appointment-title"><CalendarDays size={18} aria-hidden="true" />Próxima cita</h2>
                {nextAppointment ? renderAppointments([nextAppointment], 'next') : <p class="barber-empty-state">No tienes próximas citas.</p>}
              </section>
              <div class="barber-home-actions" aria-label="Accesos rápidos">
                <button class="availability-save-button" type="button" onClick={() => setView('agenda')}>Ver mi agenda</button>
              </div>
            </section>}
            {view === 'agenda' && <section class="assistant-upcoming barber-agenda-view" aria-labelledby="barber-agenda-title">
              <header class="assistant-heading"><h1 id="barber-agenda-title">Mi agenda</h1><p>Consulta tus citas y sus estados.</p></header>
              <div class="barber-agenda-toolbar">
                <div class="appointment-form-control barber-agenda-date-control">
                  <span>Fecha</span>
                  <div class="appointment-date-picker-control">
                    <button
                      class="appointment-date-picker-trigger"
                      type="button"
                      aria-label={`Fecha de la agenda: ${new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${agendaDate}T12:00:00`))}`}
                      aria-expanded={calendarOpen}
                      aria-controls="barber-agenda-calendar"
                      onClick={() => {
                        if (!calendarOpen) setCalendarMonth(agendaDate);
                        setCalendarOpen((open) => !open);
                      }}
                    >
                      <span>{new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${agendaDate}T12:00:00`))}</span>
                      <CalendarDays size={17} aria-hidden="true" />
                    </button>
                    {calendarOpen && <div id="barber-agenda-calendar" class="appointment-date-picker-popover" onClick={(event) => event.stopPropagation()}>
                      <MobileMonthCalendar
                        selectedDate={agendaDate}
                        displayedMonth={calendarMonth}
                        appointments={appointments}
                        onNavigateMonth={setCalendarMonth}
                        onSelectDate={(selected) => {
                          setAgendaDate(selected);
                          setCalendarMonth(selected);
                          setAgendaPage(0);
                          setCalendarOpen(false);
                        }}
                      />
                    </div>}
                  </div>
                </div>
                <button class="appointment-form-cancel" type="button" onClick={() => setView('schedule')}>Configurar horarios</button>
              </div>
              {appointmentsForSelectedDay.length ? <>
                {renderAppointments(visibleAgendaAppointments)}
                <RecordPagination
                  page={Math.min(agendaPage, Math.max(0, agendaPageCount - 1))}
                  pageCount={agendaPageCount}
                  label="Paginación de citas"
                  onPageChange={setAgendaPage}
                />
              </> : <p class="barber-empty-state">No tienes citas para esta fecha.</p>}
            </section>}
            {view === 'schedule' && agenda && barber && <section class="barber-schedule-view" aria-labelledby="barber-schedule-title">
              <header class="assistant-heading"><h1 id="barber-schedule-title">Mis horarios</h1><p>Administra tus jornadas, descansos y excepciones.</p></header>
              <BarberAvailabilityPanel barbers={[barber]} schedules={agenda.schedules} onSave={(schedules) => saveAvailability(schedules, agenda.exceptions)} />
              <AvailabilityExceptionEditor barbers={[barber]} exceptions={agenda.exceptions} onSave={(exceptions) => saveAvailability(agenda.schedules, exceptions)} />
            </section>}
            {view === 'statistics' && statistics && <section aria-labelledby="barber-statistics-title" class="barber-statistics">
              <header class="assistant-heading"><h1 id="barber-statistics-title">Mis estadísticas</h1><p>Resultados de los servicios que tienes asignados.</p></header>
              <div class="barber-statistics-filters">
                <label class="appointment-form-control">
                  <span>Periodo</span>
                  <Dropdown label="Periodo de estadísticas" value={statisticsPeriod} options={[
                    { value: 'today', label: 'Hoy' },
                    { value: 'week', label: 'Esta semana' },
                    { value: 'month', label: 'Este mes' },
                    { value: 'custom', label: 'Periodo personalizado' },
                  ]} onChange={(value) => setStatisticsPeriod(value)} />
                </label>
                {statisticsPeriod === 'custom' && <>
                  <label class="appointment-form-control"><span>Desde</span><input type="date" value={customStartDate} onInput={(event) => setCustomStartDate(event.currentTarget.value)} /></label>
                  <label class="appointment-form-control"><span>Hasta</span><input type="date" value={customEndDate} onInput={(event) => setCustomEndDate(event.currentTarget.value)} /></label>
                </>}
              </div>
              {invalidCustomRange && <p role="alert">Selecciona un periodo válido; la fecha inicial no puede ser posterior a la final.</p>}
              <dl class="assistant-metrics barber-statistics-metrics">
                <div><dt>Citas</dt><dd>{statistics.appointmentCount}</dd></div>
                <div><dt>Completadas</dt><dd>{statistics.completedCount}</dd></div>
                <div><dt>Canceladas</dt><dd>{statistics.cancelledCount}</dd></div>
                <div><dt>Pendientes</dt><dd>{statistics.pendingCount}</dd></div>
                <div><dt>Servicios programados</dt><dd>{statistics.servicesScheduled}</dd></div>
                <div><dt>Servicios cobrados</dt><dd>{statistics.servicesCharged}</dd></div>
                <div><dt>Clientes estimados</dt><dd>{statistics.clientsAttendedEstimated}</dd></div>
                <div><dt>Ingresos cobrados</dt><dd>{formatCurrency(statistics.revenue, currency)}</dd></div>
                <div><dt>Ticket promedio cobrado</dt><dd>{formatCurrency(statistics.averageTicket, currency)}</dd></div>
              </dl>
              <p class="barber-statistics-note">Ingresos solo de servicios cobrados, con descuentos prorrateados. “Clientes estimados” cuenta citas completadas; no confirma asistencia.</p>
              <section aria-labelledby="barber-top-services-title" class="assistant-upcoming barber-top-services">
                <h2 id="barber-top-services-title">Servicios más solicitados</h2>
                {statistics.topServices.length ? <ol>{statistics.topServices.map((service) => <li key={service.id}>
                  <div><strong>{service.name}</strong><span>{service.count} · {service.percentage}%</span></div>
                  <span>{formatCurrency(service.revenue, currency)} cobrados</span>
                  <div class="barber-service-share" role="img" aria-label={`${service.percentage}% de los servicios solicitados`}>
                    <span style={{ width: `${service.percentage}%` }} />
                  </div>
                </li>)}</ol> : <p class="barber-empty-state">No hay citas en este periodo.</p>}
              </section>
            </section>}
            {view === 'profile' && barber && <section class="assistant-profile-page barber-profile-view" aria-labelledby="barber-profile-title">
              <header class="assistant-heading"><h1 id="barber-profile-title">Mi perfil</h1><p>Información de tu espacio personal.</p></header>
              <dl class="assistant-profile-details">
                <div><dt>Nombre</dt><dd>{barber.name}</dd></div>
                <div><dt>Rol</dt><dd>Barbero</dd></div>
                <div><dt>Teléfono</dt><dd>{agenda?.employees?.find(({ id }) => id === barber.id)?.phone || 'Sin teléfono registrado'}</dd></div>
              </dl>
              <button class="appointment-form-cancel" type="button" onClick={() => setView('schedule')}>Administrar mis horarios</button>
            </section>}
          </div>
        </main>
        <p class="assistant-announcement" role="status" aria-live="polite" />
        <nav class="assistant-mobile-navigation barber-mobile-navigation" aria-label="Navegación del barbero">
          {renderNavigation(true)}
        </nav>
      </div>
    </div>
  </AdminGate>;
}
