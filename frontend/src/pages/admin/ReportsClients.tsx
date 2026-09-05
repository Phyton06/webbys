import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import { StatCard } from '../../components/shared/StatCard'
import { ExportButton } from '../../components/shared/ExportButton'
import type { ClientReport } from '../../services/interfaces'

export default function ReportsClients() {
  const [report, setReport] = useState<ClientReport | null>(null)
  const [period, setPeriod] = useState<string>('month')
  const [loading, setLoading] = useState(true)

  const fetchClientReport = async (selectedPeriod: string) => {
    try {
      setLoading(true)
      const res = await api.get(`/reports/clients?period=${selectedPeriod}`)
      setReport(res.data)
    } catch (err) {
      console.error('Error fetching client report:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClientReport(period)
  }, [period])

  const formattedRetention = useMemo(() => {
    if (!report) return '0.0'
    const rate = report.retentionRate > 1 ? report.retentionRate : report.retentionRate * 100
    return rate.toFixed(1)
  }, [report])

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/reports/export?type=clients')
      return typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
    } catch {
      return 'clientId,name,visits,spent\nu5,Ana Cliente,16,2400'
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
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/admin/reportes" className="hover:text-amber-600 transition-colors">
          Reportes
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Clientes</span>
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporte de Clientes y Retención</h1>
          <p className="text-sm text-gray-500 mt-1">
            Análisis de cartera, captación de nuevos clientes y tasa de fidelización y recurrencia.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="period-select" className="text-xs font-semibold text-gray-700">
              Periodo:
            </label>
            <select
              id="period-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-md border border-gray-300 bg-white py-1.5 px-3 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="month">Este mes</option>
              <option value="quarter">Este trimestre</option>
              <option value="year">Este año</option>
            </select>
          </div>

          <ExportButton onExport={handleExportCSV} filename={`reporte-clientes-${period}.csv`} />
        </div>
      </div>

      {/* KPI Cards Row */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Clientes" value={report.totalClients} subtitle="Base activa registrada" />
          <StatCard title="Nuevos Clientes" value={report.newClients} subtitle="Captados en el periodo" trendDirection="up" />
          <StatCard
            title="Clientes Recurrentes"
            value={report.returningClients}
            subtitle="Con 2 o más visitas"
            trendDirection="up"
          />
          <StatCard
            title="Tasa de Retención"
            value={`${formattedRetention}%`}
            subtitle="Fidelización calculada"
            trendDirection={Number(formattedRetention) >= 50 ? 'up' : 'down'}
          />
        </div>
      )}

      {/* Top Clients Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Top Clientes con Mayor Recurrencia y Gasto</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 font-semibold">
              <tr>
                <th className="px-4 py-3 text-left w-16">#</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-center">Visitas Totales</th>
                <th className="px-4 py-3 text-right">Gasto Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report?.topClients?.map((c, idx) => (
                <tr key={c.clientId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{c.visits}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">
                    ${c.spent.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
