import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Foods from './pages/Foods'
import Settings from './pages/Settings'
import AddFood from './pages/AddFood'
import BarcodeScanner from './pages/BarcodeScanner'

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

          {/* Chráněná bez spodního menu */}
          <Route path='/foods/new' element={<ProtectedRoute><AddFood /></ProtectedRoute>} />
          <Route path='/scanner' element={<ProtectedRoute><BarcodeScanner /></ProtectedRoute>} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}