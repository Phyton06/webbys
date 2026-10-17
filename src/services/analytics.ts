import type { SaleRecord } from '../types/domain';
import { filterSales, summarizeSales } from './sales';

export interface PeriodSummary {
  saleCount: number;
  grossTotal: number;
  discountTotal: number;
  netTotal: number;
  averageTicket: number;
}

export interface PeriodDelta {
  absolute: number;
  percent: number | null;
}

export interface PeriodComparison {
  range: { startDate: string; endDate: string };
  previousRange: { startDate: string; endDate: string };
  current: PeriodSummary;
  previous: PeriodSummary;
  deltas: {
    netTotal: PeriodDelta;
    saleCount: PeriodDelta;
    averageTicket: PeriodDelta;
  };
}

export interface RankedItem {
  id: string;
  name: string;
  units: number;
  netTotal: number;
}

export interface EmployeePerformance {
  id: string;
  name: string;
  saleCount: number;
  netTotal: number;
  averageTicket: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDateKey(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return undefined;
  return date;
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(date: Date, days: number): Date {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}

function rangeSales(sales: SaleRecord[], startDate: string, endDate: string): SaleRecord[] {
  return filterSales(sales, { query: '', startDate, endDate, employeeId: '', productId: '', serviceId: '', promotionId: '' });
}

function emptySummary(): PeriodSummary {
  return { saleCount: 0, grossTotal: 0, discountTotal: 0, netTotal: 0, averageTicket: 0 };
}

function summaryOf(sales: SaleRecord[]): PeriodSummary {
  const totals = summarizeSales(sales);
  return { ...totals, averageTicket: totals.saleCount ? totals.netTotal / totals.saleCount : 0 };
}

function deltaOf(current: number, previous: number): PeriodDelta {
  return { absolute: current - previous, percent: previous === 0 ? null : ((current - previous) / previous) * 100 };
}

export function getPeriodComparison(sales: SaleRecord[], startDate: string, endDate: string): PeriodComparison {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  if (!start || !end || start.getTime() > end.getTime()) {
    return {
      range: { startDate, endDate },
      previousRange: { startDate, endDate },
      current: emptySummary(),
      previous: emptySummary(),
      deltas: { netTotal: deltaOf(0, 0), saleCount: deltaOf(0, 0), averageTicket: deltaOf(0, 0) },
    };
  }

  const dayCount = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, -(dayCount - 1));
  const current = summaryOf(rangeSales(sales, toDateKey(start), toDateKey(end)));
  const previous = summaryOf(rangeSales(sales, toDateKey(previousStart), toDateKey(previousEnd)));

  return {
    range: { startDate: toDateKey(start), endDate: toDateKey(end) },
    previousRange: { startDate: toDateKey(previousStart), endDate: toDateKey(previousEnd) },
    current,
    previous,
    deltas: {
      netTotal: deltaOf(current.netTotal, previous.netTotal),
      saleCount: deltaOf(current.saleCount, previous.saleCount),
      averageTicket: deltaOf(current.averageTicket, previous.averageTicket),
    },
  };
}

export function getItemRanking(sales: SaleRecord[], kind: 'product' | 'service'): RankedItem[] {
  const items = new Map<string, RankedItem>();

  for (const sale of sales) {
    if (sale.grossTotal <= 0) continue;
    for (const item of sale.items) {
      if (!item.catalogItemId || item.kind !== kind) continue;
      const gross = item.quantity * item.unitPrice;
      const net = gross - sale.discountTotal * (gross / sale.grossTotal);
      const current = items.get(item.catalogItemId) ?? { id: item.catalogItemId, name: item.name, units: 0, netTotal: 0 };
      current.units += item.quantity;
      current.netTotal += net;
      items.set(item.catalogItemId, current);
    }
  }

  return [...items.values()].sort((first, second) => second.units - first.units
    || second.netTotal - first.netTotal
    || first.name.localeCompare(second.name, 'es', { sensitivity: 'base' }));
}

export function getEmployeePerformance(sales: SaleRecord[]): EmployeePerformance[] {
  const employees = new Map<string, EmployeePerformance>();

  for (const sale of sales) {
    if (!sale.employeeId || !sale.employeeName) continue;
    const current = employees.get(sale.employeeId)
      ?? { id: sale.employeeId, name: sale.employeeName, saleCount: 0, netTotal: 0, averageTicket: 0 };
    current.saleCount += 1;
    current.netTotal += sale.netTotal;
    employees.set(sale.employeeId, current);
  }

  return [...employees.values()]
    .map((employee) => ({ ...employee, averageTicket: employee.saleCount ? employee.netTotal / employee.saleCount : 0 }))
    .sort((first, second) => second.netTotal - first.netTotal
      || first.name.localeCompare(second.name, 'es', { sensitivity: 'base' }));
}
