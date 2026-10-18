const demoSessionKey = 'webbys:demo-session';

export type DemoRole = 'administrator' | 'assistant' | 'barber';

const DEMO_USERS: Record<string, { password: string; role: DemoRole }> = {
  'admin@barber.com': { password: 'admin', role: 'administrator' },
  'asistente@barber.com': { password: 'asistente', role: 'assistant' },
  'barbero@barber.com': { password: 'barber', role: 'barber' },
};

export interface Credentials {
  email: string;
  password: string;
}

export interface CredentialErrors {
  email?: string;
  password?: string;
}

export function authenticateDemoUser({ email, password }: Credentials): DemoRole | null {
  const user = DEMO_USERS[email.trim().toLocaleLowerCase('en')];
  return user?.password === password ? user.role : null;
}

export function validateCredentials({ email, password }: Credentials): CredentialErrors {
  const errors: CredentialErrors = {};
  const normalizedEmail = email.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }

  if (password.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres.';
  }

  return errors;
}

export function startDemoSession(storage: Pick<Storage, 'setItem'>, role: DemoRole = 'administrator'): void {
  storage.setItem(demoSessionKey, role);
}

export function hasDemoSession(storage: Pick<Storage, 'getItem'>): boolean {
  return getDemoSessionRole(storage) !== null;
}

export function getDemoSessionRole(storage: Pick<Storage, 'getItem'>): DemoRole | null {
  const role = storage.getItem(demoSessionKey);
  if (role === 'administrator' || role === 'assistant' || role === 'barber') return role;
  return role === 'active' ? 'administrator' : null;
}

export function endDemoSession(storage: Pick<Storage, 'removeItem'>): void {
  storage.removeItem(demoSessionKey);
}
