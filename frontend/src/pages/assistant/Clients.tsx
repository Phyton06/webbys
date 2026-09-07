import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

interface Client {
  id: string
  name: string
  email: string
  phone: string
}

export default function AssistantClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })

  const load = () => {
    api.get('/clients').then(r => setClients(r.data.clients ?? r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/clients', form)
    setForm({ name: '', email: '', phone: '', password: '' })
    setShowForm(false)
    load()
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  )

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? 'Cancelar' : '+ Nuevo'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-3">
          <input placeholder="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="input" aria-label="Nombre del cliente" />
          <input placeholder="Correo" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required className="input" aria-label="Correo electrónico" />
          <input placeholder="Teléfono" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required className="input" aria-label="Teléfono" />
          <input placeholder="Contraseña" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} className="input" aria-label="Contraseña" />
          <button type="submit" className="btn-primary w-full">Registrar cliente</button>
        </form>
      )}

      <input placeholder="Buscar por nombre o teléfono..." value={search} onChange={e => setSearch(e.target.value)} className="input" aria-label="Buscar clientes" />

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-white/50 text-sm">No se encontraron clientes</p>
        ) : (
          filtered.map(c => (
            <div key={c.id} className="card flex items-center gap-3">
              <img
                src="/avatar.jpg"
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-cyan/30 shadow-[0_0_8px_rgba(0,188,212,0.2)] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{c.name}</p>
                <p className="text-sm text-white/50 truncate">{c.phone}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
