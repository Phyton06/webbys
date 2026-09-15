import { useEffect, useState, useRef } from 'react'
import api from '../../api/client'
import DataTable from '../../components/shared/DataTable'
import { useNavigate } from 'react-router-dom'

interface Appointment {
  id: string
  clientName: string
  barberName: string
  serviceName: string
  date: string
  time: string
  status: 'PENDIENTE' | 'PENDING' | 'CONFIRMADA' | 'CONFIRMED' | 'EN_CURSO' | 'IN_PROGRESS' | 'COMPLETADA' | 'COMPLETED' | 'CANCELADA' | 'CANCELLED'
}

interface DateRange {
  from: string | null
  to: string | null
}

function FilterDropdown({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const display = value || 'Todos'

  return (
    <div ref={ref} className="flex-1 relative">
      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">{label}</label>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between !bg-white/[0.03] !border !rounded-lg !px-3 !py-2 text-sm text-left transition-all ${open ? '!border-cyan/50 !ring-1 !ring-cyan/20' : '!border-white/10'}`}
      >
        <span className={value ? 'text-white' : 'text-gray-500'}>{display}</span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl overflow-hidden animate-fade-in">
          <button
            onClick={() => { onChange(''); setOpen(false) }}
            className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${!value ? 'text-cyan bg-cyan/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            Todos
          </button>
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false) }}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${value === opt ? 'text-cyan bg-cyan/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function DatePicker({ label, value, onChange, align = 'left' }: { label: string; value: string | null; onChange: (v: string | null) => void; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => {
    const d = value ? new Date(value + 'T00:00:00') : new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const firstDay = new Date(view.year, view.month, 1)
  const startDow = (firstDay.getDay() + 6) % 7 // Monday=0
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()

  const days: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const fmt = (d: number) => `${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const display = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : ''

  return (
    <div ref={ref} className="flex-1 relative">
      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">{label}</label>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2 !bg-white/[0.03] !border !rounded-lg !px-3 !py-2 text-sm text-left transition-all ${open ? '!border-cyan/50 !ring-1 !ring-cyan/20' : '!border-white/10'}`}
      >
        <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        <span className={value ? 'text-white' : 'text-gray-500'}>{display || 'dd/mm/aaaa'}</span>
      </button>
      {open && (
        <div className={`absolute z-50 mt-1 w-56 sm:w-64 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl p-3 animate-fade-in ${align === 'right' ? 'right-0' : 'left-0'}`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setView(v => ({ year: v.month === 0 ? v.year - 1 : v.year, month: v.month === 0 ? 11 : v.month - 1 }))} className="p-1 hover:bg-white/5 rounded transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            <span className="text-sm font-medium text-white">{MONTHS[view.month]} {view.year}</span>
            <button onClick={() => setView(v => ({ year: v.month === 11 ? v.year + 1 : v.year, month: v.month === 11 ? 0 : v.month + 1 }))} className="p-1 hover:bg-white/5 rounded transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
          </div>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[10px] text-gray-600 py-1">{d}</div>
            ))}
          </div>
          {/* Days grid */}
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              if (day === null) return <div key={`e${i}`} />
              const dateStr = fmt(day)
              const isSelected = value === dateStr
              const isToday = dateStr === todayStr
              return (
                <button
                  key={day}
                  onClick={() => { onChange(dateStr); setOpen(false) }}
                  className={`relative w-8 h-8 mx-auto flex items-center justify-center text-xs rounded-lg transition-all
                    ${isSelected ? 'bg-cyan text-white font-medium' : isToday ? 'text-cyan' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  {day}
                  {isToday && !isSelected && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan" />}
                </button>
              )
            })}
          </div>
          {/* Clear button */}
          {value && (
            <button
              onClick={() => { onChange(null); setOpen(false) }}
              className="w-full mt-2 py-1.5 text-xs text-gray-500 hover:text-white transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null })
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [barberFilter, setBarberFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
  const hasActiveFilters = dateRange.from || dateRange.to || barberFilter || clientFilter

  const resetPage = () => setPage(1)
  const PER_PAGE = 5

  useEffect(() => {
    api.get('/appointments')
      .then(r => setAppointments(r.data.appointments ?? r.data ?? []))
  }, [])

  const StatusBadge = ({ status }: { status: Appointment['status'] }) => {
    const map: Record<string, { cls: string; label: string }> = {
      PENDIENTE: { cls: 'bg-cyan-500/20 text-cyan-400', label: 'Pendiente' },
      PENDING: { cls: 'bg-cyan-500/20 text-cyan-400', label: 'Pendiente' },
      CONFIRMADA: { cls: 'bg-emerald-500/20 text-emerald-400', label: 'Confirmada' },
      CONFIRMED: { cls: 'bg-emerald-500/20 text-emerald-400', label: 'Confirmada' },
      EN_CURSO: { cls: 'bg-amber-500/20 text-amber-400', label: 'En curso' },
      IN_PROGRESS: { cls: 'bg-amber-500/20 text-amber-400', label: 'En curso' },
      COMPLETADA: { cls: 'bg-emerald-500/20 text-emerald-400', label: 'Completada' },
      COMPLETED: { cls: 'bg-emerald-500/20 text-emerald-400', label: 'Completada' },
      CANCELADA: { cls: 'bg-red-500/20 text-red-400', label: 'Cancelada' },
      CANCELLED: { cls: 'bg-red-500/20 text-red-400', label: 'Cancelada' },
    }
    const { cls, label } = map[status] ?? { cls: 'bg-white/10 text-white', label: status }
    return <span className={`${cls} rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap`}>{label}</span>
  }

  const handleRowClick = (appointment: Appointment) => {
    navigate(`/admin/appointments/${appointment.id}`)
  }



  const filteredAppointments = appointments.filter(a => {
    // Date range filter
    if (dateRange.from || dateRange.to) {
      const aDate = a.date
      if (dateRange.from && aDate < dateRange.from) return false
      if (dateRange.to && aDate > dateRange.to) return false
    }
    // Barber filter
    if (barberFilter && a.barberName !== barberFilter) return false
    // Client filter
    if (clientFilter && a.clientName !== clientFilter) return false
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      const match = (a.clientName || '').toLowerCase().includes(q) ||
                    (a.barberName || '').toLowerCase().includes(q) ||
                    (a.serviceName || '').toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paged = filteredAppointments.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return (
    <div className="space-y-5 min-h-screen">
      <h1 className="text-2xl font-display font-bold text-white">Citas</h1>

      {/* Search + filter toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage() }}
            className="w-full !bg-transparent !border-0 !border-b !border-gray-700 !rounded-none !pl-6 !pr-0 !py-2.5 text-sm text-white placeholder-gray-600 focus:!outline-none focus:!border-cyan transition-colors"
            aria-label="Buscar citas"
          />
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={`p-2.5 transition-colors ${showFilters || hasActiveFilters ? 'text-cyan' : 'text-gray-500 hover:text-gray-300'}`}
          aria-label="Filtros de fecha"
          aria-expanded={showFilters}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
        </button>
      </div>

      {/* Date range filters - collapsible */}
      {showFilters && (
        <div className="space-y-4 animate-fade-in">
          {/* Date row */}
          <div className="flex gap-3">
            <DatePicker label="Desde" value={dateRange.from} onChange={v => { setDateRange({ from: v, to: dateRange.to }); resetPage() }} />
            <DatePicker label="Hasta" value={dateRange.to} onChange={v => { setDateRange({ from: dateRange.from, to: v }); resetPage() }} align="right" />
          </div>

          {/* Dropdown row */}
          <div className="flex gap-3">
            <FilterDropdown
              label="Barbero"
              value={barberFilter}
              onChange={v => { setBarberFilter(v); resetPage() }}
              options={[...new Set(appointments.map(a => a.barberName).filter(Boolean))]}
            />
            <FilterDropdown
              label="Cliente"
              value={clientFilter}
              onChange={v => { setClientFilter(v); resetPage() }}
              options={[...new Set(appointments.map(a => a.clientName).filter(Boolean))]}
            />
          </div>
        </div>
      )}

      {/* Mobile: Cards */}
      <div className="sm:hidden space-y-3">
        {filteredAppointments.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            {hasActiveFilters ? 'No hay citas con esos filtros' : 'No hay citas'}
          </p>
        ) : (
          paged.map(a => (
            <button
              key={a.id}
              onClick={() => handleRowClick(a)}
              className="w-full text-left p-4 rounded-xl bg-white/[0.03] border border-gray-800/50 active:bg-white/[0.06] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium truncate">{a.clientName}</p>
                  <p className="text-gray-500 text-xs mt-1">{a.barberName} · {a.serviceName}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                <span>{a.date}</span>
                <span>·</span>
                <span>{a.time}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Desktop: Table */}
      <div className="hidden sm:block">
        {filteredAppointments.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            {hasActiveFilters ? 'No hay citas con esos filtros' : 'No hay citas'}
          </p>
        ) : (
          <DataTable<Appointment>
            columns={[
              { key: 'clientName', header: 'Cliente', sortable: true },
              { key: 'barberName', header: 'Barbero', sortable: true },
              { key: 'serviceName', header: 'Servicio', sortable: true },
              { key: 'date', header: 'Fecha', sortable: true },
              { key: 'time', header: 'Hora', sortable: true },
              { key: 'status', header: 'Estado', sortable: true }
            ]}
            data={paged}
            keyExtractor={(item) => item.id}
            onRowClick={handleRowClick}
            hideSearch
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">{filteredAppointments.length} resultado{filteredAppointments.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${n === safePage ? 'bg-cyan/20 text-cyan' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}