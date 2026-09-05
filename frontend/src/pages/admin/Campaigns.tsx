import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import { StatCard } from '../../components/shared/StatCard'
import type { Campaign } from '../../services/interfaces'

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  PROMOTION: { label: 'Promoción', color: 'bg-purple-100 text-purple-800' },
  DISCOUNT: { label: 'Descuento', color: 'bg-blue-100 text-blue-800' },
  REFERRAL: { label: 'Referidos', color: 'bg-emerald-100 text-emerald-800' },
  SEASONAL: { label: 'Temporada', color: 'bg-amber-100 text-amber-800' },
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Activa', color: 'bg-badge-success/20 text-badge-success' },
  PAUSED: { label: 'Pausada', color: 'bg-yellow-100 text-yellow-800' },
  DRAFT: { label: 'Borrador', color: 'bg-surface text-text-primary' },
  COMPLETED: { label: 'Completada', color: 'bg-indigo-100 text-indigo-800' },
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [search, setSearch] = useState<string>('')

  // Create Campaign Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<Campaign['type']>('DISCOUNT')
  const [channel, setChannel] = useState<Campaign['channel']>('WHATSAPP')
  const [targetAudience, setTargetAudience] = useState<Campaign['targetAudience']>('ALL')
  const [discountPercent, setDiscountPercent] = useState<string>('')
  const [referralCode, setReferralCode] = useState<string>('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  const totals = useMemo(() => {
    const totalCount = campaigns.length
    const activeCount = campaigns.filter((c) => c.status === 'ACTIVE').length
    const totalSent = campaigns.reduce((acc, c) => acc + (c.stats?.sent || 0), 0)
    const totalRevenue = campaigns.reduce((acc, c) => acc + (c.stats?.revenue || 0), 0)
    return { totalCount, activeCount, totalSent, totalRevenue }
  }, [campaigns])

  const handleToggleStatus = async (campaign: Campaign) => {
    const nextStatus: Campaign['status'] = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    try {
      await api.put(`/campaigns/${campaign.id}/status`, { status: nextStatus })
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaign.id ? { ...c, status: nextStatus } : c))
      )
    } catch (err) {
      console.error('Error changing campaign status:', err)
    }
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      setSubmitting(true)
      const payload = {
        name,
        description,
        type,
        channel,
        targetAudience,
        status: 'DRAFT' as const,
        discountPercent: discountPercent ? Number(discountPercent) : undefined,
        referralCode: referralCode.trim() || undefined,
        startDate,
        endDate: endDate || undefined,
      }

      const res = await api.post('/campaigns', payload)
      const created = res.data
      setCampaigns((prev) => [created, ...prev])
      setShowCreateModal(false)

      // Reset form
      setName('')
      setDescription('')
      setDiscountPercent('')
      setReferralCode('')
      setEndDate('')
    } catch (err) {
      console.error('Error creating campaign:', err)
    } finally {
      setSubmitting(false)
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Campañas y Promociones</h1>
          <p className="text-sm text-text-muted mt-1">
            Crea promociones, gestiona cupones y códigos de referidos para atraer clientes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          + Nueva Campaña
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Campañas" value={totals.totalCount} subtitle="Histórico" />
        <StatCard title="Campañas Activas" value={totals.activeCount} subtitle="En curso" />
        <StatCard title="Mensajes Enviados" value={totals.totalSent} subtitle="A clientes" />
        <StatCard
          title="Ingresos Generados"
          value={`$${totals.totalRevenue.toLocaleString()}`}
          subtitle="Atribuido a campañas"
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface-elevated p-4 rounded-xl shadow-sm border border-border flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-xs font-medium text-text-primary whitespace-nowrap">
              Filtrar por Estado:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-border bg-surface-elevated py-1.5 px-3 text-sm focus:border-primary focus:ring-primary"
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVE">Activas</option>
              <option value="PAUSED">Pausadas</option>
              <option value="DRAFT">Borradores</option>
              <option value="COMPLETED">Completadas</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="type-filter" className="text-xs font-medium text-text-primary whitespace-nowrap">
              Tipo:
            </label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-md border border-border bg-surface-elevated py-1.5 px-3 text-sm focus:border-primary focus:ring-primary"
            >
              <option value="ALL">Todos los tipos</option>
              <option value="DISCOUNT">Descuento</option>
              <option value="PROMOTION">Promoción</option>
              <option value="REFERRAL">Referidos</option>
              <option value="SEASONAL">Temporada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.length === 0 ? (
          <div className="bg-surface-elevated rounded-xl border border-border p-8 text-center text-text-muted">
            No se encontraron campañas con los filtros aplicados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCampaigns.map((camp) => {
              const typeInfo = TYPE_LABELS[camp.type] || { label: camp.type, color: 'bg-surface text-text-primary' }
              const statusInfo = STATUS_LABELS[camp.status] || {
                label: camp.status,
                color: 'bg-surface text-text-primary',
              }

              return (
                <div
                  key={camp.id}
                  className="bg-surface-elevated rounded-xl shadow-sm border border-border p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h2 className="font-bold text-text-primary text-base">{camp.name}</h2>
                        <p className="text-xs text-text-muted line-clamp-2 mt-0.5">{camp.description}</p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                      <span className="px-2 py-0.5 rounded bg-surface text-text-primary font-medium">
                        Canal: {camp.channel}
                      </span>
                      {camp.discountPercent && (
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                          {camp.discountPercent}% OFF
                        </span>
                      )}
                      {camp.referralCode && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold">
                          {camp.referralCode}
                        </span>
                      )}
                    </div>

                    {/* Performance metrics pill bar */}
                    <div className="bg-surface rounded-lg p-3 grid grid-cols-4 gap-2 text-center text-xs">
                      <div>
                        <span className="block text-text-muted font-medium">Enviados</span>
                        <span className="font-bold text-text-primary">{camp.stats?.sent || 0} enviados</span>
                      </div>
                      <div>
                        <span className="block text-text-muted font-medium">Abiertos</span>
                        <span className="font-bold text-text-primary">{camp.stats?.opened || 0}</span>
                      </div>
                      <div>
                        <span className="block text-text-muted font-medium">Conv.</span>
                        <span className="font-bold text-text-primary">{camp.stats?.converted || 0}</span>
                      </div>
                      <div>
                        <span className="block text-text-muted font-medium">Ingresos</span>
                        <span className="font-bold text-badge-success">${camp.stats?.revenue || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-text-muted">
                      {camp.startDate} {camp.endDate ? `hasta ${camp.endDate}` : ''}
                    </span>

                    <div className="flex items-center gap-2">
                      {camp.status !== 'COMPLETED' && camp.status !== 'DRAFT' && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(camp)}
                          className="px-2.5 py-1 text-xs font-medium rounded border border-border text-text-primary hover:bg-surface"
                        >
                          {camp.status === 'ACTIVE' ? 'Pausar' : 'Reanudar'}
                        </button>
                      )}

                      <Link
                        to={`/admin/campanas/${camp.id}`}
                        className="px-3 py-1 text-xs font-semibold rounded bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        Ver Estadísticas →
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal: Create Campaign */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-surface-elevated rounded-xl shadow-xl max-w-lg w-full p-6 space-y-5">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-text-primary">Crear Nueva Campaña</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-text-muted hover:text-gray-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label htmlFor="camp-name" className="block text-xs font-medium text-text-primary mb-1">
                  Nombre de la Campaña
                </label>
                <input
                  type="text"
                  id="camp-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Promoción Primavera 2026"
                  required
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="camp-desc" className="block text-xs font-medium text-text-primary mb-1">
                  Descripción
                </label>
                <textarea
                  id="camp-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles y condiciones de la campaña..."
                  rows={2}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="camp-type" className="block text-xs font-medium text-text-primary mb-1">
                    Tipo de Campaña
                  </label>
                  <select
                    id="camp-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                  >
                    <option value="DISCOUNT">Descuento</option>
                    <option value="PROMOTION">Promoción</option>
                    <option value="REFERRAL">Referidos</option>
                    <option value="SEASONAL">Temporada</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="camp-channel" className="block text-xs font-medium text-text-primary mb-1">
                    Canal Principal
                  </label>
                  <select
                    id="camp-channel"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="SMS">SMS</option>
                    <option value="EMAIL">Email</option>
                    <option value="PUSH">Notificación Push</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="camp-audience" className="block text-xs font-medium text-text-primary mb-1">
                    Audiencia Objetivo
                  </label>
                  <select
                    id="camp-audience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                  >
                    <option value="ALL">Todos los clientes</option>
                    <option value="NEW">Clientes nuevos</option>
                    <option value="CLIENTS">Clientes habituales</option>
                    <option value="INACTIVE">Clientes inactivos</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="camp-discount" className="block text-xs font-medium text-text-primary mb-1">
                    Descuento (%)
                  </label>
                  <input
                    type="number"
                    id="camp-discount"
                    min="1"
                    max="100"
                    placeholder="Ej. 20"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>

              {type === 'REFERRAL' && (
                <div>
                  <label htmlFor="camp-referral" className="block text-xs font-medium text-text-primary mb-1">
                    Código de Referido (Opcional)
                  </label>
                  <input
                    type="text"
                    id="camp-referral"
                    placeholder="Ej. AMIGO2026"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono focus:border-primary focus:ring-primary"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="camp-start" className="block text-xs font-medium text-text-primary mb-1">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    id="camp-start"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="camp-end" className="block text-xs font-medium text-text-primary mb-1">
                    Fecha Fin (Opcional)
                  </label>
                  <input
                    type="date"
                    id="camp-end"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text-primary hover:bg-surface"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Guardar Campaña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
