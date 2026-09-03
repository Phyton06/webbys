interface AppointmentCardProps {
  clientName: string
  barberName: string
  service: string
  date: string
  time: string
  status: 'PENDIENTE' | 'CONFIRMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA'
  onClick?: () => void
}

const STATUS_MAP = {
  PENDIENTE: { label: 'Pendiente', className: 'badge-warning' },
  CONFIRMADA: { label: 'Confirmada', className: 'badge-info' },
  EN_CURSO: { label: 'En curso', className: 'badge-success' },
  COMPLETADA: { label: 'Completada', className: 'badge-success' },
  CANCELADA: { label: 'Cancelada', className: 'badge-danger' },
}

export default function AppointmentCard({ clientName, barberName, service, date, time, status, onClick }: AppointmentCardProps) {
  const s = STATUS_MAP[status]
  return (
    <button onClick={onClick} className="card w-full text-left hover:bg-white/10 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold">{clientName}</span>
        <span className={s.className}>{s.label}</span>
      </div>
      <p className="text-sm text-white/70">{barberName} · {service}</p>
      <p className="text-sm text-white/50 mt-1">{date} · {time}</p>
    </button>
  )
}
