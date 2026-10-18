import { useMemo, useState } from 'preact/hooks';
import { createDemoData } from '../data/demo';
import { createAgendaSeed } from '../data/agenda-demo';
import { loadAgendaState } from '../services/agenda-store';
import { getDashboardSummary, getUpcomingAppointments } from '../services/dashboard';
import { sitePath } from '../lib/site-path';
import { formatCurrency, getCurrentBusinessCurrency } from '../services/currency';
import { AssistantShell } from './AssistantShell';
import { AdminGate } from './AdminGate';
import { pageRecords, RecordPagination, RECORD_PAGE_SIZE } from './RecordPagination';

interface AssistantPageProps {
  now?: Date;
}

export function AssistantPage({ now = new Date() }: AssistantPageProps) {
  const [upcomingPage, setUpcomingPage] = useState(0);
  const data = useMemo(() => {
    const demo = createDemoData(now);
    let appointments = createAgendaSeed(now).appointments;
    let sales = demo.sales;
    try {
      const state = loadAgendaState(window.localStorage, now).state;
      appointments = state.appointments;
      sales = state.sales ?? demo.sales;
    } catch {
      // Keep the dashboard usable with the shared demonstration seed.
    }
    return { ...demo, sales, appointments };
  }, []);
  const summary = getDashboardSummary(data.sales, data.appointments, 'day', now);
  const currency = getCurrentBusinessCurrency();
  const upcomingAppointments = getUpcomingAppointments(data.appointments, now, data.appointments.length);
  const upcomingPageCount = Math.ceil(upcomingAppointments.length / RECORD_PAGE_SIZE);
  const upcoming = pageRecords(upcomingAppointments, upcomingPage);
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const appointmentsToday = data.appointments.filter((appointment) => {
    const startsAt = new Date(appointment.startsAt);
    const appointmentDay = Number.isFinite(startsAt.getTime())
      ? `${startsAt.getFullYear()}-${String(startsAt.getMonth() + 1).padStart(2, '0')}-${String(startsAt.getDate()).padStart(2, '0')}`
      : '';
    return appointmentDay === todayKey;
  });
  const scheduledCount = appointmentsToday.filter(({ status }) => status !== 'cancelled').length;
  const pendingPaymentCount = appointmentsToday.filter(({ status, paymentStatus }) => status !== 'cancelled' && paymentStatus !== 'paid').length;

  return (
    <AdminGate role="assistant">
      <AssistantShell activeSection="Inicio">
      <main class="assistant-dashboard">
        <header class="assistant-heading">
          <h1>Jornada de hoy</h1>
          <p>Resumen de demostración basado en los datos compartidos de la barbería.</p>
        </header>
        <section class="assistant-metrics" aria-label="Resumen del día">
          <article><span>Citas de hoy</span><strong>{scheduledCount}</strong></article>
          <article><span>Pendientes</span><strong>{summary.pendingCount}</strong></article>
          <article><span>Completadas</span><strong>{summary.completedCount}</strong></article>
          <article><span>Citas pendientes de cobro</span><strong>{pendingPaymentCount}</strong></article>
          <article><span>Ventas del día</span><strong>{summary.saleCount}</strong></article>
          <article><span>Total cobrado</span><strong>{formatCurrency(summary.netSales, currency)}</strong></article>
        </section>
        <section class="assistant-quick-actions" aria-label="Accesos rápidos">
          <a href={sitePath('/cobrar/')}>Cobrar una cita</a>
          <a href={sitePath('/agenda/')}>Agendar cita</a>
          <a href={sitePath('/clientes/')}>Registrar cliente</a>
          <a href={sitePath('/agenda/')}>Consultar agenda</a>
          <a href={`${sitePath('/cobrar/')}?quick=1`}>Venta rápida de productos</a>
        </section>
        <section class="assistant-upcoming" aria-labelledby="assistant-upcoming-title">
          <h2 id="assistant-upcoming-title">Próximas citas</h2>
          {upcoming.length ? <ul>{upcoming.map((appointment) => (
            <li key={appointment.id}>
              <time dateTime={appointment.startsAt}>{new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' }).format(new Date(appointment.startsAt))}</time>
              <div><strong>{appointment.clientName}</strong><span>{appointment.serviceName} · {appointment.barberName}</span></div>
              <span class={`assistant-status assistant-status-${appointment.status}`}>{appointment.status === 'pending' ? 'Pendiente' : appointment.status === 'confirmed' ? 'Confirmada' : appointment.status === 'completed' ? 'Completada' : 'Cancelada'}</span>
            </li>
          ))}</ul> : <p>No hay próximas citas.</p>}
          <RecordPagination page={Math.min(upcomingPage, Math.max(0, upcomingPageCount - 1))} pageCount={upcomingPageCount} label="Paginación de próximas citas" onPageChange={setUpcomingPage} />
        </section>
      </main>
      </AssistantShell>
    </AdminGate>
  );
}
