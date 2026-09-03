export default function LoadingSpinner() {
  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        {/* Barber pole spinner */}
        <div className="w-10 h-10 rounded-full border-3 border-gray-700 border-t-cyan animate-spin" 
             style={{ borderWidth: '3px' }} />
        <p className="text-gray-500 text-sm">Cargando...</p>
      </div>
    </div>
  )
}
