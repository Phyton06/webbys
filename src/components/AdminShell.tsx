import { useState } from 'preact/hooks';
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
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
import { sitePath } from '../lib/site-path';

interface AdminShellProps {
  children: ComponentChildren;
  activeSection?: string;
  onSignOut?: () => void;
}

const ACTIVE_ADMIN_SECTION = {
  HOME: 'Inicio',
  AGENDA: 'Agenda',
} as const;

interface NavigationLink {
  label: string;
  icon: typeof Home;
  href?: string;
}

interface NavigationGroup {
  label: string;
  icon: typeof Home;
  children: NavigationLink[];
}

type NavigationSection = NavigationLink | NavigationGroup;

function isNavigationGroup(section: NavigationSection): section is NavigationGroup {
  return 'children' in section;
}

const desktopSections: NavigationSection[] = [
  { label: ACTIVE_ADMIN_SECTION.HOME, icon: Home, href: sitePath('/admin/') },
  { label: ACTIVE_ADMIN_SECTION.AGENDA, icon: CalendarDays, href: sitePath('/agenda/') },
  { label: 'Clientes', icon: UsersRound, href: sitePath('/clientes/') },
  { label: 'Empleados', icon: UsersRound, href: sitePath('/empleados/') },
  {
    label: 'Catálogo',
    icon: Package,
    children: [
      { label: 'Servicios', icon: Scissors, href: sitePath('/servicios/') },
      { label: 'Productos', icon: Package, href: sitePath('/productos/') },
    ],
  },
  { label: 'Promociones', icon: Tag, href: sitePath('/promociones/') },
  { label: 'Ventas', icon: CreditCard, href: sitePath('/ventas/') },
  { label: 'Analíticas', icon: BarChart3, href: sitePath('/analiticas/') },
  { label: 'Notificaciones', icon: Bell, href: sitePath('/notificaciones/') },
  { label: 'Configuración', icon: Settings2, href: sitePath('/configuracion/') },
];

const mobileQuickSections: NavigationLink[] = [
  { label: ACTIVE_ADMIN_SECTION.AGENDA, icon: CalendarDays, href: sitePath('/agenda/') },
  { label: 'Clientes', icon: UsersRound, href: sitePath('/clientes/') },
];

const mobileMoreSections = desktopSections.filter(({ label }) => label !== 'Inicio' && label !== 'Agenda' && label !== 'Clientes');

export function AdminShell({ children, activeSection = ACTIVE_ADMIN_SECTION.HOME, onSignOut }: AdminShellProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const catalogIsActive = activeSection === 'Servicios' || activeSection === 'Productos';
  const [desktopCatalogOpen, setDesktopCatalogOpen] = useState(catalogIsActive);
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(catalogIsActive);

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
        window.location.assign(sitePath('/login/'));
      }
    } catch {
      setAnnouncement('No se pudo cerrar la sesión. Revisa el almacenamiento del navegador.');
    }
  }

  return (
    <div class="admin-app">
      <a class="skip-link" href="#main-content">Saltar al contenido</a>
      <aside class="desktop-sidebar">
        <a class="admin-wordmark" href={sitePath('/admin/')} aria-label="Webby's Barbershop, inicio">
          <img class="admin-logo" src={sitePath('/logo.jpeg')} alt="" />
          <span>Webby's Barbershop</span>
        </a>
        <p class="sidebar-caption">BARBERÍA</p>
        <nav aria-label="Navegación de escritorio">
          {desktopSections.map((section) => {
            if (isNavigationGroup(section)) {
              const Icon = section.icon;
              return (
                <div class="desktop-nav-group" role="group" aria-label={section.label} key={section.label}>
                  <button
                    class={`desktop-nav-item desktop-nav-group-toggle${catalogIsActive ? ' is-active' : ''}`}
                    type="button"
                    aria-expanded={desktopCatalogOpen}
                    aria-controls="desktop-catalog-links"
                    onClick={() => setDesktopCatalogOpen((open) => !open)}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{section.label}</span>
                    <ChevronDown class={desktopCatalogOpen ? 'is-open' : ''} size={16} aria-hidden="true" />
                  </button>
                  <div class="desktop-nav-submenu" id="desktop-catalog-links" hidden={!desktopCatalogOpen}>
                    {section.children.map(({ label, icon: ChildIcon, href }) => (
                      href ? (
                        <a
                          class={`desktop-nav-item desktop-nav-subitem${activeSection === label ? ' is-active' : ''}`}
                          href={href}
                          aria-current={activeSection === label ? 'page' : undefined}
                          key={label}
                        >
                          <ChildIcon size={18} aria-hidden="true" />
                          <span>{label}</span>
                        </a>
                      ) : (
                        <button class="desktop-nav-item desktop-nav-subitem" type="button" aria-label={`${label}, próximamente`} onClick={() => showUnavailable(label)} key={label}>
                          <ChildIcon size={18} aria-hidden="true" />
                          <span>{label}</span>
                          <span class="desktop-coming-soon">Próx.</span>
                        </button>
                      )
                    ))}
                  </div>
                </div>
              );
            }

            const { label, icon: Icon, href } = section;
            return href ? (
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
            );
          })}
        </nav>
        <div class="sidebar-footer">
          <span class="sidebar-status-dot" aria-hidden="true" />
          <span>Webby's Barbershop</span>
        </div>
      </aside>

      <div class="admin-workspace">
        <header class="admin-topbar">
          <a class="mobile-wordmark" href={sitePath('/admin/')} aria-label="Webby's Barbershop, inicio">
            <img class="admin-logo" src={sitePath('/logo.jpeg')} alt="" />
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
        <nav id="mobile-more-sections" class="mobile-more-menu" aria-label="Más secciones de administración">
          {mobileMoreSections.map((section) => {
            if (isNavigationGroup(section)) {
              const Icon = section.icon;
              return (
                <div class="mobile-more-group" role="group" aria-label={section.label} key={section.label}>
                  <button
                    class="mobile-more-group-toggle"
                    type="button"
                    aria-expanded={mobileCatalogOpen}
                    aria-controls="mobile-catalog-links"
                    onClick={() => setMobileCatalogOpen((open) => !open)}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{section.label}</span>
                    <ChevronDown class={mobileCatalogOpen ? 'is-open' : ''} size={16} aria-hidden="true" />
                  </button>
                  <div class="mobile-more-submenu" id="mobile-catalog-links" hidden={!mobileCatalogOpen}>
                    {section.children.map(({ label, icon: ChildIcon, href }) => (
                      href ? (
                        <a href={href} aria-current={activeSection === label ? 'page' : undefined} key={label}>
                          <ChildIcon size={18} aria-hidden="true" />
                          <span>{label}</span>
                        </a>
                      ) : (
                        <button type="button" aria-label={`${label}, próximamente`} onClick={() => showUnavailable(label)} key={label}>
                          <ChildIcon size={18} aria-hidden="true" />
                          <span>{label}</span>
                          <span class="coming-soon-label">Próximamente</span>
                        </button>
                      )
                    ))}
                  </div>
                </div>
              );
            }

            const { label, icon: Icon, href } = section;
            return href ? (
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
            );
          })}
        </nav>
      )}

      <nav class="mobile-navigation" aria-label="Navegación móvil">
        <a
          class={`mobile-nav-item${activeSection === ACTIVE_ADMIN_SECTION.HOME ? ' is-active' : ''}`}
          href={sitePath('/admin/')}
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
