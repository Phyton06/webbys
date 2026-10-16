import { cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAgendaSeed } from '../data/agenda-demo';
import { AGENDA_STORAGE_KEY, loadAgendaState, saveAgendaState } from '../services/agenda-store';
import type { EmployeeRecord } from '../types/agenda';
import { EmployeesPage } from './EmployeesPage';

const now = new Date(2026, 9, 15, 8, 0);

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

function renderEmployeesPage(state = createAgendaSeed(now)) {
  localStorage.setItem('webbys:demo-session', 'active');
  saveAgendaState(localStorage, state);
  return render(<EmployeesPage now={now} />);
}

function adminEmployee(id: string, name: string): EmployeeRecord {
  return {
    id,
    name,
    phone: '555-0200',
    role: 'administrator',
    active: true,
    invitationStatus: 'completed',
  };
}

describe('EmployeesPage', () => {
  it('searches by name and filters employees by role and activation', () => {
    const state = createAgendaSeed(now);
    state.employees = (state.employees ?? []).map((employee) => employee.id === 'barber-1'
      ? { ...employee, phone: '555-0101' }
      : employee);
    state.employees.push({
      id: 'employee-ana',
      name: 'Ana Torres',
      phone: '555-0199',
      role: 'assistant',
      active: false,
      invitationStatus: 'pending',
    });
    renderEmployeesPage(state);
    fireEvent.input(screen.getByLabelText('Buscar empleados'), { target: { value: '555-0101' } });

    expect(screen.getByRole('article', { name: 'Empleado Diego' })).toBeTruthy();
    expect(screen.queryByRole('article', { name: 'Empleado Raúl' })).toBeNull();

    fireEvent.input(screen.getByLabelText('Buscar empleados'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Orden: Nombre A-Z' }));
    fireEvent.click(screen.getByRole('option', { name: 'Nombre Z-A' }));
    expect(screen.getAllByRole('article').map((article) => article.getAttribute('aria-label'))).toEqual([
      'Empleado Raúl', 'Empleado Diego', 'Empleado Andrés', 'Empleado Ana Torres',
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Rol: Todos' }));
    fireEvent.click(screen.getByRole('option', { name: 'Asistentes' }));

    expect(screen.getByRole('article', { name: 'Empleado Ana Torres' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Estado: Todos' }));
    fireEvent.click(screen.getByRole('option', { name: 'Activos' }));
    expect(screen.getByText('No hay empleados que coincidan con estos filtros.')).toBeTruthy();
  });

  it('shows only the selected barber profile appointment history and availability', () => {
    const state = createAgendaSeed(now);
    const linked = state.appointments.filter(({ barberId }) => barberId === 'barber-1');
    const unlinked = state.appointments.filter(({ barberId }) => barberId !== 'barber-1');
    renderEmployeesPage(state);
    fireEvent.click(screen.getByRole('button', { name: 'Ver perfil de Diego' }));

    const history = screen.getByRole('region', { name: 'Historial de citas' });
    expect(within(history).getByText(String(linked.length))).toBeTruthy();
    for (const appointment of linked) expect(within(history).getByText(new RegExp(appointment.clientName))).toBeTruthy();
    for (const appointment of unlinked) expect(within(history).queryByText(new RegExp(appointment.clientName))).toBeNull();
    const availability = screen.getByRole('region', { name: 'Disponibilidad de Diego' });
    expect(availability).toBeTruthy();
    expect(within(availability).getAllByText('09:00–18:00').length).toBeGreaterThan(0);
  });

  it('returns the profile to the top of the scrollable content area', () => {
    renderEmployeesPage();
    const workspace = document.querySelector('.admin-workspace');
    if (!(workspace instanceof HTMLElement)) throw new Error('Expected the admin workspace');
    workspace.scrollTop = 420;

    fireEvent.click(screen.getByRole('button', { name: 'Ver perfil de Raúl' }));

    expect(workspace.scrollTop).toBe(0);
  });

  it('shows date-specific availability exceptions in the barber profile', () => {
    renderEmployeesPage();
    fireEvent.click(screen.getByRole('button', { name: 'Ver perfil de Raúl' }));

    const availability = screen.getByRole('region', { name: 'Disponibilidad de Raúl' });
    expect(within(availability).getByText('2026-10-17')).toBeTruthy();
    expect(within(availability).getByText('Día libre')).toBeTruthy();
  });

  it('creates an employee and persists its identity, role, active state, and pending invitation', async () => {
    renderEmployeesPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo empleado' }));
    fireEvent.input(screen.getByLabelText('Nombre del empleado'), { target: { value: 'Ana Torres' } });
    fireEvent.input(screen.getByLabelText('Teléfono del empleado'), { target: { value: '555-0199' } });
    fireEvent.click(screen.getByRole('button', { name: 'Rol: Barbero' }));
    fireEvent.click(screen.getByRole('option', { name: 'Asistente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar empleado' }));

    expect(await screen.findByRole('heading', { name: 'Empleado agregado.' })).toBeTruthy();
    const saved = loadAgendaState(localStorage, now).state;
    const created = saved.employees?.find(({ name }) => name === 'Ana Torres');
    expect(created).toMatchObject({
      name: 'Ana Torres',
      phone: '555-0199',
      role: 'assistant',
      active: true,
      invitationStatus: 'pending',
    });
    const link = new URL((screen.getByLabelText('Enlace de registro genérico') as HTMLInputElement).value);
    expect(link.pathname).toBe('/registro');
    expect(link.search).toBe('');
    expect(link.toString()).not.toContain(created?.id);
  });

  it('prevents deactivation of the last active Administrator', () => {
    const state = createAgendaSeed(now);
    state.employees = [...(state.employees ?? []), adminEmployee('admin-one', 'Marta')];
    renderEmployeesPage(state);

    const deactivate = screen.getByRole('button', { name: 'Desactivar empleado Marta' });
    expect(deactivate.hasAttribute('disabled')).toBe(true);
    expect(screen.getByText('Debe permanecer al menos un administrador activo.')).toBeTruthy();
    expect(loadAgendaState(localStorage, now).state.employees?.find(({ id }) => id === 'admin-one')?.active).toBe(true);
  });

  it('prevents changing the role of the last active Administrator in the edit form', () => {
    const state = createAgendaSeed(now);
    state.employees = [...(state.employees ?? []), adminEmployee('admin-one', 'Marta')];
    renderEmployeesPage(state);
    fireEvent.click(screen.getByRole('button', { name: 'Editar empleado Marta' }));

    expect(screen.queryByRole('button', { name: 'Rol: Administrador' })).toBeNull();
    expect(screen.getByText('El rol no se puede cambiar mientras sea el último administrador activo.')).toBeTruthy();
  });

  it('deactivates and reactivates an Administrator only when another active Administrator remains', () => {
    const state = createAgendaSeed(now);
    state.employees = [...(state.employees ?? []), adminEmployee('admin-one', 'Marta'), adminEmployee('admin-two', 'Lucía')];
    renderEmployeesPage(state);

    fireEvent.click(screen.getByRole('button', { name: 'Desactivar empleado Marta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar desactivación' }));
    expect(loadAgendaState(localStorage, now).state.employees?.find(({ id }) => id === 'admin-one')?.active).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Reactivar empleado Marta' }));
    expect(loadAgendaState(localStorage, now).state.employees?.find(({ id }) => id === 'admin-one')?.active).toBe(true);
  });

  it('saves a manually updated invitation status without changing the employee ID', async () => {
    renderEmployeesPage();
    fireEvent.click(screen.getByRole('button', { name: 'Editar empleado Diego' }));
    fireEvent.input(screen.getByLabelText('Teléfono del empleado'), { target: { value: '555-0101' } });
    fireEvent.click(screen.getByRole('button', { name: 'Estado de registro: Completado' }));
    fireEvent.click(screen.getByRole('option', { name: 'Pendiente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findAllByText('Cambios del empleado guardados.')).toHaveLength(1);
    const updated = loadAgendaState(localStorage, now).state.employees?.find(({ id }) => id === 'barber-1');
    expect(updated).toMatchObject({ id: 'barber-1', invitationStatus: 'pending' });
  });

  it('keeps the form open and preserves employee state when storage rejects a save', async () => {
    renderEmployeesPage();
    const before = loadAgendaState(localStorage, now).state.employees;
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      if (key === AGENDA_STORAGE_KEY) throw new Error('Storage unavailable');
      return originalSetItem.call(localStorage, key, value);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Nuevo empleado' }));
    fireEvent.input(screen.getByLabelText('Nombre del empleado'), { target: { value: 'Ana Torres' } });
    fireEvent.input(screen.getByLabelText('Teléfono del empleado'), { target: { value: '555-0199' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar empleado' }));

    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo guardar el empleado');
    expect(screen.getByRole('heading', { name: 'Nuevo empleado' })).toBeTruthy();
    expect(loadAgendaState(localStorage, now).state.employees).toEqual(before);
  });
});
