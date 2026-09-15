import { useState } from 'react'

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'business' | 'hours' | 'branding' | 'roles'>('business')

  // Business state
  const [businessForm, setBusinessForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    timezone: '',
    currency: '',
  })

  // Branding state
  const [brandingForm, setBrandingForm] = useState({
    primaryColor: '#00BCD4',
    secondaryColor: '#C41E3A',
    welcomeMessage: 'Bienvenido a Webby\'s Barbershop',
  })

  // Hours state
  const [hoursForm] = useState<Record<string, { open: string; close: string }>>({
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '18:00' },
    saturday: { open: '09:00', close: '18:00' },
    sunday: { open: '10:00', close: '14:00' },
  })

  const handleSaveBusiness = () => {
    // ponytail: save logic placeholder
  }

  const daysOfWeek = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ]

  // Helper to build tab button class names
  const getTabClass = (tab: 'business' | 'hours' | 'branding' | 'roles', active: 'business' | 'hours' | 'branding' | 'roles') => {
    const base = 'py-2 px-4 rounded-md border-b-2 font-medium text-sm transition-colors shrink-0 border-[var(--surface)] shrink-0'
    const activeClass = active === tab ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-300 hover:text-white'
    return `${base} ${activeClass}`
  }

  return (
    <div className="bg-[var(--surface)] min-h-screen">
      <h1 className="text-2xl font-display font-bold text-white p-6">Configuración</h1>

      {/* Tabs navigation */}
      <div className="border-b border-[var(--border)] pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('business')}
          className={getTabClass('business', activeTab)}>
            Datos de Negocio
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={getTabClass('hours', activeTab)}>
            Horarios de Apertura
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={getTabClass('branding', activeTab)}>
            Branding & Personalización
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={getTabClass('roles', activeTab)}>
            Roles & Permisos
          </button>
        </div>

        {/* Content wrapper */}
        <div className="p-6 space-y-4">
          {/* Business tab */}
          {activeTab === 'business' && (
            <form className="space-y-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]" onSubmit={handleSaveBusiness}>
              <div>
                <label className="block text-sm font-medium text-gray-300 uppercase tracking-wider mb-1">Nombre del Negocio</label>
                <input
                  value={businessForm.name}
                  onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                  className="w-full rounded border-[var(--border)] py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 uppercase tracking-wider mb-1">Dirección</label>
                <input
                  value={businessForm.address}
                  onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                  className="w-full rounded border-[var(--border)] py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 uppercase tracking-wider mb-1">Teléfono</label>
                  <input
                    value={businessForm.phone}
                    onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                    className="w-full rounded border-[var(--border)] py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 uppercase tracking-wider mb-1">Email</label>
                  <input
                    value={businessForm.email}
                    onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                    className="w-full rounded border-[var(--border)] py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 uppercase tracking-wider mb-1">Zona Horaria</label>
                  <input
                    value={businessForm.timezone}
                    onChange={(e) => setBusinessForm({ ...businessForm, timezone: e.target.value })}
                    className="w-full rounded border-[var(--border)] py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 uppercase tracking-wider mb-1">Moneda</label>
                  <input
                    value={businessForm.currency}
                    onChange={(e) => setBusinessForm({ ...businessForm, currency: e.target.value })}
                    className="w-full rounded border-[var(--border)] py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                <button type="submit" className="btn-primary text-white">Guardar Cambios</button>
              </div>
            </form>
          )}

          {/* Hours tab */}
          {activeTab === 'hours' && (
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <h2 className="text-lg font-bold text-white mb-4">Horarios de Apertura</h2>
              <div className="space-y-4">
                {daysOfWeek.map(({ key, label }) => {
                  const item = hoursForm[key] || { open: '09:00', close: '18:00' }
                  const isOpen = !!item

                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-cyan-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isOpen}
                          onChange={() => {}}
                          className="rounded border-cyan-400 text-cyan-400 h-4 w-4 cursor-pointer"
                        />
                        <span className="font-medium text-white">{label}</span>
                      </div>
                      {isOpen && item ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={item.open}
                            className="w-24 rounded border-[var(--border)] py-1 px-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                          />
                          <span className="text-gray-300">a</span>
                          <input
                            type="time"
                            value={item.close}
                            className="w-24 rounded border-[var(--border)] py-1 px-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Cerrado</span>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                <button className="btn-primary text-white">Guardar Cambios</button>
              </div>
            </div>
          )}

          {/* Branding tab */}
          {activeTab === 'branding' && (
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <h2 className="text-lg font-bold text-white mb-4">Branding & Personalización</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 uppercase tracking-wider mb-1">
                    Mensaje de Bienvenida
                  </label>
                  <input
                    value={brandingForm.welcomeMessage}
                    onChange={(e) => setBrandingForm({ ...brandingForm, welcomeMessage: e.target.value })}
                    className="w-full rounded border-[var(--border)] py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 uppercase tracking-wider mb-1">
                      Color Primario
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandingForm.primaryColor}
                        onChange={(e) =>
                          setBrandingForm({ ...brandingForm, primaryColor: e.target.value })
                        }
                        className="w-12 h-12 rounded border-[var(--border)] bg-white/10"
                      />
                      <input
                        id="primary-color"
                        type="text"
                        value={brandingForm.primaryColor}
                        onChange={(e) =>
                          setBrandingForm({ ...brandingForm, primaryColor: e.target.value })
                        }
                        className="flex-1 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 uppercase tracking-wider mb-1">
                      Color Secundario
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandingForm.secondaryColor}
                        onChange={(e) =>
                          setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })
                        }
                        className="w-12 h-12 rounded border-[var(--border)] bg-white/10"
                      />
                      <input
                        id="secondary-color"
                        type="text"
                        value={brandingForm.secondaryColor}
                        onChange={(e) =>
                          setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })
                        }
                        className="flex-1 text-sm text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                <button className="btn-primary text-white">Guardar Cambios</button>
              </div>
            </div>
          )}

          {/* Roles tab */}
          {activeTab === 'roles' && (
            <div className="p-4 space-y-4">
              <h2 className="text-lg font-bold text-white">Roles & Permisos</h2>
              <p className="text-sm text-gray-400">
                Matriz de permisos de los diferentes tipos de usuarios.
              </p>

              <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[var(--surface)] border-b border-[var(--border)]">
                    <tr>
                      <th className="p-3 text-xs font-semibold text-cyan-400 uppercase">Rol</th>
                      <th className="p-3 text-xs font-semibold text-cyan-400 uppercase">Permisos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    <tr>
                      <td className="p-3 font-medium text-cyan-400">Administrador</td>
                      <td className="p-3 text-gray-300">ver_todos, editar_usuarios, gestion_horarios, ver_reportes</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-cyan-400">Barbero</td>
                      <td className="p-3 text-gray-300">ver_sol propio, editar_horarios, ver_citas</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-cyan-400">Cliente</td>
                      <td className="p-3 text-gray-300">ver_perfil_proprio, agendar_cita</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-cyan-400">Invitado</td>
                      <td className="p-3 text-gray-300">sin_permisos</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
  )
}