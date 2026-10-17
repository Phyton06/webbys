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
    fireEvent.click(screen.getByLabelText('Servicio: Corte'));
    fireEvent.click(screen.getByLabelText('Producto: Shampoo'));
    fireEvent.input(screen.getByLabelText('Descuento (%)'), { target: { value: '20' } });
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
    fireEvent.click(screen.getByLabelText('Servicio: Corte'));
    fireEvent.input(screen.getByLabelText('Fecha de inicio'), { target: { value: '2026-10-20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Estado de publicación: Borrador' }));
    fireEvent.click(screen.getByRole('option', { name: 'Publicar según fechas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar promoción' }));

    expect(screen.getByText('Programada')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Desactivar promoción Oferta futura' }));
    expect(loadAgendaState(localStorage, now).state.promotions?.[0]?.manualStatus).toBe('disabled');
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
    fireEvent.click(screen.getByLabelText('Servicio: Corte'));
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
