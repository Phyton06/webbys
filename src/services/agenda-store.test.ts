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
