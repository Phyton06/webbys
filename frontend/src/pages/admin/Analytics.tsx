import { useEffect, useState, useMemo } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import { StatCard } from '../../components/shared/StatCard'
import type { AnalyticsSummary } from '../../services/interfaces'

const DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
]

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]

export default function Analytics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [period, setPeriod] = useState<string>('30d')
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = async (selectedPeriod: string) => {
    try {
      setLoading(true)
      const res = await api.get(`/analytics/summary?period=${selectedPeriod}`)
      setSummary(res.data)
    } catch (err) {
      console.error('Error fetching analytics summary:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics(period)
  }, [period])

  // Heatmap helper: calculate cell intensity
  const maxPeakCount = useMemo(() => {
    if (!summary?.peakHours || summary.peakHours.length === 0) return 1
    return Math.max(...summary.peakHours.map((p) => p.count), 1)
  }, [summary])

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-surface text-text-muted'
    const ratio = count / maxPeakCount
    if (ratio < 0.25) return 'bg-amber-100 text-amber-800'
    if (ratio < 0.5) return 'bg-amber-200 text-amber-900 font-semibold'
    if (ratio < 0.75) return 'bg-amber-400 text-amber-950 font-bold'
    return 'bg-amber-600 text-white font-bold'
  }

  // Retention SVG line/points
  const retentionSvg = useMemo(() => {
    if (!summary?.retention || summary.retention.length === 0) return { line: '', points: [] }
    const width = 600
    const height = 160
    const padX = 40
    const padY = 20

    const maxVal = Math.max(...summary.retention.map((r) => r.retained + r.churned), 100)
    const pts = summary.retention.map((r, i) => {
      const x = padX + (i / Math.max(summary.retention.length - 1, 1)) * (width - padX * 2)
      const y = height - padY - (r.retained / maxVal) * (height - padY * 2)
      return { x, y, month: r.month, retained: r.retained }
    })

    const line = pts.map((p) => `${p.x},${p.y}`).join(' ')
    return { line, points: pts }
  }, [summary])

  if (loading && !summary) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Análisis y Métricas del Negocio</h1>
          <p className="text-sm text-text-muted mt-1">
            Indicadores clave de rendimiento (KPIs), retención de clientes, horas pico y valor acumulado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="period-select" className="text-xs font-semibold text-text-primary">
            Periodo:
          </label>
          <select
            id="period-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-md border border-border bg-surface-elevated py-1.5 px-3 text-sm font-medium shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1y">Este año</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Row */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {summary.kpis.map((kpi, idx) => {
            const isCurrency = kpi.label.toLowerCase().includes('ingreso') || kpi.label.toLowerCase().includes('ticket')
            const displayVal = isCurrency
              ? `$${kpi.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
              : kpi.label.toLowerCase().includes('tasa')
              ? `${kpi.value.toFixed(1)}%`
              : kpi.value.toLocaleString()

            const trendColor =
              kpi.trend === 'UP' ? 'text-badge-success' : kpi.trend === 'DOWN' ? 'text-badge-error' : 'text-text-muted'
            const trendIcon = kpi.trend === 'UP' ? '↑' : kpi.trend === 'DOWN' ? '↓' : '→'

            return (
              <StatCard
                key={idx}
                title={kpi.label}
                value={displayVal}
                subtitle={`${trendIcon} ${kpi.change > 0 ? '+' : ''}${kpi.change}% vs anterior`}
                trend={kpi.change !== 0 ? Math.abs(kpi.change) : undefined}
                trendDirection={kpi.trend === 'UP' ? 'up' : kpi.trend === 'DOWN' ? 'down' : undefined}
                className={trendColor}
              />
            )
          })}

          <StatCard
            title="Tasa de No-Show"
            value={`${summary.noShowRate.toFixed(1)}%`}
            subtitle="Inasistencia sin previo aviso"
            trendDirection={summary.noShowRate > 10 ? 'down' : 'up'}
          />
        </div>
      )}

      {/* Customer Retention Trend Section */}
      <div className="bg-surface-elevated rounded-xl shadow-sm border border-border p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Tendencia de Retención de Clientes</h2>
            <p className="text-xs text-text-muted">
              Porcentaje y volumen de clientes que regresan mes a mes vs clientes inactivos.
            </p>
          </div>
        </div>

        {summary?.retention && summary.retention.length > 0 ? (
          <div className="space-y-6">
            {/* Simple Native SVG Trend Line */}
            <div className="w-full overflow-x-auto">
              <svg viewBox="0 0 600 160" className="w-full h-44">
                <defs>
                  <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d97706" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#d97706" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1="40" y1="30" x2="560" y2="30" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="40" y1="80" x2="560" y2="80" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="40" y1="130" x2="560" y2="130" stroke="#f3f4f6" strokeWidth="1" />

                {/* Area under polyline */}
                {retentionSvg.points.length > 1 && (
                  <polygon
                    points={`40,140 ${retentionSvg.line} 560,140`}
                    fill="url(#retentionGradient)"
                  />
                )}

                {/* Polyline */}
                {retentionSvg.line && (
                  <polyline
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={retentionSvg.line}
                  />
                )}

                {/* Point nodes and labels */}
                {retentionSvg.points.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="5" fill="#d97706" stroke="#fff" strokeWidth="2" />
                    <text
                      x={p.x}
                      y={p.y - 10}
                      textAnchor="middle"
                      className="text-[10px] font-bold fill-gray-700"
                    >
                      {p.retained}%
                    </text>
                    <text
                      x={p.x}
                      y="155"
                      textAnchor="middle"
                      className="text-[10px] font-medium fill-gray-400"
                    >
                      {p.month}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Retention monthly table list */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {summary.retention.map((r) => (
                <div key={r.month} className="bg-surface border border-border rounded-lg p-3 text-center">
                  <span className="text-xs font-semibold text-text-muted block">{r.month}</span>
                  <span className="text-base font-bold text-primary block mt-1">{r.retained}%</span>
                  <span className="text-[10px] text-text-muted block">{r.churned} inactivos</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-text-muted text-sm">No hay datos de retención para mostrar.</div>
        )}
      </div>

      {/* Peak Hours Heatmap Matrix */}
      <div className="bg-surface-elevated rounded-xl shadow-sm border border-border p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Mapa de Calor: Horas Pico</h2>
            <p className="text-xs text-text-muted">
              Densidad y volumen de citas por día y hora para optimizar personal y horarios.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>Baja</span>
            <div className="flex gap-1">
              <span className="w-3 h-3 rounded bg-amber-100" />
              <span className="w-3 h-3 rounded bg-amber-200" />
              <span className="w-3 h-3 rounded bg-amber-400" />
              <span className="w-3 h-3 rounded bg-amber-600" />
            </div>
            <span>Alta</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-center border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left font-semibold text-gray-600 w-24">Día / Hora</th>
                {HOURS.map((h) => (
                  <th key={h} className="p-2 font-semibold text-gray-600 min-w-[3rem]">
                    {h}:00
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DAYS.map((d) => (
                <tr key={d.key}>
                  <td className="p-2 text-left font-semibold text-text-primary">{d.label}</td>
                  {HOURS.map((h) => {
                    const cell = summary?.peakHours?.find(
                      (p) => p.day.toLowerCase() === d.key.toLowerCase() && p.hour === h
                    )
                    const count = cell ? cell.count : 0
                    const colorClass = getHeatmapColor(count)

                    return (
                      <td key={h} className="p-1">
                        <div
                          title={`${d.label} ${h}:00 - ${count} citas`}
                          className={`rounded py-2 px-1 text-center transition-colors cursor-default ${colorClass}`}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer LTV */}
        <div className="bg-surface-elevated rounded-xl shadow-sm border border-border p-6 space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-lg font-bold text-text-primary">Valor de Vida del Cliente (LTV)</h2>
            <p className="text-xs text-text-muted">
              Ranking de clientes más valiosos según gasto total acumulado y recurrencia.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-surface text-text-muted text-xs font-semibold">
                <tr>
                  <th className="px-3 py-2 text-left">Cliente</th>
                  <th className="px-3 py-2 text-center">Visitas</th>
                  <th className="px-3 py-2 text-right">LTV Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summary?.customerLifetimeValue?.map((c, idx) => (
                  <tr key={c.clientId} className="hover:bg-surface">
                    <td className="px-3 py-3 font-medium text-text-primary flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {c.name}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-600">{c.visits}</td>
                    <td className="px-3 py-3 text-right font-bold text-badge-success">
                      ${c.ltv.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Services Breakdown */}
        <div className="bg-surface-elevated rounded-xl shadow-sm border border-border p-6 space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-lg font-bold text-text-primary">Servicios Más Solicitados</h2>
            <p className="text-xs text-text-muted">Servicios líderes en volumen de reservas e ingresos generados.</p>
          </div>

          <div className="space-y-4">
            {summary?.topServices?.map((svc) => {
              const maxServiceCount = Math.max(...(summary.topServices.map((s) => s.count) || [1]), 1)
              const percentage = Math.round((svc.count / maxServiceCount) * 100)

              return (
                <div key={svc.serviceId} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-text-primary font-semibold">{svc.name}</span>
                    <span className="text-text-muted">
                      {svc.count} citas • <strong className="text-text-primary">${svc.revenue.toLocaleString()}</strong>
                    </span>
                  </div>
                  <div className="w-full bg-surface rounded-full h-2.5">
                    <div
                      className="bg-amber-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
