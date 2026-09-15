import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import DataTable from '../../components/shared/DataTable'
import { StatCard } from '../../components/shared/StatCard'

interface Payment {
  id: string
  date: string
  clientName: string
  barberName: string
  amount: number
  method: 'CASH' | 'CARD' | 'TRANSFER' | 'QR'
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED'
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 5

  const resetPage = () => setPage(1)

  useEffect(() => {
    api.get('/payments').then(r => setPayments(r.data || [])).finally(() => setLoading(false))
  }, [])

  const summary = {
    totalRevenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    completedCount: payments.filter(p => p.status === 'COMPLETED').length,
    pendingCount: payments.filter(p => p.status === 'PENDING').length,
    refundedCount: payments.filter(p => p.status === 'REFUNDED').length,
  }

  const filtered = payments.filter(p => {
    if (search.trim()) {
      const q = search.toLowerCase()
      const match = (p.clientName || '').toLowerCase().includes(q) ||
                    (p.barberName || '').toLowerCase().includes(q) ||
                    (p.method || '').toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  if (loading) return <LoadingSpinner />

  const methodLabels: Record<string, string> = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
    QR: 'QR',
  }

  const StatusBadge = ({ status }: { status: Payment['status'] }) => {
    const map: Record<string, { cls: string; label: string }> = {
      COMPLETED: { cls: 'bg-emerald-500/20 text-emerald-400', label: 'Completado' },
      PENDING: { cls: 'bg-amber-500/20 text-amber-400', label: 'Pendiente' },
      FAILED: { cls: 'bg-red-500/20 text-red-400', label: 'Fallido' },
      REFUNDED: { cls: 'bg-cyan-500/20 text-cyan-400', label: 'Reembolsado' },
    }
    const { cls, label } = map[status] ?? { cls: 'bg-white/10 text-white', label: status }
    return <span className={`${cls} rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap`}>{label}</span>
  }

  return (
    <div className="space-y-5 min-h-screen">
      <h1 className="text-2xl font-display font-bold text-white">Gestión de Pagos</h1>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Ingresos Totales" value={`$${summary.totalRevenue.toLocaleString()}`} subtitle="Acumulado" />
        <StatCard title="Completados" value={summary.completedCount} subtitle="Pagos" />
        <StatCard title="Ticket Promedio" value={summary.completedCount > 0 ? `$${Math.round(summary.totalRevenue / summary.completedCount)}` : '$0'} subtitle="Por pago" />
        <StatCard title="Pendientes" value={summary.pendingCount} subtitle="Por cobrar" />
      </div>

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
            aria-label="Buscar pagos"
          />
        </div>
      </div>

      {/* Mobile: Cards */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No hay pagos</p>
        ) : (
          paged.map(p => (
            <div key={p.id} className="p-4 rounded-xl bg-white/[0.03] border border-gray-800/50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium truncate">{p.clientName}</p>
                  <p className="text-gray-500 text-xs mt-1">{p.barberName} · {methodLabels[p.method] || p.method}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-cyan font-medium">${p.amount}</p>
                  <StatusBadge status={p.status} />
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                <span>{p.date}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: Table */}
      <div className="hidden sm:block">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No hay pagos</p>
        ) : (
          <DataTable<Payment>
            columns={[
              { key: 'date', header: 'Fecha', sortable: true },
              { key: 'clientName', header: 'Cliente', sortable: true },
              { key: 'barberName', header: 'Barbero', sortable: true, hideOnMobile: true },
              { key: 'amount', header: 'Monto', sortable: true, render: (p) => <span className="text-cyan font-medium">${p.amount}</span> },
              { key: 'method', header: 'Método', sortable: true, render: (p) => (
                <span className="bg-white/10 text-white rounded px-2 py-0.5 text-xs font-medium">{methodLabels[p.method] || p.method}</span>
              )},
              { key: 'status', header: 'Estado', sortable: true, render: (p) => <StatusBadge status={p.status} /> },
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
