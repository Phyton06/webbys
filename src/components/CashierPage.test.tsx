import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { createAgendaSeed } from '../data/agenda-demo';
import { createDemoData } from '../data/demo';
import { loadAgendaState, saveAgendaState } from '../services/agenda-store';
import { CashierPage } from './CashierPage';

const now = new Date(2026, 9, 15, 12);

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.history.replaceState({}, '', '/');
});

function seedAssistantState() {
  localStorage.setItem('webbys:demo-session', 'assistant');
  const state = createAgendaSeed(now);
  const appointment = state.appointments[0]!;
  state.appointments = [{ ...appointment, startsAt: now.toISOString(), status: 'completed', paymentStatus: 'pending' }, ...state.appointments.slice(1)];
  state.products = (state.products ?? []).map((product, index) => index === 0 ? { ...product, stock: 4 } : product);
  saveAgendaState(localStorage, state);
  return { state, appointment, product: state.products![0]! };
}

describe('CashierPage', () => {
  it('loads appointment services, adds a product, records payment, and shows its receipt', () => {
    const { state, appointment, product } = seedAssistantState();
    render(<CashierPage now={now} />);

    fireEvent.click(screen.getByRole('button', { name: `Cobrar ${appointment.clientName}` }));
    expect(screen.getByText(appointment.serviceName)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: `Agregar producto ${product.name}` }));
    fireEvent.input(screen.getByLabelText('Monto recibido'), { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cobro' }));

    expect(screen.getByRole('heading', { name: 'Comprobante de venta' })).toBeTruthy();
    const saved = loadAgendaState(localStorage, now).state;
    const generatedSales = createDemoData(now).sales;
    expect(saved.sales).toHaveLength(generatedSales.length + 1);
    expect(saved.sales?.slice(0, generatedSales.length).map(({ id }) => id)).toEqual(generatedSales.map(({ id }) => id));
    expect(saved.sales?.at(-1)?.appointmentId).toBe(appointment.id);
    expect(saved.appointments.find(({ id }) => id === appointment.id)?.paymentStatus).toBe('paid');
    expect(saved.products?.find(({ id }) => id === product.id)?.stock).toBe(product.stock - 1);
    expect(state.appointments[0]?.status).toBe('completed');
  });

  it('supports a product-only quick sale without creating an appointment', () => {
    const { product } = seedAssistantState();
    render(<CashierPage now={now} />);

    fireEvent.click(screen.getByRole('button', { name: 'Venta rápida' }));
    fireEvent.click(screen.getByRole('button', { name: `Agregar producto ${product.name}` }));
    fireEvent.input(screen.getByLabelText('Monto recibido'), { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cobro' }));

    const saved = loadAgendaState(localStorage, now).state;
    expect(saved.sales).toHaveLength(createDemoData(now).sales.length + 1);
    expect(saved.sales?.at(-1)?.appointmentId).toBeUndefined();
    expect(saved.appointments[0]?.paymentStatus).toBe('pending');
    expect(saved.products?.find(({ id }) => id === product.id)?.stock).toBe(product.stock - 1);
  });

  it('shows paid appointments for consultation without offering a second charge', () => {
    const { state, appointment } = seedAssistantState();
    state.appointments[0] = { ...appointment, paymentStatus: 'paid' };
    saveAgendaState(localStorage, state);
    render(<CashierPage now={now} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pagadas · consulta' }));
    expect(screen.getByText(appointment.clientName)).toBeTruthy();
    expect(screen.getByText('Pagada · solo consulta')).toBeTruthy();
    expect(screen.queryByRole('button', { name: `Cobrar ${appointment.clientName}` })).toBeNull();
  });

  it('opens the product-only flow from the quick-sale route', () => {
    const { product } = seedAssistantState();
    window.history.replaceState({}, '', '/cobrar/?quick=1');
    render(<CashierPage now={now} />);

    expect(screen.getByText('Venta de productos sin cita')).toBeTruthy();
    expect(screen.getByRole('button', { name: `Agregar producto ${product.name}` })).toBeTruthy();
  });

  it('opens the same checkout when launched from an appointment detail link', () => {
    const { appointment } = seedAssistantState();
    window.history.replaceState({}, '', `/cobrar/?appointmentId=${appointment.id}`);
    render(<CashierPage now={now} />);

    expect(screen.getByText(`Cita ${appointment.id} · estado de pago: pendiente`)).toBeTruthy();
    expect(screen.getByText(appointment.serviceName)).toBeTruthy();
    expect(screen.queryByRole('button', { name: `Cobrar ${appointment.clientName}` })).toBeNull();
  });
});
