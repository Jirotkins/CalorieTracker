import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Foods from './pages/Foods'
import Settings from './pages/Settings'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { MainLayout } from './components/layout/MainLayout'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Veřejná routa */}
          <Route path='/' element={<Login />} />

          {/* Chráněná zóna s Layoutem */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path='/dashboard' element={<Dashboard />} />
            <Route path='/foods' element={<Foods />} />
            <Route path='/settings' element={<Settings />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}