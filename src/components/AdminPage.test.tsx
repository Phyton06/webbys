import { cleanup, render, screen, within } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { createAgendaSeed } from '../data/agenda-demo';
import { saveAgendaState } from '../services/agenda-store';
import { AdminPage } from './AdminPage';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('AdminPage', () => {
  it('uses the persisted agenda appointments in the dashboard', async () => {
    localStorage.setItem('webbys:demo-session', 'active');
    const state = createAgendaSeed(new Date());
    const original = state.appointments[0];
    if (!original) throw new Error('Expected a seeded appointment');
    state.appointments = [{
      ...original,
      id: 'persisted-agenda-appointment',
      startsAt: new Date(Date.now() + 60 * 60_000).toISOString(),
      clientName: 'Cliente guardado',
      status: 'confirmed',
    }];
    saveAgendaState(localStorage, state);

    render(<AdminPage />);

    const nextAppointment = await screen.findByRole('region', { name: 'Siguiente cita' });
    expect(within(nextAppointment).getByText('Cliente guardado')).toBeTruthy();
    expect(within(nextAppointment).queryByText('Mateo Cruz')).toBeNull();
  });
});
