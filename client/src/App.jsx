import { useState } from 'react'
import './App.css'
import { BrowserRouter } from 'react-router-dom' // ✅ Add this
import { AuthProvider } from './components/AuthProvider' // ✅ Add this
import AppRoutes from './routes/AppRoutes' // ✅ Add this

function App() {

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
