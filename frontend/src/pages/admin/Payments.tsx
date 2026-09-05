import React, { useEffect, useState, useMemo } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import { StatCard } from '../../components/shared/StatCard'
import { FilterBar } from '../../components/shared/FilterBar'
import { DataTable } from '../../components/shared/DataTable'
import type { Payment, PaymentSummary } from '../../services/interfaces'

interface AppointmentOption {
  id: string
  clientId: string
  barberId: string
  serviceId: string
  date: string
  status: string
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState<PaymentSummary>({
    totalRevenue: 0,
    completedCount: 0,
    pendingCount: 0,
    refundedCount: 0,
    byMethod: {},
  })
  const [appointments, setAppointments] = useState<AppointmentOption[]>([])
  const [clientsMap, setClientsMap] = useState<Record<string, string>>({})
  const [barbersMap, setBarbersMap] = useState<Record<string, string>>({})
  const [servicesMap, setServicesMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  // Filters state
  const [filters, setFilters] = useState<Record<string, string>>({
    method: '',
    status: '',
  })

  // Modal registration state
  const [showModal, setShowModal] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'QR'>('CASH')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const [paymentsRes, summaryRes, apptsRes, clientsRes, barbersRes, servicesRes] =
        await Promise.all([
          api.get('/payments'),
          api.get('/payments/summary').catch(() => ({
            data: {
              totalRevenue: 0,
              completedCount: 0,
              pendingCount: 0,
              refundedCount: 0,
              byMethod: {},
            },
          })),
          api.get('/appointments').catch(() => ({ data: [] })),
          api.get('/clients').catch(() => ({ data: [] })),
          api.get('/barbers').catch(() => ({ data: [] })),
          api.get('/services').catch(() => ({ data: [] })),
        ])

      const pList: Payment[] = paymentsRes.data || []
      setPayments(pList)

      // Calculate or use summary
      if (summaryRes.data && summaryRes.data.totalRevenue !== undefined) {
        setSummary(summaryRes.data)
      } else {
        const totalRevenue = pList
          .filter((p) => p.status === 'COMPLETED')
          .reduce((sum, p) => sum + p.amount, 0)
        const completedCount = pList.filter((p) => p.status === 'COMPLETED').length
        const pendingCount = pList.filter((p) => p.status === 'PENDING').length
        const refundedCount = pList.filter((p) => p.status === 'REFUNDED').length
        const byMethod: Record<string, number> = {}
        pList.forEach((p) => {
          byMethod[p.method] = (byMethod[p.method] || 0) + p.amount
        })
        setSummary({ totalRevenue, completedCount, pendingCount, refundedCount, byMethod })
      }

      setAppointments(apptsRes.data || [])
      setClientsMap(
        Object.fromEntries((clientsRes.data || []).map((c: any) => [c.id, c.name]))
      )
      setBarbersMap(
        Object.fromEntries((barbersRes.data || []).map((b: any) => [b.id, b.name]))
      )
      setServicesMap(
        Object.fromEntries((servicesRes.data || []).map((s: any) => [s.id, s.name]))
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (filters.method && p.method !== filters.method) return false
      if (filters.status && p.status !== filters.status) return false
      return true
    })
  }, [payments, filters])

  const avgTicket = useMemo(() => {
    if (!summary.completedCount) return 0
    return Math.round(summary.totalRevenue / summary.completedCount)
  }, [summary])

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!selectedAppointmentId) {
      setFormError('Seleccione una cita')
      return
    }

    // Duplicate payment prevention check
    const existingPayment = payments.find(
      (p) => p.appointmentId === selectedAppointmentId && p.status !== 'REFUNDED'
    )
    if (existingPayment) {
      setFormError('Esta cita ya tiene un pago registrado')
      return
    }

    const appt = appointments.find((a) => a.id === selectedAppointmentId)
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Ingrese un monto válido')
      return
    }

    try {
      setSubmitting(true)
      const newPaymentPayload = {
        appointmentId: selectedAppointmentId,
        clientId: appt?.clientId || 'u5',
        barberId: appt?.barberId || 'u3',
        serviceId: appt?.serviceId || 's1',
        amount: numAmount,
        method,
        status: 'COMPLETED' as const,
        date: new Date().toISOString().split('T')[0],
        notes,
      }

      const res = await api.post('/payments', newPaymentPayload)
      const created = res.data

      // Update state
      const updated = [created, ...payments]
      setPayments(updated)
      setSummary((prev) => ({
        ...prev,
        totalRevenue: prev.totalRevenue + created.amount,
        completedCount: prev.completedCount + 1,
        byMethod: {
          ...prev.byMethod,
          [created.method]: (prev.byMethod[created.method] || 0) + created.amount,
        },
      }))

      setShowModal(false)
      setSelectedAppointmentId('')
      setAmount('')
      setNotes('')
    } catch (err: any) {
      setFormError(err?.message || 'Error al registrar el pago')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const filterOptions = [
    {
      key: 'method',
      label: 'Método',
      choices: [
        { value: '', label: 'Todos' },
        { value: 'CASH', label: 'Efectivo' },
        { value: 'CARD', label: 'Tarjeta' },
        { value: 'TRANSFER', label: 'Transferencia' },
        { value: 'QR', label: 'QR' },
      ],
    },
    {
      key: 'status',
      label: 'Estado',
      choices: [
        { value: '', label: 'Todos' },
        { value: 'COMPLETED', label: 'Completado' },
        { value: 'PENDING', label: 'Pendiente' },
        { value: 'REFUNDED', label: 'Reembolsado' },
        { value: 'FAILED', label: 'Fallido' },
      ],
    },
  ]

  const columns = [
    {
      key: 'date',
      header: 'Fecha',
      sortable: true,
    },
    {
      key: 'clientId',
      header: 'Cliente',
      render: (p: Payment) => clientsMap[p.clientId] || p.clientId,
      sortable: true,
    },
    {
      key: 'barberId',
      header: 'Barbero',
      render: (p: Payment) => barbersMap[p.barberId] || p.barberId,
      sortable: true,
    },
    {
      key: 'serviceId',
      header: 'Servicio',
      render: (p: Payment) => servicesMap[p.serviceId] || p.serviceId,
    },
    {
      key: 'amount',
      header: 'Monto',
      render: (p: Payment) => `$${p.amount}`,
      sortable: true,
    },
    {
      key: 'method',
      header: 'Método',
      render: (p: Payment) => {
        const labels: Record<string, string> = {
          CASH: 'Efectivo',
          CARD: 'Tarjeta',
          TRANSFER: 'Transferencia',
          QR: 'QR',
        }
        return labels[p.method] || p.method
      },
    },
    {
      key: 'status',
      header: 'Estado',
      render: (p: Payment) => {
        const badgeColors: Record<string, string> = {
          COMPLETED: 'bg-badge-success/20 text-badge-success',
          PENDING: 'bg-yellow-100 text-yellow-800',
          REFUNDED: 'bg-surface text-text-primary',
          FAILED: 'bg-badge-error/20 text-badge-error',
        }
        return (
          <span
            className={`px-2 py-1 text-xs rounded-full font-medium ${
              badgeColors[p.status] || 'bg-surface text-text-primary'
            }`}
          >
            {p.status}
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-primary">Gestión de Pagos</h1>
        <button
          onClick={() => {
            setShowModal(true)
            setFormError('')
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium text-sm"
        >
          + Registrar Pago
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Ingresos Totales" value={`$${summary.totalRevenue}`} />
        <StatCard title="Pagos Realizados" value={summary.completedCount} />
        <StatCard title="Ticket Promedio" value={`$${avgTicket}`} />
        <StatCard title="Pagos Pendientes" value={summary.pendingCount} />
      </div>

      {/* Filters */}
      <FilterBar
        options={filterOptions}
        values={filters}
        onChange={(newFilters) => setFilters(newFilters)}
      />

      {/* Payments Table */}
      <DataTable
        data={filteredPayments}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Buscar por cliente o id..."
      />

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-surface-elevated rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-text-primary">Registrar Pago</h2>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleRegisterPayment} className="space-y-4">
              <div>
                <label
                  htmlFor="payment-appointment"
                  className="block text-sm font-medium text-text-primary"
                >
                  Cita
                </label>
                <select
                  id="payment-appointment"
                  value={selectedAppointmentId}
                  onChange={(e) => {
                    const val = e.target.value
                    setSelectedAppointmentId(val)
                    if (payments.some((p) => p.appointmentId === val && p.status !== 'REFUNDED')) {
                      setFormError('Esta cita ya tiene un pago registrado')
                    } else {
                      setFormError('')
                    }
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Seleccione una cita</option>
                  {appointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      Cita {a.id} ({a.date}) - {clientsMap[a.clientId] || a.clientId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="payment-amount"
                  className="block text-sm font-medium text-text-primary"
                >
                  Monto
                </label>
                <input
                  id="payment-amount"
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="payment-method"
                  className="block text-sm font-medium text-text-primary"
                >
                  Método de Pago
                </label>
                <select
                  id="payment-method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="CASH">Efectivo</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="TRANSFER">Transferencia</option>
                  <option value="QR">QR</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="payment-notes"
                  className="block text-sm font-medium text-text-primary"
                >
                  Notas
                </label>
                <input
                  id="payment-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Opcional..."
                  className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-text-primary bg-surface rounded-md hover:bg-surface-elevated transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Guardar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
