import { cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { createAgendaSeed } from '../data/agenda-demo';
import { loadAgendaState, saveAgendaState } from '../services/agenda-store';
import { createDefaultBusinessSettings, saveBusinessSettings } from '../services/business-settings-store';
import { ProductsPage } from './ProductsPage';

const now = new Date(2026, 9, 15, 8, 0);

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderPage() {
  localStorage.setItem('webbys:demo-session', 'active');
  saveAgendaState(localStorage, createAgendaSeed(now));
  return render(<ProductsPage />);
}

describe('ProductsPage', () => {
  it('formats product prices in the saved currency without changing stored prices', () => {
    const settings = createDefaultBusinessSettings();
    settings.currency = 'USD';
    saveBusinessSettings(localStorage, settings);
    const settingsBytes = localStorage.getItem('webbys:business-settings:v1');
    renderPage();
    const product = loadAgendaState(localStorage, now).state.products?.find(({ name }) => name === 'Shampoo');

    expect(screen.getByRole('article', { name: 'Producto Shampoo' }).textContent).toContain('USD');
    expect(product?.salePrice).toBe(160);
    expect(localStorage.getItem('webbys:business-settings:v1')).toBe(settingsBytes);
  });

  it('starts with seven demo products in the saved catalog', () => {
    renderPage();

    expect(screen.getAllByRole('article')).toHaveLength(7);
    expect(screen.getByRole('article', { name: 'Producto Cera para peinar' })).toBeTruthy();
    expect(screen.getByRole('article', { name: 'Producto Acondicionador' })).toBeTruthy();
    expect(screen.getByRole('article', { name: 'Producto Bálsamo para barba' })).toBeTruthy();
    expect(screen.getByRole('article', { name: 'Producto Peine de madera' })).toBeTruthy();
  });

  it('adds the new demo products to an existing catalog without duplicating or replacing records', () => {
    const state = createAgendaSeed(now);
    const originalProducts = state.products ?? [];
    const existing = { ...originalProducts[0]!, stock: 3 };
    state.products = [existing];
    localStorage.setItem('webbys:demo-session', 'active');
    saveAgendaState(localStorage, state);
    render(<ProductsPage />);

    const saved = loadAgendaState(localStorage, now).state;
    expect(saved.products).toHaveLength(7);
    expect(saved.products?.find(({ id }) => id === existing.id)).toEqual(existing);
    expect(saved.appointments).toEqual(state.appointments);
    expect(saved.products?.filter(({ id }) => id === 'product-wax')).toHaveLength(1);
  });

  it('creates a product with price, optional cost, stock, category, and local image path', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo producto' }));
    fireEvent.input(screen.getByLabelText('Nombre del producto'), { target: { value: 'Cera mate' } });
    fireEvent.input(screen.getByLabelText('Descripción'), { target: { value: 'Fijación media' } });
    fireEvent.input(screen.getByLabelText('Precio de venta'), { target: { value: '180' } });
    fireEvent.input(screen.getByLabelText('Costo de adquisición (opcional)'), { target: { value: '90' } });
    fireEvent.input(screen.getByLabelText('Existencias'), { target: { value: '12' } });
    fireEvent.input(screen.getByLabelText('Categoría'), { target: { value: 'Cabello' } });
    fireEvent.input(screen.getByLabelText('Imagen (ruta local)'), { target: { value: '/products/cera-mate.png' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar producto' }));

    expect(loadAgendaState(localStorage, now).state.products?.find(({ name }) => name === 'Cera mate')).toMatchObject({
      name: 'Cera mate', description: 'Fijación media', salePrice: 180, costPrice: 90,
      stock: 12, category: 'Cabello', imagePath: '/products/cera-mate.png', active: true,
    });
  });

  it('searches and filters products by active state and category', () => {
    renderPage();
    fireEvent.input(screen.getByLabelText('Buscar productos'), { target: { value: 'shampoo' } });
    expect(screen.getByRole('article', { name: 'Producto Shampoo' })).toBeTruthy();
    expect(screen.queryByRole('article', { name: 'Producto Gel para cabello' })).toBeNull();
    fireEvent.input(screen.getByLabelText('Buscar productos'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar por categoría: Todas' }));
    fireEvent.click(screen.getByRole('option', { name: 'Cabello' }));
    expect(screen.getByRole('article', { name: 'Producto Shampoo' })).toBeTruthy();
    expect(screen.queryByRole('article', { name: 'Producto Aceite para barba' })).toBeNull();
  });

  it('rejects negative stock and leaves the product collection unchanged', () => {
    renderPage();
    const before = loadAgendaState(localStorage, now).state.products;
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo producto' }));
    fireEvent.input(screen.getByLabelText('Nombre del producto'), { target: { value: 'Producto inválido' } });
    fireEvent.input(screen.getByLabelText('Precio de venta'), { target: { value: '10' } });
    fireEvent.input(screen.getByLabelText('Existencias'), { target: { value: '-1' } });
    fireEvent.input(screen.getByLabelText('Categoría'), { target: { value: 'Cabello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar producto' }));

    expect((screen.getByLabelText('Existencias') as HTMLInputElement).validity.rangeUnderflow).toBe(true);
    expect(loadAgendaState(localStorage, now).state.products).toEqual(before);
  });

  it('deactivates without deleting the product record', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Desactivar producto Shampoo' }));

    expect(loadAgendaState(localStorage, now).state.products?.find(({ name }) => name === 'Shampoo')?.active).toBe(false);
  });

  it('uses the shared minimal back link for the return control', () => {
    renderPage();
    const createButton = screen.getByRole('button', { name: 'Nuevo producto' });
    const shampoo = screen.getByRole('article', { name: 'Producto Shampoo' });
    fireEvent.click(within(shampoo).getByRole('button', { name: 'ShampooLimpieza diaria para cabello.' }));
    const backButton = screen.getByRole('button', { name: 'Volver a Productos' });

    expect(createButton.classList.contains('product-flow-button')).toBe(true);
    expect(backButton.classList.contains('view-back-link')).toBe(true);
    expect(backButton.classList.contains('product-flow-button')).toBe(false);
  });
});
