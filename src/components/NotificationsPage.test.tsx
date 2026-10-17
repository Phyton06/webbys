import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAgendaSeed } from '../data/agenda-demo';
import { AGENDA_STORAGE_KEY, saveAgendaState } from '../services/agenda-store';
import { NOTIFICATIONS_STORAGE_KEY, loadNotifications } from '../services/notifications-store';
import { NotificationsPage } from './NotificationsPage';

const showLocalNotificationTestMock = vi.hoisted(() => vi.fn());
vi.mock('../services/local-notification-test', () => ({ showLocalNotificationTest: showLocalNotificationTestMock }));

const now = new Date(2026, 9, 17, 12, 0);

afterEach(() => {
  cleanup();
  localStorage.clear();
});

beforeEach(() => showLocalNotificationTestMock.mockReset());

function renderPage() {
  localStorage.setItem('webbys:demo-session', 'active');
  saveAgendaState(localStorage, createAgendaSeed(now));
  return render(<NotificationsPage now={now} />);
}

function fillComposer() {
  fireEvent.input(screen.getByLabelText('Título'), { target: { value: 'Nuevo servicio de barba' } });
  fireEvent.input(screen.getByLabelText('Mensaje'), { target: { value: 'Conoce el nuevo servicio.' } });
}

describe('NotificationsPage', () => {
  it('opens on History and opens the composer with a live message preview', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Historial de notificaciones' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva notificación' }));

    expect(screen.getByRole('heading', { name: 'Nueva notificación' })).toBeTruthy();
    fillComposer();
    expect(screen.getByRole('region', { name: 'Vista previa de notificación' }).textContent).toContain('Nuevo servicio de barba');
    expect(screen.getByRole('region', { name: 'Vista previa de notificación' }).textContent).toContain('Conoce el nuevo servicio.');
  });

  it('saves a simulated recipient send to local history without claiming actual delivery', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva notificación' }));
    fillComposer();
    fireEvent.click(screen.getByRole('button', { name: 'Simular envío' }));

    const saved = loadNotifications(localStorage);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ title: 'Nuevo servicio de barba', status: 'simulated' });
    expect(screen.getByText('Envío simulado; no se entregó a los destinatarios.')).toBeTruthy();
  });

  it('schedules a notification for the chosen local date and time without auto-sending', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva notificación' }));
    fillComposer();
    fireEvent.click(screen.getByRole('button', { name: 'Programar' }));
    expect(screen.getByRole('button', { name: /Fecha programada/ })).toBeTruthy();
    fireEvent.input(screen.getByLabelText('Hora programada'), { target: { value: '09:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar programación' }));

    const saved = loadNotifications(localStorage);
    expect(saved[0]).toMatchObject({ status: 'scheduled', scheduledFor: '2026-10-18T16:00:00.000Z' });
    expect(screen.getByText('Programación guardada localmente; no se enviará automáticamente.')).toBeTruthy();
  });

  it('does not request permission on load and tests only the current device when clicked', async () => {
    showLocalNotificationTestMock.mockResolvedValue('shown');
    renderPage();
    expect(showLocalNotificationTestMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva notificación' }));
    fillComposer();
    const agendaBytes = localStorage.getItem(AGENDA_STORAGE_KEY);

    fireEvent.click(screen.getByRole('button', { name: 'Probar en este dispositivo' }));
    await vi.waitFor(() => expect(showLocalNotificationTestMock).toHaveBeenCalledOnce());
    expect(showLocalNotificationTestMock).toHaveBeenCalledWith('Nuevo servicio de barba', 'Conoce el nuevo servicio.', expect.any(Object));
    await vi.waitFor(() => expect(screen.getByText(/Permiso: Permiso concedido en este dispositivo/)).toBeTruthy());
    expect(screen.getByText(/Notificación local mostrada solo en este dispositivo; no se envió a destinatarios/)).toBeTruthy();
    expect(loadNotifications(localStorage)).toEqual([]);
    expect(localStorage.getItem(AGENDA_STORAGE_KEY)).toBe(agendaBytes);
    expect(localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)).toBeNull();
  });

  it('stores the user-selected audience as ID/name snapshots without contact details', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva notificación' }));
    fillComposer();
    fireEvent.click(screen.getByRole('button', { name: 'Tipo de destinatarios: Clientes' }));
    fireEvent.click(screen.getByRole('option', { name: 'Empleados' }));
    fireEvent.click(screen.getByRole('button', { name: 'Segmento de empleados: Todos los empleados activos' }));
    fireEvent.click(screen.getByRole('option', { name: 'Barberos activos' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));

    expect(loadNotifications(localStorage)[0]?.audience).toMatchObject({
      recipientKind: 'employees',
      segment: 'barbers',
      recipients: [{ id: 'barber-1', name: 'Diego' }, { id: 'barber-2', name: 'Raúl' }, { id: 'barber-3', name: 'Andrés' }],
    });
    expect(JSON.stringify(loadNotifications(localStorage)[0])).not.toContain('phone');
  });

  it('closes each custom dropdown after selecting an option', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva notificación' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tipo de destinatarios: Clientes' }));
    fireEvent.click(screen.getByRole('option', { name: 'Empleados' }));

    expect(screen.queryByRole('listbox', { name: 'Tipo de destinatarios' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Segmento de empleados: Todos los empleados activos' })).toBeTruthy();
  });
});
