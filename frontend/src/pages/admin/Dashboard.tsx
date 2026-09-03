import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import AppointmentCard from '../../components/AppointmentCard'

interface DashboardStats {
  todayAppointments: number
  pendingConfirmations: number
  weekRevenue: number
}

function mapStatus(s: string): Appointment['status'] {
  const m: Record<string, Appointment['status']> = { PENDING: 'PENDIENTE', CONFIRMED: 'CONFIRMADA', IN_PROGRESS: 'EN_CURSO', COMPLETED: 'COMPLETADA', CANCELLED: 'CANCELADA' }
  return m[s] || 'PENDIENTE'
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
  const [stats, setStats] = useState<DashboardStats>({ todayAppointments: 0, pendingConfirmations: 0, weekRevenue: 0 })
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      api.get('/appointments').then(r => r.data),
      api.get('/barbers').then(r => r.data).catch(() => []),
      api.get('/services').then(r => r.data).catch(() => []),
    ]).then(([appts, barbers, services]) => {
      const list = Array.isArray(appts) ? appts : appts.appointments ?? []
      const barberMap = Object.fromEntries((Array.isArray(barbers) ? barbers : []).map((b: any) => [b.id, b.name]))
      const serviceMap = Object.fromEntries((Array.isArray(services) ? services : []).map((s: any) => [s.id, s.name]))
      const resolved: Appointment[] = list.map((a: any) => ({
        id: a.id,
        clientName: a.clientName || a.client?.name || `Cliente ${a.clientId}`,
        barberName: a.barberName || barberMap[a.barberId] || `Barbero ${a.barberId}`,
        serviceName: a.serviceName || serviceMap[a.serviceId] || 'Servicio',
        date: a.date,
        time: a.time || a.startTime,
        status: mapStatus(a.status),
      }))
      const todayList = resolved.filter(a => a.date === today)
      setStats({
        todayAppointments: todayList.length,
        pendingConfirmations: resolved.filter(a => a.status === 'PENDIENTE').length,
        weekRevenue: 0,
      })
      setAppointments(todayList)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Dashboard</h1>

      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-bold text-cyan">{stats.todayAppointments}</p>
          <p className="text-xs text-gray-500 mt-1">Citas hoy</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-amber-400">{stats.pendingConfirmations}</p>
          <p className="text-xs text-gray-500 mt-1">Pendientes</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-emerald-400">${stats.weekRevenue}</p>
          <p className="text-xs text-gray-500 mt-1">Esta semana</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Citas de hoy</h2>
        {appointments.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay citas programadas para hoy</p>
        ) : (
          <div className="space-y-3">
            {appointments.map(a => (
              <AppointmentCard
                key={a.id}
                clientName={a.clientName}
                barberName={a.barberName}
                service={a.serviceName}
                date={a.date}
                time={a.time}
                status={a.status}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
