import { useEffect, useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import { StatCard } from '../../components/shared/StatCard'

interface Campaign {
  id: string
  name: string
  description?: string
  type: string
  channel: string
  status: 'ACTIVE' | 'PAUSED' | 'DRAFT' | 'COMPLETED'
  startDate?: string
  endDate?: string
  discountPercent?: number
  stats?: {
    sent?: number
    opened?: number
    converted?: number
    revenue?: number
  }
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  PROMOTION: { label: 'Promoción', color: 'bg-cyan-500/20 text-cyan-400' },
  DISCOUNT: { label: 'Descuento', color: 'bg-red-500/20 text-red-400' },
  REFERRAL: { label: 'Referidos', color: 'bg-amber-500/20 text-amber-400' },
  SEASONAL: { label: 'Temporada', color: 'bg-cyan-600/20 text-cyan-300' },
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Activa', color: 'bg-emerald-500/20 text-emerald-400' },
  PAUSED: { label: 'Pausada', color: 'bg-white/10 text-gray-400' },
  DRAFT: { label: 'Borrador', color: 'bg-white/10 text-gray-500' },
  COMPLETED: { label: 'Completada', color: 'bg-emerald-500/20 text-emerald-400' },
}

function FilterDropdown({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className="relative">
      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">{label}</label>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 !bg-white/[0.03] !border !rounded-lg !px-3 !py-2 text-sm text-left transition-all ${open ? '!border-cyan/50 !ring-1 !ring-cyan/20' : '!border-white/10'}`}
      >
        <span className="text-white truncate">{selected?.label || 'Todos'}</span>
        <svg className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[160px] bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl py-1 animate-fade-in">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${opt.value === value ? 'text-cyan bg-white/5' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 5
  const hasActiveFilters = statusFilter !== 'ALL' || typeFilter !== 'ALL'

  const resetPage = () => setPage(1)

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const res = await api.get('/campaigns')
      setCampaigns(res.data || [])
    } catch (err) {
      console.error('Error loading campaigns:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false
      if (typeFilter !== 'ALL' && c.type !== typeFilter) return false
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [campaigns, statusFilter, typeFilter, search])

  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paged = filteredCampaigns.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const totals = useMemo(() => {
    const totalCount = campaigns.length
    const activeCount = campaigns.filter((c) => c.status === 'ACTIVE').length
    const totalSent = campaigns.reduce((acc, c) => acc + (c.stats?.sent || 0), 0)
    const totalRevenue = campaigns.reduce((acc, c) => acc + (c.stats?.revenue || 0), 0)
    return { totalCount, activeCount, totalSent, totalRevenue }
  }, [campaigns])

  const handleToggleStatus = async (campaign: any) => {
    const nextStatus: 'ACTIVE' | 'PAUSED' | 'DRAFT' | 'COMPLETED' = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    try {
      await api.put(`/campaigns/${campaign.id}/status`, { status: nextStatus })
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaign.id ? { ...c, status: nextStatus } : c))
      )
    } catch (err) {
      console.error('Error changing campaign status:', err)
    }
  }

  if (loading && campaigns.length === 0) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-5 min-h-screen">
      <h1 className="text-2xl font-display font-bold text-white">Campañas y Promociones</h1>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Total" value={totals.totalCount} subtitle="Histórico" />
        <StatCard title="Activas" value={totals.activeCount} subtitle="En curso" />
        <StatCard title="Enviados" value={totals.totalSent} subtitle="Mensajes" />
        <StatCard title="Ingresos" value={`$${totals.totalRevenue.toLocaleString()}`} subtitle="Atribuido" />
      </div>

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
            aria-label="Buscar campañas"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-3">
        <FilterDropdown
          label="Estado"
          value={statusFilter}
          onChange={v => { setStatusFilter(v); resetPage() }}
          options={[
            { value: 'ALL', label: 'Todos' },
            { value: 'ACTIVE', label: 'Activas' },
            { value: 'PAUSED', label: 'Pausadas' },
            { value: 'DRAFT', label: 'Borradores' },
            { value: 'COMPLETED', label: 'Completadas' },
          ]}
        />
        <FilterDropdown
          label="Tipo"
          value={typeFilter}
          onChange={v => { setTypeFilter(v); resetPage() }}
          options={[
            { value: 'ALL', label: 'Todos' },
            { value: 'DISCOUNT', label: 'Descuento' },
            { value: 'PROMOTION', label: 'Promoción' },
            { value: 'REFERRAL', label: 'Referidos' },
            { value: 'SEASONAL', label: 'Temporada' },
          ]}
        />
      </div>

      {/* Campaigns List */}
      {filteredCampaigns.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">
          {hasActiveFilters ? 'No hay campañas con esos filtros' : 'No hay campañas'}
        </p>
      ) : (
        <div className="space-y-3">
          {paged.map((camp) => {
            const typeInfo = TYPE_LABELS[camp.type] || { label: camp.type, color: 'bg-white/10 text-white' }
            const statusInfo = STATUS_LABELS[camp.status] || { label: camp.status, color: 'bg-white/10 text-white' }

            return (
              <div
                key={camp.id}
                className="p-4 rounded-xl bg-white/[0.03] border border-gray-800/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium truncate">{camp.name}</p>
                    {camp.description && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{camp.description}</p>}
                  </div>
                  <span className={`${statusInfo.color} rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap`}>{statusInfo.label}</span>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={`${typeInfo.color} rounded px-2 py-0.5 text-xs font-medium`}>{typeInfo.label}</span>
                  <span className="bg-white/10 text-gray-400 rounded px-2 py-0.5 text-xs font-medium">{camp.channel}</span>
                  {camp.discountPercent && (
                    <span className="bg-cyan-500/20 text-cyan-400 rounded px-2 py-0.5 text-xs font-medium">{camp.discountPercent}% OFF</span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-800/50 text-center text-xs">
                  <div>
                    <span className="text-gray-500 block">Enviados</span>
                    <span className="text-white font-medium">{camp.stats?.sent || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Abiertos</span>
                    <span className="text-white font-medium">{camp.stats?.opened || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Conv.</span>
                    <span className="text-white font-medium">{camp.stats?.converted || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Ingresos</span>
                    <span className="text-emerald-400 font-medium">${camp.stats?.revenue || 0}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800/50">
                  <span className="text-xs text-gray-500">
                    {camp.startDate} {camp.endDate ? `hasta ${camp.endDate}` : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    {camp.status !== 'COMPLETED' && camp.status !== 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(camp)}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg border border-cyan/30 text-cyan hover:bg-cyan/10 transition-colors"
                      >
                        {camp.status === 'ACTIVE' ? 'Pausar' : 'Reanudar'}
                      </button>
                    )}
                    <Link
                      to={`/admin/campanas/${camp.id}`}
                      className="px-3 py-1 text-xs font-medium rounded-lg bg-cyan/20 text-cyan hover:bg-cyan/30 transition-colors"
                    >
                      Ver →
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">{filteredCampaigns.length} resultado{filteredCampaigns.length !== 1 ? 's' : ''}</span>
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
