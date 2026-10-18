import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { getDemoSessionRole, type DemoRole } from '../lib/demo-auth';
import { BackLink } from './BackLink';
import { sitePath } from '../lib/site-path';

interface AdminGateProps {
  children: ComponentChildren;
  onUnauthenticated?: () => void;
  storage?: Pick<Storage, 'getItem'>;
  role?: DemoRole | 'any';
}

type GateState = 'checking' | 'authorized' | 'denied' | 'wrong-role';

export function AdminGate({ children, onUnauthenticated, storage, role = 'administrator' }: AdminGateProps) {
  const [state, setState] = useState<GateState>('checking');

  useEffect(() => {
    let authorized = false;

    try {
      const currentRole = getDemoSessionRole(storage ?? window.localStorage);
      authorized = role === 'any' ? currentRole !== null : currentRole === role;
    } catch {
      authorized = false;
    }

    if (authorized) {
      setState('authorized');
      return;
    }

    let currentRole: DemoRole | null = null;
    try {
      currentRole = getDemoSessionRole(storage ?? window.localStorage);
    } catch {
      currentRole = null;
    }
    setState(currentRole ? 'wrong-role' : 'denied');
    if (onUnauthenticated) {
      onUnauthenticated();
    } else {
      window.location.replace(sitePath(currentRole === 'administrator' ? '/admin/' : currentRole === 'assistant' ? '/asistente/' : '/login/'));
    }
  }, [onUnauthenticated, role, storage]);

  if (state === 'checking') {
    return <main class="admin-gate-status" role="status" aria-live="polite">Verificando el acceso…</main>;
  }

  if (state === 'denied' || state === 'wrong-role') {
    return (
      <main class="admin-gate-status">
        <p role="alert">{state === 'wrong-role' ? `Este módulo está reservado al perfil de ${role === 'administrator' ? 'administrador' : role === 'assistant' ? 'asistente' : 'barbero'}.` : 'Debes iniciar sesión para acceder al panel.'}</p>
        <BackLink href={sitePath('/login/')} label="Acceso" ariaLabel="Volver al acceso" />
      </main>
    );
  }

  return <>{children}</>;
}
