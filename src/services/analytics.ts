import type { PromotionRecord } from '../types/agenda';
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

export interface PromotionWindowComparison {
  currentNetTotal: number;
  previousNetTotal: number;
  delta: PeriodDelta;
}

export interface PromotionAnalytics {
  id: string;
  name: string;
  attributedSalesCount: number;
  attributedNetTotal: number;
  attributedDiscountTotal: number;
  attributedUnits: number;
  occurredDuringSalesCount: number;
  occurredDuringNetTotal: number;
  occurredDuringUnits: number;
  hasDateWindow: boolean;
  windowComparison: PromotionWindowComparison | null;
  dailyAttributed: Array<{ date: string; netTotal: number }>;
}

export interface PromotionAnalyticsReport {
  promotions: PromotionAnalytics[];
  withoutPromotion: { saleCount: number; netTotal: number };
}

export function getPromotionAnalytics(
  sales: SaleRecord[],
  promotions: PromotionRecord[],
  startDate: string,
  endDate: string,
): PromotionAnalyticsReport {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  if (!start || !end || start.getTime() > end.getTime()) {
    return { promotions: [], withoutPromotion: { saleCount: 0, netTotal: 0 } };
  }

  const startKey = toDateKey(start);
  const endKey = toDateKey(end);
  const saleDateKey = (sale: SaleRecord): string | undefined => {
    const date = new Date(sale.occurredAt);
    if (Number.isNaN(date.getTime())) return undefined;
    return toDateKey(date);
  };
  const isWithin = (sale: SaleRecord, from: string, to: string): boolean => {
    const key = saleDateKey(sale);
    return key !== undefined && key >= from && key <= to;
  };

  const definitions = new Map(promotions.map((promotion) => [promotion.id, promotion]));
  const snapshotNames = new Map<string, string>();
  for (const sale of sales) {
    if (sale.promotionId) snapshotNames.set(sale.promotionId, sale.promotionName ?? sale.promotionId);
  }

  const selected = sales.filter((sale) => isWithin(sale, startKey, endKey));
  const withoutAttribution = selected.filter((sale) => !sale.promotionId);
  const withoutPromotion = {
    saleCount: withoutAttribution.length,
    netTotal: withoutAttribution.reduce((total, sale) => total + sale.netTotal, 0),
  };

  const promotionsAnalytics = [...new Set([...definitions.keys(), ...snapshotNames.keys()])]
    .map((id): PromotionAnalytics => {
      const definition = definitions.get(id);
      const name = definition?.name ?? snapshotNames.get(id) ?? id;
      const attributed = selected.filter((sale) => sale.promotionId === id);

      const windowStart = definition ? parseDateKey(definition.startsOn) : undefined;
      const windowEnd = definition ? parseDateKey(definition.endsOn) : undefined;
      const hasDateWindow = Boolean(windowStart && windowEnd && windowStart.getTime() <= windowEnd.getTime());

      let occurredDuring: SaleRecord[] = [];
      let windowComparison: PromotionWindowComparison | null = null;
      if (hasDateWindow && windowStart && windowEnd) {
        const windowStartKey = toDateKey(windowStart);
        const windowEndKey = toDateKey(windowEnd);
        occurredDuring = selected.filter((sale) => sale.promotionId !== id && isWithin(sale, windowStartKey, windowEndKey));

        const windowLength = Math.round((windowEnd.getTime() - windowStart.getTime()) / DAY_MS) + 1;
        const previousEnd = addDays(windowStart, -1);
        const previousStart = addDays(previousEnd, -(windowLength - 1));
        const attributedNetWithin = (from: string, to: string): number => sales
          .filter((sale) => sale.promotionId === id && isWithin(sale, from, to))
          .reduce((total, sale) => total + sale.netTotal, 0);
        const currentNetTotal = attributedNetWithin(windowStartKey, windowEndKey);
        const previousNetTotal = attributedNetWithin(toDateKey(previousStart), toDateKey(previousEnd));
        windowComparison = { currentNetTotal, previousNetTotal, delta: deltaOf(currentNetTotal, previousNetTotal) };
      }

      const dailyNet = new Map<string, number>();
      for (const sale of attributed) {
        const key = saleDateKey(sale);
        if (key !== undefined) dailyNet.set(key, (dailyNet.get(key) ?? 0) + sale.netTotal);
      }

      return {
        id,
        name,
        attributedSalesCount: attributed.length,
        attributedNetTotal: attributed.reduce((total, sale) => total + sale.netTotal, 0),
        attributedDiscountTotal: attributed.reduce((total, sale) => total + sale.discountTotal, 0),
        attributedUnits: countUnits(attributed),
        occurredDuringSalesCount: occurredDuring.length,
        occurredDuringNetTotal: occurredDuring.reduce((total, sale) => total + sale.netTotal, 0),
        occurredDuringUnits: countUnits(occurredDuring),
        hasDateWindow,
        windowComparison,
        dailyAttributed: [...dailyNet.entries()]
          .map(([date, netTotal]) => ({ date, netTotal }))
          .sort((first, second) => first.date.localeCompare(second.date)),
      };
    })
    .sort((first, second) => second.attributedNetTotal - first.attributedNetTotal
      || first.name.localeCompare(second.name, 'es', { sensitivity: 'base' }));

  return { promotions: promotionsAnalytics, withoutPromotion };
}

function countUnits(sales: SaleRecord[]): number {
  return sales.reduce((total, sale) => total + sale.items.reduce((sum, item) => sum + item.quantity, 0), 0);
}
