import { useMemo, useState } from 'preact/hooks';
import { Dropdown } from './Dropdown';
import { formatCurrency, readBusinessCurrency } from '../services/currency';
import { Activity, ArrowUpRight, CalendarDays, Clock3 } from 'lucide-preact';
import type { AppointmentRecord, DemoData } from '../types/domain';
import {
  getDashboardSummary,
  getSalesSeries,
  getUpcomingAppointments,
  type DashboardRange,
} from '../services/dashboard';

interface DashboardPanelProps {
  data: DemoData;
  now?: Date;
}

const rangeLabels: Record<DashboardRange, string> = {
  day: 'Día',
  week: 'Semana',
  month: 'Mes',
};

const statusLabels: Record<AppointmentRecord['status'], string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

function formatDate(date: Date): string {
  const formatted = new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
  return formatted.charAt(0).toLocaleUpperCase('es') + formatted.slice(1);
}

function getGreeting(hour: number): string {
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function formatTime(date: string, now: Date): string {
  const appointmentDate = new Date(date);
  const appointmentDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const isTomorrow = appointmentDay.getTime() === tomorrow.getTime();
  const time = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(appointmentDate);
  return isTomorrow ? `Mañana · ${time}` : time;
}

function getRecentActivity(data: DemoData, now: Date) {
  const sales = data.sales
    .filter(({ occurredAt }) => new Date(occurredAt).getTime() <= now.getTime())
    .map((sale) => ({
      id: sale.id,
      title: 'Venta registrada',
      detail: sale.items.map(({ name }) => name).join(' · '),
      time: sale.occurredAt,
      amount: sale.netTotal,
    }));
  const appointments = data.appointments
    .filter(({ startsAt }) => new Date(startsAt).getTime() <= now.getTime())
    .map((appointment) => ({
      id: appointment.id,
      title: `Cita ${statusLabels[appointment.status].toLocaleLowerCase('es')}`,
      detail: appointment.clientName,
      time: appointment.startsAt,
      amount: null,
    }));

  return [...sales, ...appointments]
    .sort((first, second) => new Date(second.time).getTime() - new Date(first.time).getTime())
    .slice(0, 4);
}

function SalesChart({ data, range, currency }: { data: ReturnType<typeof getSalesSeries>; range: DashboardRange; currency: ReturnType<typeof readBusinessCurrency> }) {
  const maxValue = Math.max(1, ...data.map(({ value }) => value));
  const width = 560;
  const height = 140;
  const top = 12;
  const plotHeight = 112;
  const bandWidth = width / Math.max(data.length, 1);
  const barWidth = Math.min(30, bandWidth * 0.48);
  const hasSales = data.some(({ value }) => value > 0);

  return (
    <figure class="sales-chart" aria-label={`Ventas netas por ${rangeLabels[range].toLocaleLowerCase('es')}`}>
      {hasSales ? (
        <>
          <svg
            class="sales-chart-svg"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={`Gráfica de ventas netas por ${rangeLabels[range].toLocaleLowerCase('es')}.`}
            preserveAspectRatio="none"
          >
            <line x1="0" y1={top + plotHeight} x2={width} y2={top + plotHeight} class="chart-axis" />
            <line x1="0" y1={top + plotHeight / 2} x2={width} y2={top + plotHeight / 2} class="chart-gridline" />
            {data.map(({ label, value }, index) => {
              const barHeight = (value / maxValue) * plotHeight;
              const x = index * bandWidth + (bandWidth - barWidth) / 2;
              const y = top + plotHeight - barHeight;
              return (
                <g key={label}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(barHeight, value > 0 ? 2 : 0)}
                    rx="3"
                    class="chart-bar"
                  />
                </g>
              );
            })}
          </svg>
          <div
            class="chart-labels"
            style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
            aria-hidden="true"
          >
            {data.map(({ label }) => <span key={label}>{label}</span>)}
          </div>
        </>
      ) : (
        <p class="empty-chart-message">Sin ventas registradas en el periodo seleccionado.</p>
      )}
      <figcaption>Ingresos netos en {currency}</figcaption>
      <ul class="chart-data-accessible" aria-label="Valores de la gráfica">
        {data.map(({ label, value }) => <li key={label}>{label}: {formatCurrency(value, currency)}</li>)}
      </ul>
    </figure>
  );
}

export function DashboardPanel({ data, now = new Date() }: DashboardPanelProps) {
  const [range, setRange] = useState<DashboardRange>('week');
  const [currency] = useState(() => readBusinessCurrency(window.localStorage));
  const summary = useMemo(
    () => getDashboardSummary(data.sales, data.appointments, range, now),
    [data, now, range],
  );
  const series = useMemo(() => getSalesSeries(data.sales, range, now), [data.sales, now, range]);
  const upcoming = useMemo(() => getUpcomingAppointments(data.appointments, now, 4), [data.appointments, now]);
  const recentActivity = useMemo(() => getRecentActivity(data, now), [data, now]);
  const nextAppointment = upcoming[0];

  return (
    <div class="dashboard-panel">
      <div class="dashboard-heading">
        <div>
          <h1>{getGreeting(now.getHours())}, Webbys.</h1>
          <p>{formatDate(now)}.</p>
        </div>
        {nextAppointment && (
          <div class="next-appointment-strip" role="region" aria-label="Siguiente cita">
            <CalendarDays size={16} aria-hidden="true" />
            <div class="next-appointment-copy">
              <span>Próxima cita · <time dateTime={nextAppointment.startsAt}>{formatTime(nextAppointment.startsAt, now)}</time></span>
              <strong>{nextAppointment.clientName}</strong>
              <span>{nextAppointment.serviceName} · {nextAppointment.barberName}</span>
              <span class="next-appointment-count">
                {summary.appointmentCount} citas hoy · {summary.pendingCount}{' '}
                {summary.pendingCount === 1 ? 'pendiente' : 'pendientes'}
              </span>
            </div>
          </div>
        )}
      </div>

      <section class="sales-overview" aria-label="Ventas del periodo">
        <div class="sales-overview-header">
          <div>
            <h2>Ventas netas</h2>
            <p>Ingresos después de descuentos · importes de ejemplo ({currency})</p>
          </div>
          <div class="period-control">
            <span>Periodo</span>
            <Dropdown
              label="Periodo de ventas"
              value={range}
              options={[
                { value: 'day', label: 'Día' },
                { value: 'week', label: 'Semana' },
                { value: 'month', label: 'Mes' },
              ]}
              onChange={(value) => setRange(value as DashboardRange)}
            />
          </div>
        </div>

        <div class="sales-overview-main">
          <div class="sales-total">
            <span>{rangeLabels[range]} · netas</span>
            <strong>{formatCurrency(summary.netSales, currency)}</strong>
            <p>{summary.saleCount} {summary.saleCount === 1 ? 'venta' : 'ventas'} en el periodo</p>
          </div>
          <SalesChart data={series} range={range} currency={currency} />
        </div>

        <dl class="sales-breakdown">
          <div>
            <dt>Ventas brutas</dt>
            <dd>{formatCurrency(summary.grossSales, currency)}</dd>
          </div>
          <div>
            <dt>Descuentos</dt>
            <dd>{formatCurrency(summary.discounts, currency)}</dd>
          </div>
        </dl>
      </section>

      <section class="appointments-overview" aria-labelledby="appointments-overview-title">
        <div class="section-heading-row">
          <div>
            <h2 id="appointments-overview-title">Agenda de hoy</h2>
            <p>El día, cita por cita.</p>
          </div>
          <CalendarDays size={20} aria-hidden="true" />
        </div>
        <dl class="appointment-stats">
          <div><dt>Citas</dt><dd>{summary.appointmentCount}</dd></div>
          <div><dt>Pendientes</dt><dd>{summary.pendingCount}</dd></div>
          <div><dt>Confirmadas</dt><dd>{summary.confirmedCount}</dd></div>
          <div><dt>Completadas</dt><dd>{summary.completedCount}</dd></div>
          <div><dt>Canceladas</dt><dd>{summary.cancelledCount}</dd></div>
        </dl>
      </section>

      <div class="dashboard-lower-grid">
        <section class="timeline-section" aria-label="Próximas citas">
          <div class="section-heading-row">
            <div>
              <h2>Próximas citas</h2>
              <p>Reservas confirmadas y pendientes.</p>
            </div>
            <Clock3 size={20} aria-hidden="true" />
          </div>
          {upcoming.length === 0 ? (
            <p class="empty-message">No hay citas próximas.</p>
          ) : (
            <ol class="appointment-timeline">
              {upcoming.map((appointment) => (
                <li class="timeline-item" key={appointment.id}>
                  <time dateTime={appointment.startsAt}>{formatTime(appointment.startsAt, now)}</time>
                  <span class={`timeline-marker status-${appointment.status}`} aria-hidden="true" />
                  <div class="timeline-details">
                    <strong>{appointment.clientName}</strong>
                    <span>{appointment.serviceName} · {appointment.barberName}</span>
                  </div>
                  <span class={`status-label status-${appointment.status}`}>
                    {statusLabels[appointment.status]}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section class="activity-section" aria-labelledby="activity-title">
          <div class="section-heading-row">
            <div>
              <h2 id="activity-title">Actividad reciente</h2>
              <p>Movimientos registrados recientemente.</p>
            </div>
            <Activity size={20} aria-hidden="true" />
          </div>
          {recentActivity.length === 0 ? (
            <p class="empty-message">Todavía no hay actividad para mostrar.</p>
          ) : (
            <ul class="activity-list">
              {recentActivity.map((activity) => (
                <li class="activity-item" key={activity.id}>
                  <span class="activity-icon" aria-hidden="true">
                    {activity.amount === null ? <CalendarDays size={17} /> : <ArrowUpRight size={17} />}
                  </span>
                  <div>
                    <strong>{activity.title}</strong>
                    <span>{activity.detail}</span>
                  </div>
                  <span class="activity-amount">
                    {activity.amount === null ? formatTime(activity.time, now) : formatCurrency(activity.amount, currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
