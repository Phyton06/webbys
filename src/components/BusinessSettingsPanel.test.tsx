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
  it('shows business profile, the current read-only logo, MXN, and all seven unconfigured days', () => {
    render(<BusinessSettingsPanel />);

    expect((screen.getByLabelText('Nombre del negocio') as HTMLInputElement).value).toBe("Webby's Barbershop");
    expect(screen.getByRole('img', { name: 'Logotipo actual del negocio' }).getAttribute('src')).toBe('/logo.jpeg');
    expect(screen.queryByLabelText('Cambiar logotipo')).toBeNull();
    expect(screen.getByRole('button', { name: 'Moneda: Peso mexicano (MXN)' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Horario general/ })).toHaveLength(7);
    expect(screen.getByText('Tema actual: oscuro')).toBeTruthy();
  });

  it('saves business/admin fields and currency locally, then reloads them', () => {
    render(<BusinessSettingsPanel />);
    fireEvent.input(screen.getByLabelText('Nombre del negocio'), { target: { value: 'Barbería Central' } });
    fireEvent.input(screen.getByLabelText('Dirección del negocio'), { target: { value: 'Calle Norte 42' } });
    fireEvent.input(screen.getByLabelText('Teléfono del negocio'), { target: { value: '555-0188' } });
    fireEvent.input(screen.getByLabelText('Correo del negocio'), { target: { value: 'hola@example.test' } });
    fireEvent.input(screen.getByLabelText('Nombre del administrador'), { target: { value: 'Ana Torres' } });
    fireEvent.input(screen.getByLabelText('Correo del administrador'), { target: { value: 'ana@example.test' } });
    fireEvent.input(screen.getByLabelText('Teléfono del administrador'), { target: { value: '555-0199' } });
    fireEvent.click(screen.getByRole('button', { name: 'Moneda: Peso mexicano (MXN)' }));
    fireEvent.click(screen.getByRole('option', { name: 'Dólar estadounidense (USD)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar configuración' }));

    expect(screen.getByText('Configuración guardada localmente.')).toBeTruthy();
    expect(loadBusinessSettings(localStorage)).toMatchObject({
      status: 'loaded',
      settings: {
        business: { name: 'Barbería Central', address: 'Calle Norte 42', phone: '555-0188', email: 'hola@example.test' },
        administrator: { displayName: 'Ana Torres', email: 'ana@example.test', phone: '555-0199' },
        currency: 'USD',
      },
    });
  });

  it('requires valid opening times and keeps general hours informational', () => {
    render(<BusinessSettingsPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Horario general lunes: Sin configurar' }));
    fireEvent.click(screen.getByRole('option', { name: 'Abierto' }));
    fireEvent.input(screen.getByLabelText('Apertura del lunes'), { target: { value: '19:00' } });
    fireEvent.input(screen.getByLabelText('Cierre del lunes'), { target: { value: '09:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar configuración' }));

    expect(screen.getByRole('alert').textContent).toContain('Revisa las horas de apertura y cierre');
    expect(localStorage.getItem(BUSINESS_SETTINGS_STORAGE_KEY)).toBeNull();

    fireEvent.input(screen.getByLabelText('Apertura del lunes'), { target: { value: '09:00' } });
    fireEvent.input(screen.getByLabelText('Cierre del lunes'), { target: { value: '18:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar configuración' }));
    expect(loadBusinessSettings(localStorage).settings.hours.monday).toEqual({ status: 'open', opensAt: '09:00', closesAt: '18:00' });
    expect(screen.getByText(/No cambia la disponibilidad de citas/)).toBeTruthy();
  });

  it('persists local notification preferences without changing Agenda or notification history', () => {
    const agendaBytes = '{agenda remains unchanged';
    const notificationBytes = '{history remains unchanged';
    localStorage.setItem(AGENDA_STORAGE_KEY, agendaBytes);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, notificationBytes);
    render(<BusinessSettingsPanel />);
    fireEvent.click(screen.getByLabelText('Avisos de promociones'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar configuración' }));

    expect(loadBusinessSettings(localStorage).settings.notificationPreferences.promotion).toBe(true);
    expect(localStorage.getItem(AGENDA_STORAGE_KEY)).toBe(agendaBytes);
    expect(localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)).toBe(notificationBytes);
  });
});
