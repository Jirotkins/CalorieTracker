import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Foods from './pages/Foods'
import Settings from './pages/Settings'
import Stats from './pages/Stats'
import AddFood from './pages/AddFood'
import BarcodeScanner from './pages/BarcodeScanner'
import FoodDetail from './pages/FoodDetail'
import RecipeDetail from './pages/RecipeDetail'
import RecipeForm from './pages/RecipeForm'

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
            <Route path='/stats' element={<Stats />} />
            <Route path='/settings' element={<Settings />} />
          </Route>

          {/* Chráněná bez spodního menu */}
          <Route path='/foods/new' element={<ProtectedRoute><AddFood /></ProtectedRoute>} />
          <Route path='/scanner' element={<ProtectedRoute><BarcodeScanner /></ProtectedRoute>} />
          <Route path='/foods/:id' element={<ProtectedRoute><FoodDetail /></ProtectedRoute>} />
          <Route path='/foods/:id/edit' element={<ProtectedRoute><AddFood /></ProtectedRoute>} />
          <Route path='/recipes/new' element={<ProtectedRoute><RecipeForm /></ProtectedRoute>} />
          <Route path='/recipes/:id' element={<ProtectedRoute><RecipeDetail /></ProtectedRoute>} />
          <Route path='/recipes/:id/edit' element={<ProtectedRoute><RecipeForm /></ProtectedRoute>} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}