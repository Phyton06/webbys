import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { createAgendaSeed } from '../data/agenda-demo';
import { saveAgendaState } from '../services/agenda-store';
import { createDefaultBusinessSettings, saveBusinessSettings } from '../services/business-settings-store';
import { SalesPage } from './SalesPage';

const now = new Date(2026, 9, 14, 12, 0);

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderPage() {
  localStorage.setItem('webbys:demo-session', 'active');
  saveAgendaState(localStorage, createAgendaSeed(now));
  return render(<SalesPage now={now} />);
}

function chooseDropdown(label: string, option: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`${label}:`) }));
  fireEvent.click(screen.getByRole('option', { name: option }));
}

function showAllDates() {
  fireEvent.click(screen.getByRole('button', { name: 'Limpiar fechas' }));
}

describe('SalesPage', () => {
  it('formats sales amounts in the saved currency without rewriting settings', () => {
    const settings = createDefaultBusinessSettings();
    settings.currency = 'USD';
    saveBusinessSettings(localStorage, settings);
    const settingsBytes = localStorage.getItem('webbys:business-settings:v1');
    renderPage();
    const amount = screen.getByRole('region', { name: 'Resumen de ventas filtradas' }).textContent ?? '';

    expect(amount).toContain('USD');
    expect(localStorage.getItem('webbys:business-settings:v1')).toBe(settingsBytes);
    expect(localStorage.getItem('webbys:agenda:v1')).not.toBeNull();
  });

  it('shows generated read-only sales, period totals, and daily trend', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Ventas' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Desde: 14 de octubre de 2026' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hasta: 14 de octubre de 2026' })).toBeTruthy();
    expect(screen.getByText('Rango seleccionado · Día · 14 de octubre de 2026')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Resumen de ventas filtradas' }).textContent).toContain('1');
    expect(screen.getByRole('list', { name: 'Registros de ventas' }).querySelectorAll('li')).toHaveLength(1);
    expect(screen.getByRole('img', { name: 'Ventas netas por día' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /registrar|nueva venta|guardar venta/i })).toBeNull();
  });

  it('searches sale, employee, product, service, and promotion snapshots', () => {
    renderPage();
    showAllDates();
    const search = screen.getByRole('searchbox', { name: 'Buscar ventas' });
    fireEvent.input(search, { target: { value: 'cera' } });

    let list = screen.getByRole('list', { name: 'Registros de ventas' });
    expect(list.querySelectorAll('li').length).toBeGreaterThan(0);
    expect([...list.querySelectorAll('li')].every((item) => item.textContent?.toLocaleLowerCase('es').includes('cera'))).toBe(true);

    fireEvent.input(search, { target: { value: 'oferta de temporada' } });
    list = screen.getByRole('list', { name: 'Registros de ventas' });
    expect(list.querySelectorAll('li').length).toBeGreaterThan(0);
    expect([...list.querySelectorAll('li')].every((item) => item.textContent?.includes('Oferta de temporada'))).toBe(true);
  });

  it('filters sales by employee, product, service, and explicit promotion attribution', () => {
    renderPage();
    showAllDates();
    chooseDropdown('Empleado', 'Diego');
    let list = screen.getByRole('list', { name: 'Registros de ventas' });
    expect([...list.querySelectorAll('li')].every((item) => item.textContent?.includes('Diego'))).toBe(true);

    chooseDropdown('Empleado', 'Todos');
    chooseDropdown('Producto', 'Cera para peinar');
    list = screen.getByRole('list', { name: 'Registros de ventas' });
    expect([...list.querySelectorAll('li')].every((item) => item.textContent?.includes('Cera para peinar'))).toBe(true);

    chooseDropdown('Producto', 'Todos');
    chooseDropdown('Servicio', 'Corte');
    list = screen.getByRole('list', { name: 'Registros de ventas' });
    expect([...list.querySelectorAll('li')].every((item) => item.textContent?.includes('Corte'))).toBe(true);

    chooseDropdown('Servicio', 'Todos');
    chooseDropdown('Promoción', 'Oferta de temporada');
    list = screen.getByRole('list', { name: 'Registros de ventas' });
    expect([...list.querySelectorAll('li')].every((item) => item.textContent?.includes('Oferta de temporada'))).toBe(true);
  });

  it('opens the shared date popover from the date value and applies a date range', () => {
    renderPage();
    expect(screen.queryByRole('group', { name: 'Días de Octubre de 2026' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Desde: 14 de octubre de 2026' }));
    expect(screen.getByRole('group', { name: 'Días de Octubre de 2026' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Jueves, 1 de octubre' }));

    expect(screen.getByRole('button', { name: 'Desde: 1 de octubre de 2026' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Días de Octubre de 2026' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Hasta: 14 de octubre de 2026' })).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Registros de ventas' }).querySelectorAll('li').length).toBeGreaterThan(1);

    fireEvent.click(screen.getByRole('button', { name: 'Hasta: 14 de octubre de 2026' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lunes, 5 de octubre' }));
    expect(screen.getByText('Rango seleccionado · 1 de octubre de 2026 – 5 de octubre de 2026')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Resumen de ventas filtradas' }).textContent).toContain('5');
    expect(screen.getByRole('list', { name: 'Registros de ventas' }).querySelectorAll('li')).toHaveLength(5);
  });

  it('opens a read-only sale detail and returns to the filtered list', () => {
    renderPage();
    showAllDates();
    fireEvent.click(screen.getByRole('button', { name: 'Ver venta demo-sale-01' }));

    expect(screen.getByRole('heading', { name: 'Venta demo-sale-01' })).toBeTruthy();
    expect(screen.getByText('Método de pago')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /editar|cancelar venta|reembolsar/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Volver a ventas' }));
    expect(screen.getByRole('list', { name: 'Registros de ventas' })).toBeTruthy();
  });

  it('does not change Agenda or inventory data when searching or viewing records', () => {
    renderPage();
    showAllDates();
    const before = localStorage.getItem('webbys:agenda:v1');
    fireEvent.input(screen.getByRole('searchbox', { name: 'Buscar ventas' }), { target: { value: 'Cera' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ver venta demo-sale-31' }));

    expect(localStorage.getItem('webbys:agenda:v1')).toBe(before);
  });
});
