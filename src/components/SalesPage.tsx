import { useMemo, useState } from 'preact/hooks';
import { CalendarDays } from 'lucide-preact';
import { createDemoData } from '../data/demo';
import { loadAgendaState } from '../services/agenda-store';
import { filterSales, getPromotionSalesInsights, getSalesBreakdown, getSalesTrend, summarizeSales, type SalesFilters } from '../services/sales';
import type { PromotionRecord } from '../types/agenda';
import type { SalePaymentMethod, SaleRecord } from '../types/domain';
import { AdminGate } from './AdminGate';
import { AdminShell } from './AdminShell';
import { Dropdown } from './Dropdown';
import { MobileMonthCalendar } from './MobileMonthCalendar';
import '../styles/sales.css';

interface SalesPageProps {
  now?: Date;
}

const paymentMethodLabels: Record<SalePaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
};

const allOption = { value: '', label: 'Todos' };

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatAmount(value: number): string {
  return `$${Math.round(value).toLocaleString('es')}`;
}

function readPromotions(now: Date): PromotionRecord[] {
  try {
    return loadAgendaState(window.localStorage, now).state.promotions ?? [];
  } catch {
    return [];
  }
}

function SalesTrend({ sales }: { sales: SaleRecord[] }) {
  const buckets = getSalesTrend(sales);
  if (buckets.length === 0) return <p class="sales-empty-chart">No hay ventas para graficar con estos filtros.</p>;

  const width = Math.max(560, buckets.length * 32);
  const height = 136;
  const padding = 12;
  const plotHeight = 96;
  const bandWidth = width / buckets.length;
  const barWidth = Math.min(20, bandWidth * 0.56);
  const max = Math.max(1, ...buckets.map(({ netTotal }) => netTotal));

  return (
    <figure class="sales-trend" aria-label="Tendencia de ventas">
      <div class="sales-trend-scroll">
        <svg class="sales-trend-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Ventas netas por día">
          <line x1="0" y1={padding + plotHeight} x2={width} y2={padding + plotHeight} class="sales-chart-axis" />
          {buckets.map((bucket, index) => {
            const barHeight = bucket.netTotal / max * plotHeight;
            return (
              <rect
                key={bucket.date}
                x={index * bandWidth + (bandWidth - barWidth) / 2}
                y={padding + plotHeight - barHeight}
                width={barWidth}
                height={Math.max(2, barHeight)}
                rx="3"
                class="sales-chart-bar"
              >
                <title>{formatDate(bucket.date)}: {formatAmount(bucket.netTotal)} netos</title>
              </rect>
            );
          })}
        </svg>
        <ol class="sales-trend-labels" style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(1rem, 1fr))` }} aria-hidden="true">
          {buckets.map(({ date }, index) => <li key={date} title={formatDate(date)}>{index % 7 === 0 || index === buckets.length - 1 ? new Intl.DateTimeFormat('es', { day: 'numeric' }).format(new Date(`${date}T12:00:00`)) : ''}</li>)}
        </ol>
      </div>
      <figcaption>Importes netos del periodo seleccionado · ejemplos en $</figcaption>
      <ul class="sales-trend-accessible" aria-label="Valores diarios de ventas netas">
        {buckets.map(({ date, saleCount, netTotal }) => <li key={date}>{formatDate(date)}: {formatAmount(netTotal)} netos, {saleCount} {saleCount === 1 ? 'venta' : 'ventas'}</li>)}
      </ul>
    </figure>
  );
}

export function SalesPage({ now = new Date() }: SalesPageProps) {
  const [sales] = useState(() => createDemoData(now).sales);
  const [promotions] = useState(() => readPromotions(now));
  const [filters, setFilters] = useState<SalesFilters>({
    query: '', startDate: '', endDate: '', employeeId: '', productId: '', serviceId: '', promotionId: '',
  });
  const [selectedSaleId, setSelectedSaleId] = useState<string>();
  const [dateField, setDateField] = useState<'start' | 'end'>('start');
  const [calendarDate, setCalendarDate] = useState(dateKey(now));
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const employees = useMemo(() => [...new Map(sales.flatMap((sale) => sale.employeeId && sale.employeeName
    ? [[sale.employeeId, sale.employeeName] as const]
    : [])).entries()].sort((first, second) => first[1].localeCompare(second[1], 'es')),
  [sales]);
  const products = useMemo(() => [...new Map(sales.flatMap((sale) => sale.items
    .filter((item) => item.kind === 'product' && item.catalogItemId)
    .map((item) => [item.catalogItemId!, item.name] as const))).entries()].sort((first, second) => first[1].localeCompare(second[1], 'es')),
  [sales]);
  const services = useMemo(() => [...new Map(sales.flatMap((sale) => sale.items
    .filter((item) => item.kind === 'service' && item.catalogItemId)
    .map((item) => [item.catalogItemId!, item.name] as const))).entries()].sort((first, second) => first[1].localeCompare(second[1], 'es')),
  [sales]);
  const promotionOptions = useMemo(() => {
    const labels = new Map(promotions.map(({ id, name }) => [id, name]));
    for (const sale of sales) {
      if (sale.promotionId) labels.set(sale.promotionId, sale.promotionName ?? sale.promotionId);
    }
    return [...labels.entries()].sort((first, second) => first[1].localeCompare(second[1], 'es'));
  }, [promotions, sales]);

  const visibleSales = useMemo(() => filterSales(sales, filters)
    .sort((first, second) => second.occurredAt.localeCompare(first.occurredAt)), [filters, sales]);
  const summary = useMemo(() => summarizeSales(visibleSales), [visibleSales]);
  const breakdown = useMemo(() => getSalesBreakdown(visibleSales), [visibleSales]);
  const salesForPromotionAnalysis = useMemo(
    () => filterSales(sales, { ...filters, promotionId: '' }),
    [filters, sales],
  );
  const promotionInsights = useMemo(
    () => getPromotionSalesInsights(salesForPromotionAnalysis, promotions),
    [promotions, salesForPromotionAnalysis],
  );
  const selectedSale = visibleSales.find(({ id }) => id === selectedSaleId);

  function updateFilter<Key extends keyof SalesFilters>(key: Key, value: SalesFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function chooseDate(value: string) {
    if (dateField === 'start') {
      setFilters((current) => ({ ...current, startDate: value, ...(current.endDate && current.endDate < value ? { endDate: value } : {}) }));
    } else {
      setFilters((current) => ({ ...current, endDate: value, ...(current.startDate && current.startDate > value ? { startDate: value } : {}) }));
    }
    setCalendarDate(value);
    setDatePickerOpen(false);
  }

  const startLabel = filters.startDate ? `Desde: ${formatDate(filters.startDate)}` : 'Desde cualquier fecha';
  const endLabel = filters.endDate ? `Hasta: ${formatDate(filters.endDate)}` : 'Hasta cualquier fecha';

  return (
    <AdminGate>
      <AdminShell activeSection="Ventas">
        <section class="sales-page" aria-labelledby="sales-page-title">
          <header class="agenda-heading sales-heading">
            <div>
              <h1 id="sales-page-title">Ventas</h1>
              <p>Consulta los registros, sus descuentos y el rendimiento del periodo.</p>
            </div>
          </header>

          {selectedSale ? (
            <section class="sales-detail" aria-labelledby="sales-detail-title">
              <button class="appointment-form-cancel" type="button" onClick={() => setSelectedSaleId(undefined)}>Volver a ventas</button>
              <header>
                <div>
                  <h2 id="sales-detail-title">Venta {selectedSale.id}</h2>
                  <span class="sales-status">{selectedSale.status === 'completed' ? 'Completada' : 'Registrada'}</span>
                </div>
                <time dateTime={selectedSale.occurredAt}>{formatDateTime(selectedSale.occurredAt)}</time>
              </header>
              <dl class="sales-detail-metadata">
                <div><dt>Empleado</dt><dd>{selectedSale.employeeName ?? 'No registrado'}</dd></div>
                <div><dt>Método de pago</dt><dd>{selectedSale.paymentMethod ? paymentMethodLabels[selectedSale.paymentMethod] : 'No registrado'}</dd></div>
                <div><dt>Promoción atribuida</dt><dd>{selectedSale.promotionName ?? 'Ninguna'}</dd></div>
              </dl>
              <div class="sales-detail-table-wrap">
                <table class="sales-detail-table">
                  <thead><tr><th>Artículo</th><th>Tipo</th><th>Cantidad</th><th>Precio unitario</th><th>Importe</th></tr></thead>
                  <tbody>
                    {selectedSale.items.map((item, index) => (
                      <tr key={`${item.catalogItemId ?? item.name}-${index}`}>
                        <th scope="row">{item.name}</th>
                        <td>{item.kind === 'product' ? 'Producto' : item.kind === 'service' ? 'Servicio' : 'Artículo'}</td>
                        <td>{item.quantity}</td>
                        <td>{formatAmount(item.unitPrice)}</td>
                        <td>{formatAmount(item.unitPrice * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <dl class="sales-detail-totals">
                <div><dt>Subtotal</dt><dd>{formatAmount(selectedSale.grossTotal)}</dd></div>
                <div><dt>Descuentos</dt><dd>−{formatAmount(selectedSale.discountTotal)}</dd></div>
                <div><dt>Total neto</dt><dd>{formatAmount(selectedSale.netTotal)}</dd></div>
              </dl>
            </section>
          ) : (
            <>
              <section class="sales-summary" aria-label="Resumen de ventas filtradas">
                <article><span>Ventas</span><strong>{summary.saleCount}</strong><small>Registros encontrados</small></article>
                <article><span>Ingresos brutos</span><strong>{formatAmount(summary.grossTotal)}</strong><small>Antes de descuentos · $</small></article>
                <article><span>Descuentos</span><strong>{formatAmount(summary.discountTotal)}</strong><small>Aplicados en registros · $</small></article>
                <article><span>Ingresos netos</span><strong>{formatAmount(summary.netTotal)}</strong><small>Ticket promedio: {formatAmount(summary.saleCount ? summary.netTotal / summary.saleCount : 0)}</small></article>
              </section>

              <section class="sales-trend-section" aria-labelledby="sales-trend-title">
                <div class="sales-section-heading">
                  <div><h2 id="sales-trend-title">Tendencia diaria</h2><p>Ingresos netos según los filtros seleccionados.</p></div>
                </div>
                <SalesTrend sales={visibleSales} />
              </section>

              <section class="sales-filter-panel" aria-label="Filtros de ventas">
                <label class="sales-search-control">
                  <span>Buscar ventas</span>
                  <input type="search" aria-label="Buscar ventas" placeholder="Folio, artículo, empleado o promoción" value={filters.query} onInput={(event) => updateFilter('query', event.currentTarget.value)} />
                </label>
                <div class="sales-filter-grid">
                  <div class="sales-filter-control"><span>Empleado</span><Dropdown label="Empleado" value={filters.employeeId} options={[allOption, ...employees.map(([value, label]) => ({ value, label }))]} onChange={(value) => updateFilter('employeeId', value)} /></div>
                  <div class="sales-filter-control"><span>Producto</span><Dropdown label="Producto" value={filters.productId} options={[allOption, ...products.map(([value, label]) => ({ value, label }))]} onChange={(value) => updateFilter('productId', value)} /></div>
                  <div class="sales-filter-control"><span>Servicio</span><Dropdown label="Servicio" value={filters.serviceId} options={[allOption, ...services.map(([value, label]) => ({ value, label }))]} onChange={(value) => updateFilter('serviceId', value)} /></div>
                  <div class="sales-filter-control"><span>Promoción atribuida</span><Dropdown label="Promoción" value={filters.promotionId} options={[{ value: '', label: 'Todas' }, ...promotionOptions.map(([value, label]) => ({ value, label }))]} onChange={(value) => updateFilter('promotionId', value)} /></div>
                </div>
                <div class="sales-date-filters" aria-label="Filtrar por fechas">
                  <button type="button" class="appointment-form-cancel" aria-label={startLabel} aria-pressed={dateField === 'start'} onClick={() => { setDateField('start'); setCalendarDate(filters.startDate || dateKey(now)); setDatePickerOpen(true); }}>
                    <CalendarDays size={17} aria-hidden="true" />{startLabel}
                  </button>
                  <button type="button" class="appointment-form-cancel" aria-label={endLabel} aria-pressed={dateField === 'end'} onClick={() => { setDateField('end'); setCalendarDate(filters.endDate || dateKey(now)); setDatePickerOpen(true); }}>
                    <CalendarDays size={17} aria-hidden="true" />{endLabel}
                  </button>
                  {(filters.startDate || filters.endDate) && <button type="button" class="sales-clear-dates" onClick={() => setFilters((current) => ({ ...current, startDate: '', endDate: '' }))}>Limpiar fechas</button>}
                  {datePickerOpen && (
                    <div class="sales-calendar-popover" onClick={(event) => event.stopPropagation()}>
                      <MobileMonthCalendar
                        selectedDate={(dateField === 'start' ? filters.startDate : filters.endDate) || dateKey(now)}
                        displayedMonth={calendarDate}
                        appointments={[]}
                        onNavigateMonth={setCalendarDate}
                        onSelectDate={chooseDate}
                      />
                    </div>
                  )}
                </div>
              </section>

              <div class="sales-report-grid">
                <section class="sales-breakdown-section" aria-labelledby="sales-breakdown-title">
                  <div class="sales-section-heading"><div><h2 id="sales-breakdown-title">Productos y servicios</h2><p>Unidades e importes brutos por artículo.</p></div></div>
                  <div class="sales-breakdown-columns">
                    <div><h3>Productos</h3>{breakdown.products.length ? <ul>{breakdown.products.map((item) => <li key={item.id}><span>{item.name} · {item.units} {item.units === 1 ? 'unidad' : 'unidades'}</span><strong>{formatAmount(item.grossTotal)}</strong></li>)}</ul> : <p>Sin productos para estos filtros.</p>}</div>
                    <div><h3>Servicios</h3>{breakdown.services.length ? <ul>{breakdown.services.map((item) => <li key={item.id}><span>{item.name} · {item.units} {item.units === 1 ? 'unidad' : 'unidades'}</span><strong>{formatAmount(item.grossTotal)}</strong></li>)}</ul> : <p>Sin servicios para estos filtros.</p>}</div>
                  </div>
                  <div class="sales-employee-breakdown"><h3>Por empleado</h3>{breakdown.employees.length ? <ul>{breakdown.employees.map((employee) => <li key={employee.id}><span>{employee.name} · {employee.saleCount} {employee.saleCount === 1 ? 'venta' : 'ventas'}</span><strong>{formatAmount(employee.netTotal)}</strong></li>)}</ul> : <p>Sin empleados asociados a estos filtros.</p>}</div>
                </section>

                <section class="sales-promotion-section" aria-labelledby="sales-promotion-title">
                  <div class="sales-section-heading"><div><h2 id="sales-promotion-title">Promociones</h2><p>La coincidencia de fechas no demuestra atribución.</p></div></div>
                  {promotionInsights.length ? (
                    <ul class="sales-promotion-list">
                      {promotionInsights.map((insight) => (
                        <li key={insight.id}>
                          <h3>{insight.name}</h3>
                          <div><span>Ventas atribuidas explícitamente</span><strong>{insight.attributedSalesCount} · {formatAmount(insight.attributedNetTotal)}</strong></div>
                          {insight.hasDateWindow
                            ? <div><span>Ventas dentro de vigencia, sin atribución</span><strong>{insight.occurredDuringSalesCount} · {formatAmount(insight.occurredDuringNetTotal)}</strong></div>
                            : <p>Sin fechas de vigencia disponibles para comparar.</p>}
                        </li>
                      ))}
                    </ul>
                  ) : <p>No hay promociones registradas para comparar.</p>}
                </section>
              </div>

              <section class="sales-register" aria-labelledby="sales-register-title">
                <div class="sales-section-heading"><div><h2 id="sales-register-title">Registros de ventas</h2><p>{summary.saleCount} {summary.saleCount === 1 ? 'registro' : 'registros'} con los filtros actuales.</p></div></div>
                {visibleSales.length ? (
                  <ul class="sales-record-list" aria-label="Registros de ventas">
                    {visibleSales.map((sale) => (
                      <li key={sale.id}>
                        <article class="sales-record-row" aria-label={`Venta ${sale.id}`}>
                          <button type="button" class="sales-record-open" aria-label={`Ver venta ${sale.id}`} onClick={() => setSelectedSaleId(sale.id)}>
                            <strong>{sale.id}</strong>
                            <span>{sale.items.map(({ name }) => name).join(' · ')}</span>
                          </button>
                          <time dateTime={sale.occurredAt}>{formatDateTime(sale.occurredAt)}</time>
                          <span>{sale.employeeName ?? 'Empleado no registrado'}</span>
                          <strong>{formatAmount(sale.netTotal)}</strong>
                          <span class="sales-record-promotion">{sale.promotionName ? `Promoción atribuida: ${sale.promotionName}` : 'Sin promoción atribuida'}</span>
                          <span class="sales-status">{sale.status === 'completed' ? 'Completada' : 'Registrada'}</span>
                        </article>
                      </li>
                    ))}
                  </ul>
                ) : <p class="sales-empty-state">No hay ventas que coincidan con estos filtros.</p>}
              </section>
            </>
          )}
        </section>
      </AdminShell>
    </AdminGate>
  );
}
