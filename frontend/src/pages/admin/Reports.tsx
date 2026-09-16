import { Link } from 'react-router-dom'

interface ReportSection {
  title: string
  description: string
  href: string
  icon: string
  badgeText: string
  badgeColor: string
}

const REPORT_SECTIONS: ReportSection[] = [
  {
    title: 'Reporte de Ingresos',
    description: 'Facturación periódica, ingresos por barbero, recaudación por servicio y exportación a formato CSV.',
    href: '/admin/reportes/ingresos',
    icon: '💰',
    badgeText: 'Financiero',
    badgeColor: 'bg-cyan-500 text-white',
  },
  {
    title: 'Reporte de Citas',
    description: 'Volumen total de reservas, tasa de completadas, cancelaciones y estadísticas de no-show por fecha.',
    href: '/admin/reportes/citas',
    icon: '📅',
    badgeText: 'Operaciones',
    badgeColor: 'bg-gray-800 text-white',
  },
  {
    title: 'Reporte de Clientes',
    description: 'Nuevos clientes registrados, clientes recurrentes, tasa de retención y clientes con mayor gasto.',
    href: '/admin/reportes/clientes',
    icon: '👥',
    badgeText: 'Fidelización',
    badgeColor: 'bg-red-600 text-white',
  },
  {
    title: 'Rendimiento de Barberos',
    description: 'Productividad por barbero, volumen de citas atendidas, ingresos generados y calificación promedio.',
    href: '/admin/reportes/barberos',
    icon: '✂️',
    badgeText: 'Equipo',
    badgeColor: 'bg-amber-600 text-white',
  },
  {
    title: 'Métricas de Notificaciones',
    description: 'Estadísticas de entrega, tasa de lectura, desglose por canal (WhatsApp, SMS, Email) y tendencias.',
    href: '/admin/reportes/notificaciones',
    icon: '🔔',
    badgeText: 'Marketing',
    badgeColor: 'bg-rose-600 text-white',
  },
]

export default function Reports() {
  return (
    <div className="bg-[var(--surface)] min-h-screen p-6">
      <h1 className="text-2xl font-display font-bold text-white">Centro de Reportes</h1>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        {REPORT_SECTIONS.map((section) => (
          <Link
            key={section.href}
            to={section.href}
            className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 flex flex-col justify-between hover:border-cyan-500 transition-colors"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-3xl p-2 bg-cyan-50 rounded-lg">
                  {section.icon}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${section.badgeColor}`}>
                  {section.badgeText}
                </span>
              </div>

              <h2 className="text-lg font-bold text-white hover:text-cyan-500 transition-colors">
                {section.title}
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">{section.description}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between text-sm font-medium text-gray-300">
              <span>Abrir Reporte</span>
              <span>→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}