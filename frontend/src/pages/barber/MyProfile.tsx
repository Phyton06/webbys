import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function BarberMyProfile() {
  const [form, setForm] = useState({ name: '', phone: '', specialty: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get('/auth/me').then(r => {
      const u = r.data.user ?? r.data
      setForm({ name: u.name ?? '', phone: u.phone ?? '', specialty: u.specialty ?? '' })
    }).finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      const { data: me } = await api.get('/auth/me')
      const user = me.user ?? me
      await api.put(`/barbers/${user.id}`, form)
      setMsg('Perfil actualizado')
    } catch {
      setMsg('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mi Perfil</h1>

      <form onSubmit={handleSave} className="card space-y-4">
        {msg && <div className={`text-sm rounded-lg p-3 ${msg.includes('Error') ? 'bg-red/20 text-red-light' : 'bg-emerald-500/20 text-emerald-400'}`}>{msg}</div>}

        <div>
          <label className="text-sm text-white/50 mb-1 block" htmlFor="profile-name">Nombre</label>
          <input id="profile-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="input" aria-label="Nombre" />
        </div>

        <div>
          <label className="text-sm text-white/50 mb-1 block" htmlFor="profile-phone">Teléfono</label>
          <input id="profile-phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" aria-label="Teléfono" />
        </div>

        <div>
          <label className="text-sm text-white/50 mb-1 block" htmlFor="profile-specialty">Especialidad</label>
          <input id="profile-specialty" value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} className="input" placeholder="Ej: Fade, Barba, Diseños..." aria-label="Especialidad" />
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
