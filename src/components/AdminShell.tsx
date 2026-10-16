import { useState } from 'preact/hooks';
import {
  BarChart3,
  Bell,
  CalendarDays,
  CreditCard,
  Home,
  LogOut,
  MoreHorizontal,
  Package,
  Scissors,
  Settings2,
  Tag,
  UsersRound,
} from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { endDemoSession } from '../lib/demo-auth';

interface AdminShellProps {
  children: ComponentChildren;
  activeSection?: (typeof ACTIVE_ADMIN_SECTION)[keyof typeof ACTIVE_ADMIN_SECTION] | 'Clientes' | 'Configuración';
  onSignOut?: () => void;
}

const ACTIVE_ADMIN_SECTION = {
  HOME: 'Inicio',
  AGENDA: 'Agenda',
} as const;

interface NavigationSection {
  label: string;
  icon: typeof Home;
  href?: string;
}

const desktopSections: NavigationSection[] = [
  { label: ACTIVE_ADMIN_SECTION.HOME, icon: Home, href: '/admin/' },
  { label: ACTIVE_ADMIN_SECTION.AGENDA, icon: CalendarDays, href: '/agenda/' },
  { label: 'Clientes', icon: UsersRound, href: '/clientes/' },
  { label: 'Empleados', icon: UsersRound },
  { label: 'Servicios', icon: Scissors },
  { label: 'Productos', icon: Package },
  { label: 'Promociones', icon: Tag },
  { label: 'Ventas', icon: CreditCard },
  { label: 'Analíticas', icon: BarChart3 },
  { label: 'Notificaciones', icon: Bell },
  { label: 'Configuración', icon: Settings2, href: '/configuracion/' },
];

const mobileQuickSections: NavigationSection[] = [
  { label: ACTIVE_ADMIN_SECTION.AGENDA, icon: CalendarDays, href: '/agenda/' },
  { label: 'Clientes', icon: UsersRound, href: '/clientes/' },
];

const mobileMoreSections = desktopSections.filter(({ label }) => label !== 'Inicio' && label !== 'Agenda' && label !== 'Clientes');

export function AdminShell({ children, activeSection = ACTIVE_ADMIN_SECTION.HOME, onSignOut }: AdminShellProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  function showUnavailable(section: string) {
    setAnnouncement(`La sección ${section} aún no está disponible en esta etapa.`);
    setMoreOpen(false);
  }

  function signOut() {
    try {
      endDemoSession(window.localStorage);
      if (onSignOut) {
        onSignOut();
      } else {
        window.location.assign('/login/');
      }
    } catch {
      setAnnouncement('No se pudo cerrar la sesión. Revisa el almacenamiento del navegador.');
    }
  }

  return (
    <div class="admin-app">
      <a class="skip-link" href="#main-content">Saltar al contenido</a>
      <aside class="desktop-sidebar">
        <a class="admin-wordmark" href="/admin/" aria-label="Webby's Barbershop, inicio">
          <img class="admin-logo" src="/logo.jpeg" alt="" />
          <span>Webby's Barbershop</span>
        </a>
        <p class="sidebar-caption">BARBERÍA</p>
        <nav aria-label="Navegación de escritorio">
          {desktopSections.map(({ label, icon: Icon, href }) => (
            href ? (
              <a
                class={`desktop-nav-item${activeSection === label ? ' is-active' : ''}`}
                href={href}
                aria-current={activeSection === label ? 'page' : undefined}
                key={label}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </a>
            ) : (
              <button
                class="desktop-nav-item"
                type="button"
                aria-label={`${label}, próximamente`}
                onClick={() => showUnavailable(label)}
                key={label}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
                <span class="desktop-coming-soon">Próx.</span>
              </button>
            )
          ))}
        </nav>
        <div class="sidebar-footer">
          <span class="sidebar-status-dot" aria-hidden="true" />
          <span>Webby's Barbershop</span>
        </div>
      </aside>

      <div class="admin-workspace">
        <header class="admin-topbar">
          <a class="mobile-wordmark" href="/admin/" aria-label="Webby's Barbershop, inicio">
            <img class="admin-logo" src="/logo.jpeg" alt="" />
            <span>Webby's Barbershop</span>
          </a>
          <div class="topbar-spacer" />
          <span class="shop-name">Webby's Barbershop</span>
          <span class="admin-avatar" aria-label="Perfil de administrador">A</span>
          <button class="sign-out-button" type="button" aria-label="Cerrar sesión" onClick={signOut}>
            <LogOut size={17} aria-hidden="true" />
            <span>Cerrar sesión</span>
          </button>
        </header>

        <main class="admin-content" id="main-content" tabIndex={-1}>
          {children}
        </main>

        <p class="admin-announcement" role="status" aria-live="polite">{announcement}</p>
      </div>

      {moreOpen && (
        <nav id="mobile-more-sections" class="mobile-more-menu" aria-label="Más secciones disponibles próximamente">
          {mobileMoreSections.map(({ label, icon: Icon, href }) => (
            href ? (
              <a href={href} aria-current={activeSection === label ? 'page' : undefined} key={label}>
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </a>
            ) : (
              <button type="button" aria-label={`${label}, próximamente`} onClick={() => showUnavailable(label)} key={label}>
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
                <span class="coming-soon-label">Próximamente</span>
              </button>
            )
          ))}
        </nav>
      )}

      <nav class="mobile-navigation" aria-label="Navegación móvil">
        <a
          class={`mobile-nav-item${activeSection === ACTIVE_ADMIN_SECTION.HOME ? ' is-active' : ''}`}
          href="/admin/"
          aria-current={activeSection === ACTIVE_ADMIN_SECTION.HOME ? 'page' : undefined}
        >
          <Home size={19} aria-hidden="true" />
          <span>Inicio</span>
        </a>
        {mobileQuickSections.map(({ label, icon: Icon, href }) => (
          href ? (
            <a
              class={`mobile-nav-item${activeSection === label ? ' is-active' : ''}`}
              href={href}
              aria-current={activeSection === label ? 'page' : undefined}
              key={label}
            >
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
            </a>
          ) : (
            <button
              class="mobile-nav-item"
              type="button"
              aria-label={`${label}, próximamente`}
              onClick={() => showUnavailable(label)}
              key={label}
            >
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
              <span class="mobile-coming-soon">Próx.</span>
            </button>
          )
        ))}
        <button
          class="mobile-nav-item"
          type="button"
          aria-expanded={moreOpen}
          aria-controls="mobile-more-sections"
          aria-label="Más secciones"
          onClick={() => setMoreOpen((open) => !open)}
        >
          <MoreHorizontal size={20} aria-hidden="true" />
          <span>Más</span>
        </button>
      </nav>
    </div>
  );
}
