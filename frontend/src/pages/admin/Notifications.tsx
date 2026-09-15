import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import DataTable from '../../components/shared/DataTable'

interface Notification {
  id: string
  title: string
  recipientType: string
  channel: string
  status: 'SENT' | 'DELIVERED' | 'PENDING' | 'FAILED'
  createdAt: string
}

interface NotificationTemplate {
  id: string
  name: string
  channel: string
  type: string
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 5

  const resetPage = () => setPage(1)

  useEffect(() => {
    api.get('/notifications').then(r => setNotifications(r.data || [])).finally(() => setLoading(false))
    api.get('/notifications/templates').then(r => setTemplates(r.data || [])).finally(() => setLoading(false))
  }, [])

  const filtered = notifications.filter(n => {
    if (search.trim()) {
      const q = search.toLowerCase()
      const match = (n.title || '').toLowerCase().includes(q) ||
                    (n.recipientType || '').toLowerCase().includes(q) ||
                    (n.channel || '').toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  if (loading) return <LoadingSpinner />

  const StatusBadge = ({ status }: { status: Notification['status'] }) => {
    const map: Record<string, { cls: string; label: string }> = {
      SENT: { cls: 'bg-cyan-500/20 text-cyan-400', label: 'Enviado' },
      DELIVERED: { cls: 'bg-emerald-500/20 text-emerald-400', label: 'Entregado' },
      PENDING: { cls: 'bg-amber-500/20 text-amber-400', label: 'Pendiente' },
      FAILED: { cls: 'bg-red-500/20 text-red-400', label: 'Fallido' },
    }
    const { cls, label } = map[status] ?? { cls: 'bg-white/10 text-white', label: status }
    return <span className={`${cls} rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap`}>{label}</span>
  }

  return (
    <div className="space-y-5 min-h-screen">
      <h1 className="text-2xl font-display font-bold text-white">Notificaciones</h1>

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
            aria-label="Buscar notificaciones"
          />
        </div>
      </div>

      {/* Mobile: Cards */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No hay notificaciones</p>
        ) : (
          paged.map(n => (
            <div key={n.id} className="p-4 rounded-xl bg-white/[0.03] border border-gray-800/50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium truncate">{n.title}</p>
                  <p className="text-gray-500 text-xs mt-1">{n.recipientType} · {n.channel}</p>
                </div>
                <StatusBadge status={n.status} />
              </div>
              <div className="mt-3 text-xs text-gray-500">
                <span>{n.createdAt}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: Table */}
      <div className="hidden sm:block">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No hay notificaciones</p>
        ) : (
          <DataTable<Notification>
            columns={[
              { key: 'title', header: 'Título', sortable: true },
              { key: 'recipientType', header: 'Destinatario', sortable: true },
              { key: 'channel', header: 'Canal', sortable: true },
              { key: 'status', header: 'Estado', sortable: true, render: (n) => <StatusBadge status={n.status} /> },
              { key: 'createdAt', header: 'Fecha', sortable: true },
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

      {/* Templates Section */}
      <div className="pt-4 border-t border-gray-800/50">
        <h2 className="text-lg font-bold text-white mb-4">Plantillas</h2>
        <DataTable<NotificationTemplate>
          columns={[
            { key: 'name', header: 'Nombre', sortable: true },
            { key: 'channel', header: 'Canal', sortable: true },
            { key: 'type', header: 'Tipo', sortable: true },
          ]}
          data={templates}
          keyExtractor={(item) => item.id}
          pageSize={5}
        />
      </div>
    </div>
  )
}
