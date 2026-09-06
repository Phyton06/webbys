/** Map raw API status to internal Spanish status label. */
export function mapStatus(s: string): string {
  const m: Record<string, string> = {
    PENDING: 'PENDIENTE',
    PENDIENTE: 'PENDIENTE',
    CONFIRMED: 'CONFIRMADA',
    CONFIRMADA: 'CONFIRMADA',
    IN_PROGRESS: 'EN_CURSO',
    EN_CURSO: 'EN_CURSO',
    COMPLETED: 'COMPLETADA',
    COMPLETADA: 'COMPLETADA',
    CANCELLED: 'CANCELADA',
    CANCELADA: 'CANCELADA',
  }
  return m[s] || 'PENDIENTE'
}

/** Get display label + color for a raw API status. */
export function getStatusDisplay(status: string): { label: string; color: string } {
  switch (status) {
    case 'PENDING':    return { label: 'Pendiente',  color: 'yellow' }
    case 'CONFIRMED':  return { label: 'Confirmada', color: 'blue' }
    case 'COMPLETED':  return { label: 'Completada', color: 'green' }
    case 'CANCELLED':  return { label: 'Cancelada',  color: 'red' }
    default:           return { label: status,        color: 'gray' }
  }
}
