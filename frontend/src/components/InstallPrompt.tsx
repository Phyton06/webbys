import { useState, useEffect, useRef } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Detectar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setIsInstalled(true)
      return
    }

    // Si el usuario ya dismissó, no mostrar
    if (sessionStorage.getItem('install-dismissed')) {
      return
    }

    // Escuchar el evento nativo del browser
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowInstall(false)
    })

    // Mostrar el prompt después de 2 segundos si no hay evento nativo
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem('install-dismissed')) {
        setShowInstall(true)
      }
    }, 2000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(timer)
    }
  }, [])

  // Focus management and Escape key handler
  useEffect(() => {
    if (!showInstall) return

    // Save previous focus
    previousFocusRef.current = document.activeElement as HTMLElement

    // Focus the dialog
    dialogRef.current?.focus()

    // Trap focus and handle Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss()
        return
      }

      // Trap focus within dialog
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Restore focus
      previousFocusRef.current?.focus()
    }
  }, [showInstall])

  const handleInstall = async () => {
    // Si hay evento nativo del browser, usarlo
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowInstall(false)
      }
      setDeferredPrompt(null)
    } else {
      // Fallback: mostrar instrucciones manuales
      alert('Para instalar:\n\n• Chrome/Edge: Toca los 3 puntos → "Instalar app"\n• Safari: Toca "Compartir" → "Agregar a pantalla de inicio"')
      setShowInstall(false)
    }
  }

  const handleDismiss = () => {
    setShowInstall(false)
    sessionStorage.setItem('install-dismissed', 'true')
  }

  // No mostrar si ya está instalado
  if (isInstalled) {
    return null
  }

  // No mostrar si no toca mostrar
  if (!showInstall) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
         role="presentation">
      <div 
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Instalar Webby's"
        tabIndex={-1}
        className="w-full max-w-lg bg-gray-800 rounded-t-3xl p-6 pb-8 animate-slide-up border-t border-gray-700 outline-none"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        
        {/* Icono */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-red">
            <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="Webby's" className="w-full h-full object-cover" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-center text-white mb-2">
          Instalar Webby's
        </h3>
        <p className="text-gray-400 text-center text-sm mb-6">
          Agrega tu barbería a la pantalla de inicio como una app
        </p>

        <button onClick={handleInstall} className="btn-primary w-full mb-3" aria-label="Instalar app en pantalla de inicio">
          Instalar App
        </button>
        <button onClick={handleDismiss} className="w-full text-center text-gray-500 text-sm py-2" aria-label="Cerrar sin instalar">
          Ahora no
        </button>
      </div>
    </div>
  )
}
