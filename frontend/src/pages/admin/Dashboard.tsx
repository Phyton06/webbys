import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import { StatCard } from '../../components/shared/StatCard'
import { useNavigate } from 'react-router-dom'

interface DashboardStats {
  todayAppointments: number
  pendingConfirmations: number
  weekRevenue: number
  todayList: any[]
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({ todayAppointments: 0, pendingConfirmations: 0, weekRevenue: 0, todayList: [] })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    api.get('/appointments').then(r => r.data.appointments ?? r.data ?? []).then((appts: any[]) => {
      const todayList = appts.filter((a: any) => a.date === today)
      
      const pendingConfirmations = appts.filter((a: any) => a.status === 'PENDIENTE').length
      
      const weekRevenue = appts
        .filter((a: any) => a.status === 'COMPLETADA')
        .reduce((sum: number, a: any) => sum + ((a.amount || 150)), 0)

      setStats({
        todayAppointments: todayList.length,
        pendingConfirmations,
        weekRevenue,
        todayList,
      })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="bg-[var(--surface)] min-h-screen">
      <h1 className="text-2xl font-display font-bold text-white">Dashboard</h1>

      {/* Stats cards row */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <StatCard
          title="Ingresos Semanales"
          value={`$${stats.weekRevenue.toLocaleString()}`}
          trend={stats.weekRevenue > 0 ? 15 : 0}
          trendDirection="up"
        />
        <StatCard
          title="Citas de Hoy"
          value={stats.todayAppointments.toString()}
          trend={stats.todayAppointments > 0 ? 8 : 0}
          trendDirection="up"
        />
        <StatCard
          title="Pendientes de Confirmación"
          value={stats.pendingConfirmations.toString()}
          trend={stats.pendingConfirmations > 0 ? -5 : 0}
          trendDirection="down"
        />
      </div>

      {/* Today's appointments list - redesigned using Appointments pattern */}
      <div className="rounded border [var(--border)] bg-[var(--surface)] p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Agenda</span>
          <h2 className="text-base font-bold text-white">Tickets de Servicio</h2>
        </div>
        {stats.todayList.length === 0 ? (
          <p className="text-text-muted text-sm">No hay citas programadas para hoy</p>
        ) : (
          <div className="space-y-3">
            {stats.todayList.map((a: any) => (
              <div
                key={a.id}
                onClick={() => navigate(`/admin/appointments/${a.id}`)}
                className="flex h-16 bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden cursor-pointer hover:border-cyan-500 transition-colors"
              >
                <div
                  className="w-3 h-full"
                  style={{
                    background: 'repeating-linear-gradient(-45deg, transparent, transparent 4px, #00BCD4 4px, #00BCD4 8px)',
                    opacity: 0.8
                  }}
                />
                <div className="flex-1 px-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-text-primary leading-none">{a.clientName || 'Cliente'}</h4>
                    <span className="text-[10px] text-text-muted uppercase font-bold tracking-wide mt-1 inline-block">{a.serviceName || 'Servicio'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white">{a.time || '—'}</span>
                    <p className="text-[9px] text-text-muted font-semibold mt-0.5">{a.barberName || 'Barbero'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly revenue section - redesigned */}
      <div className="grid grid-cols-1 gap-4">
        <div className="col-span-1">
          <div className="p-6 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
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
              <svg viewBox="0 0 300 80" className="w-full h-24" data-testid="revenue-svg">
                <line x1="10" y1="10" x2="290" y2="10" stroke="#262626" strokeWidth={1} strokeDasharray="4 4" />
                <line x1="10" y1="40" x2="290" y2="40" stroke="#262626" strokeWidth={1} strokeDasharray="4 4" />
                <line x1="10" y1="70" x2="290" y2="70" stroke="#333333" strokeWidth={1} />
                
                <polyline
                  fill="none"
                  stroke="#00BCD4"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="10,65 55,50 100,58 145,20 190,35 235,30 280,15"
                />
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
    </div>
  )
}