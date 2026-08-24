import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { AppShell } from './components/layout/AppShell'
import { FullScreenLoader } from './components/FullScreenLoader'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { OrdersPage } from './pages/OrdersPage'
import { MenuPage } from './pages/MenuPage'
import { CashierPage } from './pages/CashierPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { StatisticsPage } from './pages/StatisticsPage'
import { SettingsPage } from './pages/SettingsPage'

function ProtectedLayout() {
  const { admin, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!admin) return <Navigate to="/login" replace />
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

function LoginRoute() {
  const { admin, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (admin) return <Navigate to="/" replace />
  return <LoginPage />
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/buyurtmalar" element={<OrdersPage />} />
              <Route path="/menyu" element={<MenuPage />} />
              <Route path="/kassa" element={<CashierPage />} />
              <Route path="/harajatlar" element={<ExpensesPage />} />
              <Route path="/statistika" element={<StatisticsPage />} />
              <Route path="/sozlamalar" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
