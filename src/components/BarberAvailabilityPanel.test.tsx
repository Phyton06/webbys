import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BarberRecord, BarberSchedule } from '../types/agenda';
import { BarberAvailabilityPanel } from './BarberAvailabilityPanel';

afterEach(cleanup);

const barbers: BarberRecord[] = [{ id: 'barber-diego', name: 'Diego' }];
const schedules: BarberSchedule[] = [{
  barberId: 'barber-diego',
  days: [{
    weekday: 1,
    working: [{ start: '09:00', end: '17:00' }],
    breaks: [{ start: '13:00', end: '14:00' }],
  }],
}];

describe('BarberAvailabilityPanel', () => {
  it('enables and disables recurring workdays in a draft until saved', () => {
    const onSave = vi.fn((_next: BarberSchedule[]) => true);
    render(<BarberAvailabilityPanel barbers={barbers} schedules={schedules} onSave={onSave} />);

    const monday = screen.getByLabelText('Día laborable · lunes') as HTMLInputElement;
    expect(monday.checked).toBe(true);
    fireEvent.click(monday);
    fireEvent.click(screen.getByLabelText('Día laborable · domingo'));

    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar horarios' }));

    expect(onSave).toHaveBeenCalledOnce();
    const saved = onSave.mock.calls[0]?.[0] ?? [];
    expect(saved[0]?.days.map(({ weekday }) => weekday)).toEqual([0]);
  });

  it('saves edited working hours after validating the interval', () => {
    const onSave = vi.fn((_next: BarberSchedule[]) => true);
    render(<BarberAvailabilityPanel barbers={barbers} schedules={schedules} onSave={onSave} />);

    fireEvent.input(screen.getByLabelText('Fin del horario lunes 1'), { target: { value: '18:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar horarios' }));

    expect(onSave.mock.calls[0]?.[0][0]?.days[0]?.working).toEqual([{ start: '09:00', end: '18:00' }]);
  });

  it('adds and removes an additional working interval', () => {
    const onSave = vi.fn((_next: BarberSchedule[]) => true);
    render(<BarberAvailabilityPanel barbers={barbers} schedules={schedules} onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: 'Agregar horario lunes' }));
    fireEvent.input(screen.getByLabelText('Inicio del horario lunes 2'), { target: { value: '17:00' } });
    fireEvent.input(screen.getByLabelText('Fin del horario lunes 2'), { target: { value: '18:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar horario lunes 2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar horarios' }));

    expect(onSave.mock.calls[0]?.[0][0]?.days[0]?.working).toEqual([{ start: '09:00', end: '17:00' }]);
  });

  it('allows editing a break within the working interval', () => {
    const onSave = vi.fn((_next: BarberSchedule[]) => true);
    render(<BarberAvailabilityPanel barbers={barbers} schedules={schedules} onSave={onSave} />);

    fireEvent.input(screen.getByLabelText('Inicio del descanso lunes 1'), { target: { value: '12:30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar horarios' }));

    expect(onSave.mock.calls[0]?.[0][0]?.days[0]?.breaks).toEqual([{ start: '12:30', end: '14:00' }]);
  });

  it('rejects a break outside working hours without changing saved schedules', () => {
    const onSave = vi.fn((_next: BarberSchedule[]) => true);
    render(<BarberAvailabilityPanel barbers={barbers} schedules={schedules} onSave={onSave} />);

    fireEvent.input(screen.getByLabelText('Fin del horario lunes 1'), { target: { value: '12:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar horarios' }));

    expect(screen.getByRole('alert').textContent).toContain('El descanso debe quedar dentro de un horario laboral.');
    expect(screen.getByLabelText('Fin del descanso lunes 1').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('Fin del descanso lunes 1').getAttribute('aria-describedby')).toBe('weekly-schedule-error');
    expect(onSave).not.toHaveBeenCalled();
  });
});
