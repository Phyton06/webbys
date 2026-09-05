import React, { useEffect, useState, useMemo } from 'react'
import api from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import { FilterBar } from '../../components/shared/FilterBar'
import { DataTable } from '../../components/shared/DataTable'
import type { Notification, NotificationTemplate } from '../../services/interfaces'

interface ClientOption {
  id: string
  name: string
  phone?: string
  email?: string
}

export default function Notifications() {
  const [activeTab, setActiveTab] = useState<'history' | 'templates'>('history')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)

  // Filters for history
  const [filters, setFilters] = useState<Record<string, string>>({
    channel: '',
    status: '',
    type: '',
  })

  // Send modal state
  const [showSendModal, setShowSendModal] = useState(false)
  const [recipientType, setRecipientType] = useState<'CLIENT' | 'BARBER' | 'ALL'>('CLIENT')
  const [recipientId, setRecipientId] = useState('')
  const [channel, setChannel] = useState<'SMS' | 'EMAIL' | 'PUSH' | 'WHATSAPP'>('SMS')
  const [type, setType] = useState<Notification['type']>('GENERAL')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [sending, setSending] = useState(false)
  const [sendSuccessMsg, setSendSuccessMsg] = useState('')

  // Create Template modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateType, setTemplateType] = useState<Notification['type']>('GENERAL')
  const [templateChannel, setTemplateChannel] = useState<Notification['channel']>('SMS')
  const [templateSubject, setTemplateSubject] = useState('')
  const [templateBody, setTemplateBody] = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)

  const fetchData = async () => {
    try {
      const [notifsRes, tplsRes, clientsRes] = await Promise.all([
        api.get('/notifications').catch(() => ({ data: [] })),
        api.get('/notifications/templates').catch(() => ({ data: [] })),
        api.get('/clients').catch(() => ({ data: [] })),
      ])
      setNotifications(notifsRes.data || [])
      setTemplates(tplsRes.data || [])
      setClients(clientsRes.data || [])
      if (clientsRes.data?.length > 0) {
        setRecipientId(clientsRes.data[0].id)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filters.channel && n.channel !== filters.channel) return false
      if (filters.status && n.status !== filters.status) return false
      if (filters.type && n.type !== filters.type) return false
      return true
    })
  }, [notifications, filters])

  // Template select in send modal
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId)
    if (!templateId) return
    const tpl = templates.find((t) => t.id === templateId)
    if (tpl) {
      setTitle(tpl.subject || tpl.name)
      setMessage(tpl.body)
      setChannel(tpl.channel)
      setType(tpl.type)
    }
  }

  // Handle Send Notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setSendSuccessMsg('')

    try {
      if (recipientType === 'ALL') {
        const bulkPayload = clients.map((c) => ({
          recipientType: 'CLIENT' as const,
          recipientId: c.id,
          channel,
          type,
          title,
          message,
          status: 'SENT' as const,
          sentAt: new Date().toISOString(),
        }))

        const res = await api.post('/notifications/bulk', bulkPayload)
        const createdList = Array.isArray(res.data) ? res.data : bulkPayload
        setNotifications((prev) => [...createdList, ...prev])
        setSendSuccessMsg(`${createdList.length} notificaciones enviadas con éxito`)
      } else {
        const singlePayload = {
          recipientType,
          recipientId,
          channel,
          type,
          title,
          message,
          status: 'SENT' as const,
          sentAt: new Date().toISOString(),
        }
        const res = await api.post('/notifications', singlePayload)
        const created = res.data || singlePayload
        setNotifications((prev) => [created, ...prev])
        setSendSuccessMsg('Notificación enviada con éxito')
      }

      setShowSendModal(false)
      setTitle('')
      setMessage('')
      setSelectedTemplateId('')
    } finally {
      setSending(false)
    }
  }

  // Handle Create Template
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingTemplate(true)

    try {
      const payload = {
        name: templateName,
        type: templateType,
        channel: templateChannel,
        subject: templateSubject,
        body: templateBody,
        variables: [],
      }

      const res = await api.post('/notifications/templates', payload)
      const created = res.data || { ...payload, id: Math.random().toString(36).slice(2, 9) }
      setTemplates((prev) => [...prev, created])

      setShowTemplateModal(false)
      setTemplateName('')
      setTemplateSubject('')
      setTemplateBody('')
    } finally {
      setSavingTemplate(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const filterOptions = [
    {
      key: 'channel',
      label: 'Canal',
      choices: [
        { value: '', label: 'Todos' },
        { value: 'SMS', label: 'SMS' },
        { value: 'EMAIL', label: 'Email' },
        { value: 'PUSH', label: 'Push' },
        { value: 'WHATSAPP', label: 'WhatsApp' },
      ],
    },
    {
      key: 'status',
      label: 'Estado',
      choices: [
        { value: '', label: 'Todos' },
        { value: 'SENT', label: 'Enviado' },
        { value: 'DELIVERED', label: 'Entregado' },
        { value: 'PENDING', label: 'Pendiente' },
        { value: 'FAILED', label: 'Fallido' },
      ],
    },
    {
      key: 'type',
      label: 'Tipo',
      choices: [
        { value: '', label: 'Todos' },
        { value: 'APPOINTMENT_REMINDER', label: 'Recordatorio' },
        { value: 'PROMOTION', label: 'Promoción' },
        { value: 'STATUS_CHANGE', label: 'Cambio de Estado' },
        { value: 'GENERAL', label: 'General' },
      ],
    },
  ]

  const historyColumns = [
    {
      key: 'title',
      header: 'Título / Mensaje',
      render: (n: Notification) => (
        <div>
          <div className="font-medium text-gray-900">{n.title}</div>
          <div className="text-xs text-gray-500 truncate max-w-xs">{n.message}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'recipientType',
      header: 'Destinatario',
      render: (n: Notification) => {
        if (n.recipientType === 'ALL') return 'Todos los clientes'
        const client = clients.find((c) => c.id === n.recipientId)
        return client ? client.name : n.recipientId || n.recipientType
      },
    },
    {
      key: 'channel',
      header: 'Canal',
      render: (n: Notification) => (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
          {n.channel}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (n: Notification) => {
        const badgeColors: Record<string, string> = {
          SENT: 'bg-blue-100 text-blue-800',
          DELIVERED: 'bg-green-100 text-green-800',
          PENDING: 'bg-yellow-100 text-yellow-800',
          FAILED: 'bg-red-100 text-red-800',
        }
        return (
          <span
            className={`px-2 py-1 text-xs rounded-full font-medium ${
              badgeColors[n.status] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {n.status}
          </span>
        )
      },
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      render: (n: Notification) => {
        const dateStr = n.sentAt || n.createdAt
        return dateStr ? new Date(dateStr).toLocaleDateString() : '-'
      },
      sortable: true,
    },
  ]

  const templateColumns = [
    {
      key: 'name',
      header: 'Nombre',
      sortable: true,
    },
    {
      key: 'channel',
      header: 'Canal',
      render: (t: NotificationTemplate) => (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
          {t.channel}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
    },
    {
      key: 'body',
      header: 'Contenido',
      render: (t: NotificationTemplate) => (
        <div className="text-xs text-gray-600 truncate max-w-sm">{t.body}</div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
        <div className="flex gap-2">
          {activeTab === 'templates' && (
            <button
              onClick={() => setShowTemplateModal(true)}
              className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition font-medium text-sm"
            >
              + Nueva Plantilla
            </button>
          )}
          <button
            onClick={() => {
              setShowSendModal(true)
              setSendSuccessMsg('')
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium text-sm"
          >
            + Enviar Notificación
          </button>
        </div>
      </div>

      {sendSuccessMsg && (
        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-md border border-green-200">
          {sendSuccessMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Historial
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition ${
            activeTab === 'templates'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Plantillas
        </button>
      </div>

      {/* History Tab Content */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <FilterBar
            options={filterOptions}
            values={filters}
            onChange={(newFilters) => setFilters(newFilters)}
          />

          <DataTable
            data={filteredNotifications}
            columns={historyColumns}
            keyExtractor={(item) => item.id}
            searchPlaceholder="Buscar notificación..."
          />
        </div>
      )}

      {/* Templates Tab Content */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <DataTable
            data={templates}
            columns={templateColumns}
            keyExtractor={(item) => item.id}
            searchPlaceholder="Buscar plantilla..."
          />
        </div>
      )}

      {/* Send Notification Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Enviar Notificación</h2>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label
                  htmlFor="notif-template-select"
                  className="block text-sm font-medium text-gray-700"
                >
                  Usar Plantilla (Opcional)
                </label>
                <select
                  id="notif-template-select"
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Personalizada (sin plantilla)</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.channel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="notif-recipient-type"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Tipo de Destinatario
                  </label>
                  <select
                    id="notif-recipient-type"
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value as any)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="CLIENT">Cliente individual</option>
                    <option value="ALL">Todos los clientes</option>
                    <option value="BARBER">Barbero</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="notif-channel"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Canal de Envío
                  </label>
                  <select
                    id="notif-channel"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="SMS">SMS</option>
                    <option value="EMAIL">Email</option>
                    <option value="PUSH">Push</option>
                    <option value="WHATSAPP">WhatsApp</option>
                  </select>
                </div>
              </div>

              {recipientType === 'CLIENT' && (
                <div>
                  <label
                    htmlFor="notif-recipient"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Destinatario
                  </label>
                  <select
                    id="notif-recipient"
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label
                  htmlFor="notif-title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Título / Asunto
                </label>
                <input
                  id="notif-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Recordatorio de cita"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="notif-message"
                  className="block text-sm font-medium text-gray-700"
                >
                  Mensaje
                </label>
                <textarea
                  id="notif-message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe el contenido de la notificación..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {sending ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Nueva Plantilla</h2>

            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label
                  htmlFor="template-name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nombre de plantilla
                </label>
                <input
                  id="template-name"
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Ej. Recordatorio de cita 1h antes"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="template-type"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Tipo
                  </label>
                  <select
                    id="template-type"
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value as any)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="APPOINTMENT_REMINDER">Recordatorio</option>
                    <option value="PROMOTION">Promoción</option>
                    <option value="STATUS_CHANGE">Cambio de estado</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="template-channel"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Canal
                  </label>
                  <select
                    id="template-channel"
                    value={templateChannel}
                    onChange={(e) => setTemplateChannel(e.target.value as any)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="SMS">SMS</option>
                    <option value="EMAIL">Email</option>
                    <option value="PUSH">Push</option>
                    <option value="WHATSAPP">WhatsApp</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="template-subject"
                  className="block text-sm font-medium text-gray-700"
                >
                  Asunto (opcional)
                </label>
                <input
                  id="template-subject"
                  type="text"
                  value={templateSubject}
                  onChange={(e) => setTemplateSubject(e.target.value)}
                  placeholder="Asunto para Email o WhatsApp"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="template-body"
                  className="block text-sm font-medium text-gray-700"
                >
                  Cuerpo de la plantilla
                </label>
                <textarea
                  id="template-body"
                  rows={3}
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  placeholder="Ej. Hola {{clientName}}, tu cita es a las {{time}}"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingTemplate}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-900 transition disabled:opacity-50"
                >
                  {savingTemplate ? 'Guardando...' : 'Guardar Plantilla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
