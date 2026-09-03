import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import AppointmentCard from '../../components/AppointmentCard'

interface Appointment {
  id: string
  clientName: string
  barberName: string
  serviceName: string
  date: string
  time: string
  status: 'PENDIENTE' | 'CONFIRMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA'
}

function mapStatus(s: string): Appointment['status'] {
  const m: Record<string, Appointment['status']> = { PENDING: 'PENDIENTE', CONFIRMED: 'CONFIRMADA', IN_PROGRESS: 'EN_CURSO', COMPLETED: 'COMPLETADA', CANCELLED: 'CANCELADA' }
  return m[s] || 'PENDIENTE'
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('TODAS')

  useEffect(() => {
    Promise.all([
      api.get('/appointments').then(r => r.data),
      api.get('/barbers').then(r => r.data).catch(() => []),
      api.get('/clients').then(r => r.data).catch(() => []),
      api.get('/services').then(r => r.data).catch(() => []),
    ]).then(([appts, barbers, clients, services]) => {
      const all = Array.isArray(appts) ? appts : appts.appointments ?? []
      const barberMap = Object.fromEntries((Array.isArray(barbers) ? barbers : []).map((b: any) => [b.id, b.name]))
      const clientMap = Object.fromEntries((Array.isArray(clients) ? clients : []).map((c: any) => [c.id, c.name]))
      const serviceMap = Object.fromEntries((Array.isArray(services) ? services : []).map((s: any) => [s.id, s.name]))
      setAppointments(all.map((a: any) => ({
        id: a.id,
        clientName: a.clientName || clientMap[a.clientId] || 'Cliente',
        barberName: a.barberName || barberMap[a.barberId] || 'Barbero',
        serviceName: a.serviceName || serviceMap[a.serviceId] || 'Servicio',
        date: a.date,
        time: a.time || a.startTime,
        status: mapStatus(a.status),
      })))
    }).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'TODAS' ? appointments : appointments.filter(a => a.status === filter)

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Citas</h1>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['TODAS', 'PENDIENTE', 'CONFIRMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`btn text-xs whitespace-nowrap ${filter === f ? 'bg-red text-white' : 'bg-gray-700 text-gray-400'}`}>
            {f === 'TODAS' ? 'Todas' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay citas</p>
        ) : (
          filtered.map(a => (
            <AppointmentCard
              key={a.id}
              clientName={a.clientName}
              barberName={a.barberName}
              service={a.serviceName}
              date={a.date}
              time={a.time}
              status={a.status}
            />
          ))
        )}
      </div>
    </div>
  )
}
