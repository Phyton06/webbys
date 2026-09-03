import { useState, useEffect, useRef } from 'react'

let deferredPrompt: any = null
let eventReceived = false

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e
  eventReceived = true
})

export default function InstallPrompt() {
  const [showInstall, setShowInstall] = useState(false)
  const [canNativeInstall, setCanNativeInstall] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (sessionStorage.getItem('install-dismissed')) return
    if (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true) return

    // Esperar max 4s a que llegue el evento beforeinstallprompt
    const check = setInterval(() => {
      if (eventReceived) {
        clearInterval(check)
        setCanNativeInstall(true)
        setShowInstall(true)
      }
    }, 200)

    const fallback = setTimeout(() => {
      clearInterval(check)
      if (!eventReceived) {
        // No hay evento nativo — mostrar instrucciones manuales
        setShowInstall(true)
      }
    }, 4000)

    return () => { clearInterval(check); clearTimeout(fallback) }
  }, [])

  useEffect(() => {
    if (!showInstall) return
    previousFocusRef.current = document.activeElement as HTMLElement
    dialogRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { handleDismiss(); return }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus()
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
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          setShowInstall(false)
          sessionStorage.setItem('install-dismissed', 'true')
        }
        deferredPrompt = null
        return
      } catch { /* fallback abajo */ }
    }
    // Fallback manual
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
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-red">
            <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="Webby's" className="w-full h-full object-cover" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-center text-white mb-2">
          Instalar Webby's
        </h3>

        {canNativeInstall ? (
          <>
            <p className="text-gray-400 text-center text-sm mb-6">
              Agrega tu barbería a la pantalla de inicio como una app
            </p>
            <button onClick={handleInstall} className="btn-primary w-full mb-3" aria-label="Instalar app en pantalla de inicio">
              Instalar App
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-400 text-center text-sm mb-4">
              Tu navegador no ofrece instalación automática. Sigue estos pasos:
            </p>
            <ol className="text-gray-300 text-sm space-y-2 mb-6 list-decimal list-inside">
              <li>Toca el botón de menú (tres puntos) arriba a la derecha</li>
              <li>Selecciona <strong>"Agregar a pantalla de inicio"</strong></li>
              <li>Confirma el nombre y toca "Agregar"</li>
            </ol>
          </>
        )}

        <button onClick={handleDismiss} className="w-full text-center text-gray-500 text-sm py-2" aria-label="Cerrar sin instalar">
          Ahora no
        </button>
      </div>
    </div>
  )
}
