import { describe, expect, it } from 'vitest';
import type { AppointmentRecord, SaleRecord } from '../types/domain';
import { createDemoData } from '../data/demo';
import {
  getDashboardSummary,
  getSalesSeries,
  getUpcomingAppointments,
} from './dashboard';

const now = new Date(2026, 9, 14, 12, 0, 0);

function localDate(day: number, hour = 10): string {
  return new Date(2026, 9, day, hour, 0, 0).toISOString();
}

const sales: SaleRecord[] = [
  {
    id: 'sale-today',
    occurredAt: localDate(14),
    items: [{ name: 'Corte', quantity: 1, unitPrice: 300 }],
    grossTotal: 300,
    discountTotal: 20,
    netTotal: 280,
  },
  {
    id: 'sale-monday',
    occurredAt: localDate(12),
    items: [{ name: 'Cera', quantity: 2, unitPrice: 150 }],
    grossTotal: 300,
    discountTotal: 0,
    netTotal: 300,
  },
  {
    id: 'sale-outside-week',
    occurredAt: localDate(20),
    items: [{ name: 'Barba', quantity: 1, unitPrice: 450 }],
    grossTotal: 450,
    discountTotal: 50,
    netTotal: 400,
  },
];

const appointments: AppointmentRecord[] = [
  {
    id: 'appointment-done',
    startsAt: localDate(14, 9),
    clientId: 'client-lucia',
    clientName: 'Lucía Torres',
    barberId: 'barber-diego',
    barberName: 'Diego',
    serviceIds: ['service-cut'],
    serviceName: 'Corte',
    status: 'completed',
    durationMinutes: 45,
  },
  {
    id: 'appointment-pending',
    startsAt: localDate(14, 13),
    clientId: 'client-mateo',
    clientName: 'Mateo Cruz',
    barberId: 'barber-diego',
    barberName: 'Diego',
    serviceIds: ['service-beard'],
    serviceName: 'Barba',
    status: 'pending',
    durationMinutes: 30,
  },
  {
    id: 'appointment-confirmed',
    startsAt: localDate(14, 13),
    clientId: 'client-sofia',
    clientName: 'Sofía León',
    barberId: 'barber-raul',
    barberName: 'Raúl',
    serviceIds: ['service-cut'],
    serviceName: 'Corte',
    status: 'confirmed',
    durationMinutes: 45,
  },
  {
    id: 'appointment-cancelled',
    startsAt: localDate(14, 14),
    clientId: 'client-ines',
    clientName: 'Inés Ríos',
    barberId: 'barber-raul',
    barberName: 'Raúl',
    serviceIds: ['service-cut'],
    serviceName: 'Corte',
    status: 'cancelled',
    durationMinutes: 45,
  },
  {
    id: 'appointment-tomorrow',
    startsAt: localDate(15, 10),
    clientId: 'client-sofia',
    clientName: 'Sofía León',
    barberId: 'barber-raul',
    barberName: 'Raúl',
    serviceIds: ['service-cut-beard'],
    serviceName: 'Corte y barba',
    status: 'confirmed',
    durationMinutes: 75,
  },
];

describe('getDashboardSummary', () => {
  it('uses the selected sales period and keeps appointment counts scoped to today', () => {
    expect(getDashboardSummary(sales, appointments, 'day', now)).toEqual({
      grossSales: 300,
      discounts: 20,
      netSales: 280,
      saleCount: 1,
      appointmentCount: 4,
      pendingCount: 1,
      confirmedCount: 1,
      completedCount: 1,
      cancelledCount: 1,
    });
  });

  it('uses Monday through Sunday for week sales and calendar month boundaries for month sales', () => {
    const week = getDashboardSummary(sales, appointments, 'week', now);
    const month = getDashboardSummary(sales, appointments, 'month', now);

    expect(week.netSales).toBe(580);
    expect(week.saleCount).toBe(2);
    expect(month.netSales).toBe(980);
    expect(month.saleCount).toBe(3);
    expect(week.appointmentCount).toBe(4);
    expect(month.appointmentCount).toBe(4);
  });
});

describe('getSalesSeries', () => {
  it('returns seven chronological week buckets starting on Monday', () => {
    const series = getSalesSeries(sales, 'week', now);

    expect(series).toHaveLength(7);
    expect(series[0]?.label).toMatch(/lun/i);
    expect(series[0]?.value).toBe(300);
    expect(series[2]?.value).toBe(280);
    expect(series[6]?.label).toMatch(/dom/i);
  });

  it('groups a month into local calendar weeks and keeps buckets chronological', () => {
    const series = getSalesSeries(sales, 'month', now);

    expect(series.length).toBeGreaterThanOrEqual(4);
    expect(series.length).toBeLessThanOrEqual(6);
    expect(series.reduce((sum, bucket) => sum + bucket.value, 0)).toBe(980);
  });
});

describe('getUpcomingAppointments', () => {
  it('returns future appointments in time order without completed or cancelled appointments', () => {
    const result = getUpcomingAppointments(appointments, now, 3);

    expect(result.map(({ id }) => id)).toEqual([
      'appointment-pending',
      'appointment-confirmed',
      'appointment-tomorrow',
    ]);
  });
});

describe('createDemoData', () => {
  it('generates date-relative sales with totals that reconcile to their items and discounts', () => {
    const demo = createDemoData(now);

    expect(demo.sales.length).toBeGreaterThanOrEqual(28);
    for (const sale of demo.sales) {
      const itemTotal = sale.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      expect(itemTotal).toBe(sale.grossTotal);
      expect(sale.grossTotal - sale.discountTotal).toBe(sale.netTotal);
    }
    expect(demo.appointments.length).toBeGreaterThanOrEqual(5);
  });
});
