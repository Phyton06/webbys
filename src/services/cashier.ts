import type { AgendaState, PromotionRecord, PromotionTarget } from '../types/agenda';
import type { SaleItem, SalePaymentMethod, SaleRecord } from '../types/domain';
import { createDemoData } from '../data/demo';
import { loadAgendaState, saveAgendaState } from './agenda-store';
import { getPromotionPrice, getPromotionStatus, getPromotionTargetPrice } from './promotions';
import { validateBooking } from './availability';

export interface CashierSaleRequest {
  idempotencyKey: string;
  appointmentId?: string;
  items: SaleItem[];
  promotionId?: string;
  paymentMethod: SalePaymentMethod;
  cashReceived?: number;
  clientId?: string;
  clientName?: string;
}

export type CashierSaleFailure =
  | 'invalid-items'
  | 'invalid-payment'
  | 'insufficient-payment'
  | 'insufficient-inventory'
  | 'invalid-appointment'
  | 'appointment-cancelled'
  | 'appointment-already-paid'
  | 'missing-appointment-services'
  | 'quick-sale-products-only'
  | 'service-unavailable'
  | 'invalid-promotion'
  | 'storage-unavailable';

export type CashierSaleResult =
  | { ok: true; sale: SaleRecord; duplicate?: true }
  | { ok: false; reason: CashierSaleFailure };

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function localDateKey(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getSalesRecords(state: AgendaState, now: Date): SaleRecord[] {
  return state.sales ?? createDemoData(now).sales;
}

function targetForItem(promotion: PromotionRecord, item: SaleItem): PromotionTarget | undefined {
  if (!item.catalogItemId || !item.kind) return undefined;
  const kind = item.kind === 'product' ? 'product' : 'service';
  return promotion.targets.find((target) => target.kind === kind && target.id === item.catalogItemId);
}

export function getEligibleAppointments(state: AgendaState, now: Date): AgendaState['appointments'] {
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return state.appointments
    .filter(({ status, paymentStatus }) => status !== 'cancelled' && paymentStatus !== 'paid')
    .sort((first, second) => {
      const firstTime = new Date(first.startsAt).getTime();
      const secondTime = new Date(second.startsAt).getTime();
      const firstIsToday = localDateKey(first.startsAt) === today;
      const secondIsToday = localDateKey(second.startsAt) === today;
      return Number(secondIsToday) - Number(firstIsToday) || firstTime - secondTime;
    });
}

export function calculateCashierTotals(
  items: SaleItem[],
  promotion: PromotionRecord | undefined,
  today: string,
): { grossTotal: number; discountTotal: number; netTotal: number } {
  const grossTotal = roundMoney(items.reduce((total, item) => total + item.quantity * item.unitPrice, 0));
  if (!promotion || getPromotionStatus(promotion, today) !== 'active') {
    return { grossTotal, discountTotal: 0, netTotal: grossTotal };
  }

  let discountTotal = 0;
  if ((promotion.mode ?? 'bundle') === 'product_discount') {
    for (const item of items) {
      const target = targetForItem(promotion, item);
      if (target) {
        discountTotal += Math.max(0, item.unitPrice - getPromotionTargetPrice(promotion, target)) * item.quantity;
      }
    }
  } else {
    const matchingItems = promotion.targets.map((target) => items.find((item) => (
      item.kind === (target.kind === 'product' ? 'product' : 'service') && item.catalogItemId === target.id
    )));
    if (matchingItems.every((item) => item !== undefined)) {
      const bundleGross = roundMoney(matchingItems.reduce((total, item) => total + (item?.unitPrice ?? 0), 0));
      const bundlePrice = getPromotionPrice(promotion);
      discountTotal = Math.max(0, bundleGross - Math.min(bundleGross, bundlePrice));
    }
  }

  discountTotal = roundMoney(Math.min(grossTotal, discountTotal));
  return { grossTotal, discountTotal, netTotal: roundMoney(grossTotal - discountTotal) };
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function resolveSaleItems(state: AgendaState, requested: SaleItem[], appointmentId: string | undefined, now: Date): SaleItem[] | CashierSaleFailure {
  if (!Array.isArray(requested) || requested.length === 0) return 'invalid-items';
  const appointment = appointmentId ? state.appointments.find(({ id }) => id === appointmentId) : undefined;
  if (appointmentId && !appointment) return 'invalid-appointment';
  if (!appointment && requested.some(({ kind }) => kind !== 'product')) return 'quick-sale-products-only';
  if (appointment && !appointment.serviceIds.every((id) => requested.some((item) => item.kind === 'service' && item.catalogItemId === id))) {
    return 'missing-appointment-services';
  }

  const resolved: SaleItem[] = [];
  for (const item of requested) {
    if (!item.catalogItemId || !Number.isInteger(item.quantity) || item.quantity <= 0) return 'invalid-items';
    if (item.kind === 'product') {
      const product = state.products?.find(({ id }) => id === item.catalogItemId);
      if (!product || !product.active) return 'invalid-items';
      resolved.push({ kind: 'product', catalogItemId: product.id, name: product.name, quantity: item.quantity, unitPrice: product.salePrice });
    } else if (item.kind === 'service') {
      const service = state.services.find(({ id }) => id === item.catalogItemId);
      const wasBooked = appointment?.serviceIds.includes(item.catalogItemId) ?? false;
      if (!service || (service.active === false && !wasBooked)) return 'invalid-items';
      const barberId = item.barberId ?? appointment?.barberId;
      const barber = state.barbers.find(({ id }) => id === barberId);
      if (!barber) return 'invalid-items';
      if (!wasBooked && item.servicePerformed === false && appointment) {
        const startsAt = new Date(appointment.startsAt);
        startsAt.setMinutes(startsAt.getMinutes() + appointment.durationMinutes);
        const availability = validateBooking({
          id: appointment.id,
          barberId: barber.id,
          startsAt: startsAt.toISOString(),
          durationMinutes: service.durationMinutes,
        }, state.schedules, state.exceptions, state.appointments, now);
        if (!availability.valid) return 'service-unavailable';
      }
      resolved.push({
        kind: 'service', catalogItemId: service.id, name: service.name,
        quantity: item.quantity, unitPrice: service.price,
        barberId: barber.id, barberName: barber.name,
        ...(item.servicePerformed === undefined ? {} : { servicePerformed: item.servicePerformed }),
      });
    } else {
      return 'invalid-items';
    }
  }

  const productQuantities = new Map<string, number>();
  for (const item of resolved) {
    if (item.kind === 'product' && item.catalogItemId) {
      productQuantities.set(item.catalogItemId, (productQuantities.get(item.catalogItemId) ?? 0) + item.quantity);
    }
  }
  for (const [id, quantity] of productQuantities) {
    const product = state.products?.find(({ id: productId }) => productId === id);
    if (!product || product.stock < quantity) return 'insufficient-inventory';
  }
  return resolved;
}

export function commitCashierSale(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  request: CashierSaleRequest,
  now: Date,
): CashierSaleResult {
  if (!request.idempotencyKey.trim()) return { ok: false, reason: 'invalid-items' };
  let state: AgendaState;
  try {
    const loaded = loadAgendaState(storage, now);
    if (loaded.status === 'invalid') return { ok: false, reason: 'storage-unavailable' };
    state = loaded.state;
  } catch {
    return { ok: false, reason: 'storage-unavailable' };
  }

  const previousSale = state.sales?.find(({ idempotencyKey }) => idempotencyKey === request.idempotencyKey);
  if (previousSale) return { ok: true, sale: previousSale, duplicate: true };

  const appointment = request.appointmentId
    ? state.appointments.find(({ id }) => id === request.appointmentId)
    : undefined;
  if (request.appointmentId && !appointment) return { ok: false, reason: 'invalid-appointment' };
  if (appointment?.status === 'cancelled') return { ok: false, reason: 'appointment-cancelled' };
  if (appointment?.paymentStatus === 'paid') return { ok: false, reason: 'appointment-already-paid' };
  if (request.paymentMethod !== 'cash' && request.paymentMethod !== 'card' && request.paymentMethod !== 'transfer') {
    return { ok: false, reason: 'invalid-payment' };
  }

  const items = resolveSaleItems(state, request.items, request.appointmentId, now);
  if (typeof items === 'string') return { ok: false, reason: items };
  const promotion = request.promotionId ? state.promotions?.find(({ id }) => id === request.promotionId) : undefined;
  if (request.promotionId && (!promotion || getPromotionStatus(promotion, dateKey(now)) !== 'active')) {
    return { ok: false, reason: 'invalid-promotion' };
  }
  const totals = calculateCashierTotals(items, promotion, dateKey(now));
  if (promotion && totals.discountTotal === 0) return { ok: false, reason: 'invalid-promotion' };
  if (request.paymentMethod === 'cash'
    && (typeof request.cashReceived !== 'number' || !Number.isFinite(request.cashReceived)
      || request.cashReceived < totals.netTotal)) {
    return { ok: false, reason: 'insufficient-payment' };
  }

  const employee = state.employees?.find(({ role, active }) => role === 'assistant' && active);
  const sale: SaleRecord = {
    id: `sale-${crypto.randomUUID()}`,
    idempotencyKey: request.idempotencyKey,
    occurredAt: now.toISOString(),
    items,
    ...(appointment ? {
      appointmentId: appointment.id,
      clientId: appointment.clientId,
      clientName: appointment.clientName,
      barberName: appointment.barberName,
    } : request.clientId ? {
      clientId: request.clientId,
      clientName: state.clients.find(({ id }) => id === request.clientId)?.name ?? request.clientName ?? 'Cliente',
    } : request.clientName ? { clientName: request.clientName } : {}),
    employeeId: employee?.id ?? 'assistant-demo',
    employeeName: employee?.name ?? 'Asistente',
    paymentMethod: request.paymentMethod,
    status: 'completed',
    ...(promotion ? { promotionId: promotion.id, promotionName: promotion.name } : {}),
    ...(request.paymentMethod === 'cash' ? {
      cashReceived: request.cashReceived,
      changeDue: roundMoney((request.cashReceived ?? 0) - totals.netTotal),
    } : {}),
    ...totals,
  };

  const productQuantities = new Map<string, number>();
  for (const item of items) {
    if (item.kind === 'product' && item.catalogItemId) {
      productQuantities.set(item.catalogItemId, (productQuantities.get(item.catalogItemId) ?? 0) + item.quantity);
    }
  }
  const products = (state.products ?? []).map((product) => ({
    ...product,
    stock: product.stock - (productQuantities.get(product.id) ?? 0),
  }));
  const appointments = state.appointments.map((current) => current.id === appointment?.id
    ? { ...current, paymentStatus: 'paid' as const }
    : current);
  try {
    saveAgendaState(storage, {
      ...state,
      products,
      appointments,
      sales: [...(state.sales ?? createDemoData(now).sales), sale],
    });
  } catch {
    return { ok: false, reason: 'storage-unavailable' };
  }
  return { ok: true, sale };
}
