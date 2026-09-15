import React, { useEffect, useState, useMemo } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import type { WeeklySchedule, ScheduleEntry, ScheduleException } from '../../services/interfaces'

interface BarberOption {
  id: string
  name: string
}

const DAY_NAMES_ES: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

const DEFAULT_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export default function Schedules() {
  const [barbers, setBarbers] = useState<BarberOption[]>([])
  const [selectedBarberId, setSelectedBarberId] = useState<string>('')
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null)
  const [exceptions, setExceptions] = useState<ScheduleException[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingDay, setEditingDay] = useState<any | null>(null)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [dayActive, setDayActive] = useState(true)
  const [showExceptionModal, setShowExceptionModal] = useState(false)
  const [exDate, setExDate] = useState('')
  const [exType, setExType] = useState<'DAY_OFF' | 'HALF_DAY' | 'CUSTOM'>('DAY_OFF')
  const [exReason, setExReason] = useState('')

  // Load barbers on mount
  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const res = await api.get('/barbers')
        const list = res.data || []
        setBarbers(list)
        if (list.length > 0 && !selectedBarberId) {
          setSelectedBarberId(list[0].id)
        }
      } catch (err) {
        console.error('Error fetching barbers:', err)
      }
    }
    fetchBarbers()
  }, [])

  // Load schedule and exceptions for selected barber
  useEffect(() => {
    if (!selectedBarberId) return

    const fetchSchedule = async () => {
      try {
        setLoading(true)
        const [schedRes, exRes] = await Promise.all([
          api.get(`/schedules/${selectedBarberId}`),
          api.get(`/schedules/exceptions?barberId=${selectedBarberId}`).catch(() => ({ data: [] })),
        ])
        setSchedule(schedRes.data)
        setExceptions(exRes.data || [])
      } catch (err) {
        console.error('Error loading schedule:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSchedule()
  }, [selectedBarberId])

  const currentBarberName = useMemo(() => {
    const b = barbers.find((item) => item.id === selectedBarberId)
    return b ? b.name : ''
  }, [barbers, selectedBarberId])

  const handleOpenEditDay = (entry: any) => {
    setEditingDay(entry)
    const slot = entry.slots?.[0]
    if (slot) {
      setStartTime(slot.start)
      setEndTime(slot.end)
      setDayActive(true)
    } else {
      setStartTime('09:00')
      setEndTime('18:00')
      setDayActive(false)
    }
  }

  const handleSaveDay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDay || !schedule || !selectedBarberId) return

    const updatedEntries = schedule.entries.map((entry: any) => {
      if (entry.day === editingDay.day) {
        return {
          day: entry.day,
          slots: dayActive ? [{ start: startTime, end: endTime }] : [],
        }
      }
      return entry
    })

    try {
      setSaving(true)
      await api.put(`/schedules/${selectedBarberId}`, { entries: updatedEntries })
      setSchedule({ ...schedule, entries: updatedEntries })
      setEditingDay(null)
    } catch (err) {
      console.error('Error saving schedule day:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!exDate || !selectedBarberId) return

    try {
      setSaving(true)
      const res = await api.post('/schedules/exceptions', {
        barberId: selectedBarberId,
        date: exDate,
        type: exType,
        reason: exReason,
      })

      const newEx = res.data
      setExceptions((prev: any[]) => [...prev, newEx])
      setShowExceptionModal(false)
      setExDate('')
      setExReason('')
      setExType('DAY_OFF')
    } catch (err) {
      console.error('Error creating exception:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteException = async (id: string) => {
    try {
      await api.delete(`/schedules/exceptions/${id}`)
      setExceptions((prev: any[]) => prev.filter((e: any) => e.id !== id))
    } catch (err) {
      console.error('Error removing exception:', err)
    }
  }

  if (loading && !schedule) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="bg-[var(--surface)] min-h-screen">
      <h1 className="text-2xl font-display font-bold text-white">Horarios y Disponibilidad</h1>

      {/* Header & Barber Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="text-xl font-display font-bold text-white">Horarios y Disponibilidad</h2>
          <p className="text-sm text-gray-400">Gestiona los turnos semanales y excepciones por barbero.</p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="barber-select" className="text-sm font-medium text-gray-300">
            Barbero:
          </label>
          <select
            id="barber-select"
            value={selectedBarberId}
            onChange={(e) => setSelectedBarberId(e.target.value)}
            className="rounded border [var(--border)] py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          >
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="rounded-2xl border [var(--border)] bg-[var(--surface)] overflow-hidden mb-6">
        <div className="p-5 border-b border-[var(--border)] flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-white">Horario Semanal: {currentBarberName}</h2>
            <p className="text-xs text-gray-400">Configuración estándar repetida cada semana</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-gray-300">
          {DEFAULT_DAYS.map((dayKey) => {
            const entry = schedule?.entries?.find((e: any) => e.day.toLowerCase() === dayKey.toLowerCase()) || {
              day: dayKey,
              slots: [],
            }
            const hasSlots = entry.slots && entry.slots.length > 0
            const dayLabel = DAY_NAMES_ES[dayKey] || dayKey

            return (
              <div
                key={dayKey}
                className="p-4 flex flex-col justify-between border-y [var(--border)] hover:bg-[var(--surface)] transition-colors"
              >
                <div>
                  <span className="font-semibold text-white text-sm block mb-2">{dayLabel}</span>
                  {hasSlots ? (
                    <div className="space-y-1">
                      {entry.slots.map((slot: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-cyan-500 text-white rounded px-2 py-1 text-xs font-medium text-center"
                        >
                          {slot.start} - {slot.end}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-gray-800 text-gray-300">
                      Cerrado
                    </span>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => handleOpenEditDay(entry)}
                    className="w-full text-xs font-medium text-cyan hover:text-cyan-400 py-1 rounded hover:bg-cyan-50 border border-transparent hover:border-cyan-200 transition-colors"
                  >
                    Editar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Exceptions Section */}
      <div className="rounded-2xl border [var(--border)] bg-[var(--surface)] p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[var(--border)] pb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Excepciones y Días Libres</h2>
            <p className="text-xs text-gray-400">Días no laborables, feriados o ausencias programadas que sobrescriben el horario semanal.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowExceptionModal(true)}
            className="btn-primary text-sm"
          >
            + Agregar Excepción
          </button>
        </div>

        {exceptions.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No hay excepciones registradas para este barbero.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300 text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-300">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-300">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-300">Motivo</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-300">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 bg-gray-800">
                {exceptions.map((ex: any) => (
                  <tr key={ex.id}>
                    <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{ex.date}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/20 text-cyan-400"
                      >
                        {ex.type === 'DAY_OFF' ? 'Día Libre' : ex.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{ex.reason || 'Sin motivo'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        aria-label="Eliminar excepción"
                        onClick={() => handleDeleteException(ex.id)}
                        className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Edit Day Hours */}
      {editingDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.8)] p-4">
          <div className="rounded-2xl border [var(--border)] bg-[var(--surface)] p-6 space-y-5 max-w-md w-full">
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
              <h3 className="text-lg font-bold text-white">
                Editar Horario - {DAY_NAMES_ES[editingDay.day] || editingDay.day}
              </h3>
              <button
                type="button"
                onClick={() => setEditingDay(null)}
                className="text-gray-400 hover:text-gray-300 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveDay} className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="day-active-check"
                  checked={dayActive}
                  onChange={(e) => setDayActive(e.target.checked)}
                  className="rounded border-cyan-400 text-cyan-400 h-4 w-4"
                />
                <label htmlFor="day-active-check" className="text-sm font-medium text-white">
                  Día Laborable (Activo)
                </label>
              </div>

              {dayActive && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start-time" className="block text-xs font-medium text-cyan mb-1">
                      Hora Inicio
                    </label>
                    <input
                      type="time"
                      id="start-time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      className="w-full rounded border [var(--border)] py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="end-time" className="block text-xs font-medium text-cyan mb-1">
                      Hora Fin
                    </label>
                    <input
                      type="time"
                      id="end-time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                      className="w-full rounded border [var(--border)] py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setEditingDay(null)}
                  className="btn-secondary text-sm text-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Horario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Exception */}
      {showExceptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.8)] p-4">
          <div className="rounded-2xl border [var(--border)] bg-[var(--surface)] p-6 space-y-5 max-w-md w-full">
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
              <h3 className="text-lg font-bold text-white">Nueva Excepción</h3>
              <button
                type="button"
                onClick={() => setShowExceptionModal(false)}
                className="text-gray-400 hover:text-gray-300 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddException} className="space-y-4">
              <div>
                <label htmlFor="ex-date" className="block text-xs font-medium text-cyan mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  id="ex-date"
                  value={exDate}
                  onChange={(e) => setExDate(e.target.value)}
                  required
                  className="w-full rounded border [var(--border)] py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              <div>
                <label htmlFor="ex-type" className="block text-xs font-medium text-cyan mb-1">
                  Tipo
                </label>
                <select
                  id="ex-type"
                  value={exType}
                  onChange={(e) => setExType(e.target.value as any)}
                  className="w-full rounded border [var(--border)] py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="DAY_OFF">Día Libre</option>
                  <option value="HALF_DAY">Medio Día</option>
                  <option value="CUSTOM">Personalizado</option>
                </select>
              </div>

              <div>
                <label htmlFor="ex-reason" className="block text-xs font-medium text-cyan mb-1">
                  Motivo
                </label>
                <input
                  type="text"
                  id="ex-reason"
                  placeholder="Ej. Vacaciones, Feriado, Médico..."
                  value={exReason}
                  onChange={(e) => setExReason(e.target.value)}
                  required
                  className="w-full rounded border [var(--border)] py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowExceptionModal(false)}
                  className="btn-secondary text-sm text-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Excepción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}