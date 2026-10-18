import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { createAgendaSeed } from '../data/agenda-demo';
import { saveAgendaState } from '../services/agenda-store';
import { AnalyticsPage } from './AnalyticsPage';

const now = new Date(2026, 9, 14, 12, 0);

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderPage() {
  localStorage.setItem('webbys:demo-session', 'active');
  saveAgendaState(localStorage, createAgendaSeed(now));
  return render(<AnalyticsPage now={now} />);
}

describe('AnalyticsPage', () => {
  it('defaults to the last thirty days with a comparative summary against the previous window', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Analíticas' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Desde: 15 de septiembre de 2026' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hasta: 14 de octubre de 2026' })).toBeTruthy();
    expect(screen.getByText('Rango seleccionado · 15 de septiembre de 2026 – 14 de octubre de 2026')).toBeTruthy();

    const summary = screen.getByRole('region', { name: 'Resumen comparativo' });
    expect(summary.textContent).toContain('Ingresos netos');
    expect(summary.textContent).toContain('Ticket promedio');
    expect(summary.textContent).toContain('Descuentos');
    expect(summary.textContent).toContain('Periodo anterior');
    expect(summary.textContent).toContain('%');
  });

  it('calculates administrator analytics from shared cashier sales when present', () => {
    const state = createAgendaSeed(now);
    state.sales = [{
      id: 'sale-shared-analytics', occurredAt: now.toISOString(),
      items: [{ kind: 'service', catalogItemId: 'service-1', name: 'Corte', quantity: 1, unitPrice: 320 }],
      employeeId: 'assistant-demo', employeeName: 'Asistente', paymentMethod: 'transfer', status: 'completed',
      grossTotal: 320, discountTotal: 0, netTotal: 320,
    }];
    localStorage.setItem('webbys:demo-session', 'active');
    saveAgendaState(localStorage, state);
    render(<AnalyticsPage now={now} />);

    expect(screen.getByRole('region', { name: 'Resumen comparativo' }).textContent).toContain('$320.00');
    expect(screen.getByRole('list', { name: 'Rendimiento por empleado' }).textContent).toContain('Asistente');
  });

  it('renders daily evolution, product and service rankings, and employee performance', () => {
    renderPage();

    expect(screen.getByRole('img', { name: 'Ventas netas por día' })).toBeTruthy();

    const products = screen.getByRole('list', { name: 'Productos más vendidos' });
    expect(products.textContent).toContain('Cera para peinar');
    expect(products.textContent).toContain('unidades');

    const services = screen.getByRole('list', { name: 'Servicios más vendidos' });
    expect(services.textContent).toContain('Corte');

    const employees = screen.getByRole('list', { name: 'Rendimiento por empleado' });
    expect(employees.textContent).toContain('Diego');
    expect(employees.textContent).toContain('Ticket promedio');
  });

  it('reports promotion analytics with explicit attribution, benchmark, and window honesty', () => {
    renderPage();

    expect(screen.getByText('La coincidencia de fechas no demuestra atribución.')).toBeTruthy();
    expect(screen.getByText('Ordenadas por ingresos atribuidos, de mayor a menor. Las posiciones marcan mejor y menor desempeño observado.')).toBeTruthy();
    expect(screen.getByText(/Ventas sin promoción atribuida en el rango:/)).toBeTruthy();

    const promotionList = screen.getByRole('list', { name: 'Promociones ordenadas por ingresos atribuidos' });
    expect(promotionList.textContent).toContain('1. Oferta de temporada');
    expect(promotionList.textContent).toContain('Ventas atribuidas');
    expect(promotionList.textContent).toContain('Descuentos concedidos');
    expect(promotionList.textContent).toContain('Sin ventana de fechas comparable.');
  });

  it('moves the analysis range with the shared date popover', () => {
    renderPage();

    expect(screen.queryByRole('group', { name: 'Días de Octubre de 2026' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Hasta: 14 de octubre de 2026' }));
    expect(screen.getByRole('group', { name: 'Días de Octubre de 2026' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Lunes, 5 de octubre' }));

    expect(screen.getByRole('button', { name: 'Hasta: 5 de octubre de 2026' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Días de Octubre de 2026' })).toBeNull();
    expect(screen.getByText('Rango seleccionado · 15 de septiembre de 2026 – 5 de octubre de 2026')).toBeTruthy();
  });

  it('shows honest empty states when the selected range has no sales', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Hasta: 14 de octubre de 2026' }));
    fireEvent.click(screen.getByRole('button', { name: 'Domingo, 25 de octubre' }));
    fireEvent.click(screen.getByRole('button', { name: 'Desde: 15 de septiembre de 2026' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mes siguiente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Domingo, 25 de octubre' }));

    expect(screen.getByText('Rango seleccionado · 25 de octubre de 2026')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Resumen comparativo' }).textContent).toContain('sin periodo anterior comparable');
    expect(screen.getByText('No hay ventas para graficar con estos filtros.')).toBeTruthy();
    expect(screen.getByText('Sin productos vendidos en el periodo.')).toBeTruthy();
    expect(screen.getByText('Sin servicios vendidos en el periodo.')).toBeTruthy();
    expect(screen.getByText('Sin datos de empleados en el periodo.')).toBeTruthy();
  });

  it('does not change Agenda or business data while browsing analytics', () => {
    renderPage();
    const agendaBytes = localStorage.getItem('webbys:agenda:v1');

    fireEvent.click(screen.getByRole('button', { name: 'Hasta: 14 de octubre de 2026' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lunes, 5 de octubre' }));

    expect(localStorage.getItem('webbys:agenda:v1')).toBe(agendaBytes);
    expect(screen.queryByRole('button', { name: /registrar|editar|cancelar|eliminar|crear|guardar/i })).toBeNull();
  });
});
