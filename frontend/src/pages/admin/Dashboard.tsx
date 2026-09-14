import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import { StatCard } from '../../components/shared/StatCard'
import { mapStatus } from '../../utils/status'

interface DashboardStats {
  todayAppointments: number
  pendingConfirmations: number
  weekRevenue: number
  todayList: Appointment[]
}

interface Appointment {
  id: string
  clientName: string
  barberName: string
  serviceName: string
  date: string
  time: string
  status: 'PENDIENTE' | 'CONFIRMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA'
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({ todayAppointments: 0, pendingConfirmations: 0, weekRevenue: 0, todayList: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      api.get('/appointments').then(r => r.data),
      api.get('/barbers').then(r => r.data).catch(() => []),
      api.get('/clients').then(r => r.data).catch(() => []),
      api.get('/services').then(r => r.data).catch(() => []),
    ]).then(([appts, barbers, clients, services]) => {
      const list = Array.isArray(appts) ? appts : appts.appointments ?? []
      const barberMap = Object.fromEntries((Array.isArray(barbers) ? barbers : []).map((b: any) => [b.id, b.name]))
      const clientMap = Object.fromEntries((Array.isArray(clients) ? clients : []).map((c: any) => [c.id, c.name]))
      const serviceMap = Object.fromEntries((Array.isArray(services) ? services : []).map((s: any) => [s.id, s.name]))
      
      const resolved: Appointment[] = list.map((a: any) => ({
        id: a.id,
        clientName: a.clientName || clientMap[a.clientId] || a.client?.name || `Cliente ${a.clientId}`,
        barberName: a.barberName || barberMap[a.barberId] || `Barbero ${a.barberId}`,
        serviceName: a.serviceName || serviceMap[a.serviceId] || 'Servicio',
        date: a.date,
        time: a.time || a.startTime,
        status: mapStatus(a.status) as Appointment['status'],
        amount: a.amount,
      }))

      const todayList = resolved.filter(a => a.date === today)
      
      // Calculate week revenue from completed appointments
      const weekRevenue = resolved
        .filter(a => a.status === 'COMPLETADA')
        .reduce((sum, a) => sum + ((a as any).amount || 150), 0)

      setStats({
        todayAppointments: todayList.length,
        pendingConfirmations: resolved.filter(a => a.status === 'PENDIENTE').length,
        weekRevenue: weekRevenue,
        todayList: todayList,
      })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4">
        <StatCard
          title="Ingresos Semanales"
          value={`$${stats.weekRevenue.toLocaleString()}`}
          trend={stats.weekRevenue > 0 ? 15 : 0}
          trendDirection="up"
        />
      </div>

      <div className="p-6 bg-[#0D0D0D] border border-[#333333] rounded-2xl w-full">
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Agenda</span>
            <h2 className="text-base font-bold text-white mt-0.5">Tickets de Servicio</h2>
          </div>
          {stats.todayList.length === 0 ? (
            <p className="text-text-muted text-sm">No hay citas programadas para hoy</p>
          ) : (
            <div className="flex flex-col gap-3 mt-1">
              {stats.todayList.map(a => (
                <div key={a.id} className="flex h-16 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden">
                  <div
                    className="w-3 h-full"
                    style={{
                      background: 'repeating-linear-gradient(-45deg, transparent, transparent 4px, #00BCD4 4px, #00BCD4 8px)',
                      opacity: 0.8
                    }}
                  />
                  <div className="flex-1 px-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-text-primary leading-none">{a.clientName}</h4>
                      <span className="text-[10px] text-text-muted uppercase font-bold tracking-wide mt-1 inline-block">{a.serviceName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-white">{a.time}</span>
                      <p className="text-[9px] text-text-muted font-semibold mt-0.5">{a.barberName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Trend section moved to sidebar */}
        </div>

        <div className="p-6 bg-[#1A1A1A] rounded-2xl border border-[#333333] shadow-[0_4px_30px_rgba(0,0,0,0.4)] self-start w-full">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Métricas</span>
              <h2 className="text-base font-bold text-white mt-0.5">Tendencia de Ingresos</h2>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-cyan">+12.4%</span>
              <p className="text-[10px] text-text-muted">esta semana</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center mt-2">
            <svg viewBox="0 0 300 80" className="w-full h-24" style={{ filter: 'drop-shadow(0 0 6px #00BCD4)' }} data-testid="revenue-svg">
              {/* Grilla horizontal */}
              <line x1="10" y1="10" x2="290" y2="10" stroke="#262626" strokeWidth={1} strokeDasharray="4 4" />
              <line x1="10" y1="40" x2="290" y2="40" stroke="#262626" strokeWidth={1} strokeDasharray="4 4" />
              <line x1="10" y1="70" x2="290" y2="70" stroke="#333333" strokeWidth={1} />
              
              {/* Línea de tendencia */}
              <polyline
                fill="none"
                stroke="#00BCD4"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                points="10,65 55,50 100,58 145,20 190,35 235,30 280,15"
              />
              {/* Puntos clave */}
              <circle cx="145" cy="20" r="4" fill="#00BCD4" />
              <circle cx="280" cy="15" r="4" fill="#00BCD4" />
            </svg>
            
            <div className="flex justify-between w-full mt-3 text-[10px] text-text-muted font-bold px-1 items-center">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span className="bg-cyan/15 text-cyan px-1.5 py-0.5 rounded border border-cyan/30">Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
              <span className="bg-cyan/15 text-cyan px-1.5 py-0.5 rounded border border-cyan/30">Dom</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
