import type { AppointmentRecord, SaleRecord } from '../types/domain';
import { getEffectiveAppointmentStatus } from './appointment-lifecycle';

export type DashboardRange = 'day' | 'week' | 'month';

export interface DashboardSummary {
  grossSales: number;
  discounts: number;
  netSales: number;
  saleCount: number;
  appointmentCount: number;
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
}

export interface SalesBucket {
  label: string;
  value: number;
}

interface DateRange {
  start: Date;
  end: Date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date): Date {
  const start = startOfDay(date);
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
}

function getSalesRange(range: DashboardRange, now: Date): DateRange {
  if (range === 'day') {
    const start = startOfDay(now);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  if (range === 'week') {
    const start = startOfWeek(now);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }

  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
}

function isWithin(date: string, range: DateRange): boolean {
  const timestamp = new Date(date).getTime();
  return timestamp >= range.start.getTime() && timestamp < range.end.getTime();
}

function getSalesInRange(sales: SaleRecord[], range: DashboardRange, now: Date): SaleRecord[] {
  const dateRange = getSalesRange(range, now);
  return sales.filter((sale) => isWithin(sale.occurredAt, dateRange));
}

export function getDashboardSummary(
  sales: SaleRecord[],
  appointments: AppointmentRecord[],
  range: DashboardRange,
  now: Date,
): DashboardSummary {
  const periodSales = getSalesInRange(sales, range, now);
  const today = { start: startOfDay(now), end: new Date(startOfDay(now)) };
  today.end.setDate(today.end.getDate() + 1);
  const todayAppointments = appointments.filter((appointment) => isWithin(appointment.startsAt, today));
  const statuses = todayAppointments.map((appointment) => getEffectiveAppointmentStatus(appointment, now));

  return {
    grossSales: periodSales.reduce((total, sale) => total + sale.grossTotal, 0),
    discounts: periodSales.reduce((total, sale) => total + sale.discountTotal, 0),
    netSales: periodSales.reduce((total, sale) => total + sale.netTotal, 0),
    saleCount: periodSales.length,
    appointmentCount: todayAppointments.length,
    pendingCount: statuses.filter((status) => status === 'pending').length,
    confirmedCount: statuses.filter((status) => status === 'confirmed').length,
    completedCount: statuses.filter((status) => status === 'completed').length,
    cancelledCount: statuses.filter((status) => status === 'cancelled').length,
  };
}

function createDayBuckets(sales: SaleRecord[], now: Date): SalesBucket[] {
  const labels = ['00–03', '04–07', '08–11', '12–15', '16–19', '20–23'];
  const values = Array.from({ length: labels.length }, () => 0);
  const range = getSalesRange('day', now);

  for (const sale of sales.filter(({ occurredAt }) => isWithin(occurredAt, range))) {
    const hour = new Date(sale.occurredAt).getHours();
    const index = Math.floor(hour / 4);
    values[index] = (values[index] ?? 0) + sale.netTotal;
  }

  return labels.map((label, index) => ({ label, value: values[index] ?? 0 }));
}

function createWeekBuckets(sales: SaleRecord[], now: Date): SalesBucket[] {
  const start = startOfWeek(now);
  const labels: string[] = [];
  const values = Array.from({ length: 7 }, () => 0);

  for (let index = 0; index < 7; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    labels.push(new Intl.DateTimeFormat('es', { weekday: 'short' }).format(date).replace('.', ''));
  }

  const range = getSalesRange('week', now);
  for (const sale of sales.filter(({ occurredAt }) => isWithin(occurredAt, range))) {
    const date = new Date(sale.occurredAt);
    const index = (date.getDay() + 6) % 7;
    values[index] = (values[index] ?? 0) + sale.netTotal;
  }

  return labels.map((label, index) => ({ label, value: values[index] ?? 0 }));
}

function createMonthBuckets(sales: SaleRecord[], now: Date): SalesBucket[] {
  const range = getSalesRange('month', now);
  const firstWeekStart = startOfWeek(range.start);
  const buckets: SalesBucket[] = [];

  for (let weekStart = new Date(firstWeekStart); weekStart < range.end; weekStart.setDate(weekStart.getDate() + 7)) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const bucketStart = new Date(Math.max(weekStart.getTime(), range.start.getTime()));
    const bucketEnd = new Date(Math.min(weekEnd.getTime(), range.end.getTime()));
    const firstDay = bucketStart.getDate();
    const lastDay = new Date(bucketEnd.getTime() - 1).getDate();
    const value = sales
      .filter(({ occurredAt }) => isWithin(occurredAt, { start: bucketStart, end: bucketEnd }))
      .reduce((total, sale) => total + sale.netTotal, 0);

    buckets.push({ label: `${firstDay}–${lastDay}`, value });
  }

  return buckets;
}

export function getSalesSeries(
  sales: SaleRecord[],
  range: DashboardRange,
  now: Date,
): SalesBucket[] {
  if (range === 'day') {
    return createDayBuckets(sales, now);
  }

  if (range === 'week') {
    return createWeekBuckets(sales, now);
  }

  return createMonthBuckets(sales, now);
}

export function getUpcomingAppointments(
  appointments: AppointmentRecord[],
  now: Date,
  limit = 4,
): AppointmentRecord[] {
  return appointments
    .filter((appointment) => {
      const startsAt = new Date(appointment.startsAt).getTime();
      return startsAt >= now.getTime() && getEffectiveAppointmentStatus(appointment, now) !== 'cancelled'
        && getEffectiveAppointmentStatus(appointment, now) !== 'completed';
    })
    .sort((first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime())
    .slice(0, Math.max(0, limit));
}
