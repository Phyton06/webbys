import { useEffect, useRef, useState } from 'preact/hooks';
import { sitePath } from '../lib/site-path';
import { BackLink } from './BackLink';
import '../styles/install-prompt.css';

interface InstallChoiceEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallStep {
  title: string;
  detail: string;
  icon: 'share' | 'menu' | 'home';
}

const DISMISSED_SESSION_KEY = 'webbys-install-prompt-dismissed';

function getInstallSteps(userAgent: string, platform: string, touchPoints: number): InstallStep[] {
  const isAppleMobile = /iPhone|iPad|iPod/i.test(userAgent)
    || (platform === 'MacIntel' && touchPoints > 1);

  if (isAppleMobile) {
    return [
      { title: 'Toca Compartir', detail: 'Está en la barra de Safari, junto a la dirección.', icon: 'share' },
      { title: 'Añadir a pantalla de inicio', detail: 'Desliza las opciones y selecciona “Añadir a pantalla de inicio”.', icon: 'home' },
      { title: 'Confirma con Añadir', detail: 'Webbys aparecerá como una app junto a tus otras aplicaciones.', icon: 'home' },
    ];
  }

  if (/Android/i.test(userAgent)) {
    return [
      { title: 'Abre el menú ⋮', detail: 'Toca los tres puntos de la esquina superior del navegador.', icon: 'menu' },
      { title: 'Elige instalar', detail: 'Selecciona “Instalar aplicación” o “Añadir a pantalla principal”.', icon: 'home' },
      { title: 'Confirma la instalación', detail: 'Toca “Instalar” y encontrarás Webbys en tu pantalla de inicio.', icon: 'home' },
    ];
  }

  return [
    { title: 'Abre el menú del navegador', detail: 'También puedes buscar el icono de instalación junto a la dirección.', icon: 'menu' },
    { title: 'Selecciona Instalar Webbys', detail: 'El nombre puede aparecer como “Instalar aplicación”.', icon: 'home' },
    { title: 'Confirma la instalación', detail: 'Sigue el aviso del navegador para terminar.', icon: 'home' },
  ];
}

function StepIcon({ icon }: { icon: InstallStep['icon'] }) {
  if (icon === 'share') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 20V5m0 0-6 6m6-6 6 6M7 16v11h18V16" />
      </svg>
    );
  }

  if (icon === 'menu') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="7" r="2" />
        <circle cx="16" cy="16" r="2" />
        <circle cx="16" cy="25" r="2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="m5 15 11-9 11 9v12H5zM12 27v-8h8v8M23 8V5h4v7" />
    </svg>
  );
}

export function InstallPrompt() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [installEvent, setInstallEvent] = useState<InstallChoiceEvent>();
  const [showManualSteps, setShowManualSteps] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let dismissed = false;
    try {
      dismissed = window.sessionStorage.getItem(DISMISSED_SESSION_KEY) === 'true';
    } catch {
      // Keep the prompt available when browser storage is restricted.
    }

    const dialog = dialogRef.current;
    if (standalone || dismissed) {
      setHidden(true);
      return;
    }

    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallChoiceEvent);
    };
    const handleInstalled = () => setHidden(true);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  function dismiss() {
    setHidden(true);
    try {
      window.sessionStorage.setItem(DISMISSED_SESSION_KEY, 'true');
    } catch {
      // Dismissal still applies for this render when browser storage is restricted.
    }
    if (dialogRef.current?.open && typeof dialogRef.current.close === 'function') {
      dialogRef.current.close();
    }
  }

  async function install() {
    if (!installEvent) return;

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setHidden(true);
        return;
      }
    } catch {
      setError('No se pudo abrir la instalación. Sigue estos pasos para añadir Webbys manualmente.');
    }

    setInstallEvent(undefined);
    setShowManualSteps(true);
  }

  if (hidden) return null;

  const steps = getInstallSteps(navigator.userAgent, navigator.platform, navigator.maxTouchPoints);

  return (
    <dialog
      ref={dialogRef}
      class="install-modal"
      aria-label="Instala Webbys"
      onCancel={(event) => { event.preventDefault(); dismiss(); }}
      onClick={(event) => { if (event.target === dialogRef.current) dismiss(); }}
    >
      <img class="install-modal-logo" src={sitePath('/logo.jpeg')} alt="Logotipo de Webbys" width="112" height="112" />
      <p class="install-modal-eyebrow">WEBBYS · BARBERSHOP</p>
      <div class="install-modal-title-row">
        <BackLink ariaLabel="Cerrar invitación de instalación" onClick={dismiss} />
        <h2>Tu barbería, siempre a mano</h2>
        <span aria-hidden="true" />
      </div>
      <p class="install-modal-intro">Añade Webbys a tu pantalla de inicio para abrirlo como una app.</p>

      {installEvent && !showManualSteps ? (
        <div class="install-modal-actions">
          <button class="install-modal-primary" type="button" onClick={install}>Instalar Webbys</button>
          <button class="install-modal-secondary" type="button" onClick={() => setShowManualSteps(true)}>Ver instrucciones manuales</button>
        </div>
      ) : (
        <section class="install-manual" aria-label="Pasos para instalar Webbys">
          {error && <p class="install-modal-error" role="alert">{error}</p>}
          <ol class="install-steps">
            {steps.map((step, index) => (
              <li class="install-step" key={`${step.icon}-${step.title}`}>
                <span class="install-step-icon"><StepIcon icon={step.icon} /></span>
                <span class="install-step-copy">
                  <strong><span class="install-step-number">{index + 1}</span>{step.title}</strong>
                  <span>{step.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <button class="install-modal-later" type="button" onClick={dismiss}>Ahora no</button>
    </dialog>
  );
}
