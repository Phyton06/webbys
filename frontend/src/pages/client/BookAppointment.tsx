import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

interface Barber { id: string; name: string; specialty: string }
interface Service { id: string; name: string; price: number; duration: number }
interface TimeSlot { time: string; available: boolean }

type Step = 'barber' | 'date' | 'time' | 'service' | 'confirm'

export default function BookAppointment() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('barber')
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  useEffect(() => {
    Promise.all([
      api.get('/barbers').then(r => setBarbers(r.data.barbers ?? r.data)),
      api.get('/services').then(r => setServices(r.data.services ?? r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedBarber && selectedDate) {
      api.get(`/appointments/availability/${selectedBarber.id}?date=${selectedDate}`)
        .then(r => {
          const raw = r.data.slots ?? r.data
          // Normalize: mock returns strings, component expects { time, available }
          const normalized = Array.isArray(raw)
            ? raw.map((s: any) => typeof s === 'string' ? { time: s, available: true } : s)
            : []
          setSlots(normalized)
        })
        .catch(() => setSlots([]))
    }
  }, [selectedBarber, selectedDate])

  const today = new Date().toISOString().split('T')[0]

  const handleConfirm = async () => {
    if (!selectedBarber || !selectedDate || !selectedTime) return
    setSubmitting(true)
    setError('')
    try {
      await api.post('/appointments', {
        barberId: selectedBarber.id,
        serviceId: selectedService?.id ?? undefined,
        date: selectedDate,
        time: selectedTime,
      })
      navigate('/cliente/mis-citas')
    } catch {
      setError('Error al agendar la cita')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const steps: { key: Step; label: string }[] = [
    { key: 'barber', label: 'Barbero' },
    { key: 'date', label: 'Fecha' },
    { key: 'time', label: 'Hora' },
    { key: 'service', label: 'Servicio' },
    { key: 'confirm', label: 'Confirmar' },
  ]

  const currentIdx = steps.findIndex(s => s.key === step)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Agendar Cita</h1>

      {/* Progress */}
      <div className="flex gap-1" role="progressbar" aria-label={`Paso ${currentIdx + 1} de ${steps.length}`} aria-valuenow={currentIdx + 1} aria-valuemin={1} aria-valuemax={steps.length}>
        {steps.map((s, i) => (
          <div key={s.key} className={`flex-1 h-1 rounded-full ${i <= currentIdx ? 'bg-cyan' : 'bg-white/10'}`} />
        ))}
      </div>

      {error && <div className="bg-red/20 text-red-light text-sm rounded-lg p-3">{error}</div>}

      {/* Step: Barber */}
      {step === 'barber' && (
        <div className="space-y-3">
          <p className="text-white/60 text-sm">Selecciona un barbero</p>
          {barbers.map(b => (
            <button key={b.id} onClick={() => { setSelectedBarber(b); setStep('date') }}
              className={`card w-full text-left hover:bg-white/10 transition-colors ${selectedBarber?.id === b.id ? 'ring-2 ring-cyan' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-cyan/20 flex items-center justify-center text-cyan font-bold">
                  {b.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-sm text-white/50">{b.specialty || 'Barbero general'}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step: Date */}
      {step === 'date' && (
        <div className="space-y-3">
          <p className="text-white/60 text-sm">Selecciona una fecha</p>
          <input type="date" min={today} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="input" aria-label="Fecha de la cita" />
          {selectedDate && (
            <button onClick={() => setStep('time')} className="btn-primary w-full">Siguiente</button>
          )}
        </div>
      )}

      {/* Step: Time */}
      {step === 'time' && (
        <div className="space-y-3">
          <p className="text-white/60 text-sm">Horarios disponibles para {selectedDate}</p>
          {slots.length === 0 ? (
            <p className="text-white/50 text-sm">No hay horarios disponibles</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.filter(s => s.available).map(s => (
                <button key={s.time} onClick={() => { setSelectedTime(s.time); setStep('service') }}
                  className={`btn text-sm ${selectedTime === s.time ? 'bg-red text-white' : 'bg-white/10 text-white'}`}>
                  {s.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step: Service */}
      {step === 'service' && (
        <div className="space-y-3">
          <p className="text-white/60 text-sm">Selecciona un servicio (opcional)</p>
          {services.map(s => (
            <button key={s.id} onClick={() => { setSelectedService(s); setStep('confirm') }}
              className={`card w-full text-left hover:bg-white/10 transition-colors ${selectedService?.id === s.id ? 'ring-2 ring-cyan' : ''}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-white/50">{s.duration} min</p>
                </div>
                <span className="text-cyan font-semibold">${s.price}</span>
              </div>
            </button>
          ))}
          <button onClick={() => { setSelectedService(null); setStep('confirm') }} className="btn-ghost w-full text-sm">
            Sin servicio, solo corte
          </button>
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="card space-y-2">
            <p className="text-sm text-white/50">Resumen de tu cita</p>
            <p><span className="text-white/50">Barbero:</span> {selectedBarber?.name}</p>
            <p><span className="text-white/50">Fecha:</span> {selectedDate}</p>
            <p><span className="text-white/50">Hora:</span> {selectedTime}</p>
            {selectedService && <p><span className="text-white/50">Servicio:</span> {selectedService.name} (${selectedService.price})</p>}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('service')} className="btn-secondary flex-1">Atrás</button>
            <button onClick={handleConfirm} disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Agendando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      {step !== 'barber' && step !== 'confirm' && (
        <button onClick={() => {
          const prev = steps[currentIdx - 1]
          if (prev) setStep(prev.key)
        }} className="btn-ghost w-full text-sm">Atrás</button>
      )}
    </div>
  )
}
