import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AvailabilityException, BarberRecord, BarberSchedule } from '../types/agenda';
import { getAvailableSlots } from '../services/availability';
import { AvailabilityExceptionEditor } from './AvailabilityExceptionEditor';

afterEach(cleanup);

const barbers: BarberRecord[] = [{ id: 'barber-diego', name: 'Diego' }];
const schedules: BarberSchedule[] = [{
  barberId: 'barber-diego',
  days: [{ weekday: 5, working: [{ start: '09:00', end: '18:00' }], breaks: [{ start: '13:00', end: '14:00' }] }],
}];
const now = new Date(2026, 9, 15, 8, 0);

describe('AvailabilityExceptionEditor', () => {
  it('saves a day-off override that closes otherwise available slots', () => {
    const onSave = vi.fn((_next: AvailabilityException[]) => true);
    render(<AvailabilityExceptionEditor barbers={barbers} exceptions={[]} onSave={onSave} />);
    fireEvent.input(screen.getByLabelText('Fecha de la excepción'), { target: { value: '2026-10-16' } });
    fireEvent.click(screen.getByLabelText('Día libre'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar excepción' }));

    const saved = onSave.mock.calls[0]?.[0] ?? [];
    expect(saved).toEqual([{ barberId: 'barber-diego', date: '2026-10-16', unavailable: true }]);
    expect(getAvailableSlots('2026-10-16', 'barber-diego', 30, schedules, saved, [], now)).toEqual([]);
  });

  it('saves replacement hours and the shared availability engine uses them', () => {
    const onSave = vi.fn((_next: AvailabilityException[]) => true);
    render(<AvailabilityExceptionEditor barbers={barbers} exceptions={[]} onSave={onSave} />);
    fireEvent.input(screen.getByLabelText('Fecha de la excepción'), { target: { value: '2026-10-16' } });
    fireEvent.input(screen.getByLabelText('Inicio de horario especial'), { target: { value: '12:00' } });
    fireEvent.input(screen.getByLabelText('Fin de horario especial'), { target: { value: '17:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar excepción' }));

    const saved = onSave.mock.calls[0]?.[0] ?? [];
    const slots = getAvailableSlots('2026-10-16', 'barber-diego', 30, schedules, saved, [], now);
    expect(slots[0]).toBe('12:00');
    expect(slots).not.toContain('09:00');
  });

  it('replaces rather than duplicates an exception for the same barber and date', () => {
    const original: AvailabilityException = { barberId: 'barber-diego', date: '2026-10-16', unavailable: true };
    const onSave = vi.fn((_next: AvailabilityException[]) => true);
    render(<AvailabilityExceptionEditor barbers={barbers} exceptions={[original]} onSave={onSave} />);
    fireEvent.input(screen.getByLabelText('Fecha de la excepción'), { target: { value: '2026-10-16' } });
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar excepción' }));

    const saved = onSave.mock.calls[0]?.[0] ?? [];
    expect(saved).toHaveLength(1);
    expect(saved[0]?.unavailable).toBe(true);
  });

  it('loads the configured hours when selecting an existing day-off date', () => {
    const original: AvailabilityException = { barberId: 'barber-diego', date: '2026-10-16', unavailable: true };
    const onSave = vi.fn((_next: AvailabilityException[]) => true);
    render(<AvailabilityExceptionEditor barbers={barbers} exceptions={[original]} onSave={onSave} />);

    fireEvent.input(screen.getByLabelText('Fecha de la excepción'), { target: { value: '2026-10-16' } });
    fireEvent.click(screen.getByLabelText('Día libre'));
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar excepción' }));

    const saved = onSave.mock.calls[0]?.[0] ?? [];
    expect(saved).toHaveLength(1);
    expect(saved[0]?.unavailable).toBe(false);
    expect(saved[0]?.working).toEqual([{ start: '09:00', end: '18:00' }]);
  });

  it('restores an existing special schedule when turning off its day-off flag', () => {
    const original: AvailabilityException = {
      barberId: 'barber-diego',
      date: '2026-10-16',
      unavailable: false,
      working: [{ start: '12:00', end: '17:00' }],
      breaks: [],
    };
    const onSave = vi.fn((_next: AvailabilityException[]) => true);
    render(<AvailabilityExceptionEditor barbers={barbers} exceptions={[original]} onSave={onSave} />);
    fireEvent.input(screen.getByLabelText('Fecha de la excepción'), { target: { value: '2026-10-16' } });
    fireEvent.click(screen.getByLabelText('Día libre'));
    fireEvent.click(screen.getByLabelText('Día libre'));

    expect((screen.getByLabelText('Inicio de horario especial') as HTMLInputElement).value).toBe('12:00');
    expect((screen.getByLabelText('Fin de horario especial') as HTMLInputElement).value).toBe('17:00');
  });

  it('rejects replacement hours with a break outside the shift', () => {
    const onSave = vi.fn((_next: AvailabilityException[]) => true);
    render(<AvailabilityExceptionEditor barbers={barbers} exceptions={[]} onSave={onSave} />);
    fireEvent.input(screen.getByLabelText('Fecha de la excepción'), { target: { value: '2026-10-16' } });
    fireEvent.input(screen.getByLabelText('Inicio de horario especial'), { target: { value: '09:00' } });
    fireEvent.input(screen.getByLabelText('Fin de horario especial'), { target: { value: '12:00' } });
    fireEvent.input(screen.getByLabelText('Inicio de descanso especial'), { target: { value: '12:00' } });
    fireEvent.input(screen.getByLabelText('Fin de descanso especial'), { target: { value: '13:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar excepción' }));

    expect(screen.getByRole('alert').textContent).toContain('El descanso debe quedar dentro de un horario laboral.');
    expect(screen.getByLabelText('Fin de descanso especial').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('Fin de descanso especial').getAttribute('aria-describedby')).toBe('exception-schedule-error');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('removes an existing date exception only after saving the change', () => {
    const original: AvailabilityException = { barberId: 'barber-diego', date: '2026-10-16', unavailable: true };
    const onSave = vi.fn((_next: AvailabilityException[]) => true);
    render(<AvailabilityExceptionEditor barbers={barbers} exceptions={[original]} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar excepción 2026-10-16' }));

    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios de excepciones' }));
    expect(onSave).toHaveBeenCalledWith([]);
  });
});
