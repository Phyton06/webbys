import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import DataTable from '../../components/shared/DataTable'

interface Assistant {
  id: string
  name: string
  email: string
  phone: string
  active: boolean
}

export default function Assistants() {
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 5

  const resetPage = () => setPage(1)

  const load = () => {
    api.get('/assistants')
      .then((r) => setAssistants(r.data.assistants ?? r.data))
      .catch(() => setAssistants([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await api.put(`/assistants/${editingId}`, form)
    } else {
      await api.post('/assistants', form)
    }
    setForm({ name: '', email: '', phone: '' })
    setEditingId(null)
    setShowForm(false)
    load()
  }

  const handleEdit = (a: Assistant) => {
    setForm({ name: a.name, email: a.email, phone: a.phone })
    setEditingId(a.id)
    setShowForm(true)
  }

  const handleToggleActive = async (a: Assistant) => {
    if (!confirm(a.active ? '¿Desactivar este asistente?' : '¿Activar este asistente?')) return
    await api.put(`/assistants/${a.id}`, { active: !a.active })
    load()
  }

  const filtered = assistants.filter(a => {
    if (search.trim()) {
      const q = search.toLowerCase()
      const match = (a.name || '').toLowerCase().includes(q) ||
                    (a.email || '').toLowerCase().includes(q) ||
                    (a.phone || '').toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  if (loading) return <LoadingSpinner />

  const StatusBadge = ({ active }: { active: boolean }) => {
    return active
      ? <span className="bg-emerald-500/20 text-emerald-400 rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap">Activo</span>
      : <span className="bg-red-500/20 text-red-400 rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap">Inactivo</span>
  }

  return (
    <div className="space-y-5 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-white">Asistentes</h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', email: '', phone: '' }) }}
          className="px-4 py-2 rounded-lg bg-cyan/20 text-cyan text-sm font-medium hover:bg-cyan/30 transition-colors"
        >
          + Nuevo
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-white/[0.03] border border-gray-800/50 space-y-3">
          <h2 className="text-white font-medium">{editingId ? 'Editar asistente' : 'Nuevo asistente'}</h2>
          <input
            type="text"
            placeholder="Nombre"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full !bg-white/[0.03] !border !border-white/10 !rounded-lg !px-3 !py-2 text-sm text-white"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full !bg-white/[0.03] !border !border-white/10 !rounded-lg !px-3 !py-2 text-sm text-white"
            required
          />
          <input
            type="tel"
            placeholder="Teléfono"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full !bg-white/[0.03] !border !border-white/10 !rounded-lg !px-3 !py-2 text-sm text-white"
            required
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-cyan/20 text-cyan text-sm font-medium hover:bg-cyan/30 transition-colors">
              {editingId ? 'Guardar' : 'Crear'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-gray-400 text-sm hover:text-white transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

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
            aria-label="Buscar asistentes"
          />
        </div>
      </div>

      {/* Mobile: Cards */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No hay asistentes</p>
        ) : (
          paged.map(a => (
            <div key={a.id} className="p-4 rounded-xl bg-white/[0.03] border border-gray-800/50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium truncate">{a.name}</p>
                  <p className="text-gray-500 text-xs mt-1">{a.email}</p>
                </div>
                <StatusBadge active={a.active} />
              </div>
              <div className="flex items-center justify-between mt-3 text-xs">
                <span className="text-gray-500">{a.phone}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(a)} className="text-cyan hover:text-cyan/80 transition-colors">Editar</button>
                  <button onClick={() => handleToggleActive(a)} className="text-gray-500 hover:text-white transition-colors">{a.active ? 'Desactivar' : 'Activar'}</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: Table */}
      <div className="hidden sm:block">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No hay asistentes</p>
        ) : (
          <DataTable<Assistant>
            columns={[
              { key: 'name', header: 'Asistente', sortable: true },
              { key: 'email', header: 'Email', sortable: true, hideOnMobile: true },
              { key: 'phone', header: 'Teléfono', sortable: true, hideOnMobile: true },
              { key: 'active', header: 'Estado', sortable: true, render: (item) => <StatusBadge active={item.active} /> },
              { key: 'actions', header: 'Acciones', sortable: false, render: (item) => (
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(item)} className="text-cyan hover:text-cyan/80 text-xs transition-colors">Editar</button>
                  <button onClick={() => handleToggleActive(item)} className="text-gray-500 hover:text-white text-xs transition-colors">{item.active ? 'Desactivar' : 'Activar'}</button>
                </div>
              )},
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
