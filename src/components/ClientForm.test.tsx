import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ClientRecord } from '../types/agenda';
import { ClientForm } from './ClientForm';

afterEach(cleanup);

describe('ClientForm', () => {
  it('creates a client with name and phone and offers the fixed generic link', async () => {
    const onSave = vi.fn((_client: ClientRecord) => true);
    render(<ClientForm onSave={onSave} onCancel={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'Nuevo cliente' });
    expect(within(dialog).queryByLabelText('Correo electrónico (opcional)')).toBeNull();

    fireEvent.input(screen.getByLabelText('Nombre del cliente'), { target: { value: 'Nueva Persona' } });
    fireEvent.input(screen.getByLabelText('Teléfono del cliente'), { target: { value: '555-0199' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cliente' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Cliente agregado.' })).toBeTruthy());
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Nueva Persona', phone: '555-0199', active: true }));
    expect((screen.getByLabelText('Enlace de registro genérico') as HTMLInputElement).value).toBe(`${window.location.origin}/registro`);
    expect(dialog.getAttribute('open')).not.toBeNull();
  });

  it('edits a client while preserving its identity and active state', () => {
    const client: ClientRecord = { id: 'client-1', name: 'Lucía Torres', phone: '555-0101', email: 'lucia@example.com', active: false };
    const onSave = vi.fn((_client: ClientRecord) => true);
    render(<ClientForm client={client} onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.input(screen.getByLabelText('Correo electrónico (opcional)'), { target: { value: 'lucia.new@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(onSave).toHaveBeenCalledWith({ ...client, email: 'lucia.new@example.com' });
    expect(screen.getByRole('status').textContent).toBe('Cambios del cliente guardados.');
  });

  it('shows the same generic registration link for different new clients', async () => {
    const createClient = async (name: string) => {
      render(<ClientForm onSave={vi.fn((_client: ClientRecord) => true)} onCancel={vi.fn()} />);
      fireEvent.input(screen.getByLabelText('Nombre del cliente'), { target: { value: name } });
      fireEvent.input(screen.getByLabelText('Teléfono del cliente'), { target: { value: '555-0111' } });
      fireEvent.click(screen.getByRole('button', { name: 'Guardar cliente' }));
      await waitFor(() => expect(screen.getByRole('heading', { name: 'Cliente agregado.' })).toBeTruthy());
      return (screen.getByLabelText('Enlace de registro genérico') as HTMLInputElement).value;
    };

    const firstLink = await createClient('Persona Uno');
    cleanup();
    const secondLink = await createClient('Persona Dos');

    expect(secondLink).toBe(firstLink);
    expect(secondLink).toBe(`${window.location.origin}/registro`);
  });
});
