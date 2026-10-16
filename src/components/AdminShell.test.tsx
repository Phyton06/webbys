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

  it('links to Agenda and Clients while keeping other unimplemented modules clearly unavailable', () => {
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
    const moreNavigation = screen.getByRole('navigation', { name: 'Más secciones disponibles próximamente' });
    const employeesButton = within(moreNavigation).getByRole('button', { name: 'Empleados, próximamente' });
    expect(within(employeesButton).getByText('Próximamente')).toBeTruthy();
    fireEvent.click(employeesButton);
    expect(screen.getByRole('status').textContent).toContain('La sección Empleados aún no está disponible');
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

  it('links to Configuration from desktop navigation and the mobile More menu', () => {
    render(<AdminShell activeSection="Configuración"><p>Contenido principal</p></AdminShell>);
    const desktopNavigation = screen.getByRole('navigation', { name: 'Navegación de escritorio' });

    expect(within(desktopNavigation).getByRole('link', { name: 'Configuración' }).getAttribute('href')).toBe('/configuracion/');
    expect(within(desktopNavigation).getByRole('link', { name: 'Configuración' }).getAttribute('aria-current')).toBe('page');

    fireEvent.click(screen.getByRole('button', { name: 'Más secciones' }));
    const moreNavigation = screen.getByRole('navigation', { name: 'Más secciones disponibles próximamente' });
    expect(within(moreNavigation).getByRole('link', { name: 'Configuración' }).getAttribute('href')).toBe('/configuracion/');
    const mobileNavigation = screen.getByRole('navigation', { name: 'Navegación móvil' });
    expect(within(mobileNavigation).queryByRole('link', { name: 'Configuración' })).toBeNull();
  });

  it('opens the additional mobile sections and labels unavailable modules', () => {
    render(<AdminShell><p>Contenido principal</p></AdminShell>);
    fireEvent.click(screen.getByRole('button', { name: 'Más secciones' }));

    const moreSections = screen.getByRole('navigation', { name: 'Más secciones disponibles próximamente' });
    expect(within(moreSections).getByRole('button', { name: 'Productos, próximamente' })).toBeTruthy();
    const desktopSections = screen.getByRole('navigation', { name: 'Navegación de escritorio' });
    const productButton = within(desktopSections).getByRole('button', { name: 'Productos, próximamente' });
    expect(within(productButton).getByText('Próx.')).toBeTruthy();
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
