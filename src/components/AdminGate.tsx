import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { hasDemoSession } from '../lib/demo-auth';
import { BackLink } from './BackLink';

interface AdminGateProps {
  children: ComponentChildren;
  onUnauthenticated?: () => void;
  storage?: Pick<Storage, 'getItem'>;
}

type GateState = 'checking' | 'authorized' | 'denied';

export function AdminGate({ children, onUnauthenticated, storage }: AdminGateProps) {
  const [state, setState] = useState<GateState>('checking');

  useEffect(() => {
    let authorized = false;

    try {
      authorized = hasDemoSession(storage ?? window.localStorage);
    } catch {
      authorized = false;
    }

    if (authorized) {
      setState('authorized');
      return;
    }

    setState('denied');
    if (onUnauthenticated) {
      onUnauthenticated();
    } else {
      window.location.replace('/login/');
    }
  }, [onUnauthenticated, storage]);

  if (state === 'checking') {
    return <main class="admin-gate-status" role="status" aria-live="polite">Verificando el acceso…</main>;
  }

  if (state === 'denied') {
    return (
      <main class="admin-gate-status">
        <p role="alert">Debes iniciar sesión para acceder al panel.</p>
        <BackLink href="/login/" label="Acceso" ariaLabel="Volver al acceso" />
      </main>
    );
  }

  return <>{children}</>;
}
