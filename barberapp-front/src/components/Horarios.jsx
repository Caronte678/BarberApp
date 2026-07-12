import { useState, useEffect } from 'react'
import api from '../services/api'

const DIAS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' }
]

function Horarios({ barberoId, barberoNombre }) {
  const [horarios, setHorarios]   = useState([])
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje]     = useState('')

  useEffect(() => {
    if (barberoId) cargarHorarios()
  }, [barberoId])

  const cargarHorarios = async () => {
    try {
      const res = await api.get(`/horarios/${barberoId}`)
      setHorarios(res.data)
    } catch (err) {
      console.error('Error cargando horarios:', err)
    }
  }

  // Verifica si un día está activado
  const diaActivo = (dia) => horarios.some(h => h.dia_semana === dia)

  // Obtiene el horario de un día
  const getHorario = (dia) => horarios.find(h => h.dia_semana === dia)

  // Activa o desactiva un día
  const toggleDia = (dia) => {
    if (diaActivo(dia)) {
      setHorarios(horarios.filter(h => h.dia_semana !== dia))
    } else {
      setHorarios([...horarios, { dia_semana: dia, hora_inicio: '09:00', hora_fin: '18:00' }])
    }
  }

  // Actualiza hora_inicio o hora_fin de un día
  const updateHora = (dia, campo, valor) => {
    setHorarios(horarios.map(h =>
      h.dia_semana === dia ? { ...h, [campo]: valor } : h
    ))
  }

  const guardar = async () => {
    setGuardando(true)
    setMensaje('')
    try {
      await api.post('/horarios', { barbero_id: barberoId, horarios })
      setMensaje('Horarios guardados correctamente')
      setTimeout(() => setMensaje(''), 3000)
    } catch (err) {
      setMensaje('Error al guardar horarios')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={e.contenedor}>
      <h3 style={e.titulo}>Horarios de {barberoNombre}</h3>

      <div style={e.tabla}>
        {DIAS.map(({ value, label }) => {
          const activo  = diaActivo(value)
          const horario = getHorario(value)
          return (
            <div key={value} style={{ ...e.fila, opacity: activo ? 1 : 0.5 }}>
              {/* CHECKBOX DÍA */}
              <div style={e.diaCol}>
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={() => toggleDia(value)}
                  style={{ marginRight: '8px' }}
                />
                <span style={e.diaLabel}>{label}</span>
              </div>

              {/* HORAS */}
              <div style={e.horasCol}>
                <input
                  type="time"
                  value={horario?.hora_inicio || '09:00'}
                  onChange={(ev) => updateHora(value, 'hora_inicio', ev.target.value)}
                  disabled={!activo}
                  style={e.inputHora}
                />
                <span style={e.separador}>→</span>
                <input
                  type="time"
                  value={horario?.hora_fin || '18:00'}
                  onChange={(ev) => updateHora(value, 'hora_fin', ev.target.value)}
                  disabled={!activo}
                  style={e.inputHora}
                />
              </div>
            </div>
          )
        })}
      </div>

      {mensaje && (
        <p style={{ color: mensaje.includes('Error') ? '#dc2626' : '#16a34a', fontSize: '14px', margin: '12px 0' }}>
          {mensaje}
        </p>
      )}

      <button onClick={guardar} disabled={guardando} style={e.boton}>
        {guardando ? 'Guardando...' : 'Guardar horarios'}
      </button>
    </div>
  )
}

const e = {
  contenedor: { backgroundColor: 'white', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginTop: '24px' },
  titulo: { margin: '0 0 20px', fontSize: '16px', fontWeight: '600' },
  tabla: { display: 'flex', flexDirection: 'column', gap: '12px' },
  fila: { display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 0', borderBottom: '1px solid #f3f4f6' },
  diaCol: { display: 'flex', alignItems: 'center', width: '120px' },
  diaLabel: { fontSize: '14px', fontWeight: '500' },
  horasCol: { display: 'flex', alignItems: 'center', gap: '8px' },
  inputHora: { padding: '6px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' },
  separador: { color: '#9ca3af', fontSize: '14px' },
  boton: { marginTop: '20px', backgroundColor: '#1a1a1a', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }
}

export default Horarios