import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import { DataTable } from '../../components/shared/DataTable'
import { mapStatus } from '../../utils/status'

interface Barber {
  id: string
  name: string
  email: string
  phone: string
  active: boolean
}

interface Appointment {
  id: string
  clientName: string
  serviceName: string
  date: string
  time: string
  amount: number
  status: string
}

export default function BarberDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [barber, setBarber] = useState<Barber | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const load = async () => {
    try {
      // Get all barbers and find the one matching the ID
      const resBarbers = await api.get('/barbers')
      const listBarbers: Barber[] = resBarbers.data.barbers ?? resBarbers.data
      const found = listBarbers.find(b => b.id === id)
      
      if (found) {
        setBarber(found)
        
        // Get appointments and filter for this barber's log
        const resAppts = await api.get('/appointments')
        const listAppts = Array.isArray(resAppts.data) ? resAppts.data : resAppts.data.appointments ?? []
        
        // Resolve client/service names if needed
        const [resClients, resServices] = await Promise.all([
          api.get('/clients').then(r => r.data).catch(() => []),
          api.get('/services').then(r => r.data).catch(() => []),
        ])
        
        const clientMap = Object.fromEntries((Array.isArray(resClients) ? resClients : []).map((c: any) => [c.id, c.name]))
        const serviceMap = Object.fromEntries((Array.isArray(resServices) ? resServices : []).map((s: any) => [s.id, s.name]))

        const filtered: Appointment[] = listAppts
          .filter((a: any) => a.barberId === id)
          .map((a: any) => ({
            id: a.id,
            clientName: a.clientName || clientMap[a.clientId] || a.client?.name || `Cliente ${a.clientId}`,
            serviceName: a.serviceName || serviceMap[a.serviceId] || 'Servicio',
            date: a.date,
            time: a.time || a.startTime,
            amount: a.amount || 150,
            status: mapStatus(a.status),
          }))
          
        setAppointments(filtered)
      } else {
        navigate('/admin/barbers')
      }
    } catch (err) {
      console.error('Error loading barber details:', err)
      navigate('/admin/barbers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const handleToggleActive = async () => {
    if (!barber) return
    try {
      const nextActive = !barber.active
      await api.put(`/barbers/${barber.id}`, { active: nextActive })
      setBarber(prev => prev ? { ...prev, active: nextActive } : null)
    } catch (error) {
      console.error('Error toggling barber active status:', error)
    } finally {
      setIsConfirmOpen(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!barber) return null

  const columns = [
    {
      key: 'clientName',
      header: 'Cliente',
      sortable: true,
    },
    {
      key: 'serviceName',
      header: 'Servicio',
    },
    {
      key: 'date',
      header: 'Fecha / Hora',
      render: (item: Appointment) => (
        <div>
          <p className="font-semibold text-text-primary">{item.date}</p>
          <p className="text-xs text-text-muted">{item.time}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      render: (item: Appointment) => (
        <span className="font-bold text-white">${item.amount} MXN</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (item: Appointment) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
            item.status === 'COMPLETADA'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : item.status === 'PENDIENTE'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {item.status}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/barbers')}
            className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#262626] border border-[#333333] text-sm text-text-muted rounded-xl transition"
          >
            &larr; Volver
          </button>
          <h1 className="text-2xl font-display font-bold">Ficha de Barbero</h1>
        </div>

        <button
          onClick={() => setIsConfirmOpen(true)}
          className={`px-4 py-2 text-sm font-bold uppercase rounded-xl transition ${
            barber.active
              ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
          }`}
        >
          {barber.active ? 'Desactivar Barbero' : 'Activar Barbero'}
        </button>
      </div>

      {/* Info Card */}
      <div className="p-6 bg-[#1A1A1A] border border-[#333333] rounded-2xl flex flex-col md:flex-row gap-6 items-center shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <div className="w-16 h-16 rounded-full bg-cyan/15 border border-cyan/30 flex items-center justify-center text-cyan font-bold text-2xl uppercase shadow-[0_0_12px_rgba(0,188,212,0.2)]">
          {barber.name.charAt(0)}
        </div>
        <div className="flex-1 text-center md:text-left space-y-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h2 className="text-lg font-bold text-white">{barber.name}</h2>
            <span
              className={`inline-flex self-center items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                barber.active
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              {barber.active ? 'ACTIVO' : 'INACTIVO'}
            </span>
          </div>
          <p className="text-sm text-text-muted">{barber.email}</p>
          <p className="text-sm text-cyan font-medium">{barber.phone}</p>
        </div>
      </div>

      {/* Appointments Log Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Historial de Citas (Log)</h3>
        <DataTable
          data={appointments}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyMessage="No hay citas registradas para este barbero"
        />
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={barber.active ? 'Desactivar Barbero' : 'Activar Barbero'}
        message={
          barber.active
            ? '¿Estás seguro de que deseas desactivar a este barbero? No podrá recibir nuevos turnos.'
            : '¿Deseas activar a este barbero nuevamente para recibir citas?'
        }
        onConfirm={handleToggleActive}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  )
}
