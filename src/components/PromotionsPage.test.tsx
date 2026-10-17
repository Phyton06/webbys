import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { createAgendaSeed } from '../data/agenda-demo';
import { loadAgendaState, saveAgendaState } from '../services/agenda-store';
import { PromotionsPage } from './PromotionsPage';

const now = new Date(2026, 9, 15, 8, 0);

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderPage() {
  localStorage.setItem('webbys:demo-session', 'active');
  saveAgendaState(localStorage, createAgendaSeed(now));
  return render(<PromotionsPage now={now} />);
}

describe('PromotionsPage', () => {
  it('creates a promotion with product and service price snapshots and previews the discount', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva promoción' }));
    fireEvent.input(screen.getByLabelText('Nombre de la promoción'), { target: { value: 'Corte y cuidado' } });
    fireEvent.input(screen.getByLabelText('Descripción'), { target: { value: 'Precio especial.' } });
    fireEvent.input(screen.getByRole('combobox', { name: 'Buscar productos y servicios' }), { target: { value: 'corte' } });
    fireEvent.click(screen.getByRole('option', { name: 'Servicio: Corte · $300' }));
    fireEvent.input(screen.getByRole('combobox', { name: 'Buscar productos y servicios' }), { target: { value: 'shampoo' } });
    fireEvent.click(screen.getByRole('option', { name: /Producto: Shampoo/ }));
    fireEvent.input(screen.getByLabelText('Descuento del paquete (%)'), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar promoción' }));

    const saved = loadAgendaState(localStorage, now).state.promotions?.[0];
    expect(saved).toMatchObject({ name: 'Corte y cuidado', originalPrice: 460, discountType: 'percentage', discountValue: 20 });
    expect(saved?.targets.map(({ id, name, price }) => ({ id, name, price }))).toEqual([
      { id: 'service-1', name: 'Corte', price: 300 },
      { id: 'product-shampoo', name: 'Shampoo', price: 160 },
    ]);
    expect(screen.getAllByText('$368').length).toBeGreaterThan(0);
  });

  it('derives the promotion status from dates and lets the administrator disable it', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva promoción' }));
    fireEvent.input(screen.getByLabelText('Nombre de la promoción'), { target: { value: 'Oferta futura' } });
    fireEvent.input(screen.getByRole('combobox', { name: 'Buscar productos y servicios' }), { target: { value: 'corte' } });
    fireEvent.click(screen.getByRole('option', { name: 'Servicio: Corte · $300' }));
    fireEvent.click(screen.getByRole('button', { name: 'Inicio: 15 de octubre de 2026' }));
    fireEvent.click(screen.getByRole('button', { name: 'Martes, 20 de octubre' }));
    fireEvent.click(screen.getByRole('button', { name: 'Estado de publicación: Borrador' }));
    fireEvent.click(screen.getByRole('option', { name: 'Publicar según fechas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar promoción' }));

    expect(screen.getByText('Programada')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Desactivar promoción Oferta futura' }));
    expect(loadAgendaState(localStorage, now).state.promotions?.[0]?.manualStatus).toBe('disabled');
  });

  it('searches targets, adds them to the selected list, and removes them on request', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva promoción' }));
    const search = screen.getByRole('combobox', { name: 'Buscar productos y servicios' });
    fireEvent.input(search, { target: { value: 'shampoo' } });
    expect(screen.getByRole('listbox', { name: 'Resultados de productos y servicios' })).toBeTruthy();
    fireEvent.click(screen.getByRole('option', { name: 'Producto: Shampoo · $160' }));

    expect(screen.getByText('Seleccionados (1)')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar Shampoo' }));
    expect(screen.getByText('Seleccionados (0)')).toBeTruthy();
  });

  it('offers individual discounts for selected products and services without making a bundle', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva promoción' }));
    fireEvent.input(screen.getByLabelText('Nombre de la promoción'), { target: { value: 'Descuento en productos' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tipo de promoción: Paquete de productos o servicios' }));
    fireEvent.click(screen.getByRole('option', { name: 'Descuento individual por elemento' }));
    fireEvent.input(screen.getByRole('combobox', { name: 'Buscar productos y servicios' }), { target: { value: 'corte' } });
    fireEvent.click(screen.getByRole('option', { name: 'Servicio: Corte · $300' }));
    fireEvent.input(screen.getByRole('combobox', { name: 'Buscar productos y servicios' }), { target: { value: 'shampoo' } });
    fireEvent.click(screen.getByRole('option', { name: 'Producto: Shampoo · $160' }));
    fireEvent.input(screen.getByLabelText('Descuento individual (%)'), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar promoción' }));

    const saved = loadAgendaState(localStorage, now).state.promotions?.[0];
    expect(saved?.mode).toBe('product_discount');
    expect(saved?.targets.map(({ kind }) => kind)).toEqual(['service', 'product']);
    const preview = screen.getByRole('article', { name: 'Vista previa para cliente' });
    expect(preview.textContent).toContain('$128');
    expect(preview.textContent).toContain('$240');
  });

  it('preserves an already selected service when switching to individual discounts', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva promoción' }));
    fireEvent.input(screen.getByLabelText('Nombre de la promoción'), { target: { value: 'Corte individual' } });
    fireEvent.input(screen.getByRole('combobox', { name: 'Buscar productos y servicios' }), { target: { value: 'corte' } });
    fireEvent.click(screen.getByRole('option', { name: 'Servicio: Corte · $300' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tipo de promoción: Paquete de productos o servicios' }));
    fireEvent.click(screen.getByRole('option', { name: 'Descuento individual por elemento' }));

    expect(screen.getByRole('button', { name: 'Quitar Corte' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar promoción' }));
    expect(loadAgendaState(localStorage, now).state.promotions?.[0]?.targets).toMatchObject([
      { kind: 'service', id: 'service-1', name: 'Corte', price: 300 },
    ]);
  });

  it('opens and chooses promotion targets from the dropdown with keyboard navigation', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva promoción' }));
    const search = screen.getByRole('combobox', { name: 'Buscar productos y servicios' });
    fireEvent.focus(search);
    expect(search.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(search, { key: 'ArrowDown' });
    expect(search.getAttribute('aria-activedescendant')).toBe('promotion-target-options-0');
    fireEvent.keyDown(search, { key: 'Enter' });
    expect(screen.getByText('Seleccionados (1)')).toBeTruthy();
  });

  it('keeps the promotion calendar collapsed until a date control is opened', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva promoción' }));

    expect(screen.queryByRole('group', { name: 'Días de Octubre de 2026' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Inicio: 15 de octubre de 2026' }));
    expect(screen.getByRole('group', { name: 'Días de Octubre de 2026' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Lunes, 19 de octubre' }));
    expect(screen.queryByRole('group', { name: 'Días de Octubre de 2026' })).toBeNull();
    expect(screen.getByRole('button', { name: /Inicio: 19 de octubre de 2026/ })).toBeTruthy();
  });

  it('rejects a promotion without any targets', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva promoción' }));
    fireEvent.input(screen.getByLabelText('Nombre de la promoción'), { target: { value: 'Sin objetivo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar promoción' }));

    expect(screen.getByRole('alert').textContent).toContain('Selecciona al menos un producto o servicio');
    expect(loadAgendaState(localStorage, now).state.promotions).toBeUndefined();
  });

  it('keeps the original target and price snapshots when catalog prices change', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva promoción' }));
    fireEvent.input(screen.getByLabelText('Nombre de la promoción'), { target: { value: 'Corte especial' } });
    fireEvent.input(screen.getByRole('combobox', { name: 'Buscar productos y servicios' }), { target: { value: 'corte' } });
    fireEvent.click(screen.getByRole('option', { name: 'Servicio: Corte · $300' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar promoción' }));

    const savedState = loadAgendaState(localStorage, now).state;
    saveAgendaState(localStorage, {
      ...savedState,
      services: savedState.services.map((service) => service.id === 'service-1'
        ? { ...service, name: 'Corte actualizado', price: 450 }
        : service),
    });
    cleanup();
    render(<PromotionsPage now={now} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver promoción Corte especial' }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.input(screen.getByLabelText('Descripción'), { target: { value: 'Texto actualizado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar promoción' }));

    const updated = loadAgendaState(localStorage, now).state.promotions?.[0];
    expect(updated?.originalPrice).toBe(300);
    expect(updated?.targets[0]).toMatchObject({ id: 'service-1', name: 'Corte', price: 300 });
    expect(loadAgendaState(localStorage, now).state.services.find(({ id }) => id === 'service-1')?.price).toBe(450);
  });
});
