import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import { StatCard } from '../../components/shared/StatCard'
import type { Campaign, CampaignStats } from '../../services/interfaces'

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [stats, setStats] = useState<CampaignStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchCampaign = async () => {
    if (!id) return
    try {
      setLoading(true)
      const [campRes, statsRes] = await Promise.all([
        api.get(`/campaigns/${id}`),
        api.get(`/campaigns/${id}/stats`).catch(() => ({ data: null })),
      ])
      setCampaign(campRes.data)
      setStats(statsRes.data || campRes.data?.stats || null)
    } catch (err) {
      console.error('Error fetching campaign detail:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaign()
  }, [id])

  const openRate = useMemo(() => {
    if (!stats || !stats.sent) return 0
    return Math.round((stats.opened / stats.sent) * 100)
  }, [stats])

  const clickRate = useMemo(() => {
    if (!stats || !stats.opened) return 0
    return Math.round((stats.clicked / stats.opened) * 100)
  }, [stats])

  const conversionRate = useMemo(() => {
    if (!stats || !stats.sent) return 0
    return Math.round((stats.converted / stats.sent) * 100)
  }, [stats])

  const handleGenerateReferralCode = async () => {
    if (!id) return
    try {
      setGeneratingCode(true)
      const res = await api.post(`/campaigns/${id}/referral`)
      const newCode = res.data?.code || res.data
      if (campaign) {
        setCampaign({ ...campaign, referralCode: newCode })
      }
    } catch (err) {
      console.error('Error generating referral code:', err)
    } finally {
      setGeneratingCode(false)
    }
  }

  const handleCopyCode = () => {
    if (campaign?.referralCode) {
      navigator.clipboard?.writeText(campaign.referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleUpdateStatus = async (status: Campaign['status']) => {
    if (!id || !campaign) return
    try {
      await api.put(`/campaigns/${id}/status`, { status })
      setCampaign({ ...campaign, status })
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  if (loading && !campaign) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-surface-elevated p-8 rounded-xl border border-border text-center space-y-4">
          <p className="text-gray-600">Campaña no encontrada.</p>
          <Link to="/admin/campanas" className="text-primary font-semibold hover:underline">
            ← Volver a Campañas
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/admin/campanas" className="hover:text-primary transition-colors">
          Campañas
        </Link>
        <span>/</span>
        <span className="text-text-primary font-medium">{campaign.name}</span>
      </div>

      {/* Header Info */}
      <div className="bg-surface-elevated rounded-xl shadow-sm border border-border p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">{campaign.name}</h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                campaign.status === 'ACTIVE'
                  ? 'bg-badge-success/20 text-badge-success'
                  : campaign.status === 'PAUSED'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-surface text-text-primary'
              }`}
            >
              {campaign.status}
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1">{campaign.description}</p>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-600">
            <span>
              Tipo: <strong className="font-semibold text-text-primary">{campaign.type}</strong>
            </span>
            <span>•</span>
            <span>
              Canal: <strong className="font-semibold text-text-primary">{campaign.channel}</strong>
            </span>
            <span>•</span>
            <span>
              Audiencia: <strong className="font-semibold text-text-primary">{campaign.targetAudience}</strong>
            </span>
            {campaign.discountPercent && (
              <>
                <span>•</span>
                <span>
                  Descuento: <strong className="font-semibold text-badge-error">{campaign.discountPercent}%</strong>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex items-center gap-2">
          {campaign.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => handleUpdateStatus('PAUSED')}
              className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text-primary hover:bg-surface"
            >
              Pausar Campaña
            </button>
          )}
          {campaign.status === 'PAUSED' && (
            <button
              type="button"
              onClick={() => handleUpdateStatus('ACTIVE')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium shadow-sm"
            >
              Activar Campaña
            </button>
          )}
          {campaign.status === 'DRAFT' && (
            <button
              type="button"
              onClick={() => handleUpdateStatus('ACTIVE')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium shadow-sm"
            >
              Lanzar Campaña
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Mensajes Enviados" value={stats?.sent || 0} subtitle="Total entregados" />
        <StatCard title="Mensajes Abiertos" value={stats?.opened || 0} subtitle={`${openRate}% tasa apertura`} />
        <StatCard title="Clics Registrados" value={stats?.clicked || 0} subtitle={`${clickRate}% CTR`} />
        <StatCard
          title="Conversiones"
          value={stats?.converted || 0}
          subtitle={`${conversionRate}% tasa conversión`}
        />
        <StatCard
          title="Ingresos Generados"
          value={`$${(stats?.revenue || 0).toLocaleString()}`}
          subtitle="Total atribuido"
        />
      </div>

      {/* Conversion Funnel Bar */}
      <div className="bg-surface-elevated rounded-xl shadow-sm border border-border p-6 space-y-4">
        <h2 className="text-lg font-bold text-text-primary">Embudo de Conversión (Funnel)</h2>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
              <span>Enviados (100%)</span>
              <span>{stats?.sent || 0}</span>
            </div>
            <div className="w-full bg-surface rounded-full h-3">
              <div className="bg-blue-500 h-3 rounded-full w-full" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
              <span>Abiertos ({openRate}%)</span>
              <span>{stats?.opened || 0}</span>
            </div>
            <div className="w-full bg-surface rounded-full h-3">
              <div className="bg-amber-500 h-3 rounded-full" style={{ width: `${Math.min(openRate, 100)}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
              <span>Clics ({stats?.sent ? Math.round(((stats.clicked || 0) / stats.sent) * 100) : 0}%)</span>
              <span>{stats?.clicked || 0}</span>
            </div>
            <div className="w-full bg-surface rounded-full h-3">
              <div
                className="bg-indigo-500 h-3 rounded-full"
                style={{
                  width: `${stats?.sent ? Math.min(Math.round(((stats.clicked || 0) / stats.sent) * 100), 100) : 0}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
              <span>Conversiones / Ventas ({conversionRate}%)</span>
              <span>{stats?.converted || 0}</span>
            </div>
            <div className="w-full bg-surface rounded-full h-3">
              <div
                className="bg-emerald-500 h-3 rounded-full"
                style={{ width: `${Math.min(conversionRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Referral Code Box (if referral or available) */}
      <div className="bg-surface-elevated rounded-xl shadow-sm border border-border p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-text-primary">Código de Referido de la Campaña</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Comparte este código para que los clientes obtengan el descuento asignado.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {campaign.referralCode ? (
            <div className="flex items-center gap-2">
              <span className="px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono text-base font-bold rounded-md">
                {campaign.referralCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-2 border border-border rounded-md text-xs font-semibold text-text-primary hover:bg-surface"
              >
                {copied ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={generatingCode}
              onClick={handleGenerateReferralCode}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-semibold shadow-sm disabled:opacity-50"
            >
              {generatingCode ? 'Generando...' : 'Generar Código de Referido'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
