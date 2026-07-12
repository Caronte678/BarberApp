import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Agenda from './pages/Agenda'
import Admin from './pages/Admin'

function App() {
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario')
    if (usuarioGuardado) setUsuario(JSON.parse(usuarioGuardado))
  }, [])

  const handleLogin = (datosUsuario) => setUsuario(datosUsuario)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
  }

  if (!usuario) return <Login onLogin={handleLogin} />

  if (usuario.rol === 'admin') return <Admin usuario={usuario} onLogout={handleLogout} />

  return <Agenda usuario={usuario} onLogout={handleLogout} />
}

export default App