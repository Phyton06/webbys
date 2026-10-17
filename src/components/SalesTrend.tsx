import type { SaleRecord } from '../types/domain';
import { getSalesTrend } from '../services/sales';
import { formatCurrency, getCurrentBusinessCurrency } from '../services/currency';
import '../styles/sales.css';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

export function SalesTrend({ sales, currency }: { sales: SaleRecord[]; currency: ReturnType<typeof getCurrentBusinessCurrency> }) {
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
                <title>{formatDate(bucket.date)}: {formatCurrency(bucket.netTotal, currency)} netos</title>
              </rect>
            );
          })}
        </svg>
        <ol class="sales-trend-labels" style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(1rem, 1fr))` }} aria-hidden="true">
          {buckets.map(({ date }, index) => <li key={date} title={formatDate(date)}>{index % 7 === 0 || index === buckets.length - 1 ? new Intl.DateTimeFormat('es', { day: 'numeric' }).format(new Date(`${date}T12:00:00`)) : ''}</li>)}
        </ol>
      </div>
      <figcaption>Importes netos del periodo seleccionado · {currency}</figcaption>
      <ul class="sales-trend-accessible" aria-label="Valores diarios de ventas netas">
        {buckets.map(({ date, saleCount, netTotal }) => <li key={date}>{formatDate(date)}: {formatCurrency(netTotal, currency)} netos, {saleCount} {saleCount === 1 ? 'venta' : 'ventas'}</li>)}
      </ul>
    </figure>
  );
}
