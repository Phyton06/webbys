import { describe, expect, it } from 'vitest';
import { createAgendaSeed } from '../data/agenda-demo';
import {
  AGENDA_STORAGE_KEY,
  AGENDA_STORAGE_VERSION,
  loadAgendaState,
  saveAgendaState,
} from './agenda-store';

const now = new Date(2026, 9, 14, 8, 0);

function createMemoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set(AGENDA_STORAGE_KEY, initial);

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, String(value)),
    storedValue: () => values.get(AGENDA_STORAGE_KEY) ?? null,
  };
}

describe('loadAgendaState and saveAgendaState', () => {
  it('seeds and persists an initial versioned state when storage is empty', () => {
    const storage = createMemoryStorage();
    const result = loadAgendaState(storage, now);
    const saved = JSON.parse(storage.storedValue() ?? '{}') as { version?: number; state?: unknown };

    expect(result.status).toBe('seeded');
    expect(result.state.appointments.length).toBeGreaterThan(0);
    expect(saved.version).toBe(AGENDA_STORAGE_VERSION);
    expect(saved.state).toEqual(result.state);
  });

  it('loads a valid saved state without reseeding it', () => {
    const storage = createMemoryStorage();
    const savedState = createAgendaSeed(now);
    saveAgendaState(storage, savedState);

    expect(loadAgendaState(storage, new Date(2027, 0, 1)).status).toBe('loaded');
    expect(loadAgendaState(storage, new Date(2027, 0, 1)).state).toEqual(savedState);
  });

  it('normalizes legacy barbers without rewriting stored bytes during load', () => {
    const { employees: _employees, ...legacyState } = createAgendaSeed(now);
    const original = JSON.stringify({ version: AGENDA_STORAGE_VERSION, state: legacyState });
    const storage = createMemoryStorage(original);

    const result = loadAgendaState(storage, now);

    expect(result.status).toBe('loaded');
    expect(result.state.employees?.map(({ id, role, active, invitationStatus }) => ({
      id,
      role,
      active,
      invitationStatus,
    }))).toEqual(legacyState.barbers.map(({ id }) => ({
      id,
      role: 'barber',
      active: true,
      invitationStatus: 'completed',
    })));
    expect(result.state.appointments).toEqual(legacyState.appointments);
    expect(result.state.schedules).toEqual(legacyState.schedules);
    expect(result.state.exceptions).toEqual(legacyState.exceptions);
    expect(storage.storedValue()).toBe(original);
  });

  it('writes normalized employee records on the next deliberate save', () => {
    const { employees: _employees, ...legacyState } = createAgendaSeed(now);
    const storage = createMemoryStorage();

    saveAgendaState(storage, legacyState);

    const saved = JSON.parse(storage.storedValue() ?? '{}') as { state?: { employees?: unknown[] } };
    expect(saved.state?.employees).toHaveLength(legacyState.barbers.length);
  });

  it.each([
    { role: 'owner', active: true, invitationStatus: 'pending' },
    { role: 'barber', active: 'yes', invitationStatus: 'pending' },
    { role: 'barber', active: true, invitationStatus: 'sent' },
    { role: 'barber', active: true, invitationStatus: 'pending', phone: 123 },
    { role: 'barber', active: true, invitationStatus: 'pending', id: '' },
    { role: 'barber', active: true, invitationStatus: 'pending', name: '  ' },
  ])('rejects invalid persisted employee metadata without overwriting bytes', (employee) => {
    const state = createAgendaSeed(now);
    const malformedState = {
      ...state,
      employees: [{ id: 'employee-1', name: 'Ana', phone: '555-0100', ...employee }],
    };
    const original = JSON.stringify({ version: AGENDA_STORAGE_VERSION, state: malformedState });
    const storage = createMemoryStorage(original);

    expect(loadAgendaState(storage, now).status).toBe('invalid');
    expect(storage.storedValue()).toBe(original);
  });

  it('rejects duplicate employee IDs without overwriting stored bytes', () => {
    const state = createAgendaSeed(now);
    const employees = state.employees ?? [];
    const duplicate = employees[0];
    if (!duplicate) throw new Error('Expected a seeded employee');
    const malformedState = { ...state, employees: [...employees, { ...duplicate }] };
    const original = JSON.stringify({ version: AGENDA_STORAGE_VERSION, state: malformedState });
    const storage = createMemoryStorage(original);

    expect(loadAgendaState(storage, now).status).toBe('invalid');
    expect(storage.storedValue()).toBe(original);
  });

  it('persists service descriptions and active state while retaining legacy service records', () => {
    const state = createAgendaSeed(now);
    state.services[0] = { ...state.services[0]!, description: 'Corte clásico', active: true };
    const storage = createMemoryStorage();

    saveAgendaState(storage, state);

    const loaded = loadAgendaState(storage, now);
    expect(loaded.state.services[0]).toMatchObject({ description: 'Corte clásico', active: true });
  });

  it('rejects an invalid service active state without overwriting stored bytes', () => {
    const state = createAgendaSeed(now);
    const malformed = { ...state, services: state.services.map((service) => ({ ...service, active: 'yes' })) };
    const original = JSON.stringify({ version: AGENDA_STORAGE_VERSION, state: malformed });
    const storage = createMemoryStorage(original);

    expect(loadAgendaState(storage, now).status).toBe('invalid');
    expect(storage.storedValue()).toBe(original);
  });

  it('round-trips inventory product records with optional acquisition cost and image', () => {
    const state = createAgendaSeed(now);
    state.products = [{
      id: 'product-cera',
      name: 'Cera mate',
      description: 'Fijación media',
      salePrice: 180,
      stock: 12,
      category: 'Cabello',
      active: true,
    }];
    const storage = createMemoryStorage();

    saveAgendaState(storage, state);

    expect(loadAgendaState(storage, now).state.products).toEqual(state.products);
  });

  it('rejects negative product stock without overwriting stored bytes', () => {
    const state = createAgendaSeed(now);
    const malformed = {
      ...state,
      products: [{ id: 'product-bad', name: 'Producto', description: '', salePrice: 10, stock: -1, category: 'Cabello', active: true }],
    };
    const original = JSON.stringify({ version: AGENDA_STORAGE_VERSION, state: malformed });
    const storage = createMemoryStorage(original);

    expect(loadAgendaState(storage, now).status).toBe('invalid');
    expect(storage.storedValue()).toBe(original);
  });

  it.each([
    ['email', 42],
    ['active', 'false'],
  ] as const)('rejects a malformed optional client %s field without overwriting stored data', (field, value) => {
    const state = createAgendaSeed(now);
    const firstClient = state.clients[0];
    if (!firstClient) throw new Error('Expected a seeded client');
    const malformedState = {
      ...state,
      clients: state.clients.map((client) => client.id === firstClient.id ? { ...client, [field]: value } : client),
    };
    const original = JSON.stringify({ version: AGENDA_STORAGE_VERSION, state: malformedState });
    const storage = createMemoryStorage(original);

    expect(loadAgendaState(storage, now).status).toBe('invalid');
    expect(storage.storedValue()).toBe(original);
  });

  it('returns a seed for malformed JSON while preserving the unreadable bytes', () => {
    const storage = createMemoryStorage('{not-json');
    const original = storage.storedValue();

    const result = loadAgendaState(storage, now);

    expect(result.status).toBe('invalid');
    expect(result.state.appointments.length).toBeGreaterThan(0);
    expect(storage.storedValue()).toBe(original);
  });

  it('returns a seed for an unsupported version without overwriting it', () => {
    const storage = createMemoryStorage(JSON.stringify({ version: AGENDA_STORAGE_VERSION + 1, state: {} }));
    const original = storage.storedValue();

    expect(loadAgendaState(storage, now).status).toBe('invalid');
    expect(storage.storedValue()).toBe(original);
  });

  it('reports unavailable storage reads without attempting to overwrite it', () => {
    let writes = 0;
    const storage = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { writes += 1; },
    };

    expect(loadAgendaState(storage, now).status).toBe('invalid');
    expect(writes).toBe(0);
  });

  it('propagates storage write failures when explicitly saving an edited state', () => {
    const storage = {
      getItem: () => null,
      setItem: () => { throw new Error('quota exceeded'); },
    };

    expect(() => saveAgendaState(storage, createAgendaSeed(now))).toThrow('quota exceeded');
  });
});
