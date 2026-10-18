import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAgendaSeed } from '../data/agenda-demo';
import { loadAgendaState, saveAgendaState } from '../services/agenda-store';
import { ClientsPage } from './ClientsPage';

const now = new Date(2026, 9, 15, 8, 0);

afterEach(() => {
  cleanup();
  localStorage.clear();
});

beforeEach(() => {
  vi.setSystemTime(now);
  localStorage.setItem('webbys:demo-session', 'active');
});

describe('ClientsPage', () => {
  it('lists clients and finds them by name, phone, or email', () => {
    const state = createAgendaSeed(now);
    const firstClient = state.clients[0];
    if (!firstClient) throw new Error('Expected a seeded client');
    state.clients = state.clients.map((client) => client.id === firstClient.id ? { ...client, email: 'lucia@example.com' } : client);
    saveAgendaState(localStorage, state);
    render(<ClientsPage />);

    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ver perfil de Lucía Torres' })).toBeTruthy();

    const search = screen.getByRole('searchbox', { name: 'Buscar clientes' });
    for (const query of ['Lucía', '555-0100', 'lucia@example.com']) {
      fireEvent.input(search, { target: { value: query } });
      expect(screen.getByRole('button', { name: 'Ver perfil de Lucía Torres' })).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Ver perfil de Mateo Cruz' })).toBeNull();
    }
  });

  it('filters and sorts clients using accessible controls', () => {
    const state = createAgendaSeed(now);
    const inactiveClient = state.clients[0];
    if (!inactiveClient) throw new Error('Expected a seeded client');
    state.clients = state.clients.map((client) => client.id === inactiveClient.id ? { ...client, active: false } : client);
    saveAgendaState(localStorage, state);
    render(<ClientsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Estado: Todos' }));
    fireEvent.click(screen.getByRole('option', { name: 'Inactivos' }));
    expect(screen.getByRole('button', { name: 'Ver perfil de Lucía Torres' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Ver perfil de Mateo Cruz' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Estado: Inactivos' }));
    fireEvent.click(screen.getByRole('option', { name: 'Todos' }));
    fireEvent.click(screen.getByRole('button', { name: 'Orden: Nombre A-Z' }));
    fireEvent.click(screen.getByRole('option', { name: 'Nombre Z-A' }));
    const rows = screen.getAllByRole('button', { name: /Ver perfil de/ });
    const expectedNames = state.clients.map(({ name }) => name).sort((first, second) => second.localeCompare(first, 'es', { sensitivity: 'base' }));
    expect(rows.map((row) => row.getAttribute('aria-label'))).toEqual(expectedNames.map((name) => `Ver perfil de ${name}`));
  });

  it('creates a client with required name and phone and the fixed registration link', async () => {
    saveAgendaState(localStorage, createAgendaSeed(now));
    render(<ClientsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Nuevo cliente' }));
    const dialog = screen.getByRole('dialog', { name: 'Nuevo cliente' });
    fireEvent.input(within(dialog).getByLabelText('Nombre del cliente'), { target: { value: 'Nueva Persona' } });
    fireEvent.input(within(dialog).getByLabelText('Teléfono del cliente'), { target: { value: '555-0199' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar cliente' }));

    await waitFor(() => expect(screen.getByLabelText('Enlace de registro genérico')).toBeTruthy());
    expect((screen.getByLabelText('Enlace de registro genérico') as HTMLInputElement).value).toBe(`${window.location.origin}/registro`);
    expect(loadAgendaState(localStorage, now).state.clients.some(({ name, phone }) => name === 'Nueva Persona' && phone === '555-0199')).toBe(true);
  });

  it('edits contact details without changing client identity or appointment references', () => {
    const state = createAgendaSeed(now);
    const originalClient = state.clients[0];
    if (!originalClient) throw new Error('Expected a seeded client');
    saveAgendaState(localStorage, state);
    render(<ClientsPage />);
    fireEvent.click(screen.getByRole('button', { name: `Editar cliente ${originalClient.name}` }));
    fireEvent.input(screen.getByLabelText('Teléfono del cliente'), { target: { value: '555-0198' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    const saved = loadAgendaState(localStorage, now).state;
    expect(saved.clients[0]).toMatchObject({ id: originalClient.id, name: originalClient.name, phone: '555-0198' });
    expect(saved.appointments).toEqual(state.appointments);
  });

  it('requires confirmation to deactivate a client and preserves appointments when reactivating', () => {
    const state = createAgendaSeed(now);
    const client = state.clients[0];
    if (!client) throw new Error('Expected a seeded client');
    saveAgendaState(localStorage, state);
    render(<ClientsPage />);
    fireEvent.click(screen.getByRole('button', { name: `Desactivar cliente ${client.name}` }));
    expect(screen.getByRole('alertdialog', { name: `Confirmar desactivación de ${client.name}` })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar desactivación' }));

    let saved = loadAgendaState(localStorage, now).state;
    expect(saved.clients.find(({ id }) => id === client.id)?.active).toBe(false);
    expect(saved.appointments).toEqual(state.appointments);

    fireEvent.click(screen.getByRole('button', { name: `Reactivar cliente ${client.name}` }));
    saved = loadAgendaState(localStorage, now).state;
    expect(saved.clients.find(({ id }) => id === client.id)?.active).toBe(true);
    expect(saved.appointments).toEqual(state.appointments);
  });

  it('offers the shared appointment checkout from an assistant client profile', () => {
    const state = createAgendaSeed(now);
    const client = state.clients[0]!;
    const appointment = state.appointments.find(({ clientId }) => clientId === client.id)!;
    state.appointments = state.appointments.map((current) => current.id === appointment.id
      ? { ...current, paymentStatus: 'pending' }
      : current);
    saveAgendaState(localStorage, state);
    localStorage.setItem('webbys:demo-session', 'assistant');
    render(<ClientsPage />);

    fireEvent.click(screen.getByRole('button', { name: `Ver perfil de ${client.name}` }));
    expect(screen.getByText('Pendiente de cobro')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Cobrar cita' }).getAttribute('href')).toBe(`/cobrar/?appointmentId=${appointment.id}`);
  });

  it('shows shared sales linked to the client in purchase history', () => {
    const state = createAgendaSeed(now);
    const client = state.clients[0]!;
    state.sales = [{
      id: 'sale-client-history', occurredAt: now.toISOString(), clientId: client.id, clientName: client.name,
      items: [{ kind: 'product', catalogItemId: 'product-shampoo', name: 'Shampoo', quantity: 1, unitPrice: 160 }],
      paymentMethod: 'card', status: 'completed', grossTotal: 160, discountTotal: 0, netTotal: 160,
    }];
    saveAgendaState(localStorage, state);
    expect(loadAgendaState(localStorage, now).state.sales).toHaveLength(1);
    render(<ClientsPage />);

    fireEvent.click(screen.getByRole('button', { name: `Ver perfil de ${client.name}` }));
    expect(screen.getByText('Folio sale-client-history')).toBeTruthy();
    expect(screen.getByText('1 × Shampoo')).toBeTruthy();
    expect(screen.getByText('$160.00')).toBeTruthy();
  });

  it('starts a new appointment from the assistant client profile with that client selected', () => {
    const state = createAgendaSeed(now);
    const client = state.clients[0]!;
    saveAgendaState(localStorage, state);
    localStorage.setItem('webbys:demo-session', 'assistant');
    render(<ClientsPage />);

    fireEvent.click(screen.getByRole('button', { name: `Ver perfil de ${client.name}` }));
    expect(screen.getByRole('link', { name: 'Agendar cita' }).getAttribute('href')).toBe(`/agenda/?clientId=${client.id}`);
  });

  it('opens the selected client profile and shows appointment and purchase history states', () => {
    saveAgendaState(localStorage, createAgendaSeed(now));
    render(<ClientsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver perfil de Lucía Torres' }));

    expect(screen.getByRole('heading', { name: 'Lucía Torres' })).toBeTruthy();
    expect(within(screen.getByRole('region', { name: 'Historial de citas' })).getAllByRole('listitem').length).toBeGreaterThan(0);
    expect(screen.getByRole('region', { name: 'Historial de compras' })).toBeTruthy();
    expect(screen.getByText('Este cliente aún no tiene compras registradas.')).toBeTruthy();
  });

  it('shows only the selected client appointments in chronological order', () => {
    const state = createAgendaSeed(now);
    const client = state.clients[0];
    const otherClient = state.clients[1];
    const originalAppointment = state.appointments.find(({ clientId }) => clientId === client?.id);
    if (!client || !otherClient || !originalAppointment) throw new Error('Expected seeded clients and appointments');
    state.appointments = [
      { ...originalAppointment, id: 'client-history-later', startsAt: new Date(2026, 9, 17, 12).toISOString() },
      { ...originalAppointment, id: 'other-client-history', clientId: otherClient.id, clientName: otherClient.name },
      { ...originalAppointment, id: 'client-history-earlier', startsAt: new Date(2026, 9, 15, 9).toISOString() },
    ];
    saveAgendaState(localStorage, state);
    render(<ClientsPage />);
    fireEvent.click(screen.getByRole('button', { name: `Ver perfil de ${client.name}` }));

    const history = within(screen.getByRole('region', { name: 'Historial de citas' })).getAllByRole('listitem');
    expect(history.map((item) => item.querySelector('time')?.getAttribute('datetime'))).toEqual([
      new Date(2026, 9, 15, 9).toISOString(),
      new Date(2026, 9, 17, 12).toISOString(),
    ]);
  });

  it('replaces the directory header with the selected client profile header', () => {
    saveAgendaState(localStorage, createAgendaSeed(now));
    render(<ClientsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver perfil de Lucía Torres' }));

    expect(screen.queryByRole('heading', { name: 'Clientes' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Nuevo cliente' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Lucía Torres' })).toBeTruthy();
  });
});
