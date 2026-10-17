import { cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { createDefaultBusinessSettings, saveBusinessSettings } from '../services/business-settings-store';
import type { AppointmentRecord, DemoData, SaleRecord } from '../types/domain';
import { DashboardPanel } from './DashboardPanel';

afterEach(cleanup);

const now = new Date(2026, 9, 14, 12, 0, 0);

function sale(id: string, day: number, netTotal: number, discountTotal = 0): SaleRecord {
  return {
    id,
    occurredAt: new Date(2026, 9, day, 10, 0, 0).toISOString(),
    items: [{ name: 'Corte', quantity: 1, unitPrice: netTotal + discountTotal }],
    grossTotal: netTotal + discountTotal,
    discountTotal,
    netTotal,
  };
}

function appointment(
  id: string,
  day: number,
  hour: number,
  status: AppointmentRecord['status'],
  clientName: string,
): AppointmentRecord {
  return {
    id,
    startsAt: new Date(2026, 9, day, hour, 0, 0).toISOString(),
    clientId: `client-${id}`,
    clientName,
    barberId: 'barber-diego',
    barberName: 'Diego',
    serviceIds: ['service-cut'],
    serviceName: 'Corte',
    status,
    durationMinutes: 45,
  };
}

const data: DemoData = {
  sales: [sale('monday', 12, 300), sale('today', 14, 280, 20), sale('later', 20, 400, 50)],
  appointments: [
    appointment('done', 14, 9, 'completed', 'Lucía Torres'),
    appointment('pending', 14, 13, 'pending', 'Mateo Cruz'),
    appointment('cancelled', 14, 14, 'cancelled', 'Inés Ríos'),
    appointment('confirmed-today', 14, 15, 'confirmed', 'Elena Vega'),
    appointment('tomorrow', 15, 10, 'confirmed', 'Sofía León'),
  ],
};

describe('DashboardPanel', () => {
  it('uses the shared dropdown control for period choices', () => {
    render(<DashboardPanel data={data} now={now} />);

    expect(screen.getByRole('button', { name: 'Periodo de ventas: Semana' })).toBeTruthy();
  });

  it('uses production-style copy without visible demo disclosures', () => {
    const { container } = render(<DashboardPanel data={data} now={now} />);

    expect(container.textContent?.toLocaleLowerCase('es')).not.toMatch(/demo|demostración|demostracion|simulación/);
  });

  it('surfaces the next appointment in the top-level daily summary', () => {
    render(<DashboardPanel data={data} now={now} />);

    const nextAppointment = screen.getByRole('region', { name: 'Siguiente cita' });
    expect(nextAppointment.textContent).toContain('Mateo Cruz');
    expect(nextAppointment.textContent).toContain('Corte · Diego');
    expect(nextAppointment.textContent).toContain('4 citas hoy · 1 pendiente');
  });

  it('updates net sales and the chart when the reporting period changes', () => {
    render(<DashboardPanel data={data} now={now} />);
    const summary = screen.getByRole('region', { name: 'Ventas del periodo' });

    expect(within(summary).getByText('$580.00')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Periodo de ventas: Semana' }));
    fireEvent.click(screen.getByRole('option', { name: 'Mes' }));

    expect(within(summary).getByText('$980.00')).toBeTruthy();
    expect(screen.getByRole('img', { name: /ventas netas/i })).toBeTruthy();
    const today = screen.getByRole('region', { name: 'Agenda de hoy' });
    expect(within(today).getByText('Confirmadas').parentElement?.textContent).toContain('1');
  });

  it('formats dashboard amounts in the saved currency without changing source totals', () => {
    const settings = createDefaultBusinessSettings();
    settings.currency = 'USD';
    saveBusinessSettings(localStorage, settings);
    const settingsBytes = localStorage.getItem('webbys:business-settings:v1');
    render(<DashboardPanel data={data} now={now} />);

    expect(screen.getByRole('region', { name: 'Ventas del periodo' }).textContent).toContain('USD');
    expect(data.sales.reduce((total, saleRecord) => total + saleRecord.netTotal, 0)).toBe(980);
    expect(localStorage.getItem('webbys:business-settings:v1')).toBe(settingsBytes);
  });

  it('supports changing the period with keyboard navigation', () => {
    render(<DashboardPanel data={data} now={now} />);
    const trigger = screen.getByRole('button', { name: 'Periodo de ventas: Semana' });

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'Enter' });

    expect(screen.getByRole('button', { name: 'Periodo de ventas: Mes' })).toBeTruthy();
  });

  it('shows upcoming appointments in time order and exposes each status as text', () => {
    render(<DashboardPanel data={data} now={now} />);
    const upcoming = screen.getByRole('region', { name: 'Próximas citas' });
    const rows = within(upcoming).getAllByRole('listitem');

    expect(rows.map((row) => row.textContent?.match(/Mateo Cruz|Elena Vega|Sofía León/)?.[0])).toEqual([
      'Mateo Cruz',
      'Elena Vega',
      'Sofía León',
    ]);
    expect(within(upcoming).getByText('Pendiente')).toBeTruthy();
    expect(within(upcoming).getAllByText('Confirmada')).toHaveLength(2);
    expect(within(upcoming).queryByText('Inés Ríos')).toBeNull();
  });

  it('shows helpful empty states when no appointments or activity exist', () => {
    render(<DashboardPanel data={{ sales: [], appointments: [] }} now={now} />);

    expect(screen.getByText('Sin ventas registradas en el periodo seleccionado.')).toBeTruthy();
    expect(screen.getByText('No hay citas próximas.')).toBeTruthy();
    expect(screen.getByText('Todavía no hay actividad para mostrar.')).toBeTruthy();
  });
});
