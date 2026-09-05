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

  // Edit Day Modal
  const [editingDay, setEditingDay] = useState<ScheduleEntry | null>(null)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [dayActive, setDayActive] = useState(true)

  // Add Exception Modal
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

  const handleOpenEditDay = (entry: ScheduleEntry) => {
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

    const updatedEntries = schedule.entries.map((entry) => {
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
      setExceptions((prev) => [...prev, newEx])
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
      setExceptions((prev) => prev.filter((e) => e.id !== id))
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
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header & Barber Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Horarios y Disponibilidad</h1>
          <p className="text-sm text-text-muted mt-1">
            Gestiona los turnos semanales y excepciones por barbero.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="barber-select" className="text-sm font-medium text-text-primary">
            Barbero:
          </label>
          <select
            id="barber-select"
            value={selectedBarberId}
            onChange={(e) => setSelectedBarberId(e.target.value)}
            className="rounded-md border border-border bg-surface-elevated py-2 px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
      <div className="bg-surface-elevated rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-5 bg-surface border-b border-border flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Horario Semanal: {currentBarberName}</h2>
            <p className="text-xs text-text-muted">Configuración estándar repetida cada semana</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {DEFAULT_DAYS.map((dayKey) => {
            const entry = schedule?.entries?.find((e) => e.day.toLowerCase() === dayKey.toLowerCase()) || {
              day: dayKey,
              slots: [],
            }
            const hasSlots = entry.slots && entry.slots.length > 0
            const dayLabel = DAY_NAMES_ES[dayKey] || dayKey

            return (
              <div key={dayKey} className="p-4 flex flex-col justify-between hover:bg-surface transition-colors">
                <div>
                  <span className="font-semibold text-text-primary text-sm block mb-2">{dayLabel}</span>
                  {hasSlots ? (
                    <div className="space-y-1">
                      {entry.slots.map((slot, idx) => (
                        <div
                          key={idx}
                          className="bg-amber-50 text-amber-900 border border-amber-200 rounded px-2 py-1 text-xs font-medium text-center"
                        >
                          {slot.start} - {slot.end}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="inline-block px-2 py-1 text-xs text-text-muted bg-surface rounded font-medium">
                      Cerrado
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => handleOpenEditDay(entry)}
                    className="w-full text-xs font-medium text-primary hover:text-amber-700 py-1 rounded hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-colors"
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
      <div className="bg-surface-elevated rounded-xl shadow-sm border border-border p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Excepciones y Días Libres</h2>
            <p className="text-xs text-text-muted">
              Días no laborables, feriados o ausencias programadas que sobrescriben el horario semanal.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowExceptionModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            + Agregar Excepción
          </button>
        </div>

        {exceptions.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm">
            No hay excepciones registradas para este barbero.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Motivo</th>
                  <th className="px-4 py-3 text-right font-medium text-text-muted">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-surface-elevated">
                {exceptions.map((ex) => (
                  <tr key={ex.id}>
                    <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">{ex.date}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-badge-error/20 text-badge-error">
                        {ex.type === 'DAY_OFF' ? 'Día Libre' : ex.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{ex.reason || 'Sin motivo'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        aria-label="Eliminar excepción"
                        onClick={() => handleDeleteException(ex.id)}
                        className="text-red-600 hover:text-red-800 text-xs font-semibold"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-surface-elevated rounded-xl shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-text-primary">
                Editar Horario - {DAY_NAMES_ES[editingDay.day] || editingDay.day}
              </h3>
              <button
                type="button"
                onClick={() => setEditingDay(null)}
                className="text-text-muted hover:text-gray-600 text-lg font-bold"
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
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="day-active-check" className="text-sm font-medium text-text-primary">
                  Día Laborable (Activo)
                </label>
              </div>

              {dayActive && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start-time" className="block text-xs font-medium text-text-primary mb-1">
                      Hora Inicio
                    </label>
                    <input
                      type="time"
                      id="start-time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="end-time" className="block text-xs font-medium text-text-primary mb-1">
                      Hora Fin
                    </label>
                    <input
                      type="time"
                      id="end-time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                      className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingDay(null)}
                  className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text-primary hover:bg-surface"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium shadow-sm disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-surface-elevated rounded-xl shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-text-primary">Nueva Excepción</h3>
              <button
                type="button"
                onClick={() => setShowExceptionModal(false)}
                className="text-text-muted hover:text-gray-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddException} className="space-y-4">
              <div>
                <label htmlFor="ex-date" className="block text-xs font-medium text-text-primary mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  id="ex-date"
                  value={exDate}
                  onChange={(e) => setExDate(e.target.value)}
                  required
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="ex-type" className="block text-xs font-medium text-text-primary mb-1">
                  Tipo
                </label>
                <select
                  id="ex-type"
                  value={exType}
                  onChange={(e) => setExType(e.target.value as any)}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                >
                  <option value="DAY_OFF">Día Libre</option>
                  <option value="HALF_DAY">Medio Día</option>
                  <option value="CUSTOM">Personalizado</option>
                </select>
              </div>

              <div>
                <label htmlFor="ex-reason" className="block text-xs font-medium text-text-primary mb-1">
                  Motivo
                </label>
                <input
                  type="text"
                  id="ex-reason"
                  placeholder="Ej. Vacaciones, Feriado, Médico..."
                  value={exReason}
                  onChange={(e) => setExReason(e.target.value)}
                  required
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowExceptionModal(false)}
                  className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text-primary hover:bg-surface"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium shadow-sm disabled:opacity-50"
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
