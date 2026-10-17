import { describe, expect, it } from 'vitest';
import type { PromotionRecord } from '../types/agenda';
import type { SaleRecord } from '../types/domain';
import { getPromotionSalesInsights, getSalesBreakdown, getSalesTrend, filterSales, summarizeSales } from './sales';

function sale(overrides: Partial<SaleRecord> = {}): SaleRecord {
  return {
    id: 'sale-one',
    occurredAt: '2026-10-14T12:00:00.000Z',
    items: [
      { kind: 'service', catalogItemId: 'service-1', name: 'Corte', quantity: 1, unitPrice: 300 },
      { kind: 'product', catalogItemId: 'product-wax', name: 'Cera para peinar', quantity: 2, unitPrice: 175 },
    ],
    employeeId: 'barber-1',
    employeeName: 'Diego',
    paymentMethod: 'cash',
    status: 'completed',
    grossTotal: 650,
    discountTotal: 50,
    netTotal: 600,
    ...overrides,
  };
}

function promotion(overrides: Partial<PromotionRecord> = {}): PromotionRecord {
  return {
    id: 'promotion-seasonal',
    name: 'Oferta de temporada',
    description: '',
    targets: [{ kind: 'product', id: 'product-wax', name: 'Cera para peinar', price: 175 }],
    discountType: 'percentage',
    originalPrice: 175,
    discountValue: 20,
    startsOn: '2026-10-10',
    endsOn: '2026-10-20',
    manualStatus: 'published',
    ...overrides,
  };
}

describe('filterSales', () => {
  const records = [
    sale(),
    sale({
      id: 'sale-two',
      occurredAt: '2026-10-21T12:00:00.000Z',
      items: [{ kind: 'service', catalogItemId: 'service-2', name: 'Barba', quantity: 1, unitPrice: 250 }],
      employeeId: 'barber-2',
      employeeName: 'Raúl',
      paymentMethod: 'card',
      grossTotal: 250,
      discountTotal: 0,
      netTotal: 250,
    }),
  ];

  it('includes both selected date boundaries and searches item and employee snapshots', () => {
    expect(filterSales(records, {
      query: 'cera', startDate: '2026-10-14', endDate: '2026-10-14',
      employeeId: '', productId: '', serviceId: '', promotionId: '',
    }).map(({ id }) => id)).toEqual(['sale-one']);

    expect(filterSales(records, {
      query: 'raul', startDate: '', endDate: '',
      employeeId: '', productId: '', serviceId: '', promotionId: '',
    }).map(({ id }) => id)).toEqual(['sale-two']);
  });

  it('filters by employee, product, service, and explicitly attributed promotion', () => {
    const attributed = sale({ promotionId: 'promotion-seasonal', promotionName: 'Oferta de temporada' });
    const data = [attributed, records[1]!];
    const base = { query: '', startDate: '', endDate: '', employeeId: '', productId: '', serviceId: '', promotionId: '' };

    expect(filterSales(data, { ...base, employeeId: 'barber-2' }).map(({ id }) => id)).toEqual(['sale-two']);
    expect(filterSales(data, { ...base, productId: 'product-wax' }).map(({ id }) => id)).toEqual(['sale-one']);
    expect(filterSales(data, { ...base, serviceId: 'service-2' }).map(({ id }) => id)).toEqual(['sale-two']);
    expect(filterSales(data, { ...base, promotionId: 'promotion-seasonal' }).map(({ id }) => id)).toEqual(['sale-one']);
  });

  it('returns no records for malformed or reversed date ranges', () => {
    const base = { query: '', startDate: '', endDate: '', employeeId: '', productId: '', serviceId: '', promotionId: '' };
    expect(filterSales(records, { ...base, startDate: '2026-02-30' })).toEqual([]);
    expect(filterSales(records, { ...base, startDate: '2026-10-22', endDate: '2026-10-14' })).toEqual([]);
  });
});

describe('sales summaries and promotion insights', () => {
  it('summarizes gross sales, discounts, net sales, and record count', () => {
    expect(summarizeSales([sale(), sale({ id: 'sale-two', grossTotal: 250, discountTotal: 0, netTotal: 250 })])).toEqual({
      saleCount: 2,
      grossTotal: 900,
      discountTotal: 50,
      netTotal: 850,
    });
  });

  it('breaks down product and service units and employee net totals', () => {
    expect(getSalesBreakdown([sale()])).toEqual({
      products: [{ id: 'product-wax', name: 'Cera para peinar', units: 2, grossTotal: 350 }],
      services: [{ id: 'service-1', name: 'Corte', units: 1, grossTotal: 300 }],
      employees: [{ id: 'barber-1', name: 'Diego', saleCount: 1, netTotal: 600 }],
    });
  });

  it('groups net sales by local calendar day in chronological order', () => {
    expect(getSalesTrend([
      sale({ id: 'later', occurredAt: '2026-10-15T12:00:00.000Z', netTotal: 125 }),
      sale({ id: 'earlier', occurredAt: '2026-10-13T12:00:00.000Z', netTotal: 75 }),
      sale({ id: 'same-day', occurredAt: '2026-10-15T15:00:00.000Z', netTotal: 25 }),
    ])).toEqual([
      { date: '2026-10-13', saleCount: 1, netTotal: 75 },
      { date: '2026-10-15', saleCount: 2, netTotal: 150 },
    ]);
  });

  it('keeps explicit attribution separate from sales that only overlap a promotion date range', () => {
    const insights = getPromotionSalesInsights([
      sale({ promotionId: 'promotion-seasonal', promotionName: 'Oferta de temporada' }),
      sale({ id: 'sale-overlap-only', promotionId: undefined, occurredAt: '2026-10-18T12:00:00.000Z' }),
      sale({ id: 'sale-outside', occurredAt: '2026-10-21T12:00:00.000Z' }),
    ], [promotion()]);

    expect(insights).toEqual([{
      id: 'promotion-seasonal',
      name: 'Oferta de temporada',
      attributedSalesCount: 1,
      attributedNetTotal: 600,
      occurredDuringSalesCount: 1,
      occurredDuringNetTotal: 600,
      hasDateWindow: true,
    }]);
  });

  it('does not invent a promotion date window from an attribution name snapshot', () => {
    expect(getPromotionSalesInsights([
      sale({ promotionId: 'old-promotion', promotionName: 'Promoción anterior' }),
    ], [])).toEqual([{
      id: 'old-promotion',
      name: 'Promoción anterior',
      attributedSalesCount: 1,
      attributedNetTotal: 600,
      occurredDuringSalesCount: 0,
      occurredDuringNetTotal: 0,
      hasDateWindow: false,
    }]);
  });
});
