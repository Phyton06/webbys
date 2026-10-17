import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { BUSINESS_SETTINGS_STORAGE_KEY, loadBusinessSettings } from '../services/business-settings-store';
import { AGENDA_STORAGE_KEY } from '../services/agenda-store';
import { NOTIFICATIONS_STORAGE_KEY } from '../services/notifications-store';
import { BusinessSettingsPanel } from './BusinessSettingsPanel';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('BusinessSettingsPanel', () => {
  it('shows only the selected business profile and its read-only logo', () => {
    render(<BusinessSettingsPanel section="business" />);

    expect((screen.getByLabelText('Nombre del negocio') as HTMLInputElement).value).toBe("Webby's Barbershop");
    expect(screen.getByRole('img', { name: 'Logotipo actual del negocio' }).getAttribute('src')).toBe('/logo.jpeg');
    expect(screen.queryByLabelText('Cambiar logotipo')).toBeNull();
    expect(screen.queryByLabelText('Nombre del administrador')).toBeNull();
    expect(screen.queryByLabelText('Avisos de promociones')).toBeNull();
  });

  it('saves only the selected business profile category', () => {
    render(<BusinessSettingsPanel section="business" />);
    fireEvent.input(screen.getByLabelText('Nombre del negocio'), { target: { value: 'Barbería Central' } });
    fireEvent.input(screen.getByLabelText('Dirección del negocio'), { target: { value: 'Calle Norte 42' } });
    fireEvent.input(screen.getByLabelText('Teléfono del negocio'), { target: { value: '555-0188' } });
    fireEvent.input(screen.getByLabelText('Correo del negocio'), { target: { value: 'hola@example.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(screen.getByText('Configuración guardada localmente.')).toBeTruthy();
    expect(loadBusinessSettings(localStorage)).toMatchObject({
      status: 'loaded',
      settings: {
        business: { name: 'Barbería Central', address: 'Calle Norte 42', phone: '555-0188', email: 'hola@example.test' },
        administrator: { displayName: '', email: '', phone: '' },
        currency: 'MXN',
      },
    });
  });

  it('shows and saves the administrator profile separately', () => {
    render(<BusinessSettingsPanel section="administrator" />);
    expect(screen.getByLabelText('Nombre del administrador')).toBeTruthy();
    expect(screen.queryByLabelText('Nombre del negocio')).toBeNull();
    fireEvent.input(screen.getByLabelText('Nombre del administrador'), { target: { value: 'Ana Torres' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(loadBusinessSettings(localStorage).settings.administrator.displayName).toBe('Ana Torres');
    expect(loadBusinessSettings(localStorage).settings.business.name).toBe("Webby's Barbershop");
  });

  it('shows and saves the currency category separately', () => {
    render(<BusinessSettingsPanel section="currency" />);
    expect(screen.getByRole('button', { name: 'Moneda: Peso mexicano (MXN)' })).toBeTruthy();
    expect(screen.queryByLabelText('Nombre del negocio')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Moneda: Peso mexicano (MXN)' }));
    fireEvent.click(screen.getByRole('option', { name: 'Dólar estadounidense (USD)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(loadBusinessSettings(localStorage).settings.currency).toBe('USD');
    expect(loadBusinessSettings(localStorage).settings.business.name).toBe("Webby's Barbershop");
  });

  it('requires valid opening times and keeps general hours informational', () => {
    render(<BusinessSettingsPanel section="hours" />);
    fireEvent.click(screen.getByRole('button', { name: 'Horario general lunes: Sin configurar' }));
    fireEvent.click(screen.getByRole('option', { name: 'Abierto' }));
    fireEvent.input(screen.getByLabelText('Apertura del lunes'), { target: { value: '19:00' } });
    fireEvent.input(screen.getByLabelText('Cierre del lunes'), { target: { value: '09:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(screen.getByRole('alert').textContent).toContain('Revisa las horas de apertura y cierre');
    expect(localStorage.getItem(BUSINESS_SETTINGS_STORAGE_KEY)).toBeNull();

    fireEvent.input(screen.getByLabelText('Apertura del lunes'), { target: { value: '09:00' } });
    fireEvent.input(screen.getByLabelText('Cierre del lunes'), { target: { value: '18:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(loadBusinessSettings(localStorage).settings.hours.monday).toEqual({ status: 'open', opensAt: '09:00', closesAt: '18:00' });
    expect(screen.getByText(/No cambia la disponibilidad de citas/)).toBeTruthy();
  });

  it('persists local notification preferences without changing Agenda or notification history', () => {
    const agendaBytes = '{agenda remains unchanged';
    const notificationBytes = '{history remains unchanged';
    localStorage.setItem(AGENDA_STORAGE_KEY, agendaBytes);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, notificationBytes);
    render(<BusinessSettingsPanel section="notificationPreferences" />);
    fireEvent.click(screen.getByLabelText('Avisos de promociones'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(loadBusinessSettings(localStorage).settings.notificationPreferences.promotion).toBe(true);
    expect(localStorage.getItem(AGENDA_STORAGE_KEY)).toBe(agendaBytes);
    expect(localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)).toBe(notificationBytes);
  });

  it('keeps an unsaved draft while navigating and does not save it with another category', () => {
    const view = render(<BusinessSettingsPanel section="business" />);
    fireEvent.input(screen.getByLabelText('Nombre del negocio'), { target: { value: 'Borrador no guardado' } });
    view.rerender(<BusinessSettingsPanel section="currency" />);
    fireEvent.click(screen.getByRole('button', { name: 'Moneda: Peso mexicano (MXN)' }));
    fireEvent.click(screen.getByRole('option', { name: 'Dólar estadounidense (USD)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(loadBusinessSettings(localStorage).settings.currency).toBe('USD');
    expect(loadBusinessSettings(localStorage).settings.business.name).toBe("Webby's Barbershop");
    view.rerender(<BusinessSettingsPanel section="business" />);
    expect((screen.getByLabelText('Nombre del negocio') as HTMLInputElement).value).toBe('Borrador no guardado');
    expect(screen.getByText('Cambios sin guardar')).toBeTruthy();
  });
});
