import { describe, expect, it } from 'vitest';
import {
  authenticateDemoUser,
  endDemoSession,
  getDemoSessionRole,
  hasDemoSession,
  startDemoSession,
  validateCredentials,
} from './demo-auth';

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

describe('validateCredentials', () => {
  it('rejects a malformed email address', () => {
    expect(validateCredentials({ email: 'not-an-email', password: 'barber123' })).toEqual({
      email: 'Ingresa un correo electrónico válido.',
    });
  });

  it('requires a password with at least eight characters', () => {
    expect(validateCredentials({ email: 'admin@webbys.mx', password: 'short' })).toEqual({
      password: 'La contraseña debe tener al menos 8 caracteres.',
    });
  });

  it('accepts a valid email and password without checking real credentials', () => {
    expect(validateCredentials({ email: ' admin@webbys.mx ', password: 'barber123' })).toEqual({});
  });
});

describe('demo session', () => {
  it('starts and reads a namespaced browser-only demo session', () => {
    const storage = createMemoryStorage();
    storage.setItem('unrelated', 'keep');

    startDemoSession(storage);

    expect(hasDemoSession(storage)).toBe(true);
    expect(storage.getItem('unrelated')).toBe('keep');
  });

  it('clears only the demo session when signing out', () => {
    const storage = createMemoryStorage();
    storage.setItem('unrelated', 'keep');
    startDemoSession(storage);

    endDemoSession(storage);

    expect(hasDemoSession(storage)).toBe(false);
    expect(storage.getItem('unrelated')).toBe('keep');
  });
});

describe('authenticateDemoUser', () => {
  it.each([
    ['admin@barber.com', 'admin', 'administrator'],
    ['asistente@barber.com', 'asistente', 'assistant'],
  ] as const)('authenticates %s with the %s demo credential', (email, password, role) => {
    expect(authenticateDemoUser({ email, password })).toBe(role);
  });

  it('rejects credentials that do not match a demo user', () => {
    expect(authenticateDemoUser({ email: 'assistant@barber.com', password: 'admin' })).toBeNull();
  });

  it('persists the authenticated role in the demo session', () => {
    const storage = createMemoryStorage();
    startDemoSession(storage, 'assistant');

    expect(hasDemoSession(storage)).toBe(true);
    expect(getDemoSessionRole(storage)).toBe('assistant');
  });
});
