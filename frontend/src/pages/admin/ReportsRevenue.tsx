import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import { StatCard } from '../../components/shared/StatCard'
import { ExportButton } from '../../components/shared/ExportButton'
import type { RevenueReport } from '../../services/interfaces'

export default function ReportsRevenue() {
  const [report, setReport] = useState<RevenueReport | null>(null)
  const [period, setPeriod] = useState<string>('week')
  const [loading, setLoading] = useState(true)

  const fetchRevenue = async (selectedPeriod: string) => {
    try {
      setLoading(true)
      const res = await api.get(`/reports/revenue?period=${selectedPeriod}`)
      setReport(res.data)
    } catch (err) {
      console.error('Error loading revenue report:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRevenue(period)
  }, [period])

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/reports/export?type=revenue')
      return typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
    } catch {
      return 'date,barber,amount\n2026-09-04,Default,0'
    }
  }

  const maxBarberRev = useMemo(() => {
    if (!report?.byBarber || report.byBarber.length === 0) return 1
    return Math.max(...report.byBarber.map((b) => b.revenue), 1)
  }, [report])

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
        <span className="text-gray-900 font-medium">Ingresos</span>
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporte de Ingresos y Facturación</h1>
          <p className="text-sm text-gray-500 mt-1">
            Análisis financiero consolidado, rendimiento por barbero y servicios más rentables.
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
              <option value="day">Hoy</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="year">Este año</option>
            </select>
          </div>

          <ExportButton onExport={handleExportCSV} filename={`reporte-ingresos-${period}.csv`} />
        </div>
      </div>

      {/* KPI Cards Row */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Ingresos Totales"
            value={`$${report.totalRevenue.toLocaleString()}`}
            subtitle={`Periodo: ${period}`}
          />
          <StatCard
            title="Total Citas Facturadas"
            value={report.appointmentCount}
            subtitle="Citas con cobro exitoso"
          />
          <StatCard
            title="Ticket Promedio"
            value={`$${Math.round(report.averageTicket).toLocaleString()}`}
            subtitle="Gasto promedio por cita"
          />
        </div>
      )}

      {/* Barber Revenue Visual Comparison Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Ingresos por Barbero</h2>
        <div className="space-y-4">
          {report?.byBarber?.map((barber) => {
            const percentage = report.totalRevenue > 0 ? Math.round((barber.revenue / report.totalRevenue) * 100) : 0
            const barWidth = Math.round((barber.revenue / maxBarberRev) * 100)

            return (
              <div key={barber.barberId} className="space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-gray-800">{barber.barberName}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-500">{barber.appointments} citas</span>
                    <strong className="text-amber-600 font-bold">${barber.revenue.toLocaleString()}</strong>
                    <span className="text-gray-400 font-medium">({percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
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

      {/* Services Breakdown Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Ingresos por Servicio</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Servicio</th>
                <th className="px-4 py-3 text-center">Cantidad Vendida</th>
                <th className="px-4 py-3 text-right">Total Facturado</th>
                <th className="px-4 py-3 text-right">Participación (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report?.byService?.map((svc) => {
                const part = report.totalRevenue > 0 ? Math.round((svc.revenue / report.totalRevenue) * 100) : 0
                return (
                  <tr key={svc.serviceId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{svc.serviceName}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{svc.count}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">
                      ${svc.revenue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 font-medium">{part}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
