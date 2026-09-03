import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

interface Barber {
  id: string
  name: string
  email: string
  phone: string
  specialty: string
  active: boolean
}

export default function Barbers() {
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', specialty: '' })

  const load = () => {
    api.get('/barbers').then(r => setBarbers(r.data.barbers ?? r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/barbers', form)
    setForm({ name: '', email: '', phone: '', specialty: '' })
    setShowForm(false)
    load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Barberos</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? 'Cancelar' : '+ Nuevo'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-3">
          <input placeholder="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="input" aria-label="Nombre" />
          <input placeholder="Correo" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required className="input" aria-label="Correo" />
          <input placeholder="Teléfono" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required className="input" aria-label="Teléfono" />
          <input placeholder="Especialidad" value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} className="input" aria-label="Especialidad" />
          <button type="submit" className="btn-primary w-full">Guardar</button>
        </form>
      )}

      <div className="space-y-3">
        {barbers.map(b => (
          <div key={b.id} className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-cyan/20 flex items-center justify-center text-cyan font-bold text-lg shrink-0">
              {b.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{b.name}</p>
              <p className="text-sm text-gray-500 truncate">{b.specialty || 'Sin especialidad'}</p>
            </div>
            <span className={`badge ${b.active ? 'badge-success' : 'badge-danger'} shrink-0`}>
              {b.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
