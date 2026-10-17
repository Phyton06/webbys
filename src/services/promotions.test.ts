import { describe, expect, it } from 'vitest';
import type { PromotionRecord } from '../types/agenda';
import { getPromotionPrice, getPromotionStatus, validatePromotion } from './promotions';

function promotion(overrides: Partial<PromotionRecord> = {}): PromotionRecord {
  return {
    id: 'promotion-corte',
    name: 'Corte de temporada',
    description: 'Precio especial de lanzamiento.',
    targets: [{ kind: 'service', id: 'service-1', name: 'Corte', price: 300 }],
    discountType: 'percentage',
    originalPrice: 300,
    discountValue: 20,
    startsOn: '2026-10-10',
    endsOn: '2026-10-20',
    manualStatus: 'published',
    ...overrides,
  };
}

describe('promotion calculations and lifecycle', () => {
  it('calculates the estimated price for a percentage discount', () => {
    expect(getPromotionPrice(promotion())).toBe(240);
  });

  it('uses the configured direct promotional price', () => {
    expect(getPromotionPrice(promotion({ discountType: 'fixed_price', discountValue: 175 }))).toBe(175);
  });

  it('derives scheduled, active, and finished statuses from inclusive dates', () => {
    const current = promotion();
    expect(getPromotionStatus(current, '2026-10-09')).toBe('scheduled');
    expect(getPromotionStatus(current, '2026-10-10')).toBe('active');
    expect(getPromotionStatus(current, '2026-10-20')).toBe('active');
    expect(getPromotionStatus(current, '2026-10-21')).toBe('finished');
  });

  it('keeps manually controlled draft and disabled statuses', () => {
    expect(getPromotionStatus(promotion({ manualStatus: 'draft' }), '2026-10-15')).toBe('draft');
    expect(getPromotionStatus(promotion({ manualStatus: 'disabled' }), '2026-10-15')).toBe('disabled');
  });

  it('validates percentage, dates, target snapshots, and direct price bounds', () => {
    expect(validatePromotion(promotion())).toEqual({ valid: true });
    expect(validatePromotion(promotion({ discountValue: 101 })).valid).toBe(false);
    expect(validatePromotion(promotion({ startsOn: '2026-10-21' })).valid).toBe(false);
    expect(validatePromotion(promotion({ targets: [] })).valid).toBe(false);
    expect(validatePromotion(promotion({ discountType: 'fixed_price', discountValue: 301 })).valid).toBe(false);
  });
});
