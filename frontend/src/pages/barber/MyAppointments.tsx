import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import AppointmentCard from '../../components/AppointmentCard'

interface Appointment {
  id: string
  clientName: string
  serviceName: string
  date: string
  time: string
  status: 'PENDIENTE' | 'CONFIRMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA'
}

function mapStatus(s: string): Appointment['status'] {
  const m: Record<string, Appointment['status']> = { PENDING: 'PENDIENTE', CONFIRMED: 'CONFIRMADA', IN_PROGRESS: 'EN_CURSO', COMPLETED: 'COMPLETADA', CANCELLED: 'CANCELADA' }
  return m[s] || 'PENDIENTE'
}

export default function BarberMyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])

  const load = () => {
    Promise.all([
      api.get('/appointments').then(r => r.data),
      api.get('/clients').then(r => r.data).catch(() => []),
      api.get('/services').then(r => r.data).catch(() => []),
    ]).then(([appts, clients, services]) => {
      const all = Array.isArray(appts) ? appts : appts.appointments ?? []
      const clientMap = Object.fromEntries((Array.isArray(clients) ? clients : []).map((c: any) => [c.id, c.name]))
      const serviceMap = Object.fromEntries((Array.isArray(services) ? services : []).map((s: any) => [s.id, s.name]))
      const resolved: Appointment[] = all.map((a: any) => ({
        id: a.id,
        clientName: a.clientName || clientMap[a.clientId] || 'Cliente',
        serviceName: a.serviceName || serviceMap[a.serviceId] || 'Servicio',
        date: a.date,
        time: a.time || a.startTime,
        status: mapStatus(a.status),
      }))
      setAppointments(resolved.filter(a => a.date === dateFilter))
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [dateFilter])

  const updateStatus = async (id: string, status: string) => {
    await api.put(`/appointments/${id}/status`, { status })
    load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Mis Citas</h1>

      <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="input" aria-label="Filtrar por fecha" />

      <div className="space-y-3">
        {appointments.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay citas para esta fecha</p>
        ) : (
          appointments.map(a => (
            <div key={a.id} className="space-y-2">
              <AppointmentCard
                clientName={a.clientName}
                barberName=""
                service={a.serviceName}
                date={a.date}
                time={a.time}
                status={a.status}
              />
              {a.status === 'CONFIRMADA' && (
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(a.id, 'EN_CURSO')} className="btn-secondary text-xs flex-1">Iniciar</button>
                  <button onClick={() => updateStatus(a.id, 'CANCELADA')} className="btn-danger text-xs">Cancelar</button>
                </div>
              )}
              {a.status === 'EN_CURSO' && (
                <button onClick={() => updateStatus(a.id, 'COMPLETADA')} className="btn-primary text-xs w-full">Completar</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
