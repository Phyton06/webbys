// Service interfaces for all admin modules
// All methods return Promise<T> to mimic async API calls
// Swappable to real API implementation later

// ─── Shared Types ────────────────────────────────────────────

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface DateRange {
  start: string // YYYY-MM-DD
  end: string // YYYY-MM-DD
}

// ─── Payment Types ───────────────────────────────────────────

export interface Payment {
  id: string
  appointmentId: string
  clientId: string
  barberId: string
  serviceId: string
  amount: number
  method: 'CASH' | 'CARD' | 'TRANSFER' | 'QR'
  status: 'PENDING' | 'COMPLETED' | 'REFUNDED' | 'FAILED'
  date: string // YYYY-MM-DD
  notes?: string
}

export interface PaymentSummary {
  totalRevenue: number
  completedCount: number
  pendingCount: number
  refundedCount: number
  byMethod: Record<string, number>
}

export interface PaymentFilter {
  dateRange?: DateRange
  method?: string
  status?: string
  barberId?: string
}

// ─── Notification Types ──────────────────────────────────────

export interface Notification {
  id: string
  type: 'APPOINTMENT_REMINDER' | 'PROMOTION' | 'STATUS_CHANGE' | 'GENERAL'
  title: string
  message: string
  recipientId?: string
  recipientType: 'CLIENT' | 'BARBER' | 'ALL'
  channel: 'SMS' | 'EMAIL' | 'PUSH' | 'WHATSAPP'
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED'
  sentAt?: string
  createdAt: string
  variables?: Record<string, string>
}

export interface NotificationTemplate {
  id: string
  name: string
  type: Notification['type']
  channel: Notification['channel']
  subject?: string
  body: string
  variables: string[]
}

export interface NotificationFilter {
  type?: string
  channel?: string
  status?: string
  dateRange?: DateRange
}

export interface ScheduledNotificationRule {
  id: string
  name: string
  type: 'APPOINTMENT_REMINDER' | 'PROMOTION' | 'CUSTOM'
  offsetHours: number // -24 = 24h before, -1 = 1h before
  frequencyPerDay: number // e.g. 1
  advanceDays: number // e.g. 1
  active: boolean
  title: string
  body: string
}

export interface PushTestPayload {
  title: string
  message: string
}

// ─── Notification Stats Types ────────────────────────────────

export interface NotificationStats {
  total: number
  sent: number
  delivered: number
  failed: number
  byChannel: Record<string, { sent: number; delivered: number; failed: number }>
  byType: Record<string, number>
  trend: { date: string; count: number }[]
}

// ─── Report Types ────────────────────────────────────────────

export interface RevenueReport {
  period: string
  totalRevenue: number
  appointmentCount: number
  averageTicket: number
  byBarber: { barberId: string; barberName: string; revenue: number; appointments: number }[]
  byService: { serviceId: string; serviceName: string; revenue: number; count: number }[]
}

export interface AppointmentReport {
  period: string
  total: number
  completed: number
  cancelled: number
  noShow: number
  byStatus: Record<string, number>
  byDay: { date: string; count: number }[]
}

export interface ClientReport {
  period: string
  totalClients: number
  newClients: number
  returningClients: number
  retentionRate: number
  topClients: { clientId: string; name: string; visits: number; spent: number }[]
}

export interface BarberReport {
  period: string
  barbers: {
    barberId: string
    name: string
    appointments: number
    revenue: number
    averageRating: number
    noShowRate: number
  }[]
}

// ─── Schedule Types ──────────────────────────────────────────

export interface ScheduleEntry {
  day: string // monday, tuesday, etc.
  slots: { start: string; end: string }[]
}

export interface ScheduleException {
  id: string
  barberId: string
  date: string // YYYY-MM-DD
  type: 'DAY_OFF' | 'HALF_DAY' | 'CUSTOM'
  slots?: { start: string; end: string }[]
  reason?: string
}

export interface WeeklySchedule {
  barberId: string
  entries: ScheduleEntry[]
  exceptions: ScheduleException[]
}

// ─── Campaign Types ──────────────────────────────────────────

export interface Campaign {
  id: string
  name: string
  description: string
  type: 'PROMOTION' | 'DISCOUNT' | 'REFERRAL' | 'SEASONAL'
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  channel: Notification['channel']
  discountPercent?: number
  referralCode?: string
  startDate: string
  endDate: string
  targetAudience: 'ALL' | 'CLIENTS' | 'INACTIVE' | 'NEW'
  stats: CampaignStats
  createdAt: string
}

export interface CampaignStats {
  sent: number
  opened: number
  clicked: number
  converted: number
  revenue: number
}

// ─── Analytics Types ─────────────────────────────────────────

export interface AnalyticsKPI {
  label: string
  value: number
  change: number // percentage change from previous period
  trend: 'UP' | 'DOWN' | 'STABLE'
}

export interface RetentionData {
  month: string
  retained: number
  churned: number
}

export interface PeakHour {
  hour: number
  day: string
  count: number
}

export interface AnalyticsSummary {
  kpis: AnalyticsKPI[]
  retention: RetentionData[]
  peakHours: PeakHour[]
  topServices: { serviceId: string; name: string; count: number; revenue: number }[]
  customerLifetimeValue: { clientId: string; name: string; ltv: number; visits: number }[]
  noShowRate: number
}

// ─── Settings Types ──────────────────────────────────────────

export interface BusinessSettings {
  name: string
  address: string
  phone: string
  email: string
  openingHours: Record<string, { open: string; close: string } | null>
  timezone: string
  currency: string
}

export interface RolePermission {
  role: string
  permissions: string[]
}

export interface BrandingSettings {
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  welcomeMessage: string
}

export interface AppSettings {
  business: BusinessSettings
  roles: RolePermission[]
  branding: BrandingSettings
}

// ─── Dashboard Types ─────────────────────────────────────────

export interface DashboardData {
  todayAppointments: number
  pendingConfirmations: number
  weekRevenue: number
  recentPayments: Payment[]
  upcomingAppointments: { id: string; clientName: string; barberName: string; service: string; time: string }[]
}

// ─── Extended Barber Types ───────────────────────────────────

export interface BarberProfile {
  id: string
  userId: string
  bio?: string
  photoUrl?: string
  schedule?: Record<string, { start: string; end: string }[]>
}

export interface BarberPerformance {
  barberId: string
  name: string
  totalAppointments: number
  completedAppointments: number
  revenue: number
  averageRating: number
  noShowRate: number
  active: boolean
}

// ─── Extended Client Types ───────────────────────────────────

export interface ClientProfile {
  id: string
  name: string
  email: string
  phone: string
  totalVisits: number
  totalSpent: number
  lastVisit?: string
  preferences?: string
  notes?: string
}

// ─── Extended Appointment Types ──────────────────────────────

export interface AppointmentDetail {
  id: string
  clientId: string
  clientName: string
  barberId: string
  barberName: string
  serviceId: string
  serviceName: string
  date: string
  startTime: string
  endTime: string
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes?: string
  createdAt: string
}

export type AppointmentStatus = AppointmentDetail['status']

// ─── Service Interfaces ──────────────────────────────────────

export interface PaymentService {
  getAll(filter?: PaymentFilter): Promise<Payment[]>
  getById(id: string): Promise<Payment>
  create(payment: Omit<Payment, 'id'>): Promise<Payment>
  updateStatus(id: string, status: Payment['status']): Promise<Payment>
  getSummary(filter?: PaymentFilter): Promise<PaymentSummary>
  getDailyRevenue(dateRange: DateRange): Promise<{ date: string; total: number }[]>
}

export interface NotificationService {
  getAll(filter?: NotificationFilter): Promise<Notification[]>
  getById(id: string): Promise<Notification>
  send(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification>
  sendBulk(notifications: Omit<Notification, 'id' | 'createdAt'>[]): Promise<Notification[]>
  getTemplates(): Promise<NotificationTemplate[]>
  createTemplate(template: Omit<NotificationTemplate, 'id'>): Promise<NotificationTemplate>
  updateTemplate(id: string, template: Partial<NotificationTemplate>): Promise<NotificationTemplate>
  deleteTemplate(id: string): Promise<void>
  renderTemplate(templateId: string, variables: Record<string, string>): Promise<{ subject?: string; body: string }>
}

export interface NotificationStatsService {
  getStats(dateRange?: DateRange): Promise<NotificationStats>
  getStatsByChannel(dateRange?: DateRange): Promise<Record<string, { sent: number; delivered: number; failed: number }>>
  getTrend(days?: number): Promise<{ date: string; count: number }[]>
}

export interface ReportService {
  getRevenueReport(period: string, dateRange?: DateRange): Promise<RevenueReport>
  getAppointmentReport(period: string, dateRange?: DateRange): Promise<AppointmentReport>
  getClientReport(period: string, dateRange?: DateRange): Promise<ClientReport>
  getBarberReport(period: string, dateRange?: DateRange): Promise<BarberReport>
  exportCSV(type: string, dateRange?: DateRange): Promise<string>
}

export interface ScheduleService {
  getWeeklySchedule(barberId: string): Promise<WeeklySchedule>
  updateWeeklySchedule(barberId: string, entries: ScheduleEntry[]): Promise<WeeklySchedule>
  addException(exception: Omit<ScheduleException, 'id'>): Promise<ScheduleException>
  removeException(id: string): Promise<void>
  getExceptions(barberId: string, dateRange?: DateRange): Promise<ScheduleException[]>
  checkAvailability(barberId: string, date: string, start: string, end: string): Promise<boolean>
}

export interface CampaignService {
  getAll(): Promise<Campaign[]>
  getById(id: string): Promise<Campaign>
  create(campaign: Omit<Campaign, 'id' | 'createdAt' | 'stats'>): Promise<Campaign>
  update(id: string, campaign: Partial<Campaign>): Promise<Campaign>
  updateStatus(id: string, status: Campaign['status']): Promise<Campaign>
  getStats(id: string): Promise<CampaignStats>
  generateReferralCode(id: string): Promise<string>
}

export interface AnalyticsService {
  getSummary(dateRange?: DateRange): Promise<AnalyticsSummary>
  getRetention(months?: number): Promise<RetentionData[]>
  getPeakHours(dateRange?: DateRange): Promise<PeakHour[]>
  getCustomerLTV(): Promise<{ clientId: string; name: string; ltv: number; visits: number }[]>
  getNoShowRate(dateRange?: DateRange): Promise<number>
}

export interface SettingsService {
  get(): Promise<AppSettings>
  updateBusiness(settings: Partial<BusinessSettings>): Promise<BusinessSettings>
  updateBranding(settings: Partial<BrandingSettings>): Promise<BrandingSettings>
  getRoles(): Promise<RolePermission[]>
}

export interface DashboardService {
  getData(): Promise<DashboardData>
  getWeeklyRevenue(): Promise<{ date: string; total: number }[]>
}

export interface BarberService {
  getAll(): Promise<BarberPerformance[]>
  getById(id: string): Promise<BarberPerformance>
  update(id: string, data: Partial<BarberPerformance>): Promise<BarberPerformance>
  deactivate(id: string): Promise<BarberPerformance>
  reactivate(id: string): Promise<BarberPerformance>
  getPerformance(id: string, dateRange?: DateRange): Promise<BarberPerformance>
}

export interface ClientService {
  getAll(search?: string): Promise<ClientProfile[]>
  getById(id: string): Promise<ClientProfile>
  update(id: string, data: Partial<ClientProfile>): Promise<ClientProfile>
  getHistory(id: string): Promise<AppointmentDetail[]>
  addNote(id: string, note: string): Promise<ClientProfile>
}

export interface AppointmentService {
  getAll(filter?: { dateRange?: DateRange; barberId?: string; status?: string }): Promise<AppointmentDetail[]>
  getById(id: string): Promise<AppointmentDetail>
  updateStatus(id: string, status: AppointmentStatus): Promise<AppointmentDetail>
  cancel(id: string, reason?: string): Promise<AppointmentDetail>
  reassign(id: string, newBarberId: string): Promise<AppointmentDetail>
  getWaitlist(): Promise<AppointmentDetail[]>
}