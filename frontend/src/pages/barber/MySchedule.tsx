import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

interface DaySchedule {
  day: string
  active: boolean
  startTime: string
  endTime: string
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function BarberMySchedule() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS.map(d => ({ day: d, active: false, startTime: '09:00', endTime: '18:00' }))
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/auth/me').then(r => {
      const user = r.data.user ?? r.data
      api.get(`/barbers/${user.id}`).then(r2 => {
        const s = r2.data.schedule ?? r2.data.barber?.schedule
        if (Array.isArray(s) && s.length > 0) setSchedule(s)
      })
    }).finally(() => setLoading(false))
  }, [])

  const toggleDay = (index: number) => {
    setSchedule(prev => prev.map((d, i) => i === index ? { ...d, active: !d.active } : d))
  }

  const updateField = (index: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedule(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: me } = await api.get('/auth/me')
      const user = me.user ?? me
      await api.put(`/barbers/${user.id}/schedule`, { schedule })
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mi Horario</h1>

      <div className="space-y-3">
        {schedule.map((day, i) => (
          <div key={day.day} className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{day.day}</span>
              <button onClick={() => toggleDay(i)} className={`w-12 h-6 rounded-full transition-colors ${day.active ? 'bg-success' : 'bg-white/20'}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${day.active ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {day.active && (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-white/50" htmlFor={`start-${i}`}>Inicio</label>
                  <input id={`start-${i}`} type="time" value={day.startTime} onChange={e => updateField(i, 'startTime', e.target.value)} className="input text-sm py-2" aria-label={`Hora de inicio ${day.day}`} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-white/50" htmlFor={`end-${i}`}>Fin</label>
                  <input id={`end-${i}`} type="time" value={day.endTime} onChange={e => updateField(i, 'endTime', e.target.value)} className="input text-sm py-2" aria-label={`Hora de fin ${day.day}`} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
        {saving ? 'Guardando...' : 'Guardar horario'}
      </button>
    </div>
  )
}
