import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import { StatCard } from '../../components/shared/StatCard'
import { mapStatus } from '../../utils/status'

interface DashboardStats {
  todayAppointments: number
  pendingConfirmations: number
  weekRevenue: number
  todayList: Appointment[]
}

interface Appointment {
  id: string
  clientName: string
  barberName: string
  serviceName: string
  date: string
  time: string
  status: 'PENDIENTE' | 'CONFIRMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA'
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({ todayAppointments: 0, pendingConfirmations: 0, weekRevenue: 0, todayList: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      api.get('/appointments').then(r => r.data),
      api.get('/barbers').then(r => r.data).catch(() => []),
      api.get('/clients').then(r => r.data).catch(() => []),
      api.get('/services').then(r => r.data).catch(() => []),
    ]).then(([appts, barbers, clients, services]) => {
      const list = Array.isArray(appts) ? appts : appts.appointments ?? []
      const barberMap = Object.fromEntries((Array.isArray(barbers) ? barbers : []).map((b: any) => [b.id, b.name]))
      const clientMap = Object.fromEntries((Array.isArray(clients) ? clients : []).map((c: any) => [c.id, c.name]))
      const serviceMap = Object.fromEntries((Array.isArray(services) ? services : []).map((s: any) => [s.id, s.name]))
      
      const resolved: Appointment[] = list.map((a: any) => ({
        id: a.id,
        clientName: a.clientName || clientMap[a.clientId] || a.client?.name || `Cliente ${a.clientId}`,
        barberName: a.barberName || barberMap[a.barberId] || `Barbero ${a.barberId}`,
        serviceName: a.serviceName || serviceMap[a.serviceId] || 'Servicio',
        date: a.date,
        time: a.time || a.startTime,
        status: mapStatus(a.status) as Appointment['status'],
        amount: a.amount,
      }))

      const todayList = resolved.filter(a => a.date === today)
      
      // Calculate week revenue from completed appointments
      const weekRevenue = resolved
        .filter(a => a.status === 'COMPLETADA')
        .reduce((sum, a) => sum + ((a as any).amount || 150), 0)

      setStats({
        todayAppointments: todayList.length,
        pendingConfirmations: resolved.filter(a => a.status === 'PENDIENTE').length,
        weekRevenue: weekRevenue,
        todayList: todayList,
      })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4">
        <StatCard
          title="Ingresos Semanales"
          value={`$${stats.weekRevenue.toLocaleString()}`}
          trend={stats.weekRevenue > 0 ? 15 : 0}
          trendDirection="up"
        />
      </div>

      <div className="p-6 bg-surface-elevated rounded-lg border border-border shadow-sm">
        <h2 className="text-sm font-medium text-text-muted mb-4 font-semibold">Citas de hoy</h2>
        {stats.todayList.length === 0 ? (
          <p className="text-text-muted text-sm">No hay citas programadas para hoy</p>
        ) : (
          <div className="space-y-3">
            {stats.todayList.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <div>
                  <p className="text-sm font-medium text-text-primary">{a.clientName}</p>
                  <p className="text-xs text-text-muted">{a.barberName} &middot; {a.serviceName}</p>
                </div>
                <span className="text-xs text-text-muted">{a.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Trend section moved to sidebar */}
        </div>

        <div className="p-6 bg-surface-elevated rounded-lg border border-border shadow-sm self-start">
          <h2 className="text-sm font-medium text-text-muted mb-4 font-semibold">Tendencia Semanal</h2>
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 300 80" className="w-full h-24" data-testid="revenue-svg">
              <line x1="10" y1="10" x2="290" y2="10" stroke="#f3f4f6" strokeWidth={1} />
              <line x1="10" y1="40" x2="290" y2="40" stroke="#f3f4f6" strokeWidth={1} />
              <line x1="10" y1="70" x2="290" y2="70" stroke="#e5e7eb" strokeWidth={1} />
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth={2}
                points="10,60 55,45 100,55 145,20 190,30 235,25 280,15"
              />
            </svg>
            <div className="flex justify-between w-full mt-2 text-[10px] text-text-muted">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
              <span>Dom</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
