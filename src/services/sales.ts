import type { PromotionRecord } from '../types/agenda';
import type { SaleRecord } from '../types/domain';

export interface SalesFilters {
  query: string;
  startDate: string;
  endDate: string;
  employeeId: string;
  productId: string;
  serviceId: string;
  promotionId: string;
}

export interface SalesBreakdown {
  products: Array<{ id: string; name: string; units: number; grossTotal: number }>;
  services: Array<{ id: string; name: string; units: number; grossTotal: number }>;
  employees: Array<{ id: string; name: string; saleCount: number; netTotal: number }>;
}

export interface PromotionSalesInsight {
  id: string;
  name: string;
  attributedSalesCount: number;
  attributedNetTotal: number;
  occurredDuringSalesCount: number;
  occurredDuringNetTotal: number;
  hasDateWindow: boolean;
}

function isDateKey(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
}

function localDateKey(value: string): string | undefined {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase('es').normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export function filterSales(sales: SaleRecord[], filters: SalesFilters): SaleRecord[] {
  const startDate = filters.startDate.trim();
  const endDate = filters.endDate.trim();
  if ((startDate && !isDateKey(startDate)) || (endDate && !isDateKey(endDate))
    || (startDate && endDate && startDate > endDate)) return [];

  const query = normalizeSearch(filters.query);
  return sales.filter((sale) => {
    const saleDate = localDateKey(sale.occurredAt);
    if (!saleDate) return false;
    if (startDate && saleDate < startDate) return false;
    if (endDate && saleDate > endDate) return false;
    if (filters.employeeId && sale.employeeId !== filters.employeeId) return false;
    if (filters.productId && !sale.items.some((item) => item.kind === 'product' && item.catalogItemId === filters.productId)) return false;
    if (filters.serviceId && !sale.items.some((item) => item.kind === 'service' && item.catalogItemId === filters.serviceId)) return false;
    if (filters.promotionId && sale.promotionId !== filters.promotionId) return false;
    if (!query) return true;

    return normalizeSearch(sale.id).includes(query)
      || normalizeSearch(sale.employeeName ?? '').includes(query)
      || normalizeSearch(sale.promotionName ?? '').includes(query)
      || sale.items.some(({ name }) => normalizeSearch(name).includes(query));
  });
}

export function summarizeSales(sales: SaleRecord[]) {
  return sales.reduce((summary, sale) => ({
    saleCount: summary.saleCount + 1,
    grossTotal: summary.grossTotal + sale.grossTotal,
    discountTotal: summary.discountTotal + sale.discountTotal,
    netTotal: summary.netTotal + sale.netTotal,
  }), { saleCount: 0, grossTotal: 0, discountTotal: 0, netTotal: 0 });
}

export function getSalesBreakdown(sales: SaleRecord[]): SalesBreakdown {
  const products = new Map<string, SalesBreakdown['products'][number]>();
  const services = new Map<string, SalesBreakdown['services'][number]>();
  const employees = new Map<string, SalesBreakdown['employees'][number]>();

  for (const sale of sales) {
    if (sale.employeeId && sale.employeeName) {
      const current = employees.get(sale.employeeId) ?? {
        id: sale.employeeId,
        name: sale.employeeName,
        saleCount: 0,
        netTotal: 0,
      };
      current.saleCount += 1;
      current.netTotal += sale.netTotal;
      employees.set(sale.employeeId, current);
    }

    for (const item of sale.items) {
      if (!item.catalogItemId || (item.kind !== 'product' && item.kind !== 'service')) continue;
      const collection = item.kind === 'product' ? products : services;
      const current = collection.get(item.catalogItemId) ?? {
        id: item.catalogItemId,
        name: item.name,
        units: 0,
        grossTotal: 0,
      };
      current.units += item.quantity;
      current.grossTotal += item.quantity * item.unitPrice;
      collection.set(item.catalogItemId, current);
    }
  }

  const byName = <T extends { name: string }>(first: T, second: T) => first.name.localeCompare(second.name, 'es', { sensitivity: 'base' });
  return {
    products: [...products.values()].sort(byName),
    services: [...services.values()].sort(byName),
    employees: [...employees.values()].sort(byName),
  };
}

export function getSalesTrend(sales: SaleRecord[]): Array<{ date: string; saleCount: number; netTotal: number }> {
  const daily = new Map<string, { date: string; saleCount: number; netTotal: number }>();
  for (const sale of sales) {
    const date = localDateKey(sale.occurredAt);
    if (!date) continue;
    const bucket = daily.get(date) ?? { date, saleCount: 0, netTotal: 0 };
    bucket.saleCount += 1;
    bucket.netTotal += sale.netTotal;
    daily.set(date, bucket);
  }
  return [...daily.values()].sort((first, second) => first.date.localeCompare(second.date));
}

export function getPromotionSalesInsights(sales: SaleRecord[], promotions: PromotionRecord[]): PromotionSalesInsight[] {
  const definitions = new Map(promotions.map((promotion) => [promotion.id, promotion]));
  const attributedSnapshots = new Map<string, string>();
  for (const sale of sales) {
    if (sale.promotionId) attributedSnapshots.set(sale.promotionId, sale.promotionName ?? sale.promotionId);
  }

  const promotionIds = new Set([...definitions.keys(), ...attributedSnapshots.keys()]);
  return [...promotionIds].map((id) => {
    const promotion = definitions.get(id);
    const name = promotion?.name ?? attributedSnapshots.get(id) ?? id;
    const attributedSales = sales.filter((sale) => sale.promotionId === id);
    const dateWindow = promotion ? { start: promotion.startsOn, end: promotion.endsOn } : undefined;
    const hasDateWindow = dateWindow !== undefined;
    const occurredDuringSales = sales.filter((sale) => {
      if (!dateWindow || sale.promotionId === id) return false;
      const date = localDateKey(sale.occurredAt);
      return date !== undefined && date >= dateWindow.start && date <= dateWindow.end;
    });

    return {
      id,
      name,
      attributedSalesCount: attributedSales.length,
      attributedNetTotal: attributedSales.reduce((total, sale) => total + sale.netTotal, 0),
      occurredDuringSalesCount: occurredDuringSales.length,
      occurredDuringNetTotal: occurredDuringSales.reduce((total, sale) => total + sale.netTotal, 0),
      hasDateWindow,
    };
  }).sort((first, second) => first.name.localeCompare(second.name, 'es', { sensitivity: 'base' }));
}
