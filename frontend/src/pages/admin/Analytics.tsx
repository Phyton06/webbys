import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

const DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
]

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]

export default function Analytics() {
  const [summary, setSummary] = useState<any>(null)
  const [period, setPeriod] = useState<string>('30d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/analytics/summary?period=${period}`).then(r => setSummary(r.data)).finally(() => setLoading(false))
  }, [period])

  if (loading && !summary) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="bg-[var(--surface)] min-h-screen p-6">
      <h1 className="text-2xl font-display font-bold text-white">Análisis y Métricas del Negocio</h1>

      {/* Period selector and KPI cards */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded border [var(--border)] py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
        >
          <option value="7d">Últimos 7 días</option>
          <option value="30d">Últimos 30 días</option>
          <option value="90d">Últimos 90 días</option>
          <option value="1y">Este año</option>
        </select>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {summary && summary.kpis?.map((kpi: any, idx: number) => {
            const displayVal = kpi.label.toLowerCase().includes('ingreso') || kpi.label.toLowerCase().includes('ticket')
              ? `$${kpi.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
              : kpi.label.toLowerCase().includes('tasa')
                ? `${kpi.value.toFixed(1)}%`
                : kpi.value.toLocaleString()

            const trendColor =
              kpi.trend === 'UP' ? 'text-cyan-400' : kpi.trend === 'DOWN' ? 'text-red-400' : 'text-gray-400'
            const trendIcon = kpi.trend === 'UP' ? '↑' : kpi.trend === 'DOWN' ? '↓' : '→'

            return (
              <div
                key={idx}
                className="border border-[var(--border)] rounded-xl p-4 bg-[var(--surface)] transition-colors hover:border-cyan-500/30"
              >
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">{kpi.label}</span>
                <h2 className="text-xl font-bold text-white">{displayVal}</h2>
                <div className="flex justify-between text-sm">
                  <span className={trendColor}>{trendIcon} {Math.abs(kpi.change)}% vs anterior</span>
                </div>
              </div>
            )
          })}
          {/* Tasa de No-Show card */}
          <div
            key="no-show"
            className="border border-[var(--border)] rounded-xl p-4 bg-[var(--surface)] transition-colors hover:border-cyan-500/30"
          >
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Tasa de No-Show</span>
            <h2 className="text-xl font-bold text-white">{summary?.noShowRate?.toFixed(1) || '0'}%</h2>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Inasistencia sin previo aviso</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Retention Trend */}
      <div className="rounded-2xl border [var(--border)] bg-[var(--surface)] p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-3">Tendencia de Retención de Clientes</h2>
        <p className="text-sm text-gray-400 mb-4">Porcentaje y volumen de clientes que regresan mes a mes vs clientes inactivos.</p>

        {summary?.retention && summary.retention.length > 0 ? (
          <div className="space-y-6">
            {/* Native SVG Trend Line */}
            <div className="w-full overflow-x-auto">
              <svg viewBox="0 0 600 160" className="w-full h-40">
                <defs>
                  <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00BCD4" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#00BCD4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Area under polyline */}
                {summary.retention.length > 1 && (
                  <polygon
                    points={`40,140 ${summary.retention.map((r: any, i) => {
                      const x = 40 + (i / (summary.retention.length - 1)) * 520
                      const y = 140 - (r.retained / 100) * 100
                      return `${x},${y}`
                    }).join(' ')}`}
                    fill="url(#retentionGradient)"
                  />
                )}

                {/* Polyline */}
                {summary.retention.length > 0 && (
                  <polyline
                    fill="none"
                    stroke="#00BCD4"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={summary.retention.map((r: any, i) => {
                      const x = 40 + (i / Math.max(summary.retention.length - 1, 1)) * 520
                      const y = 140 - (r.retained / 100) * 100
                      return `${x},${y}`
                    }).join(' ')}
                  />
                )}

                {/* Point nodes and labels */}
                {summary.retention.map((r: any, i) => (
                  <g key={i}>
                    <circle
                      cx={40 + (i / Math.max(summary.retention.length - 1, 1)) * 520}
                      cy={140 - (r.retained / 100) * 100}
                      r="4"
                      fill="#00BCD4"
                    />
                    <text
                      x={40 + (i / Math.max(summary.retention.length - 1, 1)) * 520}
                      y={140 - (r.retained / 100) * 100 - 8}
                      textAnchor="middle"
                      className="text-[10px] font-bold fill-white"
                    >
                      {r.retained}%
                    </text>
                    <text
                      x={40 + (i / Math.max(summary.retention.length - 1, 1)) * 520}
                      y="150"
                      textAnchor="middle"
                      className="text-[10px] font-medium fill-gray-300"
                    >
                      {r.month}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Retention monthly table */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 my-4">
              {summary.retention.map((r: any) => (
                <div
                  key={r.month}
                  className="border border-[var(--border)] rounded-lg p-3 bg-[var(--surface)] text-center"
                >
                  <span className="text-xs font-semibold text-gray-400 block">{r.month}</span>
                  <span className="text-base font-bold text-cyan block mt-1">{r.retained}%</span>
                  <span className="text-[10px] text-gray-400 block">{r.churned} inactivos</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400 text-sm">No hay datos de retención para mostrar.</div>
        )}
      </div>

      {/* Peak Hours Heatmap */}
      <div className="rounded-2xl border [var(--border)] bg-[var(--surface)] p-6 mb-6">
        <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
          <div>
            <h2 className="text-lg font-bold text-white">Mapa de Calor: Horas Pico</h2>
            <p className="text-sm text-gray-400">
              Densidad y volumen de citas por día y hora para optimizar personal y horarios.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span>Baja</span>
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded bg-gray-300" />
              <span className="w-2 h-2 rounded bg-gray-400" />
              <span className="w-2 h-2 rounded bg-cyan-400" />
              <span className="w-2 h-2 rounded bg-cyan-600" />
              <span>Alta</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-center border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left font-semibold text-gray-300 w-24">Día / Hora</th>
                {HOURS.map((h) => (
                  <th key={h} className="p-2 font-semibold text-gray-300 min-w-[2.5rem]">
                    {h}:00
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {DAYS.map((d) => (
                <tr key={d.key}>
                  <td className="p-2 text-left font-semibold text-white">{d.label}</td>
                  {HOURS.map((h) => {
                    const cell = summary?.peakHours?.find(
                      (p: any) => p.day.toLowerCase() === d.key.toLowerCase() && p.hour === h
                    )
                    const count = cell ? cell.count : 0

                    // Color based on count using DESIGN.md palette
                    let colorClass: string
                    if (count >= 15) colorClass = 'bg-cyan-600 text-white'
                    else if (count >= 10) colorClass = 'bg-cyan-500 text-white'
                    else if (count >= 5) colorClass = 'bg-cyan-400 text-black'
                    else if (count > 0) colorClass = 'bg-cyan-200 text-black'
                    else colorClass = 'bg-gray-800 text-gray-400'

                    return (
                      <td key={h} className="p-1">
                        <div
                          title={`${d.label} ${h}:00 - ${count} citas`}
                          className={`rounded py-1 px-1 text-center transition-colors cursor-default ${colorClass}`}
                        >
                          {count > 0 ? count : '-'}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-Column Grid: Customer LTV & Top Services */}
      <div className="grid grid-cols-1 gap-6">
        {/* Customer LTV */}
        <div className="rounded-2xl border [var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-lg font-bold text-white mb-3">Valor de Vida del Cliente (LTV)</h2>
          <p className="text-sm text-gray-400">
            Ranking de clientes más valiosos según gasto total acumulado y recurrencia.
          </p>

          {summary?.customerLifetimeValue?.map((c: any, idx: number) => (
            <div
              key={c.clientId}
              className="border-b border-[var(--border)] py-3 last:border-0 hover:bg-[var(--surface)] transition-colors"
            >
              <div className="flex justify-between text-sm">
                <span className="text-text-primary font-medium">{c.name}</span>
                <span className="text-sm text-gray-300">{idx + 1}°</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">{c.visits} visitas</span>
                <span className="font-bold text-cyan">${c.ltv.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Top Services Breakdown */}
        <div className="rounded-2xl border [var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-lg font-bold text-white mb-3">Servicios Más Solicitados</h2>
          <p className="text-sm text-gray-400">
            Servicios líderes en volumen de reservas e ingresos generados.
          </p>

          {summary?.topServices?.map((svc: any) => {
            const maxServiceCount = Math.max(...(summary.topServices.map((s: any) => s.count) || [1]), 1)
            const percentage = Math.round((svc.count / maxServiceCount) * 100)

            return (
              <div
                key={svc.serviceId}
                className="space-y-2.5 border-b border-[var(--border)] py-2.5 last:border-0 hover:bg-[var(--surface)] transition-colors"
              >
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-text-primary font-semibold">{svc.name}</span>
                  <span className="text-gray-400">{svc.count} citas</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-cyan-500 rounded-full h-2 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}