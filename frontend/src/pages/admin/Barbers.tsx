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
  const [form, setForm] = useState({ name: '', email: '', phone: '' })

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
            <p className="text-xs text-text-muted mt-0.5">{item.email}</p>
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
    </div>
  )
}
