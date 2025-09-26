
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar.tsx'
import Home from './pages/Home.tsx'
import Livros from './pages/Livros.tsx'
import Emprestimos from './pages/Emprestimos.tsx'
import Reservas from './pages/Reservas.tsx'
import Categorias from './pages/Categorias.tsx'
import Autores from './pages/Autores.tsx'
import Dashboard from './pages/Dashboard.tsx'

function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '10px',
            fontSize: '14px'
          },
          success: {
            style: {
              background: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
      
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <Navbar />
          
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/livros" element={<Livros />} />
              <Route path="/emprestimos" element={<Emprestimos />} />
              <Route path="/reservas" element={<Reservas />} />
              <Route path="/categorias" element={<Categorias />} />
              <Route path="/autores" element={<Autores />} />
            </Routes>
          </main>
        </div>
      </Router>
    </>
  )
}

export default App
