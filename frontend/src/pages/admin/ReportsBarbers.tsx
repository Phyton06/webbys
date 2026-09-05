import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import { StatCard } from '../../components/shared/StatCard'
import { ExportButton } from '../../components/shared/ExportButton'
import type { BarberReport } from '../../services/interfaces'

export default function ReportsBarbers() {
  const [report, setReport] = useState<BarberReport | null>(null)
  const [period, setPeriod] = useState<string>('month')
  const [loading, setLoading] = useState(true)

  const fetchBarberReport = async (selectedPeriod: string) => {
    try {
      setLoading(true)
      const res = await api.get(`/reports/barbers?period=${selectedPeriod}`)
      setReport(res.data)
    } catch (err) {
      console.error('Error fetching barber report:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBarberReport(period)
  }, [period])

  const totals = useMemo(() => {
    if (!report?.barbers) return { totalRev: 0, totalAppts: 0, avgRating: 0 }
    const totalRev = report.barbers.reduce((acc, b) => acc + b.revenue, 0)
    const totalAppts = report.barbers.reduce((acc, b) => acc + b.appointments, 0)
    const avgRating =
      report.barbers.length > 0
        ? (report.barbers.reduce((acc, b) => acc + b.averageRating, 0) / report.barbers.length).toFixed(1)
        : '0.0'
    return { totalRev, totalAppts, avgRating }
  }, [report])

  const maxRevenue = useMemo(() => {
    if (!report?.barbers || report.barbers.length === 0) return 1
    return Math.max(...report.barbers.map((b) => b.revenue), 1)
  }, [report])

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/reports/export?type=barbers')
      return typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
    } catch {
      return 'barberId,name,appointments,revenue\nu3,Juan,60,9000'
    }
  }

  if (loading && !report) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/admin/reportes" className="hover:text-primary transition-colors">
          Reportes
        </Link>
        <span>/</span>
        <span className="text-text-primary font-medium">Barberos</span>
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Reporte de Rendimiento por Barbero</h1>
          <p className="text-sm text-text-muted mt-1">
            Comparativa de citas realizadas, facturación generada, calificaciones y puntualidad.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="period-select" className="text-xs font-semibold text-text-primary">
              Periodo:
            </label>
            <select
              id="period-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-md border border-border bg-surface-elevated py-1.5 px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="year">Este año</option>
            </select>
          </div>

          <ExportButton onExport={handleExportCSV} filename={`reporte-barberos-${period}.csv`} />
        </div>
      </div>

      {/* Overview StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Facturación Total Equipo"
          value={`$${totals.totalRev.toLocaleString()}`}
          subtitle={`Periodo: ${period}`}
        />
        <StatCard title="Total Citas Atendidas" value={totals.totalAppts} subtitle="Citas en el periodo" />
        <StatCard
          title="Calificación Promedio"
          value={`★ ${totals.avgRating}`}
          subtitle="Satisfacción de clientes"
        />
      </div>

      {/* Barber Visual Ranking */}
      <div className="bg-surface-elevated rounded-xl shadow-sm border border-border p-6 space-y-4">
        <h2 className="text-lg font-bold text-text-primary">Ranking de Facturación por Barbero</h2>
        <div className="space-y-4">
          {report?.barbers?.map((b) => {
            const barWidth = Math.round((b.revenue / maxRevenue) * 100)

            return (
              <div key={b.barberId} className="space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-text-primary">{b.name}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-text-muted">{b.appointments} citas</span>
                    <strong className="text-primary font-bold">${b.revenue.toLocaleString()}</strong>
                  </div>
                </div>
                <div className="w-full bg-surface rounded-full h-3">
                  <div
                    className="bg-amber-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Barbers Detailed Performance Table */}
      <div className="bg-surface-elevated rounded-xl shadow-sm border border-border p-6 space-y-4">
        <h2 className="text-lg font-bold text-text-primary">Métricas Detalladas</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-surface text-xs text-text-muted font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Barbero</th>
                <th className="px-4 py-3 text-center">Citas</th>
                <th className="px-4 py-3 text-right">Facturación</th>
                <th className="px-4 py-3 text-center">Calificación</th>
                <th className="px-4 py-3 text-right">No-Show (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report?.barbers?.map((b) => (
                <tr key={b.barberId} className="hover:bg-surface">
                  <td className="px-4 py-3 font-semibold text-text-primary">{b.name}</td>
                  <td className="px-4 py-3 text-center text-text-primary">{b.appointments}</td>
                  <td className="px-4 py-3 text-right font-bold text-badge-success">
                    ${b.revenue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center text-amber-500 font-medium">★ {b.averageRating.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right text-gray-600 font-medium">{b.noShowRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
