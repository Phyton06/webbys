import { describe, expect, it } from 'vitest';
import { createAgendaSeed } from '../data/agenda-demo';
import { getBarberStatistics } from './barber-statistics';

describe('getBarberStatistics', () => {
  it('counts only the barber’s appointments and attributes discounted paid service revenue', () => {
    const now = new Date(2026, 9, 15, 12);
    const state = createAgendaSeed(now);
    state.appointments = [
      { ...state.appointments[0]!, id: 'done', startsAt: new Date(2026, 9, 15, 9).toISOString(), barberId: 'barber-1', clientId: 'client-1', serviceIds: ['service-1'], status: 'confirmed', durationMinutes: 45 },
      { ...state.appointments[0]!, id: 'cancelled', startsAt: new Date(2026, 9, 15, 10).toISOString(), barberId: 'barber-1', clientId: 'client-2', serviceIds: ['service-2'], status: 'cancelled' },
      { ...state.appointments[0]!, id: 'other-barber', startsAt: new Date(2026, 9, 15, 10).toISOString(), barberId: 'barber-2', clientId: 'client-3', serviceIds: ['service-2'], status: 'confirmed' },
    ];
    state.sales = [{
      id: 'paid-service', occurredAt: new Date(2026, 9, 15, 11).toISOString(),
      items: [
        { kind: 'service', catalogItemId: 'service-1', barberId: 'barber-1', name: 'Corte', quantity: 1, unitPrice: 300 },
        { kind: 'product', catalogItemId: 'product-wax', name: 'Cera', quantity: 1, unitPrice: 100 },
      ], status: 'completed', grossTotal: 400, discountTotal: 40, netTotal: 360,
    }];

    const stats = getBarberStatistics(state, 'barber-1', '2026-10-15', '2026-10-15', now);

    expect(stats).toMatchObject({
      appointmentCount: 2,
      completedCount: 1,
      cancelledCount: 1,
      pendingCount: 0,
      servicesScheduled: 1,
      clientsAttendedEstimated: 1,
      servicesCharged: 1,
      revenue: 270,
      averageTicket: 270,
    });
    expect(stats.topServices).toEqual([{ id: 'service-1', name: 'Corte', count: 1, revenue: 270, percentage: 100 }]);
  });
});
