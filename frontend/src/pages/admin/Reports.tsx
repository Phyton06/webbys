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
    badgeColor: 'bg-emerald-100 text-emerald-800',
  },
  {
    title: 'Reporte de Citas',
    description: 'Volumen total de reservas, tasa de completadas, cancelaciones y estadísticas de no-show por fecha.',
    href: '/admin/reportes/citas',
    icon: '📅',
    badgeText: 'Operaciones',
    badgeColor: 'bg-blue-100 text-blue-800',
  },
  {
    title: 'Reporte de Clientes',
    description: 'Nuevos clientes registrados, clientes recurrentes, tasa de retención y clientes con mayor gasto.',
    href: '/admin/reportes/clientes',
    icon: '👥',
    badgeText: 'Fidelización',
    badgeColor: 'bg-purple-100 text-purple-800',
  },
  {
    title: 'Rendimiento de Barberos',
    description: 'Productividad por barbero, volumen de citas atendidas, ingresos generados y calificación promedio.',
    href: '/admin/reportes/barberos',
    icon: '✂️',
    badgeText: 'Equipo',
    badgeColor: 'bg-amber-100 text-amber-800',
  },
  {
    title: 'Métricas de Notificaciones',
    description: 'Estadísticas de entrega, tasa de lectura, desglose por canal (WhatsApp, SMS, Email) y tendencias.',
    href: '/admin/reportes/notificaciones',
    icon: '🔔',
    badgeText: 'Marketing',
    badgeColor: 'bg-rose-100 text-rose-800',
  },
]

export default function Reports() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold text-gray-900">Centro de Reportes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Visualiza métricas consolidadas, analiza el desempeño del negocio y exporta auditorías en formato CSV.
        </p>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {REPORT_SECTIONS.map((section) => (
          <Link
            key={section.href}
            to={section.href}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md hover:border-amber-400 transition-all group"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-3xl p-2 bg-amber-50 rounded-lg group-hover:scale-105 transition-transform">
                  {section.icon}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${section.badgeColor}`}>
                  {section.badgeText}
                </span>
              </div>

              <h2 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                {section.title}
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">{section.description}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-amber-600">
              <span>Abrir Reporte</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
