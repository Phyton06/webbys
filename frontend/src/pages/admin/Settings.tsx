import React, { useState, useEffect } from 'react'
import useSettings from '../../hooks/useSettings'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function Settings() {
  const { settings, loading, error, updateBusiness, updateBranding } = useSettings()
  const [activeTab, setActiveTab] = useState<'business' | 'roles' | 'hours' | 'branding'>('business')

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
    primaryColor: '',
    secondaryColor: '',
    welcomeMessage: '',
  })

  // Opening hours state
  const [hoursForm, setHoursForm] = useState<Record<string, { open: string; close: string } | null>>({})

  // Success / error message state
  const [message, setMessage] = useState('')
  const [errMessage, setErrMessage] = useState('')

  useEffect(() => {
    if (settings) {
      setBusinessForm({
        name: settings.business.name || '',
        address: settings.business.address || '',
        phone: settings.business.phone || '',
        email: settings.business.email || '',
        timezone: settings.business.timezone || '',
        currency: settings.business.currency || '',
      })

      setBrandingForm({
        primaryColor: settings.branding.primaryColor || '',
        secondaryColor: settings.branding.secondaryColor || '',
        welcomeMessage: settings.branding.welcomeMessage || '',
      })

      setHoursForm(settings.business.openingHours || {})
    }
  }, [settings])

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setErrMessage('')
    try {
      await updateBusiness({
        ...businessForm,
        openingHours: hoursForm,
      })
      setMessage('Configuración de negocio guardada con éxito')
    } catch {
      setErrMessage('Error al guardar la configuración de negocio')
    }
  }

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setErrMessage('')
    try {
      await updateBranding(brandingForm)
      setMessage('Configuración de branding guardada con éxito')
    } catch {
      setErrMessage('Error al guardar la configuración de branding')
    }
  }

  const handleHourChange = (day: string, field: 'open' | 'close', value: string) => {
    const current = hoursForm[day] || { open: '09:00', close: '18:00' }
    setHoursForm({
      ...hoursForm,
      [day]: {
        ...current,
        [field]: value,
      },
    })
  }

  const handleToggleDay = (day: string) => {
    if (hoursForm[day]) {
      setHoursForm({
        ...hoursForm,
        [day]: null,
      })
    } else {
      setHoursForm({
        ...hoursForm,
        [day]: { open: '09:00', close: '18:00' },
      })
    }
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuración</h1>

      {loading ? (
        <LoadingSpinner />
      ) : error || !settings ? (
        <div className="text-red-light p-4">{error || 'Error al cargar la configuración'}</div>
      ) : (
        <>
          {message && <div className="bg-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm">{message}</div>}
          {errMessage && <div className="bg-red/20 text-red-light p-3 rounded-lg text-sm">{errMessage}</div>}

          {/* Tabs navigation */}
          <div className="flex border-b border-gray-800 gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('business')}
              className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors shrink-0 ${
                activeTab === 'business' ? 'border-cyan text-cyan' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Datos de Negocio
            </button>
            <button
              onClick={() => setActiveTab('hours')}
              className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors shrink-0 ${
                activeTab === 'hours' ? 'border-cyan text-cyan' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Horarios de Apertura
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors shrink-0 ${
                activeTab === 'branding' ? 'border-cyan text-cyan' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Branding & Personalización
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors shrink-0 ${
                activeTab === 'roles' ? 'border-cyan text-cyan' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Roles & Permisos
            </button>
          </div>

          {/* Content wrapper */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800/80 p-6">
            {activeTab === 'business' && (
              <form onSubmit={handleSaveBusiness} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="business-name">
                    Nombre del Negocio
                  </label>
                  <input
                    id="business-name"
                    aria-label="Nombre del Negocio"
                    type="text"
                    value={businessForm.name}
                    onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="business-address">
                    Dirección
                  </label>
                  <input
                    id="business-address"
                    type="text"
                    value={businessForm.address}
                    onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="business-phone">
                      Teléfono
                    </label>
                    <input
                      id="business-phone"
                      type="text"
                      value={businessForm.phone}
                      onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="business-email">
                      Email
                    </label>
                    <input
                      id="business-email"
                      type="email"
                      value={businessForm.email}
                      onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="business-timezone">
                      Zona Horaria
                    </label>
                    <input
                      id="business-timezone"
                      type="text"
                      value={businessForm.timezone}
                      onChange={(e) => setBusinessForm({ ...businessForm, timezone: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="business-currency">
                      Moneda
                    </label>
                    <input
                      id="business-currency"
                      type="text"
                      value={businessForm.currency}
                      onChange={(e) => setBusinessForm({ ...businessForm, currency: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800 flex justify-end">
                  <button type="submit" className="btn-primary">
                    Guardar Cambios
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'hours' && (
              <form onSubmit={handleSaveBusiness} className="space-y-4">
                <h2 className="text-lg font-semibold text-white mb-4">Horarios de Apertura</h2>
                <div className="space-y-4">
                  {daysOfWeek.map(({ key, label }) => {
                    const item = hoursForm[key];
                    const isOpen = !!item;
                    return (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-800">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isOpen}
                            onChange={() => handleToggleDay(key)}
                            className="w-4 h-4 rounded border-gray-700 bg-black text-cyan focus:ring-cyan"
                            aria-label={`Toggle ${label}`}
                          />
                          <span className="font-medium text-white">{label}</span>
                        </div>
                        {isOpen && item ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={item.open}
                              aria-label={`${key}-open`}
                              onChange={(e) => handleHourChange(key, 'open', e.target.value)}
                              className="input py-1 px-2 text-xs"
                            />
                            <span className="text-gray-500">a</span>
                            <input
                              type="time"
                              value={item.close}
                              aria-label={`${key}-close`}
                              onChange={(e) => handleHourChange(key, 'close', e.target.value)}
                              className="input py-1 px-2 text-xs"
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Cerrado</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-gray-800 flex justify-end">
                  <button type="submit" className="btn-primary">
                    Guardar Cambios
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'branding' && (
              <form onSubmit={handleSaveBranding} className="space-y-4">
                <h2 className="text-lg font-semibold text-white mb-4">Branding & Personalización</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="welcome-msg">
                    Mensaje de Bienvenida
                  </label>
                  <input
                    id="welcome-msg"
                    aria-label="Mensaje de Bienvenida"
                    type="text"
                    value={brandingForm.welcomeMessage}
                    onChange={(e) => setBrandingForm({ ...brandingForm, welcomeMessage: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="primary-color">
                      Color Primario
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={brandingForm.primaryColor}
                        onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                        className="w-10 h-10 border border-gray-800 bg-transparent rounded"
                      />
                      <input
                        id="primary-color"
                        type="text"
                        value={brandingForm.primaryColor}
                        onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                        className="input flex-1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="secondary-color">
                      Color Secundario
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={brandingForm.secondaryColor}
                        onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })}
                        className="w-10 h-10 border border-gray-800 bg-transparent rounded"
                      />
                      <input
                        id="secondary-color"
                        type="text"
                        value={brandingForm.secondaryColor}
                        onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })}
                        className="input flex-1"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800 flex justify-end">
                  <button type="submit" className="btn-primary">
                    Guardar Cambios
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'roles' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Roles & Permisos</h2>
                <p className="text-sm text-gray-400">Esta es una matriz de permisos de solo lectura para los diferentes tipos de usuarios.</p>
                <div className="overflow-x-auto border border-gray-800 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-950 border-b border-gray-800">
                        <th className="p-3 text-xs font-semibold text-gray-400 uppercase">Rol</th>
                        <th className="p-3 text-xs font-semibold text-gray-400 uppercase">Permisos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {settings.roles.map((r) => (
                        <tr key={r.role} className="hover:bg-gray-900/30">
                          <td className="p-3 font-semibold text-cyan">{r.role}</td>
                          <td className="p-3 text-sm text-gray-300">{r.permissions.join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
