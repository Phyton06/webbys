import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import LoadingSpinner from './components/LoadingSpinner'
import InstallPrompt from './components/InstallPrompt'
import ErrorBoundary from './components/ErrorBoundary'

// Lazy-loaded pages for code splitting
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminBarbers = lazy(() => import('./pages/admin/Barbers'))
const AdminBarberDetail = lazy(() => import('./pages/admin/BarberDetail'))
const AdminClients = lazy(() => import('./pages/admin/Clients'))
const AdminServices = lazy(() => import('./pages/admin/Services'))
const AdminAppointments = lazy(() => import('./pages/admin/Appointments'))
const AdminPayments = lazy(() => import('./pages/admin/Payments'))
const AdminNotifications = lazy(() => import('./pages/admin/Notifications'))
const AdminSettings = lazy(() => import('./pages/admin/Settings'))

const AdminReportsNotifications = lazy(() => import('./pages/admin/ReportsNotifications'))
const AdminCampaigns = lazy(() => import('./pages/admin/Campaigns'))
const AdminCampaignDetail = lazy(() => import('./pages/admin/CampaignDetail'))
const AdminReports = lazy(() => import('./pages/admin/Reports'))
const AdminReportsRevenue = lazy(() => import('./pages/admin/ReportsRevenue'))
const AdminReportsAppointments = lazy(() => import('./pages/admin/ReportsAppointments'))
const AdminReportsClients = lazy(() => import('./pages/admin/ReportsClients'))
const AdminReportsBarbers = lazy(() => import('./pages/admin/ReportsBarbers'))
const AdminSchedules = lazy(() => import('./pages/admin/Schedules'))
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'))

const BarberMyAppointments = lazy(() => import('./pages/barber/MyAppointments'))
const BarberMyProfile = lazy(() => import('./pages/barber/MyProfile'))
const BarberMySchedule = lazy(() => import('./pages/barber/MySchedule'))

const ClientBookAppointment = lazy(() => import('./pages/client/BookAppointment'))
const ClientMyAppointments = lazy(() => import('./pages/client/MyAppointments'))
const ClientBarbers = lazy(() => import('./pages/client/Barbers'))

const AssistantNewAppointment = lazy(() => import('./pages/assistant/NewAppointment'))
const AssistantTodayAppointments = lazy(() => import('./pages/assistant/TodayAppointments'))
const AssistantClients = lazy(() => import('./pages/assistant/Clients'))

const ROLE_ROUTES = {
  ADMIN: '/admin',
  BARBER: '/barbero',
  CLIENT: '/cliente',
  ASSISTANT: '/asistente',
}

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={ROLE_ROUTES[user.role]} replace />
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <LoadingSpinner />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <InstallPrompt />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><Layout /></RoleRoute></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="barbers" element={<AdminBarbers />} />
            <Route path="barbers/:id" element={<AdminBarberDetail />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="citas" element={<AdminAppointments />} />
            <Route path="pagos" element={<AdminPayments />} />
            <Route path="notificaciones" element={<AdminNotifications />} />
            <Route path="configuracion" element={<AdminSettings />} />
            <Route path="reportes/notificaciones" element={<AdminReportsNotifications />} />
            <Route path="campanas" element={<AdminCampaigns />} />
            <Route path="campanas/:id" element={<AdminCampaignDetail />} />
            <Route path="reportes" element={<AdminReports />} />
            <Route path="reportes/ingresos" element={<AdminReportsRevenue />} />
            <Route path="reportes/citas" element={<AdminReportsAppointments />} />
            <Route path="reportes/clientes" element={<AdminReportsClients />} />
            <Route path="reportes/barberos" element={<AdminReportsBarbers />} />
            <Route path="horarios" element={<AdminSchedules />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>

          {/* Barber */}
          <Route path="/barbero" element={<ProtectedRoute><RoleRoute allowedRoles={['BARBER']}><Layout /></RoleRoute></ProtectedRoute>}>
            <Route index element={<BarberMyAppointments />} />
            <Route path="mi-perfil" element={<BarberMyProfile />} />
            <Route path="mi-horario" element={<BarberMySchedule />} />
          </Route>

          {/* Client */}
          <Route path="/cliente" element={<ProtectedRoute><RoleRoute allowedRoles={['CLIENT']}><Layout /></RoleRoute></ProtectedRoute>}>
            <Route index element={<ClientBookAppointment />} />
            <Route path="nueva-cita" element={<ClientBookAppointment />} />
            <Route path="mis-citas" element={<ClientMyAppointments />} />
            <Route path="barberos" element={<ClientBarbers />} />
          </Route>

          {/* Assistant */}
          <Route path="/asistente" element={<ProtectedRoute><RoleRoute allowedRoles={['ASSISTANT']}><Layout /></RoleRoute></ProtectedRoute>}>
            <Route index element={<AssistantTodayAppointments />} />
            <Route path="nueva-cita" element={<AssistantNewAppointment />} />
            <Route path="citas-hoy" element={<AssistantTodayAppointments />} />
            <Route path="clientes" element={<AssistantClients />} />
          </Route>

          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
