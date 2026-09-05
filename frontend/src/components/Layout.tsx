import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../contexts/AuthContext'

interface NavItem {
  to: string
  label: string
  icon: JSX.Element
}

const IconHome = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
const IconUser = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
const IconCalendar = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
const IconScissors = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 01-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 7.794M12.537 15.5H12" /></svg>
const IconClock = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const IconPlus = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
const IconClipboard = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
const IconCreditCard = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
const IconBell = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
const IconChartBar = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
const IconMegaphone = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.68.3-1.43.41-2.19.32a3 3 0 01-2.5-1.5 3 3 0 01.32-3.84L9 8m1.34 7.84L12 16.5m-1.66-.66L15 13.5M9 8c.7-.65 1.5-.94 2.25-.83a3 3 0 012.5 1.5 3 3 0 01-.32 3.84L11 15m-2-7L7.5 6M15 13.5l1.5 1.5" /></svg>
const IconChartPie = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6zM13.5 1.5v6.75H21A7.5 7.5 0 0013.5 1.5z" /></svg>
const IconGear = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.57 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.214-1.28z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>

const NAV_CONFIG: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { to: '/admin', label: 'Inicio', icon: IconHome },
    { to: '/admin/barbers', label: 'Barberos', icon: IconScissors },
    { to: '/admin/clients', label: 'Clientes', icon: IconUser },
    { to: '/admin/services', label: 'Servicios', icon: IconClipboard },
    { to: '/admin/citas', label: 'Citas', icon: IconCalendar },
    { to: '/admin/pagos', label: 'Pagos', icon: IconCreditCard },
    { to: '/admin/notificaciones', label: 'Notificaciones', icon: IconBell },
    { to: '/admin/reportes', label: 'Reportes', icon: IconChartBar },
    { to: '/admin/horarios', label: 'Horarios', icon: IconClock },
    { to: '/admin/campanas', label: 'Campañas', icon: IconMegaphone },
    { to: '/admin/analytics', label: 'Analytics', icon: IconChartPie },
    { to: '/admin/configuracion', label: 'Configuración', icon: IconGear },
  ],
  BARBER: [
    { to: '/barbero', label: 'Mis Citas', icon: IconCalendar },
    { to: '/barbero/mi-perfil', label: 'Perfil', icon: IconUser },
    { to: '/barbero/mi-horario', label: 'Horario', icon: IconClock },
  ],
  CLIENT: [
    { to: '/cliente', label: 'Agendar', icon: IconCalendar },
    { to: '/cliente/mis-citas', label: 'Mis Citas', icon: IconClipboard },
    { to: '/cliente/barberos', label: 'Barberos', icon: IconScissors },
  ],
  ASSISTANT: [
    { to: '/asistente', label: 'Hoy', icon: IconCalendar },
    { to: '/asistente/nueva-cita', label: 'Nueva Cita', icon: IconPlus },
    { to: '/asistente/clientes', label: 'Clientes', icon: IconUser },
  ],
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  BARBER: 'Barbero',
  CLIENT: 'Cliente',
  ASSISTANT: 'Asistente',
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const items = user ? NAV_CONFIG[user.role] : []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-black">
      {/* Status bar safe area */}
      <div className="status-bar-spacer bg-gray-800" />

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 flex items-center justify-between shrink-0"
              style={{ height: '56px' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" className="w-full h-full object-cover" aria-hidden="true" loading="lazy" />
          </div>
          <div>
            <span className="text-white font-bold text-base block leading-tight">Webby's</span>
            {user && <span className="text-[10px] text-cyan uppercase tracking-wider">{ROLE_LABELS[user.role]}</span>}
          </div>
        </div>
        {user && (
          <button onClick={handleLogout} 
                  className="text-gray-500 hover:text-red transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Cerrar sesión">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto px-4 py-4" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <Outlet />
      </main>

      {/* Bottom navigation — estilo app nativa */}
      <nav className="bottom-nav" aria-label="Navegación principal">
        <div className="flex justify-around items-center max-w-lg mx-auto h-16">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin' || item.to === '/barbero' || item.to === '/cliente' || item.to === '/asistente'}
              aria-label={item.label}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[60px] transition-colors rounded-xl ${
                  isActive
                    ? 'text-cyan'
                    : 'text-gray-500 active:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="leading-none" aria-hidden="true">{item.icon}</span>
                  <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                  {isActive && (
                    <div className="w-4 h-0.5 bg-cyan rounded-full mt-0.5" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
