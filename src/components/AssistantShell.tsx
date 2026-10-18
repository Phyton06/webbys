import { useState } from 'preact/hooks';
import { CalendarDays, CreditCard, Home, LogOut, MoreHorizontal, Package, Scissors, Tag, UserRound, UsersRound, ReceiptText } from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { endDemoSession } from '../lib/demo-auth';
import { sitePath } from '../lib/site-path';
import '../styles/assistant-shell.css';

interface AssistantShellProps {
  children: ComponentChildren;
  activeSection?: string;
  onSignOut?: () => void;
}

const moreLinks = [
  { label: 'Productos', icon: Package, href: '/productos/' },
  { label: 'Servicios', icon: Scissors, href: '/servicios/' },
  { label: 'Promociones', icon: Tag, href: '/promociones/' },
  { label: 'Historial de ventas', icon: ReceiptText, href: '/ventas/' },
  { label: 'Perfil', icon: UserRound, href: '/asistente/perfil/' },
];

export function AssistantShell({ children, activeSection = 'Inicio', onSignOut }: AssistantShellProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  function signOut() {
    try {
      endDemoSession(window.localStorage);
      if (onSignOut) onSignOut();
      else window.location.assign(sitePath('/login/'));
    } catch {
      setAnnouncement('No se pudo cerrar la sesión. Revisa el almacenamiento del navegador.');
    }
  }

  return (
    <div class="assistant-app">
      <a class="assistant-skip-link" href="#assistant-main">Saltar al contenido</a>
      <aside class="assistant-sidebar">
        <a class="assistant-brand" href={sitePath('/asistente/')}><img src={sitePath('/logo.jpeg')} alt="" />Webby's Barbershop</a>
        <p>OPERACIÓN</p>
        <nav aria-label="Navegación de escritorio del asistente">
          <a class={activeSection === 'Inicio' ? 'is-active' : ''} href={sitePath('/asistente/')} aria-current={activeSection === 'Inicio' ? 'page' : undefined}><Home size={18} aria-hidden="true" />Inicio</a>
          <a class={activeSection === 'Agenda' ? 'is-active' : ''} href={sitePath('/agenda/')} aria-current={activeSection === 'Agenda' ? 'page' : undefined}><CalendarDays size={18} aria-hidden="true" />Agenda</a>
          <a class={activeSection === 'Cobrar' ? 'is-active assistant-charge-link' : 'assistant-charge-link'} href={sitePath('/cobrar/')} aria-current={activeSection === 'Cobrar' ? 'page' : undefined}><CreditCard size={18} aria-hidden="true" />Cobrar</a>
          <a class={activeSection === 'Clientes' ? 'is-active' : ''} href={sitePath('/clientes/')} aria-current={activeSection === 'Clientes' ? 'page' : undefined}><UsersRound size={18} aria-hidden="true" />Clientes</a>
          {moreLinks.map(({ label, icon: Icon, href }) => <a class={activeSection === label ? 'is-active' : ''} href={sitePath(href)} aria-current={activeSection === label ? 'page' : undefined} key={label}><Icon size={18} aria-hidden="true" />{label}</a>)}
        </nav>
        <button class="assistant-sidebar-signout" type="button" onClick={signOut}><LogOut size={18} aria-hidden="true" />Cerrar sesión</button>
      </aside>
      <div class="assistant-workspace">
        <header class="assistant-topbar">
          <a href={sitePath('/asistente/')} class="assistant-mobile-brand"><img src={sitePath('/logo.jpeg')} alt="" />Webby's Barbershop</a>
          <div class="assistant-topbar-spacer" />
          <span class="assistant-account">Perfil de asistente</span>
          <span class="assistant-avatar" aria-label="Perfil de asistente">A</span>
          <button type="button" aria-label="Cerrar sesión" onClick={signOut}><LogOut size={17} aria-hidden="true" /><span>Cerrar sesión</span></button>
        </header>
        <main id="assistant-main" class="assistant-content" tabIndex={-1}>{children}</main>
        {moreOpen && <nav class="assistant-more-menu" id="assistant-more-menu" aria-label="Más secciones del asistente">
          {moreLinks.map(({ label, icon: Icon, href }) => <a href={sitePath(href)} aria-current={activeSection === label ? 'page' : undefined} key={label}><Icon size={18} aria-hidden="true" />{label}</a>)}
          <button type="button" onClick={signOut}><LogOut size={18} aria-hidden="true" />Cerrar sesión</button>
        </nav>}
        <nav class="assistant-mobile-navigation" aria-label="Navegación del asistente">
          <a class={activeSection === 'Inicio' ? 'is-active' : ''} href={sitePath('/asistente/')} aria-current={activeSection === 'Inicio' ? 'page' : undefined}><Home size={19} aria-hidden="true" /><span>Inicio</span></a>
          <a class={activeSection === 'Agenda' ? 'is-active' : ''} href={sitePath('/agenda/')} aria-current={activeSection === 'Agenda' ? 'page' : undefined}><CalendarDays size={19} aria-hidden="true" /><span>Agenda</span></a>
          <a class={`assistant-mobile-charge${activeSection === 'Cobrar' ? ' is-active' : ''}`} href={sitePath('/cobrar/')} aria-current={activeSection === 'Cobrar' ? 'page' : undefined}><CreditCard size={20} aria-hidden="true" /><span>Cobrar</span></a>
          <a class={activeSection === 'Clientes' ? 'is-active' : ''} href={sitePath('/clientes/')} aria-current={activeSection === 'Clientes' ? 'page' : undefined}><UsersRound size={19} aria-hidden="true" /><span>Clientes</span></a>
          <button type="button" aria-expanded={moreOpen} aria-controls="assistant-more-menu" onClick={() => setMoreOpen((open) => !open)}><MoreHorizontal size={20} aria-hidden="true" /><span>Más</span></button>
        </nav>
        <p class="assistant-announcement" role="status" aria-live="polite">{announcement}</p>
      </div>
    </div>
  );
}
