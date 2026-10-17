import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotificationRecipientPicker } from './NotificationRecipientPicker';

afterEach(cleanup);

describe('NotificationRecipientPicker', () => {
  it('searches recipients in a dropdown and calls selection', () => {
    const onToggle = vi.fn();
    render(<NotificationRecipientPicker
      recipients={[{ id: 'client-1', name: 'Lucía Torres' }, { id: 'client-2', name: 'Mateo Cruz' }]}
      selectedIds={[]}
      onToggle={onToggle}
    />);

    const search = screen.getByRole('combobox', { name: 'Buscar destinatarios' });
    fireEvent.input(search, { target: { value: 'lucia' } });
    expect(screen.getByRole('listbox', { name: 'Resultados de destinatarios' })).toBeTruthy();
    fireEvent.click(screen.getByRole('option', { name: 'Lucía Torres' }));

    expect(onToggle).toHaveBeenCalledWith('client-1');
  });

  it('shows selected recipients below the search and can remove each one', () => {
    const onToggle = vi.fn();
    render(<NotificationRecipientPicker
      recipients={[{ id: 'client-1', name: 'Lucía Torres' }]}
      selectedIds={['client-1']}
      onToggle={onToggle}
    />);

    expect(screen.getByText('Lucía Torres')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar Lucía Torres' }));
    expect(onToggle).toHaveBeenCalledWith('client-1');
  });
});
