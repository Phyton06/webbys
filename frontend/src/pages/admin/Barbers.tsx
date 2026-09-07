import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import { DataTable } from '../../components/shared/DataTable'

interface Barber {
  id: string
  name: string
  email: string
  phone: string
  active: boolean
}

export default function Barbers() {
  const navigate = useNavigate()
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '' })
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)

  const load = () => {
    api.get('/barbers')
      .then((r) => setBarbers(r.data.barbers ?? r.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const tempEmail = `temp_invite_${Date.now()}@webbys.com`
      const payload = { name: form.name, email: tempEmail, phone: form.phone }
      const res = await api.post('/barbers', payload)
      const createdBarber = res.data?.barber || res.data
      const barberId = createdBarber?.id || `u${barbers.length + 3}`
      setInviteLink(`${window.location.origin}/register?role=barber&id=${barberId}`)
      setShowInviteModal(true)
      setForm({ name: '', phone: '' })
      setShowForm(false)
      load()
    } catch (error) {
      console.error('Error creating barber:', error)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <LoadingSpinner />

  const columns = [
    {
      key: 'name',
      header: 'Barbero',
      sortable: true,
      render: (item: Barber) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan/10 border border-cyan/30 flex items-center justify-center text-cyan font-bold text-sm">
            {item.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-text-primary leading-tight">{item.name}</p>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  item.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                {item.active ? 'ACTIVO' : 'INACTIVO'}
              </span>
            </div>
            {item.email.startsWith('temp_invite') ? (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded mt-1 inline-block">REGISTRO PENDIENTE</span>
            ) : (
              <p className="text-xs text-text-muted mt-0.5">{item.email}</p>
            )}
            <p className="text-[11px] text-cyan font-medium mt-0.5">{item.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Detalles',
      render: (item: Barber) => (
        <button
          onClick={() => navigate(`/admin/barbers/${item.id}`)}
          className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#262626] border border-[#333333] text-xs font-bold text-cyan rounded-xl transition"
        >
          Ver Ficha &rarr;
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-white tracking-tight">Barberos</h1>
        <button
          onClick={() => setShowForm(true)}
          className="group px-4 py-2 bg-[#00BCD4] hover:bg-[#4DD0E1] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 min-h-[40px] shadow-lg shadow-cyan/10 hover:shadow-cyan/20 inline-flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          + Nuevo
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleCreate}
            className="bg-[#1A1A1A] border border-[#333333] rounded-2xl max-w-md w-full p-6 space-y-6 shadow-[0_4px_30px_rgba(0,0,0,0.6)] animate-slide-up relative"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-white text-xl font-medium focus:outline-none transition-colors"
              aria-label="Cerrar modal"
            >
              &times;
            </button>

            <div>
              <h2 className="text-xl font-display font-bold text-white tracking-tight">Agregar Nuevo Barbero</h2>
              <p className="text-xs text-text-muted mt-1">Registra un nuevo integrante para el equipo de Webby's.</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name-input" className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Nombre Completo</label>
                <input
                  id="name-input"
                  placeholder="Ej. Carlos Mendoza"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full bg-[#0D0D0D] border border-[#333333] hover:border-[#444444] focus:border-[#00BCD4] text-white rounded-xl px-4 py-3 min-h-[48px] focus:outline-none transition-all duration-150 text-sm placeholder-gray-600"
                  aria-label="Nombre"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone-input" className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Teléfono de Contacto</label>
                <input
                  id="phone-input"
                  placeholder="Ej. 55 1234 5678"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  required
                  className="w-full bg-[#0D0D0D] border border-[#333333] hover:border-[#444444] focus:border-[#00BCD4] text-white rounded-xl px-4 py-3 min-h-[48px] focus:outline-none transition-all duration-150 text-sm placeholder-gray-600"
                  aria-label="Teléfono"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 bg-transparent border border-[#333333] hover:border-[#444444] text-text-muted hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all min-h-[48px] inline-flex items-center justify-center active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-[#00BCD4] hover:bg-[#4DD0E1] text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-all min-h-[48px] shadow-lg shadow-cyan/10 hover:shadow-cyan/20 inline-flex items-center justify-center active:scale-[0.98]"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl max-w-md w-full p-6 space-y-6 shadow-[0_4px_30px_rgba(0,0,0,0.6)] animate-slide-up text-center">
            <div className="w-12 h-12 rounded-full bg-cyan/15 border border-cyan/30 flex items-center justify-center text-cyan font-bold text-xl mx-auto shadow-[0_0_12px_rgba(0,188,212,0.2)]">
              ✓
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Barbero Registrado</h2>
              <p className="text-xs text-text-muted mt-1.5">
                Copia este enlace de registro y envíaselo para que termine de configurar su cuenta.
              </p>
            </div>

            <div className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl p-3 flex items-center justify-between gap-3 overflow-hidden">
              <span className="text-xs text-cyan truncate text-left select-all flex-1 font-mono">{inviteLink}</span>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#262626] border border-[#333333] text-[10px] font-bold uppercase tracking-wider text-cyan rounded-lg transition"
              >
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            <button
              onClick={() => setShowInviteModal(false)}
              className="w-full py-3 bg-[#00BCD4] hover:bg-[#4DD0E1] text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-all min-h-[48px] shadow-lg shadow-cyan/10"
            >
              Listo
            </button>
          </div>
        </div>
      )}

      <DataTable
        data={barbers}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchKey="name"
        searchPlaceholder="Buscar barbero..."
      />
    </div>
  )
}
