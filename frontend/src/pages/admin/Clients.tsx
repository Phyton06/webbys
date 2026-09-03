import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

interface Client {
  id: string
  name: string
  email: string
  phone: string
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/clients').then(r => setClients(r.data.clients ?? r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Clientes</h1>

      <input
        placeholder="Buscar por nombre, correo o teléfono..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="input"
        aria-label="Buscar clientes por nombre, correo o teléfono"
      />

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-white/50 text-sm">No se encontraron clientes</p>
        ) : (
          filtered.map(c => (
            <div key={c.id} className="card flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold">
                {c.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{c.name}</p>
                <p className="text-sm text-white/50 truncate">{c.email} · {c.phone}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
