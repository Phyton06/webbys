import { useMemo, useState } from 'preact/hooks';
import { CalendarDays } from 'lucide-preact';
import { createDemoData } from '../data/demo';
import { loadAgendaState } from '../services/agenda-store';
import { getEmployeePerformance, getItemRanking, getPeriodComparison, getPromotionAnalytics } from '../services/analytics';
import { formatCurrency, getCurrentBusinessCurrency } from '../services/currency';
import { filterSales } from '../services/sales';
import type { PromotionRecord } from '../types/agenda';
import { AdminGate } from './AdminGate';
import { AdminShell } from './AdminShell';
import { MobileMonthCalendar } from './MobileMonthCalendar';
import { SalesTrend } from './SalesTrend';
import '../styles/analytics.css';

interface AnalyticsPageProps {
  now?: Date;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function addDays(date: Date, days: number): Date {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}

function readPromotions(now: Date): PromotionRecord[] {
  try {
    return loadAgendaState(window.localStorage, now).state.promotions ?? [];
  } catch {
    return [];
  }
}

function formatPercent(percent: number | null): string {
  if (percent === null) return 'sin periodo anterior comparable';
  return `${percent > 0 ? '+' : ''}${new Intl.NumberFormat('es', { maximumFractionDigits: 1 }).format(percent)}%`;
}

function deltaLabel(absolute: number, percent: number | null, format: (value: number) => string): string {
  const sign = absolute > 0 ? '+' : absolute < 0 ? '−' : '';
  return `${sign}${format(Math.abs(absolute))} · ${formatPercent(percent)}`;
}

export function AnalyticsPage({ now = new Date() }: AnalyticsPageProps) {
  const [sales] = useState(() => createDemoData(now).sales);
  const [currency] = useState(getCurrentBusinessCurrency);
  const [promotions] = useState(() => readPromotions(now));
  const [range, setRange] = useState(() => ({ startDate: dateKey(addDays(now, -29)), endDate: dateKey(now) }));
  const [dateField, setDateField] = useState<'start' | 'end'>('start');
  const [calendarDate, setCalendarDate] = useState(() => dateKey(addDays(now, -29)));
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const rangeSales = useMemo(() => filterSales(sales, {
    query: '', startDate: range.startDate, endDate: range.endDate, employeeId: '', productId: '', serviceId: '', promotionId: '',
  }).sort((first, second) => second.occurredAt.localeCompare(first.occurredAt)), [sales, range]);
  const comparison = useMemo(() => getPeriodComparison(sales, range.startDate, range.endDate), [sales, range]);
  const productRanking = useMemo(() => getItemRanking(rangeSales, 'product'), [rangeSales]);
  const serviceRanking = useMemo(() => getItemRanking(rangeSales, 'service'), [rangeSales]);
  const employeePerformance = useMemo(() => getEmployeePerformance(rangeSales), [rangeSales]);
  const promotionReport = useMemo(
    () => getPromotionAnalytics(sales, promotions, range.startDate, range.endDate),
    [sales, promotions, range],
  );

  function chooseDate(value: string) {
    if (dateField === 'start') {
      setRange((current) => ({ ...current, startDate: value, endDate: current.endDate < value ? value : current.endDate }));
    } else {
      setRange((current) => ({ ...current, endDate: value, startDate: current.startDate > value ? value : current.startDate }));
    }
    setCalendarDate(value);
    setDatePickerOpen(false);
  }

  const startLabel = `Desde: ${formatDate(range.startDate)}`;
  const endLabel = `Hasta: ${formatDate(range.endDate)}`;
  const selectedRangeLabel = range.startDate === range.endDate
    ? formatDate(range.startDate)
    : `${formatDate(range.startDate)} – ${formatDate(range.endDate)}`;

  return (
    <AdminGate>
      <AdminShell activeSection="Analíticas">
        <section class="analytics-page" aria-labelledby="analytics-page-title">
          <header class="agenda-heading analytics-heading">
            <div>
              <h1 id="analytics-page-title">Analíticas</h1>
              <p>Comparación de periodos, evolución y rendimiento de promociones sobre los registros demo.</p>
            </div>
          </header>

          <section class="analytics-date-period" aria-label="Periodo de análisis">
            <div class="analytics-section-heading">
              <div><h2>Periodo de análisis</h2><p>Rango seleccionado · {selectedRangeLabel}</p></div>
            </div>
            <div class="analytics-date-filters" aria-label="Elegir rango de fechas">
              <button type="button" class="appointment-form-cancel" aria-label={startLabel} aria-pressed={dateField === 'start'} onClick={() => { setDateField('start'); setCalendarDate(range.startDate || dateKey(now)); setDatePickerOpen(true); }}>
                <CalendarDays size={17} aria-hidden="true" />{startLabel}
              </button>
              <button type="button" class="appointment-form-cancel" aria-label={endLabel} aria-pressed={dateField === 'end'} onClick={() => { setDateField('end'); setCalendarDate(range.endDate || dateKey(now)); setDatePickerOpen(true); }}>
                <CalendarDays size={17} aria-hidden="true" />{endLabel}
              </button>
              {datePickerOpen && (
                <div class="appointment-date-picker-popover" onClick={(event) => event.stopPropagation()}>
                  <MobileMonthCalendar
                    selectedDate={(dateField === 'start' ? range.startDate : range.endDate) || dateKey(now)}
                    displayedMonth={calendarDate}
                    appointments={[]}
                    onNavigateMonth={setCalendarDate}
                    onSelectDate={chooseDate}
                  />
                </div>
              )}
            </div>
          </section>

          <section class="analytics-summary" aria-label="Resumen comparativo">
            <article>
              <span>Ingresos netos</span>
              <strong>{formatCurrency(comparison.current.netTotal, currency)}</strong>
              <small>Periodo anterior: {formatCurrency(comparison.previous.netTotal, currency)}</small>
              <em>{deltaLabel(comparison.deltas.netTotal.absolute, comparison.deltas.netTotal.percent, (value) => formatCurrency(value, currency))}</em>
            </article>
            <article>
              <span>Ventas</span>
              <strong>{comparison.current.saleCount}</strong>
              <small>Periodo anterior: {comparison.previous.saleCount}</small>
              <em>{deltaLabel(comparison.deltas.saleCount.absolute, comparison.deltas.saleCount.percent, (value) => String(value))}</em>
            </article>
            <article>
              <span>Ticket promedio</span>
              <strong>{formatCurrency(comparison.current.averageTicket, currency)}</strong>
              <small>Periodo anterior: {formatCurrency(comparison.previous.averageTicket, currency)}</small>
              <em>{deltaLabel(comparison.deltas.averageTicket.absolute, comparison.deltas.averageTicket.percent, (value) => formatCurrency(value, currency))}</em>
            </article>
            <article>
              <span>Brutos y descuentos</span>
              <strong>{formatCurrency(comparison.current.grossTotal, currency)}</strong>
              <small>Descuentos: {formatCurrency(comparison.current.discountTotal, currency)}</small>
              <em>Neto: {formatCurrency(comparison.current.netTotal, currency)}</em>
            </article>
          </section>

          <section class="analytics-trend-section" aria-labelledby="analytics-trend-title">
            <div class="analytics-section-heading">
              <div><h2 id="analytics-trend-title">Evolución diaria</h2><p>Ingresos netos por día del rango seleccionado.</p></div>
            </div>
            <SalesTrend sales={rangeSales} currency={currency} />
          </section>

          <div class="analytics-report-grid">
            <section class="analytics-ranking-section" aria-labelledby="analytics-products-title">
              <div class="analytics-section-heading">
                <div><h2 id="analytics-products-title">Productos más vendidos</h2><p>Unidades e ingresos netos, con descuentos repartidos proporcionalmente.</p></div>
              </div>
              {productRanking.length ? (
                <ol class="analytics-ranking-list" aria-label="Productos más vendidos">
                  {productRanking.map((item, index) => (
                    <li key={item.id}>
                      <span>{index + 1}. {item.name} · {item.units} {item.units === 1 ? 'unidad' : 'unidades'}</span>
                      <strong>{formatCurrency(item.netTotal, currency)}</strong>
                    </li>
                  ))}
                </ol>
              ) : <p>Sin productos vendidos en el periodo.</p>}
            </section>

            <section class="analytics-ranking-section" aria-labelledby="analytics-services-title">
              <div class="analytics-section-heading">
                <div><h2 id="analytics-services-title">Servicios más vendidos</h2><p>Unidades e ingresos netos, con descuentos repartidos proporcionalmente.</p></div>
              </div>
              {serviceRanking.length ? (
                <ol class="analytics-ranking-list" aria-label="Servicios más vendidos">
                  {serviceRanking.map((item, index) => (
                    <li key={item.id}>
                      <span>{index + 1}. {item.name} · {item.units} {item.units === 1 ? 'unidad' : 'unidades'}</span>
                      <strong>{formatCurrency(item.netTotal, currency)}</strong>
                    </li>
                  ))}
                </ol>
              ) : <p>Sin servicios vendidos en el periodo.</p>}
            </section>

            <section class="analytics-ranking-section" aria-labelledby="analytics-employees-title">
              <div class="analytics-section-heading">
                <div><h2 id="analytics-employees-title">Rendimiento por empleado</h2><p>Ventas, ingresos netos y ticket promedio.</p></div>
              </div>
              {employeePerformance.length ? (
                <ol class="analytics-ranking-list" aria-label="Rendimiento por empleado">
                  {employeePerformance.map((employee, index) => (
                    <li key={employee.id}>
                      <span>{index + 1}. {employee.name} · {employee.saleCount} {employee.saleCount === 1 ? 'venta' : 'ventas'}</span>
                      <strong>{formatCurrency(employee.netTotal, currency)}</strong>
                      <small>Ticket promedio: {formatCurrency(employee.averageTicket, currency)}</small>
                    </li>
                  ))}
                </ol>
              ) : <p>Sin datos de empleados en el periodo.</p>}
            </section>
          </div>

          <section class="analytics-promotion-section" aria-labelledby="analytics-promotion-title">
            <div class="analytics-section-heading">
              <div>
                <h2 id="analytics-promotion-title">Promociones</h2>
                <p>La coincidencia de fechas no demuestra atribución.</p>
              </div>
            </div>
            <p class="analytics-benchmark">Ventas sin promoción atribuida en el rango: {promotionReport.withoutPromotion.saleCount} · {formatCurrency(promotionReport.withoutPromotion.netTotal, currency)}</p>
            <p class="analytics-ranking-note">Ordenadas por ingresos atribuidos, de mayor a menor. Las posiciones marcan mejor y menor desempeño observado.</p>
            {promotionReport.promotions.length ? (
              <ol class="analytics-promotion-list" aria-label="Promociones ordenadas por ingresos atribuidos">
                {promotionReport.promotions.map((promotion, index) => (
                  <li key={promotion.id}>
                    <h3>{index + 1}. {promotion.name}</h3>
                    <div><span>Ventas atribuidas</span><strong>{promotion.attributedSalesCount} · {formatCurrency(promotion.attributedNetTotal, currency)}</strong></div>
                    <div><span>Descuentos concedidos</span><strong>{formatCurrency(promotion.attributedDiscountTotal, currency)} · {promotion.attributedUnits} {promotion.attributedUnits === 1 ? 'unidad' : 'unidades'}</strong></div>
                    {promotion.hasDateWindow ? (
                      <>
                        <div><span>En su ventana sin atribución</span><strong>{promotion.occurredDuringSalesCount} · {formatCurrency(promotion.occurredDuringNetTotal, currency)}</strong></div>
                        {promotion.windowComparison && (
                          <div>
                            <span>Su ventana vs. ventana anterior de igual duración</span>
                            <strong>{formatCurrency(promotion.windowComparison.currentNetTotal, currency)} vs {formatCurrency(promotion.windowComparison.previousNetTotal, currency)} · {formatPercent(promotion.windowComparison.delta.percent)}</strong>
                          </div>
                        )}
                      </>
                    ) : <p class="analytics-promotion-window-note">Sin ventana de fechas comparable.</p>}
                    {promotion.dailyAttributed.length > 0 && (
                      <ul class="analytics-promotion-days" aria-label={`Evolución diaria atribuida de ${promotion.name}`}>
                        {promotion.dailyAttributed.map(({ date, netTotal }) => <li key={date}>{formatDate(date)}: {formatCurrency(netTotal, currency)} netos</li>)}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            ) : <p>No hay promociones registradas para analizar.</p>}
          </section>
        </section>
      </AdminShell>
    </AdminGate>
  );
}
