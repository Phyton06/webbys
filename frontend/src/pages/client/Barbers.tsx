import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

interface Barber {
  id: string
  name: string
  specialty: string
  phone: string
}

export default function ClientBarbers() {
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/barbers').then(r => setBarbers(r.data.barbers ?? r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nuestros Barberos</h1>

      <div className="space-y-3">
        {barbers.length === 0 ? (
          <p className="text-white/50 text-sm">No hay barberos disponibles</p>
        ) : (
          barbers.map(b => (
            <div key={b.id} className="card">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-cyan/20 flex items-center justify-center text-cyan font-bold text-xl">
                  {b.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-lg">{b.name}</p>
                  <p className="text-white/50">{b.specialty || 'Barbero general'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
