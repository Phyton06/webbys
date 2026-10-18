import { cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { createAgendaSeed } from '../data/agenda-demo';
import { loadAgendaState, saveAgendaState } from '../services/agenda-store';
import { BarberPage } from './BarberPage';

afterEach(() => { cleanup(); localStorage.clear(); });

describe('BarberPage', () => {
  it('opens as a styled barber dashboard with upcoming appointments', async () => {
    const now = new Date(2026, 9, 15, 8);
    localStorage.setItem('webbys:demo-session', 'barber');
    saveAgendaState(localStorage, createAgendaSeed(now));
    render(<BarberPage now={now} />);

    expect(await screen.findByRole('heading', { name: 'Jornada de hoy' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Navegación del barbero' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Próxima cita' })).toBeTruthy();
    expect(screen.getByText('45 min')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Configurar horarios' })).toBeNull();
  });

  it('shows only appointments assigned to the signed-in barber', async () => {
    const now = new Date(2026, 9, 15, 8);
    localStorage.setItem('webbys:demo-session', 'barber');
    saveAgendaState(localStorage, createAgendaSeed(now));

    render(<BarberPage now={now} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Mi agenda' })[0]!);
    expect(await screen.findByRole('heading', { name: 'Mi agenda' })).toBeTruthy();
    const seedAppointments = createAgendaSeed(now).appointments;
    const localDay = (value: string) => {
      const date = new Date(value);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    const assigned = seedAppointments.filter(({ barberId, startsAt }) => barberId === 'barber-1'
      && localDay(startsAt) === '2026-10-15');
    const other = seedAppointments.filter(({ barberId, startsAt }) => barberId !== 'barber-1'
      && localDay(startsAt) === '2026-10-15');
    for (const appointment of assigned) expect(screen.getByText(appointment.clientName)).toBeTruthy();
    for (const appointment of other) expect(screen.queryByText(appointment.clientName)).toBeNull();
    expect(screen.getByText('09:30')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /iniciar|finalizar servicio/i })).toBeNull();
  });

  it('lets the barber open their own schedule settings', async () => {
    const now = new Date(2026, 9, 15, 8);
    localStorage.setItem('webbys:demo-session', 'barber');
    saveAgendaState(localStorage, createAgendaSeed(now));
    render(<BarberPage now={now} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Mi agenda' })[0]!);
    fireEvent.click(screen.getByRole('button', { name: 'Configurar horarios' }));

    expect(screen.getByRole('heading', { name: 'Horarios de trabajo' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Barbero de horarios/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Barbero de excepción/ })).toBeNull();
    fireEvent.click(screen.getByText('lunes'));
    expect(screen.getByRole('checkbox', { name: 'Día laborable · lunes' })).toBeTruthy();
  });

  it('blocks a schedule change that conflicts with a future appointment', async () => {
    const now = new Date(2026, 9, 15, 8);
    localStorage.setItem('webbys:demo-session', 'barber');
    const agenda = createAgendaSeed(now);
    saveAgendaState(localStorage, agenda);
    render(<BarberPage now={now} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Mi agenda' })[0]!);
    fireEvent.click(screen.getByRole('button', { name: 'Configurar horarios' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Día laborable · viernes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar horarios' }));

    expect(await screen.findByText(/No se guardó el cambio porque afecta estas citas futuras/)).toBeTruthy();
    expect(loadAgendaState(localStorage, now).state.schedules).toEqual(agenda.schedules);
  });

  it('shows personal statistics for the selected period', async () => {
    const now = new Date(2026, 9, 15, 12);
    localStorage.setItem('webbys:demo-session', 'barber');
    const agenda = createAgendaSeed(now);
    agenda.sales = [{
      id: 'barber-sale', occurredAt: now.toISOString(),
      items: [{ kind: 'service', catalogItemId: 'service-1', barberId: 'barber-1', name: 'Corte', quantity: 1, unitPrice: 300 }],
      status: 'completed', grossTotal: 300, discountTotal: 0, netTotal: 300,
    }];
    saveAgendaState(localStorage, agenda);
    render(<BarberPage now={now} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Estadísticas' })[0]!);

    expect(screen.getByRole('heading', { name: 'Mis estadísticas' })).toBeTruthy();
    expect(screen.getAllByText('$300.00')).toHaveLength(2);
    expect(screen.getByText('Ingresos cobrados')).toBeTruthy();
    expect(screen.getByRole('img', { name: '100% de los servicios solicitados' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Configurar horarios' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Periodo de estadísticas: Esta semana' }));
    fireEvent.click(screen.getByRole('option', { name: 'Periodo personalizado' }));
    expect(screen.queryByRole('listbox', { name: 'Periodo de estadísticas' })).toBeNull();
    expect(screen.getByLabelText('Desde')).toBeTruthy();
    expect(screen.getByLabelText('Hasta')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Periodo de estadísticas: Periodo personalizado' }));
    fireEvent.click(screen.getByRole('option', { name: 'Hoy' }));
    expect(screen.queryByRole('listbox', { name: 'Periodo de estadísticas' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Periodo de estadísticas: Hoy' })).toBeTruthy();
  });

  it('provides a keyboard skip link and a named section switcher', () => {
    const now = new Date(2026, 9, 15, 8);
    localStorage.setItem('webbys:demo-session', 'barber');
    saveAgendaState(localStorage, createAgendaSeed(now));
    render(<BarberPage now={now} />);

    expect(screen.getByRole('link', { name: 'Saltar al contenido' }).getAttribute('href')).toBe('#barber-main');
    expect(screen.getByRole('navigation', { name: 'Navegación del barbero' })).toBeTruthy();
  });

  it('defaults to today, paginates five appointments, and lets the barber choose another date', () => {
    const now = new Date(2026, 9, 15, 8);
    localStorage.setItem('webbys:demo-session', 'barber');
    const agenda = createAgendaSeed(now);
    const firstAppointment = agenda.appointments.find(({ barberId }) => barberId === 'barber-1')!;
    agenda.appointments = [
      ...Array.from({ length: 7 }, (_, index) => ({
        ...firstAppointment,
        id: `today-${index}`,
        startsAt: new Date(2026, 9, 15, 9 + index).toISOString(),
        barberId: 'barber-1',
        clientName: `Client ${index + 1}`,
      })),
      { ...firstAppointment, id: 'tomorrow', startsAt: new Date(2026, 9, 16, 9).toISOString(), barberId: 'barber-1', clientName: 'Tomorrow Client' },
    ];
    saveAgendaState(localStorage, agenda);
    render(<BarberPage now={now} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Mi agenda' })[0]!);

    const region = screen.getByRole('region', { name: 'Mi agenda' });
    expect(screen.getByRole('button', { name: /Fecha de la agenda.*15 de octubre/ })).toBeTruthy();
    expect(within(region).getByText('Client 5')).toBeTruthy();
    expect(within(region).queryByText('Client 6')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(within(region).getByText('Client 6')).toBeTruthy();
    expect(within(region).queryByText('Client 1')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Fecha de la agenda/ }));
    expect(screen.getByRole('region', { name: 'Calendario mensual' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /viernes, 16 de octubre/i }));
    expect(within(region).getByText('Tomorrow Client')).toBeTruthy();
    expect(within(region).queryByText('Client 6')).toBeNull();
  });
});
