import { cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminShell } from './AdminShell';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('AdminShell', () => {
  it('uses the barbershop name without demo messaging', () => {
    const { container } = render(<AdminShell><p>Contenido principal</p></AdminShell>);

    expect(screen.getAllByText("Webby's Barbershop")).toHaveLength(4);
    expect(container.textContent?.toLocaleLowerCase('es')).not.toMatch(/demo|demostración|demostracion/);
  });

  it('provides a keyboard skip link to the main dashboard content', () => {
    render(<AdminShell><p>Contenido principal</p></AdminShell>);

    expect(screen.getByRole('link', { name: 'Saltar al contenido' }).getAttribute('href')).toBe('#main-content');
  });

  it('links to Agenda, Clients, Sales, and Analytics from the mobile More menu', () => {
    render(
      <AdminShell onSignOut={vi.fn()}>
        <p>Contenido principal</p>
      </AdminShell>,
    );
    const mobileNavigation = screen.getByRole('navigation', { name: 'Navegación móvil' });

    expect(within(mobileNavigation).getByRole('link', { name: 'Inicio' }).getAttribute('aria-current')).toBe('page');
    const agendaLink = within(mobileNavigation).getByRole('link', { name: 'Agenda' });
    expect(agendaLink.getAttribute('href')).toBe('/agenda/');
    expect(within(mobileNavigation).getByRole('link', { name: 'Clientes' }).getAttribute('href')).toBe('/clientes/');
    fireEvent.click(within(mobileNavigation).getByRole('button', { name: 'Más secciones' }));
    const moreNavigation = screen.getByRole('navigation', { name: 'Más secciones de administración' });
    expect(within(moreNavigation).getByRole('link', { name: 'Ventas' }).getAttribute('href')).toBe('/ventas/');
    const analyticsLink = within(moreNavigation).getByRole('link', { name: 'Analíticas' });
    expect(analyticsLink.getAttribute('href')).toBe('/analiticas/');
  });

  it('marks Agenda current in desktop and mobile navigation when its route is active', () => {
    render(<AdminShell activeSection="Agenda"><p>Contenido principal</p></AdminShell>);

    const mobileNavigation = screen.getByRole('navigation', { name: 'Navegación móvil' });
    const desktopNavigation = screen.getByRole('navigation', { name: 'Navegación de escritorio' });
    expect(within(mobileNavigation).getByRole('link', { name: 'Agenda' }).getAttribute('aria-current')).toBe('page');
    expect(within(desktopNavigation).getByRole('link', { name: 'Agenda' }).getAttribute('aria-current')).toBe('page');
    expect(within(mobileNavigation).getByRole('link', { name: 'Inicio' }).getAttribute('aria-current')).toBeNull();
  });

  it('marks Clients current in desktop and mobile navigation when its route is active', () => {
    render(<AdminShell activeSection="Clientes"><p>Contenido principal</p></AdminShell>);
    const mobileNavigation = screen.getByRole('navigation', { name: 'Navegación móvil' });
    const desktopNavigation = screen.getByRole('navigation', { name: 'Navegación de escritorio' });

    expect(within(mobileNavigation).getByRole('link', { name: 'Clientes' }).getAttribute('aria-current')).toBe('page');
    expect(within(desktopNavigation).getByRole('link', { name: 'Clientes' }).getAttribute('aria-current')).toBe('page');
  });

  it('links Employees from desktop and the mobile More menu and marks the current route', () => {
    render(<AdminShell activeSection="Empleados"><p>Contenido principal</p></AdminShell>);
    const desktopNavigation = screen.getByRole('navigation', { name: 'Navegación de escritorio' });
    const employeesDesktopLink = within(desktopNavigation).getByRole('link', { name: 'Empleados' });
    expect(employeesDesktopLink.getAttribute('href')).toBe('/empleados/');
    expect(employeesDesktopLink.getAttribute('aria-current')).toBe('page');

    fireEvent.click(screen.getByRole('button', { name: 'Más secciones' }));
    const moreNavigation = screen.getByRole('navigation', { name: 'Más secciones de administración' });
    const employeesMobileLink = within(moreNavigation).getByRole('link', { name: 'Empleados' });
    expect(employeesMobileLink.getAttribute('href')).toBe('/empleados/');
    expect(employeesMobileLink.getAttribute('aria-current')).toBe('page');
  });

  it('groups Services and Products in Catalog on desktop and marks the current route', () => {
    render(<AdminShell activeSection="Servicios"><p>Contenido principal</p></AdminShell>);
    const desktopNavigation = screen.getByRole('navigation', { name: 'Navegación de escritorio' });
    const desktopCatalog = within(desktopNavigation).getByRole('group', { name: 'Catálogo' });
    const desktopCatalogToggle = within(desktopCatalog).getByRole('button', { name: 'Catálogo' });
    expect(desktopCatalogToggle.getAttribute('aria-expanded')).toBe('true');
    const servicesDesktopLink = within(desktopCatalog).getByRole('link', { name: 'Servicios' });
    expect(servicesDesktopLink.getAttribute('href')).toBe('/servicios/');
    expect(servicesDesktopLink.getAttribute('aria-current')).toBe('page');
    expect(within(desktopCatalog).getByRole('link', { name: 'Productos' }).getAttribute('href')).toBe('/productos/');

    fireEvent.click(screen.getByRole('button', { name: 'Más secciones' }));
    const moreNavigation = screen.getByRole('navigation', { name: 'Más secciones de administración' });
    const mobileCatalog = within(moreNavigation).getByRole('group', { name: 'Catálogo' });
    const servicesMobileLink = within(mobileCatalog).getByRole('link', { name: 'Servicios' });
    expect(servicesMobileLink.getAttribute('href')).toBe('/servicios/');
    expect(servicesMobileLink.getAttribute('aria-current')).toBe('page');
    expect(within(mobileCatalog).getByRole('link', { name: 'Productos' }).getAttribute('href')).toBe('/productos/');
  });

  it('marks Products current inside Catalog on desktop and in the mobile More menu', () => {
    render(<AdminShell activeSection="Productos"><p>Contenido principal</p></AdminShell>);
    const desktopNavigation = screen.getByRole('navigation', { name: 'Navegación de escritorio' });
    const desktopCatalog = within(desktopNavigation).getByRole('group', { name: 'Catálogo' });
    const productsDesktopLink = within(desktopCatalog).getByRole('link', { name: 'Productos' });
    expect(productsDesktopLink.getAttribute('href')).toBe('/productos/');
    expect(productsDesktopLink.getAttribute('aria-current')).toBe('page');
    expect(within(desktopCatalog).getByRole('link', { name: 'Servicios' }).getAttribute('href')).toBe('/servicios/');

    fireEvent.click(screen.getByRole('button', { name: 'Más secciones' }));
    const moreNavigation = screen.getByRole('navigation', { name: 'Más secciones de administración' });
    const mobileCatalog = within(moreNavigation).getByRole('group', { name: 'Catálogo' });
    const productsMobileLink = within(mobileCatalog).getByRole('link', { name: 'Productos' });
    expect(productsMobileLink.getAttribute('href')).toBe('/productos/');
    expect(productsMobileLink.getAttribute('aria-current')).toBe('page');
    expect(within(mobileCatalog).getByRole('link', { name: 'Servicios' }).getAttribute('href')).toBe('/servicios/');
  });

  it('expands Catalog links on desktop and in the mobile More menu', () => {
    render(<AdminShell><p>Contenido principal</p></AdminShell>);
    const desktopNavigation = screen.getByRole('navigation', { name: 'Navegación de escritorio' });
    const desktopCatalog = within(desktopNavigation).getByRole('group', { name: 'Catálogo' });
    const desktopToggle = within(desktopCatalog).getByRole('button', { name: 'Catálogo' });
    expect(desktopToggle.getAttribute('aria-expanded')).toBe('false');
    expect(within(desktopCatalog).queryByRole('link', { name: 'Servicios' })).toBeNull();
    fireEvent.click(desktopToggle);
    expect(desktopToggle.getAttribute('aria-expanded')).toBe('true');
    expect(within(desktopCatalog).getByRole('link', { name: 'Servicios' }).getAttribute('href')).toBe('/servicios/');
    expect(within(desktopCatalog).getByRole('link', { name: 'Productos' }).getAttribute('href')).toBe('/productos/');

    fireEvent.click(screen.getByRole('button', { name: 'Más secciones' }));
    const moreNavigation = screen.getByRole('navigation', { name: 'Más secciones de administración' });
    const mobileCatalog = within(moreNavigation).getByRole('group', { name: 'Catálogo' });
    const mobileToggle = within(mobileCatalog).getByRole('button', { name: 'Catálogo' });
    expect(mobileToggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(mobileToggle);
    expect(mobileToggle.getAttribute('aria-expanded')).toBe('true');
    expect(within(mobileCatalog).getByRole('link', { name: 'Servicios' }).getAttribute('href')).toBe('/servicios/');
    expect(within(mobileCatalog).getByRole('link', { name: 'Productos' }).getAttribute('href')).toBe('/productos/');
  });

  it('links Promotions from desktop and the mobile More menu and marks the current route', () => {
    render(<AdminShell activeSection="Promociones"><p>Contenido principal</p></AdminShell>);
    const desktopNavigation = screen.getByRole('navigation', { name: 'Navegación de escritorio' });
    const promotionsDesktopLink = within(desktopNavigation).getByRole('link', { name: 'Promociones' });
    expect(promotionsDesktopLink.getAttribute('href')).toBe('/promociones/');
    expect(promotionsDesktopLink.getAttribute('aria-current')).toBe('page');

    fireEvent.click(screen.getByRole('button', { name: 'Más secciones' }));
    const moreNavigation = screen.getByRole('navigation', { name: 'Más secciones de administración' });
    const promotionsMobileLink = within(moreNavigation).getByRole('link', { name: 'Promociones' });
    expect(promotionsMobileLink.getAttribute('href')).toBe('/promociones/');
    expect(promotionsMobileLink.getAttribute('aria-current')).toBe('page');
  });

  it('links to Configuration from desktop navigation and the mobile More menu', () => {
    render(<AdminShell activeSection="Configuración"><p>Contenido principal</p></AdminShell>);
    const desktopNavigation = screen.getByRole('navigation', { name: 'Navegación de escritorio' });

    expect(within(desktopNavigation).getByRole('link', { name: 'Configuración' }).getAttribute('href')).toBe('/configuracion/');
    expect(within(desktopNavigation).getByRole('link', { name: 'Configuración' }).getAttribute('aria-current')).toBe('page');

    fireEvent.click(screen.getByRole('button', { name: 'Más secciones' }));
    const moreNavigation = screen.getByRole('navigation', { name: 'Más secciones de administración' });
    expect(within(moreNavigation).getByRole('link', { name: 'Configuración' }).getAttribute('href')).toBe('/configuracion/');
    const mobileNavigation = screen.getByRole('navigation', { name: 'Navegación móvil' });
    expect(within(mobileNavigation).queryByRole('link', { name: 'Configuración' })).toBeNull();
  });

  it('opens the additional mobile sections with their links', () => {
    render(<AdminShell><p>Contenido principal</p></AdminShell>);
    fireEvent.click(screen.getByRole('button', { name: 'Más secciones' }));

    const moreSections = screen.getByRole('navigation', { name: 'Más secciones de administración' });
    expect(within(moreSections).getByRole('link', { name: 'Ventas' }).getAttribute('href')).toBe('/ventas/');
    expect(within(moreSections).getByRole('link', { name: 'Analíticas' }).getAttribute('href')).toBe('/analiticas/');
    const desktopSections = screen.getByRole('navigation', { name: 'Navegación de escritorio' });
    expect(within(desktopSections).getByRole('link', { name: 'Ventas' }).getAttribute('href')).toBe('/ventas/');
    expect(within(desktopSections).getByRole('link', { name: 'Analíticas' }).getAttribute('href')).toBe('/analiticas/');
  });

  it('links to Sales in desktop navigation and the mobile More menu', () => {
    render(<AdminShell activeSection="Ventas"><p>Contenido principal</p></AdminShell>);
    const desktop = screen.getByRole('navigation', { name: 'Navegación de escritorio' });
    const salesDesktop = within(desktop).getByRole('link', { name: 'Ventas' });
    expect(salesDesktop.getAttribute('href')).toBe('/ventas/');
    expect(salesDesktop.getAttribute('aria-current')).toBe('page');

    fireEvent.click(screen.getByRole('button', { name: 'Más secciones' }));
    const more = screen.getByRole('navigation', { name: 'Más secciones de administración' });
    const salesMobile = within(more).getByRole('link', { name: 'Ventas' });
    expect(salesMobile.getAttribute('href')).toBe('/ventas/');
    expect(salesMobile.getAttribute('aria-current')).toBe('page');
  });

  it('links to Analytics in desktop navigation and the mobile More menu and marks the current route', () => {
    render(<AdminShell activeSection="Analíticas"><p>Contenido principal</p></AdminShell>);
    const desktop = screen.getByRole('navigation', { name: 'Navegación de escritorio' });
    const desktopLink = within(desktop).getByRole('link', { name: 'Analíticas' });
    expect(desktopLink.getAttribute('href')).toBe('/analiticas/');
    expect(desktopLink.getAttribute('aria-current')).toBe('page');

    fireEvent.click(screen.getByRole('button', { name: 'Más secciones' }));
    const more = screen.getByRole('navigation', { name: 'Más secciones de administración' });
    const mobileLink = within(more).getByRole('link', { name: 'Analíticas' });
    expect(mobileLink.getAttribute('href')).toBe('/analiticas/');
    expect(mobileLink.getAttribute('aria-current')).toBe('page');
  });

  it('links to Notifications in desktop navigation and the mobile More menu', () => {
    render(<AdminShell activeSection="Notificaciones"><p>Contenido principal</p></AdminShell>);
    const desktop = screen.getByRole('navigation', { name: 'Navegación de escritorio' });
    const desktopLink = within(desktop).getByRole('link', { name: 'Notificaciones' });
    expect(desktopLink.getAttribute('href')).toBe('/notificaciones/');
    expect(desktopLink.getAttribute('aria-current')).toBe('page');

    fireEvent.click(screen.getByRole('button', { name: 'Más secciones' }));
    const more = screen.getByRole('navigation', { name: 'Más secciones de administración' });
    const mobileLink = within(more).getByRole('link', { name: 'Notificaciones' });
    expect(mobileLink.getAttribute('href')).toBe('/notificaciones/');
    expect(mobileLink.getAttribute('aria-current')).toBe('page');
  });

  it('links to Notifications in desktop navigation and the mobile More menu', () => {
    render(<AdminShell activeSection="Notificaciones"><p>Contenido principal</p></AdminShell>);
    const desktop = screen.getByRole('navigation', { name: 'Navegación de escritorio' });
    const desktopLink = within(desktop).getByRole('link', { name: 'Notificaciones' });
    expect(desktopLink.getAttribute('href')).toBe('/notificaciones/');
    expect(desktopLink.getAttribute('aria-current')).toBe('page');

    fireEvent.click(screen.getByRole('button', { name: 'Más secciones' }));
    const more = screen.getByRole('navigation', { name: 'Más secciones de administración' });
    const mobileLink = within(more).getByRole('link', { name: 'Notificaciones' });
    expect(mobileLink.getAttribute('href')).toBe('/notificaciones/');
    expect(mobileLink.getAttribute('aria-current')).toBe('page');
  });

  it('clears only the demo session on sign-out', () => {
    const onSignOut = vi.fn();
    localStorage.setItem('webbys:demo-session', 'active');
    localStorage.setItem('unrelated', 'keep');
    render(<AdminShell onSignOut={onSignOut}><p>Contenido principal</p></AdminShell>);

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(onSignOut).toHaveBeenCalledOnce();
    expect(localStorage.getItem('webbys:demo-session')).toBeNull();
    expect(localStorage.getItem('unrelated')).toBe('keep');
  });
});
