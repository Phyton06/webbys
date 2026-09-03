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
const AdminClients = lazy(() => import('./pages/admin/Clients'))
const AdminServices = lazy(() => import('./pages/admin/Services'))
const AdminAppointments = lazy(() => import('./pages/admin/Appointments'))
const AdminSettings = lazy(() => import('./pages/admin/Settings'))

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
            <Route path="barbers" element={<AdminBarbers />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="citas" element={<AdminAppointments />} />
            <Route path="configuracion" element={<AdminSettings />} />
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
