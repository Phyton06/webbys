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

export default function AssistantTodayAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  const load = () => {
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
      const resolved: Appointment[] = all.map((a: any) => ({
        id: a.id,
        clientName: a.clientName || clientMap[a.clientId] || `Cliente`,
        barberName: a.barberName || barberMap[a.barberId] || `Barbero`,
        serviceName: a.serviceName || serviceMap[a.serviceId] || 'Servicio',
        date: a.date,
        time: a.time || a.startTime,
        status: mapStatus(a.status),
      }))
      setAppointments(resolved.filter(a => a.date === today))
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id: string, status: string) => {
    await api.put(`/appointments/${id}/status`, { status })
    load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Citas de Hoy</h1>
      <p className="text-gray-500 text-sm">{new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <div className="space-y-3">
        {appointments.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay citas programadas para hoy</p>
        ) : (
          appointments.map(a => (
            <div key={a.id} className="space-y-2">
              <AppointmentCard
                clientName={a.clientName}
                barberName={a.barberName}
                service={a.serviceName}
                date={a.date}
                time={a.time}
                status={a.status}
              />
              <div className="flex gap-2">
                {a.status === 'PENDIENTE' && (
                  <button onClick={() => updateStatus(a.id, 'CONFIRMADA')} className="btn-secondary text-xs flex-1">Confirmar</button>
                )}
                {a.status === 'CONFIRMADA' && (
                  <button onClick={() => updateStatus(a.id, 'EN_CURSO')} className="btn-secondary text-xs flex-1">Iniciar</button>
                )}
                {a.status === 'EN_CURSO' && (
                  <button onClick={() => updateStatus(a.id, 'COMPLETADA')} className="btn-primary text-xs flex-1">Completar</button>
                )}
                {(a.status === 'PENDIENTE' || a.status === 'CONFIRMADA') && (
                  <button onClick={() => updateStatus(a.id, 'CANCELADA')} className="btn-danger text-xs">Cancelar</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
