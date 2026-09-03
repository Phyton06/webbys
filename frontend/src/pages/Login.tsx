import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../contexts/AuthContext'

const IconUser = <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
const IconClipboard = <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
const IconScissors = <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 01-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 7.794M12.537 15.5H12" /></svg>

const ROLES = [
  { role: 'ADMIN' as const, label: 'Administrador', desc: 'Gestión completa', route: '/admin', icon: IconUser },
  { role: 'ASSISTENT' as const, label: 'Asistente', desc: 'Agendar y registrar', route: '/asistente', icon: IconClipboard },
  { role: 'BARBER' as const, label: 'Barbero', desc: 'Mis citas y horario', route: '/barbero', icon: IconScissors },
  { role: 'CLIENT' as const, label: 'Cliente', desc: 'Agendar mi cita', route: '/cliente', icon: IconScissors },
]

const MOCK_USER: Record<string, { id: string; name: string; email: string; phone: string; role: UserRole }> = {
  ADMIN: { id: 'u1', name: 'Carlos Dueño', email: 'carlos@webbys.com', phone: '5551234567', role: 'ADMIN' },
  ASSISTENT: { id: 'u2', name: 'María Asistente', email: 'maria@webbys.com', phone: '5552345678', role: 'ASSISTANT' },
  BARBER: { id: 'u3', name: 'Juan Barbero', email: 'juan@webbys.com', phone: '5553456789', role: 'BARBER' },
  CLIENT: { id: 'u5', name: 'Ana Cliente', email: 'ana@webbys.com', phone: '5555678901', role: 'CLIENT' },
}

export default function Login() {
  const { loginDirect } = useAuth()
  const navigate = useNavigate()

  const handleRole = (role: string, route: string) => {
    const user = MOCK_USER[role]
    if (user) {
      loginDirect(user)
      navigate(route)
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-black">
      {/* Status bar safe area */}
      <div className="status-bar-spacer" />

      {/* Logo section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo */}
        <div className="w-40 h-40 mb-6 animate-fade-in">
          <img src="/logo.jpeg" alt="Webby's Barbershop" className="w-full h-full object-contain" />
        </div>

        <h1 className="text-3xl font-display font-bold text-white tracking-wide mb-1">
          Webby's
        </h1>
        <p className="text-cyan text-sm font-bold uppercase tracking-[0.3em] mb-1">
          Barbershop
        </p>
        <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">
          Corte y Afeitado
        </p>

        {/* Línea decorativa estilo barber pole */}
        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-red to-transparent mt-6 mb-10" aria-hidden="true" />

        <p className="text-gray-500 text-sm mb-6">
          Selecciona tu perfil
        </p>

        {/* Role buttons */}
        <div className="w-full max-w-sm space-y-3">
          {ROLES.map((r, i) => (
            <button
              key={r.role}
              onClick={() => handleRole(r.role, r.route)}
              className="w-full card hover:border-red/50 transition-all duration-200 flex items-center gap-4 group"
              style={{ animationDelay: `${i * 80}ms` }}
              aria-label={`Entrar como ${r.label}`}
            >
              <div className="w-14 h-14 rounded-xl bg-gray-700 flex items-center justify-center text-cyan group-hover:bg-red/20 transition-colors shrink-0">
                {r.icon}
              </div>
              <div className="text-left flex-1">
                <div className="font-bold text-white text-base">{r.label}</div>
                <div className="text-sm text-gray-500">{r.desc}</div>
              </div>
              <div className="text-gray-500 group-hover:text-cyan transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-6 px-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <p className="text-gray-500 text-[11px] uppercase tracking-widest">
          Prototipo v1.0
        </p>
      </div>
    </div>
  )
}
