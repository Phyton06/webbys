import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', duration: '' })

  const load = () => {
    api.get('/services').then(r => setServices(r.data.services ?? r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, price: Number(form.price), duration: Number(form.duration) }
    if (editingId) {
      await api.put(`/services/${editingId}`, payload)
    } else {
      await api.post('/services', payload)
    }
    setForm({ name: '', description: '', price: '', duration: '' })
    setEditingId(null)
    setShowForm(false)
    load()
  }

  const handleEdit = (s: Service) => {
    setForm({ name: s.name, description: s.description ?? '', price: String(s.price), duration: String(s.duration) })
    setEditingId(s.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este servicio?')) return
    await api.delete(`/services/${id}`)
    load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Servicios</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', description: '', price: '', duration: '' }) }} className="btn-primary text-sm">
          {showForm ? 'Cancelar' : '+ Nuevo'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-3">
          <input placeholder="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="input" aria-label="Nombre" />
          <input placeholder="Descripción" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input" aria-label="Descripción" />
          <input placeholder="Precio ($)" type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required className="input" aria-label="Precio" />
          <input placeholder="Duración (min)" type="number" min="1" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} required className="input" aria-label="Duración en minutos" />
          <button type="submit" className="btn-primary w-full">{editingId ? 'Actualizar' : 'Guardar'}</button>
        </form>
      )}

      <div className="space-y-3">
        {services.map(s => (
          <div key={s.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{s.name}</p>
                {s.description && <p className="text-sm text-white/50">{s.description}</p>}
                <p className="text-sm text-cyan mt-1">${s.price} · {s.duration} min</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(s)} className="btn-ghost text-xs px-2 py-1">Editar</button>
                <button onClick={() => handleDelete(s.id)} className="text-red-light text-xs px-2 py-1">Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
