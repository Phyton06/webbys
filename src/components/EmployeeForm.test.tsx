import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EmployeeRecord } from '../types/agenda';
import { EmployeeForm } from './EmployeeForm';

afterEach(cleanup);

const existingEmployee: EmployeeRecord = {
  id: 'employee-diego',
  name: 'Diego',
  phone: '555-0101',
  role: 'barber',
  active: true,
  invitationStatus: 'completed',
};

function fillRequiredFields(name = 'Ana Torres', phone = '555-0199') {
  fireEvent.input(screen.getByLabelText('Nombre del empleado'), { target: { value: name } });
  fireEvent.input(screen.getByLabelText('Teléfono del empleado'), { target: { value: phone } });
}

describe('EmployeeForm', () => {
  it('creates an active employee with a pending invitation using only name, phone, and role', () => {
    const onSave = vi.fn((_employee: EmployeeRecord) => true);
    render(<EmployeeForm onSave={onSave} onCancel={() => undefined} />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: 'Rol: Barbero' }));
    fireEvent.click(screen.getByRole('option', { name: 'Administrador' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar empleado' }));

    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave.mock.calls[0]?.[0]).toMatchObject({
      name: 'Ana Torres',
      phone: '555-0199',
      role: 'administrator',
      active: true,
      invitationStatus: 'pending',
    });
    expect(screen.getByRole('heading', { name: 'Empleado agregado.' })).toBeTruthy();
    const link = new URL((screen.getByLabelText('Enlace de registro genérico') as HTMLInputElement).value);
    expect(link.pathname).toBe('/registro');
    expect(link.search).toBe('');
    expect(link.toString()).not.toContain(onSave.mock.calls[0]?.[0]?.id);
  });

  it('requires a name and phone before saving', () => {
    const onSave = vi.fn((_employee: EmployeeRecord) => true);
    render(<EmployeeForm onSave={onSave} onCancel={() => undefined} />);

    fireEvent.click(screen.getByRole('button', { name: 'Guardar empleado' }));

    expect(onSave).not.toHaveBeenCalled();
    expect((screen.getByLabelText('Nombre del empleado') as HTMLInputElement).checkValidity()).toBe(false);
    expect((screen.getByLabelText('Teléfono del empleado') as HTMLInputElement).checkValidity()).toBe(false);
  });

  it('rejects whitespace-only values with an actionable message', () => {
    const onSave = vi.fn((_employee: EmployeeRecord) => true);
    render(<EmployeeForm onSave={onSave} onCancel={() => undefined} />);
    fillRequiredFields('   ', '555-0199');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar empleado' }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('nombre y el teléfono');
  });

  it('preserves the employee ID while editing role and invitation status', () => {
    const onSave = vi.fn((_employee: EmployeeRecord) => true);
    render(<EmployeeForm employee={existingEmployee} onSave={onSave} onCancel={() => undefined} />);
    fireEvent.input(screen.getByLabelText('Teléfono del empleado'), { target: { value: '555-0200' } });
    fireEvent.click(screen.getByRole('button', { name: 'Rol: Barbero' }));
    fireEvent.click(screen.getByRole('option', { name: 'Asistente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Estado de registro: Completado' }));
    fireEvent.click(screen.getByRole('option', { name: 'Pendiente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(onSave.mock.calls[0]?.[0]).toMatchObject({
      id: 'employee-diego',
      phone: '555-0200',
      role: 'assistant',
      active: true,
      invitationStatus: 'pending',
    });
  });

  it('keeps the form open and reports a storage failure', () => {
    const onSave = vi.fn((_employee: EmployeeRecord) => false);
    render(<EmployeeForm onSave={onSave} onCancel={() => undefined} />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar empleado' }));

    expect(screen.getByRole('heading', { name: 'Nuevo empleado' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('No se pudo guardar');
  });
});
