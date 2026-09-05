import { useState, useEffect } from 'react'
import api from '../api/client'
import type { AppSettings, BusinessSettings, BrandingSettings } from '../services/interfaces'

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await api.get('/settings')
      setSettings(res.data)
    } catch (err: any) {
      setError('Error al cargar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const updateBusiness = async (data: Partial<BusinessSettings>) => {
    try {
      const res = await api.put('/settings/business', data)
      if (settings) {
        setSettings({ ...settings, business: { ...settings.business, ...res.data } })
      }
      return res.data
    } catch (err) {
      throw new Error('Error al actualizar la configuración de negocio')
    }
  }

  const updateBranding = async (data: Partial<BrandingSettings>) => {
    try {
      const res = await api.put('/settings/branding', data)
      if (settings) {
        setSettings({ ...settings, branding: { ...settings.branding, ...res.data } })
      }
      return res.data
    } catch (err) {
      throw new Error('Error al actualizar la configuración de marca')
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return {
    settings,
    loading,
    error,
    updateBusiness,
    updateBranding,
    refresh: fetchSettings,
  }
}
export default useSettings
