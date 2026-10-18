import type { AgendaState } from '../types/agenda';
import { getEffectiveAppointmentStatus } from './appointment-lifecycle';

export interface BarberStatistics {
  appointmentCount: number;
  completedCount: number;
  cancelledCount: number;
  pendingCount: number;
  servicesScheduled: number;
  servicesCharged: number;
  clientsAttendedEstimated: number;
  revenue: number;
  averageTicket: number;
  topServices: Array<{ id: string; name: string; count: number; revenue: number; percentage: number }>;
}

function dateKey(value: string): string | undefined {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function emptyStatistics(): BarberStatistics {
  return {
    appointmentCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    pendingCount: 0,
    servicesScheduled: 0,
    servicesCharged: 0,
    clientsAttendedEstimated: 0,
    revenue: 0,
    averageTicket: 0,
    topServices: [],
  };
}

export function getBarberStatistics(
  state: AgendaState,
  barberId: string,
  startDate: string,
  endDate: string,
  now: Date,
): BarberStatistics {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || startDate > endDate) {
    return emptyStatistics();
  }

  const appointments = state.appointments.filter((appointment) => appointment.barberId === barberId
    && (dateKey(appointment.startsAt) ?? '') >= startDate && (dateKey(appointment.startsAt) ?? '') <= endDate);
  const appointmentsWithStatus = appointments.map((appointment) => ({
    appointment,
    status: getEffectiveAppointmentStatus(appointment, now),
  }));
  const nonCancelled = appointmentsWithStatus.filter(({ status }) => status !== 'cancelled');
  const attendedClients = new Set(appointmentsWithStatus
    .filter(({ status }) => status === 'completed')
    .map(({ appointment }) => appointment.clientId));
  const serviceCounts = new Map<string, { id: string; name: string; count: number; revenue: number }>();
  for (const { appointment } of nonCancelled) {
    for (const id of appointment.serviceIds) {
      const service = state.services.find(({ id: serviceId }) => serviceId === id);
      if (!service) continue;
      const current = serviceCounts.get(id) ?? { id, name: service.name, count: 0, revenue: 0 };
      current.count += 1;
      serviceCounts.set(id, current);
    }
  }

  let servicesCharged = 0;
  let revenue = 0;
  const attributedSales = new Set<string>();
  for (const sale of state.sales ?? []) {
    const saleDate = dateKey(sale.occurredAt);
    if (!saleDate || saleDate < startDate || saleDate > endDate || sale.grossTotal <= 0) continue;
    const barberItems = sale.items.filter((item) => item.kind === 'service' && item.barberId === barberId);
    const barberGross = barberItems.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
    if (barberGross <= 0) continue;
    const netShare = sale.netTotal * (barberGross / sale.grossTotal);
    servicesCharged += barberItems.reduce((total, item) => total + item.quantity, 0);
    revenue += netShare;
    attributedSales.add(sale.id);
    for (const item of barberItems) {
      if (!item.catalogItemId) continue;
      const service = serviceCounts.get(item.catalogItemId);
      if (service) service.revenue += netShare * ((item.quantity * item.unitPrice) / barberGross);
    }
  }

  const statuses = appointmentsWithStatus.map(({ status }) => status);
  const totalRequestedServices = [...serviceCounts.values()].reduce((total, service) => total + service.count, 0);
  return {
    appointmentCount: appointments.length,
    completedCount: statuses.filter((status) => status === 'completed').length,
    cancelledCount: statuses.filter((status) => status === 'cancelled').length,
    pendingCount: statuses.filter((status) => status === 'pending' || status === 'confirmed').length,
    servicesScheduled: nonCancelled.reduce((total, { appointment }) => total + appointment.serviceIds.length, 0),
    servicesCharged,
    clientsAttendedEstimated: attendedClients.size,
    revenue,
    averageTicket: attributedSales.size ? revenue / attributedSales.size : 0,
    topServices: [...serviceCounts.values()]
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'))
      .slice(0, 5)
      .map((service) => ({
        ...service,
        percentage: totalRequestedServices ? Math.round((service.count / totalRequestedServices) * 100) : 0,
      })),
  };
}
