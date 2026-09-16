import { useEffect, useState } from 'react'
import api from '../../api/client'
import DataTable from '../../components/shared/DataTable'

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  duration: number
  status?: string
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 5

  const resetPage = () => setPage(1)

  useEffect(() => {
    api.get('/services').then(r => setServices(r.data.services ?? r.data ?? []))
  }, [])

  const filtered = services.filter(s => {
    if (search.trim()) {
      const q = search.toLowerCase()
      const match = (s.name || '').toLowerCase().includes(q) ||
                    (s.description || '').toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const StatusBadge = ({ status }: { status: string | undefined }) => {
    if (!status) return <span className="text-gray-500 text-xs">Sin estado</span>
    const map: Record<string, { cls: string; label: string }> = {
      ACTIVE: { cls: 'bg-emerald-500/20 text-emerald-400', label: 'Activo' },
      INACTIVE: { cls: 'bg-red-500/20 text-red-400', label: 'Inactivo' },
    }
    const { cls, label } = map[status] ?? { cls: 'bg-white/10 text-white', label: status }
    return <span className={`${cls} rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap`}>{label}</span>
  }

  return (
    <div className="space-y-5 min-h-screen">
      <h1 className="text-2xl font-display font-bold text-white">Servicios</h1>

      {/* Search */}
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
            aria-label="Buscar servicios"
          />
        </div>
      </div>

      {/* Mobile: Cards */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No hay servicios</p>
        ) : (
          paged.map(s => (
            <div
              key={s.id}
              className="p-4 rounded-xl bg-white/[0.03] border border-gray-800/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium truncate">{s.name}</p>
                  {s.description && <p className="text-gray-500 text-xs mt-1 truncate">{s.description}</p>}
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="text-cyan font-medium">${s.price}</span>
                <span>{s.duration} min</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: Table */}
      <div className="hidden sm:block">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No hay servicios</p>
        ) : (
          <DataTable<Service>
            columns={[
              { key: 'name', header: 'Nombre', sortable: true },
              { key: 'description', header: 'Descripción', sortable: true },
              { key: 'price', header: 'Precio', sortable: true, render: (s) => <span className="text-cyan font-medium">${s.price}</span> },
              { key: 'duration', header: 'Duración', sortable: true, render: (s) => <span>{s.duration} min</span> },
              { key: 'status', header: 'Estado', sortable: true, render: (item) => <StatusBadge status={item.status} /> },
            ]}
            data={paged}
            keyExtractor={(item) => item.id}
            hideSearch
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
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
