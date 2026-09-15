import { useNavigate } from 'react-router-dom'

const sections = [
  { to: '/admin/barbers', label: 'Barberos', desc: 'Gestiona tu equipo', icon: '✂️' },
  { to: '/admin/asistentes', label: 'Asistentes', desc: 'Personal de apoyo', icon: '👥' },
  { to: '/admin/services', label: 'Servicios', desc: 'Catálogo y precios', icon: '📋' },
  { to: '/admin/pagos', label: 'Pagos', desc: 'Ingresos y facturación', icon: '💳' },
  { to: '/admin/notificaciones', label: 'Notificaciones', desc: 'Alertas y avisos', icon: '🔔' },
  { to: '/admin/horarios', label: 'Horarios', desc: 'Disponibilidad', icon: '🕐' },
  { to: '/admin/campanas', label: 'Campañas', desc: 'Promociones activas', icon: '📣' },
  { to: '/admin/analytics', label: 'Analytics', desc: 'Métricas del negocio', icon: '📊' },
  { to: '/admin/configuracion', label: 'Configuración', desc: 'Ajustes del sistema', icon: '⚙️' },
]

export default function More() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-white tracking-tight">Más</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sections.map(s => (
          <button
            key={s.to}
            onClick={() => navigate(s.to)}
            className="flex flex-col items-center gap-2 p-4 bg-surface rounded-xl border border-border hover:bg-surface-elevated hover:border-primary/30 transition-all text-center group"
          >
            <span className="text-2xl">{s.icon}</span>
            <span className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">{s.label}</span>
            <span className="text-[10px] text-text-muted leading-tight">{s.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
