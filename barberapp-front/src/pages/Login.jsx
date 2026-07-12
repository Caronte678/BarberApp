import { useState } from 'react'
import api from '../services/api'

// Estado inicial del formulario
const estadoInicial = { email: '', password: '' }

function Login({ onLogin }) {
  const [form, setForm]     = useState(estadoInicial)
  const [error, setError]   = useState('')
  const [cargando, setCargando] = useState(false)

  // Actualiza el estado cuando el usuario escribe
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Envía el formulario a la API
  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError('')

    try {
      const res = await api.post('/auth/login', form)

      // Guarda el token y los datos del usuario en localStorage
      localStorage.setItem('token',   res.data.token)
      localStorage.setItem('usuario', JSON.stringify(res.data.usuario))

      // Avisa al componente padre que el login fue exitoso
      onLogin(res.data.usuario)

    } catch (err) {
      setError('Email o contraseña incorrectos')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={estilos.contenedor}>
      <div style={estilos.caja}>
        <h1 style={estilos.titulo}>BarberApp</h1>
        <p style={estilos.subtitulo}>Panel de secretaría</p>

        <form onSubmit={handleSubmit}>
          <div style={estilos.campo}>
            <label style={estilos.label}>Email</label>
            <input
              style={estilos.input}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="demo@agenda.cl"
              required
            />
          </div>

          <div style={estilos.campo}>
            <label style={estilos.label}>Contraseña</label>
            <input
              style={estilos.input}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••"
              required
            />
          </div>

          {error && <p style={estilos.error}>{error}</p>}

          <button
            style={estilos.boton}
            type="submit"
            disabled={cargando}
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Estilos en JS — más adelante los moveremos a CSS
const estilos = {
  contenedor: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5'
  },
  caja: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '380px'
  },
  titulo: {
    textAlign: 'center',
    marginBottom: '4px',
    fontSize: '28px'
  },
  subtitulo: {
    textAlign: 'center',
    color: '#888',
    marginBottom: '28px',
    fontSize: '14px'
  },
  campo: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  boton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#1a1a1a',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    cursor: 'pointer',
    marginTop: '8px'
  },
  error: {
    color: '#e53e3e',
    fontSize: '13px',
    marginBottom: '8px'
  }
}

export default Login