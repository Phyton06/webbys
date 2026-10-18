import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { createAgendaSeed } from '../data/agenda-demo';
import { loadAgendaState, saveAgendaState } from '../services/agenda-store';
import { createDefaultBusinessSettings, saveBusinessSettings } from '../services/business-settings-store';
import { ServicesPage } from './ServicesPage';

const now = new Date(2026, 9, 15, 8, 0);

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderPage() {
  localStorage.setItem('webbys:demo-session', 'active');
  saveAgendaState(localStorage, createAgendaSeed(now));
  return render(<ServicesPage />);
}

describe('ServicesPage', () => {
  it('paginates service records five at a time', () => {
    const state = createAgendaSeed(now);
    const template = state.services[0]!;
    state.services = [...state.services, ...Array.from({ length: 4 }, (_, index) => ({
      ...template,
      id: `service-page-${index}`,
      name: `Extra service ${index}`,
    }))];
    localStorage.setItem('webbys:demo-session', 'active');
    saveAgendaState(localStorage, state);
    render(<ServicesPage now={now} />);

    expect(document.querySelectorAll('.service-list > li')).toHaveLength(5);
    expect(screen.getByText('Página 1 de 2')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(document.querySelectorAll('.service-list > li')).toHaveLength(2);
    expect(screen.getByText('Página 2 de 2')).toBeTruthy();
  });

  it('formats service prices in the saved currency without changing stored prices', () => {
    const settings = createDefaultBusinessSettings();
    settings.currency = 'USD';
    saveBusinessSettings(localStorage, settings);
    const settingsBytes = localStorage.getItem('webbys:business-settings:v1');
    renderPage();

    expect(screen.getByRole('article', { name: 'Servicio Corte' }).textContent).toContain('USD');
    expect(loadAgendaState(localStorage, now).state.services.find(({ id }) => id === 'service-1')?.price).toBe(300);
    expect(localStorage.getItem('webbys:business-settings:v1')).toBe(settingsBytes);
  });

  it('uses the shared dialog close button and styled status dropdown', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo servicio' }));

    expect(screen.getByRole('button', { name: 'Cerrar formulario de servicio' }).className).toContain('view-back-link');
    fireEvent.click(screen.getByRole('button', { name: 'Estado: Todos' }));
    expect(screen.getByRole('listbox', { name: 'Estado' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Activos' })).toBeTruthy();
  });

  it('creates a service with description, price, duration, and active state', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo servicio' }));
    fireEvent.input(screen.getByLabelText('Nombre del servicio'), { target: { value: 'Corte premium' } });
    fireEvent.input(screen.getByLabelText('Descripción'), { target: { value: 'Corte personalizado' } });
    fireEvent.input(screen.getByLabelText('Precio'), { target: { value: '425' } });
    fireEvent.input(screen.getByLabelText('Duración en minutos'), { target: { value: '60' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar servicio' }));

    const saved = loadAgendaState(localStorage, now).state.services.find(({ name }) => name === 'Corte premium');
    expect(saved).toMatchObject({ name: 'Corte premium', description: 'Corte personalizado', price: 425, durationMinutes: 60, active: true });
  });

  it('searches services and deactivates without deleting the service record', () => {
    renderPage();
    fireEvent.input(screen.getByLabelText('Buscar servicios'), { target: { value: 'barba' } });
    expect(screen.getByRole('article', { name: 'Servicio Barba' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Desactivar servicio Barba' }));

    const saved = loadAgendaState(localStorage, now).state.services.find(({ id }) => id === 'service-2');
    expect(saved).toMatchObject({ id: 'service-2', active: false });
  });

  it('does not rewrite appointment history when deactivating its service', () => {
    const state = createAgendaSeed(now);
    const appointmentsBefore = state.appointments;
    localStorage.setItem('webbys:demo-session', 'active');
    saveAgendaState(localStorage, state);
    render(<ServicesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Desactivar servicio Barba' }));

    expect(loadAgendaState(localStorage, now).state.appointments).toEqual(appointmentsBefore);
  });
});
