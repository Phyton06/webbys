import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

interface Barber { id: string; name: string }
interface Client { id: string; name: string; phone: string }
interface Service { id: string; name: string; price: number }
interface TimeSlot { time: string; available: boolean }

export default function AssistantNewAppointment() {
  const navigate = useNavigate()
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [clientId, setClientId] = useState('')
  const [barberId, setBarberId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [clientSearch, setClientSearch] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/barbers').then(r => setBarbers(r.data.barbers ?? r.data)),
      api.get('/clients').then(r => setClients(r.data.clients ?? r.data)),
      api.get('/services').then(r => setServices(r.data.services ?? r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (barberId && date) {
      api.get(`/appointments/availability/${barberId}?date=${date}`)
        .then(r => {
          const raw = r.data.slots ?? r.data
          const normalized = Array.isArray(raw)
            ? raw.map((s: any) => typeof s === 'string' ? { time: s, available: true } : s)
            : []
          setSlots(normalized)
        })
        .catch(() => setSlots([]))
    }
  }, [barberId, date])

  const today = new Date().toISOString().split('T')[0]

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone?.includes(clientSearch)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || !barberId || !date || !time) return
    setSubmitting(true)
    setError('')
    try {
      await api.post('/appointments', { clientId, barberId, serviceId: serviceId || undefined, date, time })
      navigate('/asistente')
    } catch {
      setError('Error al agendar la cita')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nueva Cita</h1>

      {error && <div className="bg-red/20 text-red-light text-sm rounded-lg p-3">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client */}
        <div className="card space-y-2">
          <label className="text-sm text-white/50" htmlFor="client-search">Cliente</label>
          <input id="client-search" placeholder="Buscar por nombre o teléfono..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} className="input" aria-label="Buscar cliente" />
          {clientSearch && (
            <div className="max-h-40 overflow-y-auto space-y-1">
              {filteredClients.map(c => (
                <button key={c.id} type="button" onClick={() => { setClientId(c.id); setClientSearch(c.name) }}
                  className={`w-full text-left p-2 rounded text-sm ${clientId === c.id ? 'bg-cyan/20 text-cyan' : 'bg-gray-700 hover:bg-gray-600'}`}>
                  {c.name} · {c.phone}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Barber */}
        <div className="card space-y-2">
          <label className="text-sm text-white/50" htmlFor="barber-select">Barbero</label>
          <select id="barber-select" value={barberId} onChange={e => setBarberId(e.target.value)} className="input" aria-label="Seleccionar barbero">
            <option value="">Seleccionar barbero</option>
            {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        {/* Date */}
        <div className="card space-y-2">
          <label className="text-sm text-white/50" htmlFor="appointment-date">Fecha</label>
          <input id="appointment-date" type="date" min={today} value={date} onChange={e => setDate(e.target.value)} className="input" aria-label="Fecha de la cita" />
        </div>

        {/* Time */}
        {slots.length > 0 && (
          <div className="card space-y-2">
            <label className="text-sm text-white/50" id="time-slots-label">Hora</label>
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-labelledby="time-slots-label">
              {slots.filter(s => s.available).map(s => (
                <button key={s.time} type="button" onClick={() => setTime(s.time)}
                  className={`btn text-xs ${time === s.time ? 'bg-red text-white' : 'bg-white/10 text-white'}`}>
                  {s.time}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Service */}
        <div className="card space-y-2">
          <label className="text-sm text-white/50" htmlFor="service-select">Servicio (opcional)</label>
          <select id="service-select" value={serviceId} onChange={e => setServiceId(e.target.value)} className="input" aria-label="Seleccionar servicio">
            <option value="">Sin servicio específico</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>)}
          </select>
        </div>

        <button type="submit" disabled={submitting || !clientId || !barberId || !date || !time} className="btn-primary w-full">
          {submitting ? 'Agendando...' : 'Agendar cita'}
        </button>
      </form>
    </div>
  )
}
