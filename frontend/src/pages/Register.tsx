import { Link } from 'react-router-dom'

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-4xl font-bold text-cyan mb-4">Webby's</h1>
        <p className="text-white/50 mb-8">Prototipo — sin registro real</p>
        <Link to="/login" className="btn-primary inline-flex">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
