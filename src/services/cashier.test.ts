import { describe, expect, it } from 'vitest';
import { createAgendaSeed } from '../data/agenda-demo';
import { loadAgendaState, saveAgendaState } from './agenda-store';
import { calculateCashierTotals, commitCashierSale, getEligibleAppointments } from './cashier';
import type { AgendaState, PromotionRecord } from '../types/agenda';
import type { SaleItem } from '../types/domain';

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

const now = new Date(2026, 9, 15, 12);

function stateWithAppointments(): AgendaState {
  const seed = createAgendaSeed(now);
  const appointments = seed.appointments.slice(0, 3).map((appointment, index) => ({
    ...appointment,
    status: index === 1 ? 'cancelled' as const : 'completed' as const,
    paymentStatus: index === 2 ? 'paid' as const : 'pending' as const,
  }));
  return { ...seed, appointments, sales: [] } as AgendaState;
}

describe('getEligibleAppointments', () => {
  it('keeps attention status separate and excludes cancelled or already-paid appointments', () => {
    const state = stateWithAppointments();
    const eligible = getEligibleAppointments(state, now);

    expect(eligible.map(({ id }) => id)).toEqual([state.appointments[0]?.id]);
    expect(eligible[0]?.status).toBe('completed');
    expect(eligible[0]?.paymentStatus).toBe('pending');
  });
});

describe('calculateCashierTotals', () => {
  it('applies a current promotion to matching sale items and ignores expired promotions', () => {
    const item: SaleItem = { kind: 'product', catalogItemId: 'product-shampoo', name: 'Shampoo', quantity: 1, unitPrice: 200 };
    const promotion: PromotionRecord = {
      id: 'promo', name: 'Oferta', description: '', mode: 'product_discount',
      targets: [{ kind: 'product', id: 'product-shampoo', name: 'Shampoo', price: 200 }],
      discountType: 'percentage', originalPrice: 200, discountValue: 20,
      startsOn: '2026-10-01', endsOn: '2026-10-30', manualStatus: 'published',
    };

    expect(calculateCashierTotals([item], promotion, '2026-10-15')).toEqual({ grossTotal: 200, discountTotal: 40, netTotal: 160 });
    expect(calculateCashierTotals([item], { ...promotion, endsOn: '2026-10-14' }, '2026-10-15')).toEqual({ grossTotal: 200, discountTotal: 0, netTotal: 200 });
  });
});

describe('commitCashierSale', () => {
  it('updates shared sales, inventory, and appointment payment once in one save', () => {
    const storage = createMemoryStorage();
    const state = stateWithAppointments();
    const appointment = state.appointments[0]!;
    const product = state.products![0]!;
    product.stock = 5;
    saveAgendaState(storage, state);
    expect(loadAgendaState(storage, now).status).toBe('loaded');
    const items: SaleItem[] = [
      ...appointment.serviceIds.map((id) => {
        const service = state.services.find((entry) => entry.id === id)!;
        return { kind: 'service' as const, catalogItemId: id, name: service.name, quantity: 1, unitPrice: service.price };
      }),
      { kind: 'product' as const, catalogItemId: product.id, name: product.name, quantity: 2, unitPrice: product.salePrice },
    ];
    const request = { appointmentId: appointment.id, items, paymentMethod: 'cash' as const, cashReceived: 1000, idempotencyKey: 'checkout-once' };

    const first = commitCashierSale(storage, request, now);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.sale.changeDue).toBe(1000 - first.sale.netTotal);
    const saved = loadAgendaState(storage, now).state;
    expect(saved.products?.find(({ id }) => id === product.id)?.stock).toBe(3);
    expect(saved.appointments.find(({ id }) => id === appointment.id)?.paymentStatus).toBe('paid');
    expect(saved.sales).toHaveLength(1);

    const bytesBeforeDuplicate = storage.getItem('webbys:agenda:v1');
    const duplicate = commitCashierSale(storage, request, now);
    expect(duplicate).toMatchObject({ ok: true, duplicate: true, sale: { id: first.sale.id } });
    expect(storage.getItem('webbys:agenda:v1')).toBe(bytesBeforeDuplicate);
  });

  it('rejects an insufficient cash payment without changing stored data', () => {
    const storage = createMemoryStorage();
    const state = stateWithAppointments();
    const appointment = state.appointments[0]!;
    saveAgendaState(storage, state);
    const bytesBefore = storage.getItem('webbys:agenda:v1');
    const items = appointment.serviceIds.map((id) => {
      const service = state.services.find((entry) => entry.id === id)!;
      return { kind: 'service' as const, catalogItemId: id, name: service.name, quantity: 1, unitPrice: service.price };
    });

    expect(commitCashierSale(storage, {
      appointmentId: appointment.id, items, paymentMethod: 'cash', cashReceived: 1, idempotencyKey: 'short-cash',
    }, now)).toMatchObject({ ok: false, reason: 'insufficient-payment' });
    expect(storage.getItem('webbys:agenda:v1')).toBe(bytesBefore);
  });

  it('rejects insufficient inventory without changing stored data', () => {
    const storage = createMemoryStorage();
    const state = stateWithAppointments();
    const appointment = state.appointments[0]!;
    const product = state.products![0]!;
    product.stock = 1;
    saveAgendaState(storage, state);
    const bytesBefore = storage.getItem('webbys:agenda:v1');
    const items: SaleItem[] = [
      ...appointment.serviceIds.map((id) => {
        const service = state.services.find((entry) => entry.id === id)!;
        return { kind: 'service' as const, catalogItemId: id, name: service.name, quantity: 1, unitPrice: service.price };
      }),
      { kind: 'product' as const, catalogItemId: product.id, name: product.name, quantity: 2, unitPrice: product.salePrice },
    ];

    expect(commitCashierSale(storage, {
      appointmentId: appointment.id, items, paymentMethod: 'card', idempotencyKey: 'not-enough-stock',
    }, now)).toMatchObject({ ok: false, reason: 'insufficient-inventory' });
    expect(storage.getItem('webbys:agenda:v1')).toBe(bytesBefore);
  });

  it('does not overwrite unreadable shared data when checkout is attempted', () => {
    const storage = createMemoryStorage();
    storage.setItem('webbys:agenda:v1', '{invalid');
    const bytesBefore = storage.getItem('webbys:agenda:v1');

    expect(commitCashierSale(storage, {
      items: [{ kind: 'product' as const, catalogItemId: 'product-shampoo', name: 'Shampoo', quantity: 1, unitPrice: 160 }],
      paymentMethod: 'card', idempotencyKey: 'invalid-store',
    }, now)).toMatchObject({ ok: false, reason: 'storage-unavailable' });
    expect(storage.getItem('webbys:agenda:v1')).toBe(bytesBefore);
  });

  it('checks the chosen barber schedule when an added service is still to be performed', () => {
    const storage = createMemoryStorage();
    const state = stateWithAppointments();
    const appointment = state.appointments[0]!;
    const additionalService = state.services.find(({ id }) => !appointment.serviceIds.includes(id))!;
    state.schedules = state.schedules.map((schedule) => schedule.barberId === appointment.barberId
      ? { ...schedule, days: schedule.days.map((day) => day.weekday === now.getDay()
        ? { ...day, working: [{ start: '09:00', end: '12:30' }], breaks: [] }
        : day) }
      : schedule);
    saveAgendaState(storage, state);
    const items: SaleItem[] = [
      ...appointment.serviceIds.map((id) => {
        const service = state.services.find((entry) => entry.id === id)!;
        return { kind: 'service' as const, catalogItemId: id, name: service.name, quantity: 1, unitPrice: service.price };
      }),
      { kind: 'service' as const, catalogItemId: additionalService.id, name: additionalService.name, quantity: 1, unitPrice: additionalService.price, barberId: appointment.barberId, servicePerformed: false },
    ];

    expect(commitCashierSale(storage, {
      appointmentId: appointment.id, items, paymentMethod: 'card', idempotencyKey: 'service-schedule-check',
    }, now)).toMatchObject({ ok: false, reason: 'service-unavailable' });
  });
});
