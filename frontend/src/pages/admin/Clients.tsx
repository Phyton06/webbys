import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import { DataTable } from '../../components/shared/DataTable'

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
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [notes, setNotes] = useState<string>('Cliente puntual')

  const load = () => {
    api.get('/clients')
      .then((r) => setClients(r.data.clients ?? r.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleSelectClient = async (client: Client) => {
    setSelectedClient(client)
    setLoadingHistory(true)
    try {
      const r = await api.get('/appointments')
      const appts = Array.isArray(r.data) ? r.data : r.data.appointments ?? []
      setHistory(appts.filter((a: any) => a.clientId === client.id))
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return
    setNotes((prev) => prev ? `${prev}\n${newNote.trim()}` : newNote.trim())
    setNewNote('')
  }

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  )

  if (loading) return <LoadingSpinner />

  const columns = [
    {
      key: 'name',
      header: 'Cliente',
      sortable: true,
      render: (item: Client) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-elevated/10 flex items-center justify-center font-bold">
            {item.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-text-primary">{item.name}</p>
            <p className="text-sm text-white/50">{item.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email-phone',
      header: 'Contacto',
      render: (item: Client) => `${item.email} · ${item.phone}`,
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (item: Client) => (
        <button
          onClick={() => handleSelectClient(item)}
          className="text-xs font-semibold text-blue-600 hover:text-blue-900 transition"
        >
          Ver Ficha
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Clientes</h1>

      <div className="flex flex-col gap-2">
        <label htmlFor="search-input" className="text-xs font-semibold text-text-muted">
          Buscar clientes por nombre, correo o teléfono
        </label>
        <input
          id="search-input"
          placeholder="Buscar por nombre, correo o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-md"
          aria-label="Buscar clientes por nombre, correo o teléfono"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {filtered.length === 0 ? (
            <p className="text-white/50 text-sm">No se encontraron clientes</p>
          ) : (
            <DataTable
              data={filtered}
              columns={columns}
              keyExtractor={(item) => item.id}
            />
          )}
        </div>

        {selectedClient ? (
          <div className="p-6 bg-surface-elevated rounded-lg border border-border shadow-sm space-y-6 self-start">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-text-primary">{selectedClient.name}</h2>
                <p className="text-sm text-text-muted">{selectedClient.email}</p>
                <p className="text-sm text-text-muted">{selectedClient.phone}</p>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-text-muted hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">Notas Administrativas</h3>
              <div className="max-h-32 overflow-y-auto space-y-2 mb-3">
                {notes ? (
                  notes.split('\n').map((note, index) => (
                    <p key={index} className="text-xs text-gray-600 bg-yellow-50/50 p-2 rounded border border-yellow-100/50">
                      {note}
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-text-muted italic">No hay notas para este cliente.</p>
                )}
              </div>
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  placeholder="Agregar una nota..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs border border-border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition"
                >
                  Agregar
                </button>
              </form>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">Historial de Citas</h3>
              {loadingHistory ? (
                <p className="text-xs text-text-muted italic">Cargando historial...</p>
              ) : history.length === 0 ? (
                <p className="text-xs text-text-muted italic">No registra citas anteriores.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {history.map((h) => (
                    <div key={h.id} className="text-xs p-2.5 bg-surface rounded border border-border flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-text-primary">{h.serviceName || 'Servicio'}</p>
                        <p className="text-[10px] text-text-muted">{h.date} • {h.time || h.startTime}</p>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-badge-success/20 text-badge-success">
                        {h.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-surface rounded-lg border border-dashed border-border text-center py-16 self-start">
            <p className="text-sm text-text-muted">Selecciona un cliente para ver su historial y agregar notas.</p>
          </div>
        )}
      </div>
    </div>
  )
}
