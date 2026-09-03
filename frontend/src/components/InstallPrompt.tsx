import { useState, useEffect, useRef } from 'react'

export default function InstallPrompt() {
  const [showInstall, setShowInstall] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Si el usuario ya dismissó en esta sesión, no mostrar
    if (sessionStorage.getItem('install-dismissed')) return

    // Si está en modo standalone (ya instalado), no mostrar
    if (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true) {
      return
    }

    // Mostrar después de 2 segundos SIEMPRE
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem('install-dismissed')) {
        setShowInstall(true)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Focus management and Escape key handler
  useEffect(() => {
    if (!showInstall) return

    previousFocusRef.current = document.activeElement as HTMLElement
    dialogRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss()
        return
      }
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
      previousFocusRef.current?.focus()
    }
  }, [showInstall])

  const handleInstall = async () => {
    // Intentar evento nativo del browser
    const deferredPrompt = (window as any).__deferredPrompt
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowInstall(false)
        sessionStorage.setItem('install-dismissed', 'true')
      }
      return
    }

    // Detectar browser y mostrar instrucciones
    const ua = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(ua)
    const isSafari = /safari/.test(ua) && !/chrome/.test(ua)
    const isBrave = /brave/.test(ua)
    const isChrome = /chrome/.test(ua) || isBrave

    let msg = ''
    if (isIOS || isSafari) {
      msg = 'Para instalar:\n\n1. Toca el botón Compartir (cuadrado con flecha)\n2. Selecciona "Agregar a pantalla de inicio"\n3. Toca "Agregar"'
    } else if (isChrome || isBrave) {
      msg = 'Para instalar:\n\n1. Toca los 3 puntos (⋮) arriba a la derecha\n2. Selecciona "Agregar a pantalla de inicio"\n3. Toca "Agregar"'
    } else {
      msg = 'Para instalar, agrega esta página a tu pantalla de inicio desde el menú de tu navegador.'
    }
    
    alert(msg)
    setShowInstall(false)
    sessionStorage.setItem('install-dismissed', 'true')
  }

  const handleDismiss = () => {
    setShowInstall(false)
    sessionStorage.setItem('install-dismissed', 'true')
  }

  if (!showInstall) return null

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
