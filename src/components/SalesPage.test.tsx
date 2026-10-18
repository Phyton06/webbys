import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { createAgendaSeed } from '../data/agenda-demo';
import { createDemoData } from '../data/demo';
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
    expect(screen.getByRole('region', { name: 'Resumen de ventas filtradas' }).textContent).toContain('3');
    expect(screen.getByRole('list', { name: 'Registros de ventas' }).querySelectorAll('li')).toHaveLength(3);
    expect(screen.getByRole('img', { name: 'Ventas netas por día' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /registrar|nueva venta|guardar venta/i })).toBeNull();
  });

  it('shows five newest sales per page and resets pagination when filters change', () => {
    renderPage();
    showAllDates();
    const expected = [...createDemoData(now).sales]
      .sort((first, second) => second.occurredAt.localeCompare(first.occurredAt));
    const getRows = () => [...screen.getByRole('list', { name: 'Registros de ventas' }).querySelectorAll('li')];
    const rowIds = () => getRows().map((row) => row.textContent?.match(/demo-sale-\d+/)?.[0]);

    expect(getRows()).toHaveLength(5);
    expect(rowIds()).toEqual(expected.slice(0, 5).map(({ id }) => id));
    expect(screen.getByText(`Página 1 de ${Math.ceil(expected.length / 5)}`)).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Resumen de ventas filtradas' }).textContent).toContain(String(expected.length));

    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(rowIds()).toEqual(expected.slice(5, 10).map(({ id }) => id));
    fireEvent.input(screen.getByRole('searchbox', { name: 'Buscar ventas' }), { target: { value: 'demo-sale-01' } });
    expect(getRows()).toHaveLength(1);
    expect(screen.queryByRole('navigation', { name: 'Paginación del historial de ventas' })).toBeNull();
  });

  it('shows a cashier sale persisted in the shared agenda state', () => {
    const state = createAgendaSeed(now);
    state.sales = [{
      id: 'sale-shared-history', occurredAt: now.toISOString(),
      items: [{ kind: 'product', catalogItemId: 'product-shampoo', name: 'Shampoo', quantity: 1, unitPrice: 160 }],
      clientName: 'Lucía Torres', employeeName: 'Asistente', paymentMethod: 'card', status: 'completed',
      grossTotal: 160, discountTotal: 0, netTotal: 160,
    }];
    localStorage.setItem('webbys:demo-session', 'active');
    saveAgendaState(localStorage, state);
    render(<SalesPage now={now} />);

    expect(screen.getByRole('list', { name: 'Registros de ventas' }).textContent).toContain('sale-shared-history');
    expect(screen.getByRole('list', { name: 'Registros de ventas' }).textContent).toContain('Shampoo');
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
  }, 10_000);

  it('opens the shared date popover from the date value and applies a date range', () => {
    renderPage();
    expect(screen.queryByRole('group', { name: 'Días de Octubre de 2026' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Desde: 14 de octubre de 2026' }));
    const calendar = screen.getByRole('group', { name: 'Días de Octubre de 2026' });
    expect(calendar.closest('.appointment-date-picker-popover')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Jueves, 1 de octubre' }));

    expect(screen.getByRole('button', { name: 'Desde: 1 de octubre de 2026' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Días de Octubre de 2026' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Hasta: 14 de octubre de 2026' })).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Registros de ventas' }).querySelectorAll('li').length).toBeGreaterThan(1);

    fireEvent.click(screen.getByRole('button', { name: 'Hasta: 14 de octubre de 2026' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lunes, 5 de octubre' }));
    expect(screen.getByText('Rango seleccionado · 1 de octubre de 2026 – 5 de octubre de 2026')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Resumen de ventas filtradas' }).textContent).toContain('11');
    expect(screen.getByRole('list', { name: 'Registros de ventas' }).querySelectorAll('li')).toHaveLength(5);
    expect(screen.getByText('Página 1 de 3')).toBeTruthy();
  });

  it('opens a read-only sale detail and returns to the filtered list', () => {
    renderPage();
    showAllDates();
    const firstVisibleSale = screen.getByRole('list', { name: 'Registros de ventas' }).querySelector('button')?.getAttribute('aria-label')?.replace('Ver venta ', '');
    fireEvent.click(screen.getByRole('button', { name: `Ver venta ${firstVisibleSale}` }));

    expect(screen.getByRole('heading', { name: `Venta ${firstVisibleSale}` })).toBeTruthy();
    expect(screen.getByText('Método de pago')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /editar|cancelar venta|reembolsar/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Volver a Ventas' }));
    expect(screen.getByRole('list', { name: 'Registros de ventas' })).toBeTruthy();
  });

  it('does not change Agenda or inventory data when searching or viewing records', () => {
    renderPage();
    showAllDates();
    const before = localStorage.getItem('webbys:agenda:v1');
    fireEvent.input(screen.getByRole('searchbox', { name: 'Buscar ventas' }), { target: { value: 'Cera' } });
    const firstCeraSale = screen.getByRole('list', { name: 'Registros de ventas' }).querySelector('button')?.getAttribute('aria-label');
    fireEvent.click(screen.getByRole('button', { name: firstCeraSale ?? '' }));

    expect(localStorage.getItem('webbys:agenda:v1')).toBe(before);
  });
});
