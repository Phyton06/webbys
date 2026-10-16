import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ClientRecord } from '../types/agenda';
import { ClientCombobox } from './ClientCombobox';

afterEach(cleanup);

const clients: ClientRecord[] = [
  { id: 'client-lucia', name: 'Lucía Torres', phone: '555-0101' },
  { id: 'client-mateo', name: 'Mateo Cruz', phone: '555-0102' },
];

describe('ClientCombobox', () => {
  it('filters existing clients as the user types and selects a matching option', () => {
    const onSelect = vi.fn();
    const { rerender } = render(<ClientCombobox clients={clients} selectedClientId="client-lucia" onSelect={onSelect} />);
    const input = screen.getByRole('combobox', { name: 'Cliente' });

    fireEvent.input(input, { target: { value: 'mateo' } });

    expect(screen.getByRole('option', { name: 'Mateo Cruz · 555-0102' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'Lucía Torres · 555-0101' })).toBeNull();
    fireEvent.click(screen.getByRole('option', { name: 'Mateo Cruz · 555-0102' }));
    rerender(<ClientCombobox clients={clients} selectedClientId="client-mateo" onSelect={onSelect} />);

    expect(onSelect).toHaveBeenCalledWith('client-mateo');
    expect((input as HTMLInputElement).value).toBe('Mateo Cruz');
  });

  it('shows selectable clients when the current selection receives focus', () => {
    render(<ClientCombobox clients={clients} selectedClientId="client-lucia" onSelect={vi.fn()} />);
    fireEvent.focus(screen.getByRole('combobox', { name: 'Cliente' }));

    expect(screen.getByRole('option', { name: 'Lucía Torres · 555-0101' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Mateo Cruz · 555-0102' })).toBeTruthy();
  });

  it('selects the active search result with the keyboard', () => {
    const onSelect = vi.fn();
    render(<ClientCombobox clients={clients} selectedClientId="" onSelect={onSelect} />);
    const input = screen.getByRole('combobox', { name: 'Cliente' });
    fireEvent.input(input, { target: { value: 'lucía' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith('client-lucia');
  });

  it('starts keyboard navigation at the first result in an unfiltered list', () => {
    const onSelect = vi.fn();
    render(<ClientCombobox clients={clients} selectedClientId="" onSelect={onSelect} />);
    const input = screen.getByRole('combobox', { name: 'Cliente' });
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith('client-lucia');
  });

  it('announces when no client matches the search', () => {
    render(<ClientCombobox clients={clients} selectedClientId="" onSelect={vi.fn()} />);
    fireEvent.input(screen.getByRole('combobox', { name: 'Cliente' }), { target: { value: 'inexistente' } });

    expect(screen.getByRole('status').textContent).toBe('No hay clientes que coincidan.');
  });
});
