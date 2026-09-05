import { useEffect, useState, useMemo } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import { StatCard } from '../../components/shared/StatCard'
import type { NotificationStats } from '../../services/interfaces'

export default function NotificationStatsPage() {
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [period, setPeriod] = useState<string>('7d')
  const [loading, setLoading] = useState(true)

  const fetchStats = async (selectedPeriod: string) => {
    try {
      setLoading(true)
      const res = await api.get(`/notification-stats?period=${selectedPeriod}`)
      setStats(res.data)
    } catch {
      // Fallback default
      setStats({
        total: 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        byChannel: {},
        byType: {},
        trend: [],
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats(period)
  }, [period])

  const deliveryRate = useMemo(() => {
    if (!stats || !stats.total) return 0
    return Math.round((stats.delivered / stats.total) * 100)
  }, [stats])

  // Chart coordinate calculation for trend line
  const trendPoints = useMemo(() => {
    if (!stats?.trend || stats.trend.length === 0) return ''
    const maxVal = Math.max(...stats.trend.map((t) => t.count), 10)
    const width = 600
    const height = 180
    const padding = 20

    return stats.trend
      .map((item, idx) => {
        const x = padding + (idx / Math.max(stats.trend.length - 1, 1)) * (width - padding * 2)
        const y = height - padding - (item.count / maxVal) * (height - padding * 2)
        return `${x},${y}`
      })
      .join(' ')
  }, [stats])

  if (loading && !stats) return <LoadingSpinner />

  const channelKeys = ['SMS', 'EMAIL', 'PUSH', 'WHATSAPP']

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Estadísticas de Notificaciones
          </h1>
          <p className="text-sm text-text-muted">
            Métricas de entrega, canales y tendencias de envíos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="stats-period" className="text-sm font-medium text-text-primary">
            Período:
          </label>
          <select
            id="stats-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1.5 text-sm bg-surface-elevated border border-border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
          </select>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Notificaciones" value={stats?.total || 0} />
        <StatCard
          title="Tasa de Entrega"
          value={`${deliveryRate}%`}
        />
        <StatCard title="Entregadas" value={stats?.delivered || 0} />
        <StatCard title="Fallidas" value={stats?.failed || 0} />
      </div>

      {/* Channel Breakdown & Trend Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Breakdown */}
        <div className="p-6 bg-surface-elevated rounded-lg border border-border shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-text-primary">Desglose por Canal</h2>
          <div className="space-y-4">
            {channelKeys.map((chKey) => {
              const chData = stats?.byChannel?.[chKey] || { sent: 0, delivered: 0, failed: 0 }
              const rate = chData.sent > 0 ? Math.round((chData.delivered / chData.sent) * 100) : 0

              return (
                <div key={chKey} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-text-primary">{chKey}</span>
                    <span className="text-xs text-text-muted">
                      {chData.sent} enviados • {chData.delivered} entregados • {chData.failed} fallidos ({rate}%)
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-surface h-2.5 rounded-full overflow-hidden flex">
                    <div
                      className="bg-green-500 h-full"
                      style={{ width: `${rate}%` }}
                      title={`Entregados: ${rate}%`}
                    />
                    <div
                      className="bg-red-400 h-full"
                      style={{
                        width: `${
                          chData.sent > 0 ? (chData.failed / chData.sent) * 100 : 0
                        }%`,
                      }}
                      title="Fallidos"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Trend Line Chart */}
        <div className="p-6 bg-surface-elevated rounded-lg border border-border shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-text-primary">Tendencia de Envíos</h2>
          {stats?.trend && stats.trend.length > 0 ? (
            <div className="space-y-2">
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox="0 0 600 180"
                  className="trend-chart w-full h-44 overflow-visible"
                >
                  {/* Grid Lines */}
                  <line x1="20" y1="20" x2="580" y2="20" stroke="#f3f4f6" strokeWidth="1" />
                  <line x1="20" y1="80" x2="580" y2="80" stroke="#f3f4f6" strokeWidth="1" />
                  <line x1="20" y1="140" x2="580" y2="140" stroke="#f3f4f6" strokeWidth="1" />
                  <line x1="20" y1="160" x2="580" y2="160" stroke="#e5e7eb" strokeWidth="1" />

                  {/* Trend Polyline */}
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={trendPoints}
                  />

                  {/* Data Points */}
                  {stats.trend.map((item, idx) => {
                    const maxVal = Math.max(...stats.trend.map((t) => t.count), 10)
                    const x = 20 + (idx / Math.max(stats.trend.length - 1, 1)) * (600 - 40)
                    const y = 180 - 20 - (item.count / maxVal) * (180 - 40)
                    return (
                      <g key={idx}>
                        <circle cx={x} cy={y} r="4" fill="#2563eb" />
                        <text
                          x={x}
                          y={y - 8}
                          fontSize="10"
                          textAnchor="middle"
                          fill="#4b5563"
                        >
                          {item.count}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>

              {/* Date Axis labels */}
              <div className="flex justify-between text-xs text-text-muted px-2 pt-1 border-t border-border">
                <span>{stats.trend[0]?.date}</span>
                <span>{stats.trend[stats.trend.length - 1]?.date}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted py-8 text-center">
              No hay datos de tendencia disponibles
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
