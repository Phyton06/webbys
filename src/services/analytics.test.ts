import { describe, expect, it } from 'vitest';
import type { PromotionRecord } from '../types/agenda';
import type { SaleItem, SaleRecord } from '../types/domain';
import { getEmployeePerformance, getItemRanking, getPeriodComparison, getPromotionAnalytics } from './analytics';

function at(month: number, day: number, hour = 12, minute = 0): string {
  return new Date(2026, month - 1, day, hour, minute).toISOString();
}

const corte = (price = 300): SaleItem => ({ kind: 'service', catalogItemId: 'service-1', name: 'Corte', quantity: 1, unitPrice: price });
const cera = (price = 175): SaleItem => ({ kind: 'product', catalogItemId: 'product-wax', name: 'Cera para peinar', quantity: 1, unitPrice: price });

function sale(overrides: Partial<SaleRecord> & { id: string; occurredAt: string; items: SaleItem[] }): SaleRecord {
  const grossTotal = overrides.items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  const discountTotal = overrides.discountTotal ?? 0;
  return {
    employeeId: 'barber-1',
    employeeName: 'Diego',
    paymentMethod: 'cash',
    status: 'completed',
    ...overrides,
    grossTotal,
    discountTotal,
    netTotal: grossTotal - discountTotal,
  };
}

// Ventana actual: 1–5 oct (3 ventas, neto 600, bruto 850, descuentos 250).
// Ventana previa esperada: 26–30 sep (2 ventas, neto 300).
// Fuera de ambas: 6 oct y 25 sep, para probar que no se filtran.
const periodSales: SaleRecord[] = [
  sale({ id: 's-1', occurredAt: at(10, 1, 0, 30), items: [corte(300)] }),
  sale({ id: 's-2', occurredAt: at(10, 3), items: [corte(250)], discountTotal: 50 }),
  sale({ id: 's-3', occurredAt: at(10, 5, 23, 30), items: [corte(300)], discountTotal: 200 }),
  sale({ id: 's-4', occurredAt: at(9, 27), items: [corte(150)] }),
  sale({ id: 's-5', occurredAt: at(9, 30), items: [corte(150)] }),
  sale({ id: 's-6', occurredAt: at(10, 6), items: [corte(400)] }),
  sale({ id: 's-7', occurredAt: at(9, 25), items: [corte(400)] }),
];

describe('getPeriodComparison', () => {
  it('compares a range against the immediately preceding window of equal inclusive length', () => {
    const comparison = getPeriodComparison(periodSales, '2026-10-01', '2026-10-05');

    expect(comparison.range).toEqual({ startDate: '2026-10-01', endDate: '2026-10-05' });
    expect(comparison.previousRange).toEqual({ startDate: '2026-09-26', endDate: '2026-09-30' });

    expect(comparison.current).toEqual({ saleCount: 3, grossTotal: 850, discountTotal: 250, netTotal: 600, averageTicket: 200 });
    expect(comparison.previous).toEqual({ saleCount: 2, grossTotal: 300, discountTotal: 0, netTotal: 300, averageTicket: 150 });

    expect(comparison.deltas.netTotal).toEqual({ absolute: 300, percent: 100 });
    expect(comparison.deltas.saleCount).toEqual({ absolute: 1, percent: 50 });
    expect(comparison.deltas.averageTicket.absolute).toBe(50);
    expect(comparison.deltas.averageTicket.percent).toBeCloseTo((50 / 150) * 100, 5);
  });

  it('includes both boundary days and excludes the sales of the neighboring windows', () => {
    const comparison = getPeriodComparison(periodSales, '2026-10-01', '2026-10-05');

    expect(comparison.current.saleCount).toBe(3);
    expect(comparison.current.netTotal).toBe(600);
    expect(comparison.previous.saleCount).toBe(2);
    expect(comparison.previous.netTotal).toBe(300);
  });

  it('returns empty summaries with null percentages when there are no sales', () => {
    const comparison = getPeriodComparison([], '2026-08-01', '2026-08-05');

    expect(comparison.previousRange).toEqual({ startDate: '2026-07-27', endDate: '2026-07-31' });
    expect(comparison.current).toEqual({ saleCount: 0, grossTotal: 0, discountTotal: 0, netTotal: 0, averageTicket: 0 });
    expect(comparison.previous).toEqual({ saleCount: 0, grossTotal: 0, discountTotal: 0, netTotal: 0, averageTicket: 0 });
    expect(comparison.deltas.netTotal.percent).toBeNull();
    expect(comparison.deltas.saleCount.percent).toBeNull();
    expect(comparison.deltas.averageTicket.percent).toBeNull();
  });

  it('reports a null percentage when the previous window has no value', () => {
    const comparison = getPeriodComparison(periodSales, '2026-09-27', '2026-09-27');

    expect(comparison.current.netTotal).toBe(150);
    expect(comparison.previous.netTotal).toBe(0);
    expect(comparison.deltas.netTotal).toEqual({ absolute: 150, percent: null });
    expect(comparison.deltas.saleCount).toEqual({ absolute: 1, percent: null });
    expect(comparison.deltas.averageTicket).toEqual({ absolute: 150, percent: null });
  });

  it('returns empty summaries for malformed or reversed ranges without throwing', () => {
    for (const [start, end] of [['2026-13-01', '2026-10-05'], ['2026-10-05', '2026-10-01'], ['', '2026-10-05']]) {
      const comparison = getPeriodComparison(periodSales, start as string, end as string);

      expect(comparison.current.saleCount).toBe(0);
      expect(comparison.previous.saleCount).toBe(0);
      expect(comparison.deltas.netTotal.percent).toBeNull();
    }
  });
});

describe('getItemRanking', () => {
  const rankingSales: SaleRecord[] = [
    sale({ id: 'r-1', occurredAt: at(10, 10), items: [corte(300), cera(175)], discountTotal: 50 }),
    sale({ id: 'r-2', occurredAt: at(10, 11), items: [cera(175)] }),
    sale({ id: 'r-3', occurredAt: at(10, 12), items: [{ name: 'Artículo libre', quantity: 2, unitPrice: 10 }] }),
  ];

  it('ranks items by units and splits each sale discount proportionally to its gross amount', () => {
    const products = getItemRanking(rankingSales, 'product');

    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({ id: 'product-wax', name: 'Cera para peinar', units: 2 });
    expect(products[0]!.netTotal).toBeCloseTo(175 - 50 * (175 / 475) + 175, 5);

    const services = getItemRanking(rankingSales, 'service');

    expect(services).toHaveLength(1);
    expect(services[0]).toMatchObject({ id: 'service-1', name: 'Corte', units: 1 });
    expect(services[0]!.netTotal).toBeCloseTo(300 - 50 * (300 / 475), 5);
  });

  it('orders ties by net total and then by name', () => {
    const netTie = getItemRanking([
      sale({ id: 't-1', occurredAt: at(10, 1), items: [{ kind: 'product', catalogItemId: 'p-low', name: 'Zeta', quantity: 1, unitPrice: 100 }] }),
      sale({ id: 't-2', occurredAt: at(10, 2), items: [{ kind: 'product', catalogItemId: 'p-high', name: 'Delta', quantity: 1, unitPrice: 150 }] }),
    ], 'product');
    expect(netTie.map(({ name }) => name)).toEqual(['Delta', 'Zeta']);

    const nameTie = getItemRanking([
      sale({ id: 't-3', occurredAt: at(10, 3), items: [{ kind: 'product', catalogItemId: 'p-b', name: 'Beta', quantity: 1, unitPrice: 100 }] }),
      sale({ id: 't-4', occurredAt: at(10, 4), items: [{ kind: 'product', catalogItemId: 'p-a', name: 'Alfa', quantity: 1, unitPrice: 100 }] }),
    ], 'product');
    expect(nameTie.map(({ name }) => name)).toEqual(['Alfa', 'Beta']);
  });

  it('ignores items without catalog identity and items of the other kind', () => {
    const products = getItemRanking(rankingSales, 'product');

    expect(products.map(({ id }) => id)).toEqual(['product-wax']);
    expect(products.some(({ name }) => name === 'Artículo libre')).toBe(false);
  });

  it('counts multiple units of the same line as separate units', () => {
    const ranking = getItemRanking([
      sale({ id: 'u-1', occurredAt: at(10, 5), items: [{ kind: 'product', catalogItemId: 'product-oil', name: 'Aceite para barba', quantity: 3, unitPrice: 100 }] }),
    ], 'product');

    expect(ranking[0]).toMatchObject({ units: 3 });
    expect(ranking[0]!.netTotal).toBe(300);
  });
});

describe('getEmployeePerformance', () => {
  it('groups sales per employee with average ticket and ranks by net total', () => {
    const performance = getEmployeePerformance([
      sale({ id: 'e-1', occurredAt: at(10, 10), items: [corte(300)], employeeId: 'barber-1', employeeName: 'Diego' }),
      sale({ id: 'e-2', occurredAt: at(10, 11), items: [corte(200)], employeeId: 'barber-1', employeeName: 'Diego' }),
      sale({ id: 'e-3', occurredAt: at(10, 12), items: [corte(600)], employeeId: 'barber-2', employeeName: 'Raúl' }),
    ]);

    expect(performance.map(({ name }) => name)).toEqual(['Raúl', 'Diego']);
    expect(performance[0]).toEqual({ id: 'barber-2', name: 'Raúl', saleCount: 1, netTotal: 600, averageTicket: 600 });
    expect(performance[1]).toEqual({ id: 'barber-1', name: 'Diego', saleCount: 2, netTotal: 500, averageTicket: 250 });
  });

  it('breaks net-total ties by name and skips sales without an employee', () => {
    const performance = getEmployeePerformance([
      sale({ id: 'e-4', occurredAt: at(10, 13), items: [corte(600)], employeeId: 'barber-3', employeeName: 'Raúl' }),
      sale({ id: 'e-5', occurredAt: at(10, 14), items: [corte(600)], employeeId: 'barber-4', employeeName: 'Andrés' }),
      sale({ id: 'e-6', occurredAt: at(10, 15), items: [corte(600)], employeeId: undefined, employeeName: undefined }),
    ]);

    expect(performance.map(({ name }) => name)).toEqual(['Andrés', 'Raúl']);
  });
});

function promotion(overrides: Partial<PromotionRecord> & { id: string; name: string; startsOn: string; endsOn: string }): PromotionRecord {
  return {
    description: '',
    targets: [],
    discountType: 'percentage',
    originalPrice: 0,
    discountValue: 10,
    manualStatus: 'published',
    ...overrides,
  };
}

// Promo A definida con ventana 1–10 sep; la ventana previa de igual longitud es 22–31 ago.
// a-1..a-2 atribuidas dentro del rango elegido (sep 1–30); a-3 fuera del rango pero dentro de la ventana previa;
// a-4 fuera de la ventana previa. o-1..o-3 coinciden en fechas sin atribuirse a A (o-2 y o-3 pertenecen a otras promos).
const promotionRecords: PromotionRecord[] = [
  promotion({ id: 'promo-a', name: 'Promo barba', startsOn: '2026-09-01', endsOn: '2026-09-10' }),
  promotion({ id: 'promo-c', name: 'Promo futura', startsOn: '2026-11-01', endsOn: '2026-11-10' }),
];

const promotionSales: SaleRecord[] = [
  sale({ id: 'a-1', occurredAt: at(9, 3), items: [corte(300), cera(175)], discountTotal: 25, promotionId: 'promo-a', promotionName: 'Promo barba' }),
  sale({ id: 'a-2', occurredAt: at(9, 8), items: [corte(300)], discountTotal: 50, promotionId: 'promo-a', promotionName: 'Promo barba' }),
  sale({ id: 'a-3', occurredAt: at(8, 25), items: [corte(300)], promotionId: 'promo-a', promotionName: 'Promo barba' }),
  sale({ id: 'a-4', occurredAt: at(8, 20), items: [corte(500)], promotionId: 'promo-a', promotionName: 'Promo barba' }),
  sale({ id: 'o-1', occurredAt: at(9, 5), items: [corte(250)] }),
  sale({ id: 'o-2', occurredAt: at(9, 7), items: [corte(200)], promotionId: 'promo-b', promotionName: 'Oferta express' }),
  sale({ id: 'o-3', occurredAt: at(9, 9), items: [corte(200)], promotionId: 'promo-d', promotionName: 'Zeta promo' }),
  sale({ id: 'x-1', occurredAt: at(8, 10), items: [corte(400)] }),
];

describe('getPromotionAnalytics', () => {
  it('keeps explicit attribution separate from date-window coincidence', () => {
    const { promotions: list } = getPromotionAnalytics(promotionSales, promotionRecords, '2026-09-01', '2026-09-30');
    const promoA = list.find(({ id }) => id === 'promo-a')!;

    expect(promoA.attributedSalesCount).toBe(2);
    expect(promoA.attributedNetTotal).toBe(700);
    expect(promoA.attributedDiscountTotal).toBe(75);
    expect(promoA.attributedUnits).toBe(3);
    expect(promoA.occurredDuringSalesCount).toBe(3);
    expect(promoA.occurredDuringNetTotal).toBe(650);
    expect(promoA.occurredDuringUnits).toBe(3);
  });

  it('compares the stored window against the immediately preceding window of equal length under the same attribution rule', () => {
    const { promotions: list } = getPromotionAnalytics(promotionSales, promotionRecords, '2026-09-01', '2026-09-30');
    const promoA = list.find(({ id }) => id === 'promo-a')!;

    expect(promoA.hasDateWindow).toBe(true);
    expect(promoA.windowComparison).not.toBeNull();
    expect(promoA.windowComparison!.currentNetTotal).toBe(700);
    expect(promoA.windowComparison!.previousNetTotal).toBe(300);
    expect(promoA.windowComparison!.delta.absolute).toBe(400);
    expect(promoA.windowComparison!.delta.percent).toBeCloseTo((400 / 300) * 100, 5);
  });

  it('leaves the window comparison null for promotions without a stored definition', () => {
    const { promotions: list } = getPromotionAnalytics(promotionSales, promotionRecords, '2026-09-01', '2026-09-30');
    const promoB = list.find(({ id }) => id === 'promo-b')!;

    expect(promoB.name).toBe('Oferta express');
    expect(promoB.hasDateWindow).toBe(false);
    expect(promoB.windowComparison).toBeNull();
    expect(promoB.occurredDuringSalesCount).toBe(0);
    expect(promoB.attributedSalesCount).toBe(1);
    expect(promoB.attributedNetTotal).toBe(200);
  });

  it('lists definitions with no sales and computes the promotion-free benchmark of the range', () => {
    const report = getPromotionAnalytics(promotionSales, promotionRecords, '2026-09-01', '2026-09-30');
    const promoA = report.promotions.find(({ id }) => id === 'promo-a')!;
    const promoD = report.promotions.find(({ id }) => id === 'promo-d')!;
    const promoC = report.promotions.find(({ id }) => id === 'promo-c')!;

    expect(promoA.dailyAttributed).toEqual([
      { date: '2026-09-03', netTotal: 450 },
      { date: '2026-09-08', netTotal: 250 },
    ]);
    expect(promoD.dailyAttributed).toEqual([{ date: '2026-09-09', netTotal: 200 }]);
    expect(promoC.attributedSalesCount).toBe(0);
    expect(promoC.hasDateWindow).toBe(true);
    expect(promoC.windowComparison).toEqual({ currentNetTotal: 0, previousNetTotal: 0, delta: { absolute: 0, percent: null } });
    expect(report.withoutPromotion).toEqual({ saleCount: 1, netTotal: 250 });
  });

  it('orders promotions by attributed net total and then by name', () => {
    const { promotions: list } = getPromotionAnalytics(promotionSales, promotionRecords, '2026-09-01', '2026-09-30');

    expect(list.map(({ id }) => id)).toEqual(['promo-a', 'promo-b', 'promo-d', 'promo-c']);
  });

  it('scopes attributed figures and the daily series to the selected range', () => {
    const { promotions: list } = getPromotionAnalytics(promotionSales, promotionRecords, '2026-09-01', '2026-09-05');
    const promoA = list.find(({ id }) => id === 'promo-a')!;

    expect(promoA.attributedSalesCount).toBe(1);
    expect(promoA.attributedNetTotal).toBe(450);
    expect(promoA.dailyAttributed).toEqual([{ date: '2026-09-03', netTotal: 450 }]);
    expect(promoA.occurredDuringSalesCount).toBe(1);
    expect(promoA.windowComparison!.currentNetTotal).toBe(700);
  });

  it('returns an empty report for malformed or reversed ranges', () => {
    for (const [start, end] of [['2026-13-01', '2026-09-30'], ['2026-09-30', '2026-09-01']]) {
      const report = getPromotionAnalytics(promotionSales, promotionRecords, start as string, end as string);

      expect(report.promotions).toEqual([]);
      expect(report.withoutPromotion).toEqual({ saleCount: 0, netTotal: 0 });
    }
  });
});
