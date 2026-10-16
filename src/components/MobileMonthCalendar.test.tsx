import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppointmentRecord } from '../types/domain';
import { MobileMonthCalendar } from './MobileMonthCalendar';

afterEach(cleanup);

function appointment(id: string, day: number): AppointmentRecord {
  return {
    id,
    startsAt: new Date(2026, 9, day, 10).toISOString(),
    clientId: `client-${id}`,
    clientName: `Cliente ${id}`,
    barberId: 'barber-1',
    barberName: 'Diego',
    serviceIds: ['service-1'],
    serviceName: 'Corte',
    status: 'confirmed',
    durationMinutes: 45,
  };
}

describe('MobileMonthCalendar', () => {
  it('shows the selected month and marks the selected calendar date', () => {
    render(<MobileMonthCalendar selectedDate="2026-10-15" appointments={[]} onSelectDate={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Octubre de 2026' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Jueves, 15 de octubre', pressed: true })).toBeTruthy();
  });

  it('marks dates with appointments and includes their count in the accessible name', () => {
    render(<MobileMonthCalendar selectedDate="2026-10-15" appointments={[appointment('one', 15), appointment('two', 15)]} onSelectDate={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Jueves, 15 de octubre, 2 citas', pressed: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Viernes, 16 de octubre', pressed: false })).toBeTruthy();
  });

  it('navigates months without selecting a date when a navigation callback is provided', () => {
    const onSelectDate = vi.fn();
    const onNavigateMonth = vi.fn();
    render(<MobileMonthCalendar selectedDate="2026-10-15" appointments={[]} onSelectDate={onSelectDate} onNavigateMonth={onNavigateMonth} />);

    fireEvent.click(screen.getByRole('button', { name: 'Mes siguiente' }));

    expect(onNavigateMonth).toHaveBeenCalledWith('2026-11-01');
    expect(onSelectDate).not.toHaveBeenCalled();
  });

  it('selects a calendar day when its date button is activated', () => {
    const onSelectDate = vi.fn();
    render(<MobileMonthCalendar selectedDate="2026-10-15" appointments={[]} onSelectDate={onSelectDate} />);

    fireEvent.click(screen.getByRole('button', { name: 'Jueves, 8 de octubre' }));

    expect(onSelectDate).toHaveBeenCalledWith('2026-10-08');
  });
});
