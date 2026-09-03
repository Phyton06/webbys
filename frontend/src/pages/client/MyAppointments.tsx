import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import AppointmentCard from '../../components/AppointmentCard'

interface Appointment {
  id: string
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

export default function ClientMyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    Promise.all([
      api.get('/appointments').then(r => r.data),
      api.get('/barbers').then(r => r.data).catch(() => []),
      api.get('/services').then(r => r.data).catch(() => []),
    ]).then(([appts, barbers, services]) => {
      const all = Array.isArray(appts) ? appts : appts.appointments ?? []
      const barberMap = Object.fromEntries((Array.isArray(barbers) ? barbers : []).map((b: any) => [b.id, b.name]))
      const serviceMap = Object.fromEntries((Array.isArray(services) ? services : []).map((s: any) => [s.id, s.name]))
      const resolved = all.map((a: any) => ({
        id: a.id,
        barberName: a.barberName || barberMap[a.barberId] || 'Barbero',
        serviceName: a.serviceName || serviceMap[a.serviceId] || 'Servicio',
        date: a.date,
        time: a.time || a.startTime,
        status: mapStatus(a.status),
      }))
      setAppointments(resolved)
    }).finally(() => setLoading(false))
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const upcoming = appointments.filter(a => a.date >= today && a.status !== 'CANCELADA')
  const past = appointments.filter(a => a.date < today || a.status === 'COMPLETADA' || a.status === 'CANCELADA')
  const list = tab === 'upcoming' ? upcoming : past

  const cancelAppointment = async (id: string) => {
    if (!confirm('¿Cancelar esta cita?')) return
    await api.put(`/appointments/${id}/status`, { status: 'CANCELADA' })
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'CANCELADA' as const } : a))
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Mis Citas</h1>

      <div className="flex gap-2">
        <button onClick={() => setTab('upcoming')} className={`btn text-sm flex-1 ${tab === 'upcoming' ? 'bg-red text-white' : 'bg-gray-700 text-gray-400'}`}>
          Próximas ({upcoming.length})
        </button>
        <button onClick={() => setTab('past')} className={`btn text-sm flex-1 ${tab === 'past' ? 'bg-red text-white' : 'bg-gray-700 text-gray-400'}`}>
          Anteriores ({past.length})
        </button>
      </div>

      <div className="space-y-3">
        {list.length === 0 ? (
          <p className="text-gray-500 text-sm">{tab === 'upcoming' ? 'No tienes citas próximas' : 'No hay citas anteriores'}</p>
        ) : (
          list.map(a => (
            <div key={a.id} className="space-y-2">
              <AppointmentCard
                clientName=""
                barberName={a.barberName}
                service={a.serviceName}
                date={a.date}
                time={a.time}
                status={a.status}
              />
              {(a.status === 'PENDIENTE' || a.status === 'CONFIRMADA') && (
                <button onClick={() => cancelAppointment(a.id)} className="btn-danger text-xs w-full">
                  Cancelar cita
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
