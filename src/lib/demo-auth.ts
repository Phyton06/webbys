const demoSessionKey = 'webbys:demo-session';

export interface Credentials {
  email: string;
  password: string;
}

export interface CredentialErrors {
  email?: string;
  password?: string;
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

export function startDemoSession(storage: Pick<Storage, 'setItem'>): void {
  storage.setItem(demoSessionKey, 'active');
}

export function hasDemoSession(storage: Pick<Storage, 'getItem'>): boolean {
  return storage.getItem(demoSessionKey) === 'active';
}

export function endDemoSession(storage: Pick<Storage, 'removeItem'>): void {
  storage.removeItem(demoSessionKey);
}
