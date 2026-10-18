import { useEffect, useState } from 'preact/hooks';
import { sitePath } from '../lib/site-path';
import '../styles/install-prompt.css';

interface InstallChoiceEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallChoiceEvent>();
  const [helpOpen, setHelpOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) {
      setHidden(true);
      return;
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

  async function install() {
    if (!installEvent) {
      setHelpOpen((open) => !open);
      return;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') setHidden(true);
    setInstallEvent(undefined);
  }

  if (hidden) return null;

  return (
    <aside class="install-prompt" aria-label="Instala Webbys">
      <img src={sitePath('/icons/webbys-192.png')} alt="" width="40" height="40" />
      <div class="install-prompt-copy">
        <strong>Webbys en tu celular</strong>
        <span>Instala la app para abrirla desde tu pantalla de inicio.</span>
        {helpOpen && (
          <p role="status">
            { /iPad|iPhone|iPod/.test(navigator.userAgent)
              ? 'En Safari, toca Compartir y luego “Añadir a pantalla de inicio”.'
              : 'Abre el menú del navegador y selecciona “Instalar aplicación” o “Añadir a pantalla de inicio”.' }
          </p>
        )}
      </div>
      <button type="button" onClick={install}>
        {installEvent ? 'Instalar' : helpOpen ? 'Ocultar ayuda' : 'Cómo instalar'}
      </button>
      <button class="install-prompt-dismiss" type="button" aria-label="Cerrar invitación de instalación" onClick={() => setHidden(true)}>×</button>
    </aside>
  );
}
