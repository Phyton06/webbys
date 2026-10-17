import {
  PROMOTION_DISCOUNT_TYPE,
  PROMOTION_MANUAL_STATUS,
  PROMOTION_TARGET_KIND,
  type PromotionRecord,
  type PromotionTarget,
} from '../types/agenda';

const PROMOTION_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  FINISHED: 'finished',
  DISABLED: 'disabled',
} as const;

export type PromotionStatus = (typeof PROMOTION_STATUS)[keyof typeof PROMOTION_STATUS];

const PROMOTION_FAILURE = {
  INVALID_RECORD: 'invalid-record',
  INVALID_TARGETS: 'invalid-targets',
  INVALID_ORIGINAL_PRICE: 'invalid-original-price',
  INVALID_DISCOUNT: 'invalid-discount',
  INVALID_DATES: 'invalid-dates',
  INVALID_OPTIONAL_FIELDS: 'invalid-optional-fields',
} as const;

export type PromotionFailure = (typeof PROMOTION_FAILURE)[keyof typeof PROMOTION_FAILURE];

export type PromotionValidation =
  | { valid: true }
  | { valid: false; reason: PromotionFailure };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isPromotionTarget(value: unknown): value is PromotionTarget {
  return isRecord(value)
    && (value.kind === PROMOTION_TARGET_KIND.PRODUCT || value.kind === PROMOTION_TARGET_KIND.SERVICE)
    && typeof value.id === 'string'
    && value.id.trim().length > 0
    && typeof value.name === 'string'
    && value.name.trim().length > 0
    && typeof value.price === 'number'
    && Number.isFinite(value.price)
    && value.price >= 0;
}

export function validatePromotion(value: unknown): PromotionValidation {
  if (!isRecord(value)
    || typeof value.id !== 'string' || value.id.trim().length === 0
    || typeof value.name !== 'string' || value.name.trim().length === 0
    || typeof value.description !== 'string'
    || !Array.isArray(value.targets)
    || (value.discountType !== PROMOTION_DISCOUNT_TYPE.PERCENTAGE && value.discountType !== PROMOTION_DISCOUNT_TYPE.FIXED_PRICE)
    || typeof value.originalPrice !== 'number' || !Number.isFinite(value.originalPrice) || value.originalPrice < 0
    || typeof value.discountValue !== 'number' || !Number.isFinite(value.discountValue)
    || !isDateKey(value.startsOn) || !isDateKey(value.endsOn)
    || (value.manualStatus !== PROMOTION_MANUAL_STATUS.DRAFT
      && value.manualStatus !== PROMOTION_MANUAL_STATUS.PUBLISHED
      && value.manualStatus !== PROMOTION_MANUAL_STATUS.DISABLED)) {
    return { valid: false, reason: PROMOTION_FAILURE.INVALID_RECORD };
  }

  if (value.targets.length === 0 || !value.targets.every(isPromotionTarget)) {
    return { valid: false, reason: PROMOTION_FAILURE.INVALID_TARGETS };
  }

  const targetKeys = value.targets.map((target) => `${target.kind}:${target.id}`);
  if (new Set(targetKeys).size !== targetKeys.length) return { valid: false, reason: PROMOTION_FAILURE.INVALID_TARGETS };

  const targetTotal = Math.round(value.targets.reduce((total, target) => total + target.price, 0) * 100) / 100;
  if (Math.abs(targetTotal - value.originalPrice) > 0.01) {
    return { valid: false, reason: PROMOTION_FAILURE.INVALID_ORIGINAL_PRICE };
  }

  if (value.discountType === PROMOTION_DISCOUNT_TYPE.PERCENTAGE
    ? value.discountValue <= 0 || value.discountValue > 100
    : value.discountValue < 0 || value.discountValue > value.originalPrice) {
    return { valid: false, reason: PROMOTION_FAILURE.INVALID_DISCOUNT };
  }

  if (value.startsOn > value.endsOn) return { valid: false, reason: PROMOTION_FAILURE.INVALID_DATES };

  if ((value.imagePath !== undefined && typeof value.imagePath !== 'string')
    || (value.conditions !== undefined && typeof value.conditions !== 'string')
    || (value.unitLimit !== undefined && (typeof value.unitLimit !== 'number'
      || !Number.isInteger(value.unitLimit) || value.unitLimit < 1))) {
    return { valid: false, reason: PROMOTION_FAILURE.INVALID_OPTIONAL_FIELDS };
  }

  return { valid: true };
}

export function getPromotionPrice(promotion: PromotionRecord): number {
  if (promotion.discountType === PROMOTION_DISCOUNT_TYPE.FIXED_PRICE) return promotion.discountValue;
  return Math.round(promotion.originalPrice * (1 - promotion.discountValue / 100) * 100) / 100;
}

export function getPromotionStatus(promotion: PromotionRecord, today: string): PromotionStatus {
  if (promotion.manualStatus === PROMOTION_MANUAL_STATUS.DRAFT) return PROMOTION_STATUS.DRAFT;
  if (promotion.manualStatus === PROMOTION_MANUAL_STATUS.DISABLED) return PROMOTION_STATUS.DISABLED;
  if (!isDateKey(today) || !isDateKey(promotion.startsOn) || !isDateKey(promotion.endsOn)) return PROMOTION_STATUS.DRAFT;
  if (today < promotion.startsOn) return PROMOTION_STATUS.SCHEDULED;
  if (today <= promotion.endsOn) return PROMOTION_STATUS.ACTIVE;
  return PROMOTION_STATUS.FINISHED;
}
