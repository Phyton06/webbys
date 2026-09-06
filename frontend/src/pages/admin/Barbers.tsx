import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import { DataTable } from '../../components/shared/DataTable'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'

interface Barber {
  id: string
  name: string
  email: string
  phone: string
  active: boolean
}

export default function Barbers() {
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  
  // Dialog state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null)

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
      await api.post('/barbers', form)
      setForm({ name: '', email: '', phone: '' })
      setShowForm(false)
      load()
    } catch (error) {
      console.error('Error creating barber:', error)
    }
  }

  const handleDeactivateClick = (id: string) => {
    setSelectedBarberId(id)
    setIsConfirmOpen(true)
  }

  const handleConfirmDeactivate = async (id?: string) => {
    const barberId = id || selectedBarberId
    if (barberId) {
      try {
        await api.put(`/barbers/${barberId}`, { active: false })
        load()
      } catch (error) {
        console.error('Error deactivating barber:', error)
      } finally {
        setIsConfirmOpen(false)
        setSelectedBarberId(null)
      }
    }
  }

  const handleReactivate = async (id: string) => {
    try {
      await api.put(`/barbers/${id}`, { active: true })
      load()
    } catch (error) {
      console.error('Error reactivating barber:', error)
    }
  }

  if (loading) return <LoadingSpinner />

  const columns = [
    {
      key: 'name',
      header: 'Barbero',
      sortable: true,
      render: (item: Barber) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-800 font-semibold text-sm">
            {item.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-text-primary">{item.name}</p>
            <p className="text-xs text-text-muted">{item.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Teléfono',
    },
    {
      key: 'active',
      header: 'Estado',
      render: (item: Barber) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            item.active ? 'bg-badge-success/20 text-badge-success' : 'bg-badge-error/20 text-badge-error'
          }`}
        >
          {item.active ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (item: Barber) => (
        <div className="flex items-center gap-2">
          {item.active ? (
            <button
              onClick={() => handleConfirmDeactivate(item.id)}
              className="text-xs font-semibold text-red-600 hover:text-red-900 transition"
            >
              Desactivar
            </button>
          ) : (
            <button
              onClick={() => handleReactivate(item.id)}
              className="text-xs font-semibold text-green-600 hover:text-green-900 transition"
            >
              Reactivar
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Barberos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
        >
          {showForm ? 'Cancelar' : '+ Nuevo'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="p-6 bg-surface-elevated rounded-lg border border-border shadow-sm space-y-4 max-w-md">
          <h2 className="text-lg font-semibold text-text-primary">Agregar Nuevo Barbero</h2>
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="name-input" className="text-xs font-semibold text-text-muted">Nombre</label>
              <input
                id="name-input"
                placeholder="Nombre"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                aria-label="Nombre"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="email-input" className="text-xs font-semibold text-text-muted">Correo</label>
              <input
                id="email-input"
                placeholder="Correo"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                aria-label="Correo"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="phone-input" className="text-xs font-semibold text-text-muted">Teléfono</label>
              <input
                id="phone-input"
                placeholder="Teléfono"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                aria-label="Teléfono"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition"
          >
            Guardar
          </button>
        </form>
      )}

      <DataTable
        data={barbers}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchKey="name"
        searchPlaceholder="Buscar barbero..."
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Desactivar Barbero"
        message="¿Estás seguro de que deseas desactivar este barbero? Ya no se le podrán asignar nuevas citas."
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  )
}
