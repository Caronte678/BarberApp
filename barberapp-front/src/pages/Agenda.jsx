import { useState, useEffect } from 'react'
import api from '../services/api'

const hoy = () => new Date().toISOString().split('T')[0]

function Agenda({ usuario, onLogout }) {
  const [fecha, setFecha] = useState(hoy())
  const [reservas, setReservas] = useState([])
  const [cargando, setCargando] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [barberos, setBarberos] = useState([])
  const [servicios, setServicios] = useState([])
  const [form, setForm] = useState({
    barbero_id: '', servicio_id: '', fecha: hoy(),
    hora_inicio: '', cliente_nombre: '', cliente_telefono: '', notas: ''
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [horasDisponibles, setHorasDisponibles] = useState([])
  const [cargandoHoras, setCargandoHoras] = useState(false)

  useEffect(() => { cargarReservas() }, [fecha])
  useEffect(() => { cargarBarberosYServicios() }, [])

  const cargarReservas = async () => {
    setCargando(true)
    try {
      const res = await api.get(`/reservas?fecha=${fecha}`)
      setReservas(res.data)
    } catch (err) {
      console.error('Error cargando reservas:', err)
    } finally {
      setCargando(false)
    }
  }

  const cargarBarberosYServicios = async () => {
    try {
      const [bRes, sRes] = await Promise.all([
        api.get('/barberos'),
        api.get('/servicios')
      ])
      setBarberos(bRes.data)
      setServicios(sRes.data)
    } catch (err) {
      console.error('Error cargando datos:', err)
    }
  }

  const cargarDisponibilidad = async (barbero_id, servicio_id, fecha) => {
    if (!barbero_id || !servicio_id || !fecha) return

    // Obtener duración del servicio seleccionado
    const servicio = servicios.find(s => s.id === servicio_id)
    if (!servicio) return

    setCargandoHoras(true)
    try {
      const res = await api.get(
        `/horarios/${barbero_id}/disponibilidad?fecha=${fecha}&duracion=${servicio.duracion_min}`
      )
      setHorasDisponibles(res.data.disponibles || [])
    } catch (err) {
      console.error('Error cargando disponibilidad:', err)
      setHorasDisponibles([])
    } finally {
      setCargandoHoras(false)
    }
  }

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await api.patch(`/reservas/${id}/estado`, { estado: nuevoEstado })
      // Actualizar la lista sin recargar todo
      setReservas(prev =>
        prev.map(r => r.id === id ? { ...r, estado: nuevoEstado } : r)
      )
    } catch (err) {
      alert('Error al cambiar el estado')
    }
  }

  const handleFormChange = (e) => {
    const nuevoForm = { ...form, [e.target.name]: e.target.value }
    setForm(nuevoForm)

    // Recargar disponibilidad cuando cambia algo relevante
    if (['barbero_id', 'servicio_id', 'fecha'].includes(e.target.name)) {
      cargarDisponibilidad(
        nuevoForm.barbero_id,
        nuevoForm.servicio_id,
        nuevoForm.fecha
      )
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      await api.post('/reservas', form)
      setMostrarForm(false)
      setForm({
        barbero_id: '', servicio_id: '', fecha: hoy(),
        hora_inicio: '', cliente_nombre: '', cliente_telefono: '', notas: ''
      })
      if (form.fecha === fecha) cargarReservas()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la cita')
    } finally {
      setGuardando(false)
    }
  }

  const coloreEstado = {
    confirmada: '#2563eb', completada: '#16a34a',
    cancelada: '#dc2626', no_show: '#9ca3af', pendiente: '#d97706'
  }

  return (
    <div style={estilos.contenedor}>

      {/* HEADER */}
      <div style={estilos.header}>
        <h1 style={estilos.titulo}>BarberApp</h1>
        <div style={estilos.headerDerecha}>
          <span style={estilos.nombreUsuario}>{usuario.nombre}</span>
          <button style={estilos.botonCerrar} onClick={onLogout}>Cerrar sesión</button>
        </div>
      </div>

      {/* BARRA DE FECHA */}
      <div style={estilos.fechaBar}>
        <label style={estilos.fechaLabel}>Fecha:</label>
        <input
          type="date" value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          style={estilos.fechaInput}
        />
        <span style={estilos.totalCitas}>
          {reservas.length} cita{reservas.length !== 1 ? 's' : ''}
        </span>
        <button style={estilos.botonNueva} onClick={() => setMostrarForm(!mostrarForm)}>
          {mostrarForm ? 'Cancelar' : '+ Nueva cita'}
        </button>
      </div>

      {/* FORMULARIO NUEVA CITA */}
      {mostrarForm && (
        <div style={estilos.formulario}>
          <h3 style={estilos.formTitulo}>Registrar nueva cita</h3>
          <form onSubmit={handleSubmit}>
            <div style={estilos.formGrid} className="form-grid">
              <div style={estilos.campo}>
                <label style={estilos.label}>Cliente *</label>
                <input style={estilos.input} name="cliente_nombre" value={form.cliente_nombre} onChange={handleFormChange} placeholder="Nombre del cliente" required />
              </div>
              <div style={estilos.campo}>
                <label style={estilos.label}>Teléfono</label>
                <input style={estilos.input} name="cliente_telefono" value={form.cliente_telefono} onChange={handleFormChange} placeholder="+56912345678" />
              </div>
              <div style={estilos.campo}>
                <label style={estilos.label}>Barbero *</label>
                <select style={estilos.input} name="barbero_id" value={form.barbero_id} onChange={handleFormChange} required>
                  <option value="">Seleccionar barbero</option>
                  {barberos.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
              </div>
              <div style={estilos.campo}>
                <label style={estilos.label}>Servicio *</label>
                <select style={estilos.input} name="servicio_id" value={form.servicio_id} onChange={handleFormChange} required>
                  <option value="">Seleccionar servicio</option>
                  {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre} ({s.duracion_min} min)</option>)}
                </select>
              </div>
              <div style={estilos.campo}>
                <label style={estilos.label}>Fecha *</label>
                <input style={estilos.input} type="date" name="fecha" value={form.fecha} onChange={handleFormChange} required />
              </div>
              <div style={estilos.campo}>
                <label style={estilos.label}>Hora *</label>
                {cargandoHoras ? (
                  <p style={{ fontSize: '13px', color: '#9ca3af', padding: '8px 0' }}>
                    Cargando horas disponibles...
                  </p>
                ) : horasDisponibles.length > 0 ? (
                  <select
                    style={estilos.input}
                    name="hora_inicio"
                    value={form.hora_inicio}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Seleccionar hora</option>
                    {horasDisponibles.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                ) : (
                  <select style={estilos.input} disabled>
                    <option>
                      {form.barbero_id && form.servicio_id && form.fecha
                        ? 'Sin horas disponibles'
                        : 'Elige barbero, servicio y fecha primero'}
                    </option>
                  </select>
                )}
              </div>
              <div style={{ ...estilos.campo, gridColumn: '1 / -1' }}>
                <label style={estilos.label}>Notas</label>
                <input style={estilos.input} name="notas" value={form.notas} onChange={handleFormChange} placeholder="Opcional" />
              </div>
            </div>
            {error && <p style={estilos.error}>{error}</p>}
            <button type="submit" style={estilos.botonGuardar} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar cita'}
            </button>
          </form>
        </div>
      )}

      {/* LISTA DE RESERVAS */}
      <div style={estilos.lista}>
        {cargando && <p style={estilos.mensaje}>Cargando...</p>}
        {!cargando && reservas.length === 0 && (
          <p style={estilos.mensaje}>No hay citas para este día</p>
        )}
        {!cargando && reservas.map((r) => (
          <div key={r.id} style={estilos.tarjeta} className="tarjeta">
            <div style={estilos.tarjetaHora}>
              <span style={estilos.hora}>{r.hora_inicio.slice(0, 5)}</span>
              <span style={estilos.horaFin}>{r.hora_fin.slice(0, 5)}</span>
            </div>
            <div style={estilos.tarjetaInfo}>
              <p style={estilos.clienteNombre}>{r.cliente || 'Sin nombre'}</p>
              <p style={estilos.detalle}>{r.servicio} · {r.barbero}</p>
              {r.notas && <p style={estilos.notas}>{r.notas}</p>}
            </div>
            <div style={estilos.tarjetaDerecha} className="tarjeta-derecha">
              <span style={{
                ...estilos.badge,
                backgroundColor: coloreEstado[r.estado] + '20',
                color: coloreEstado[r.estado]
              }}>
                {r.estado}
              </span>
              <p style={estilos.precio}>${r.precio?.toLocaleString('es-CL')}</p>

              {/* BOTONES DE ESTADO */}
              <div style={estilos.botonesEstado}>
                {r.estado !== 'completada' && (
                  <button
                    style={{ ...estilos.btnEstado, backgroundColor: '#16a34a20', color: '#16a34a' }}
                    onClick={() => cambiarEstado(r.id, 'completada')}
                  >
                    ✓ Completada
                  </button>
                )}
                {r.estado !== 'cancelada' && (
                  <button
                    style={{ ...estilos.btnEstado, backgroundColor: '#dc262620', color: '#dc2626' }}
                    onClick={() => cambiarEstado(r.id, 'cancelada')}
                  >
                    ✕ Cancelar
                  </button>
                )}
                {r.estado !== 'no_show' && (
                  <button
                    style={{ ...estilos.btnEstado, backgroundColor: '#9ca3af20', color: '#6b7280' }}
                    onClick={() => cambiarEstado(r.id, 'no_show')}
                  >
                    No llegó
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const estilos = {
  contenedor: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' },
  header: { backgroundColor: '#1a1a1a', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { margin: 0, fontSize: '20px' },
  headerDerecha: { display: 'flex', alignItems: 'center', gap: '16px' },
  nombreUsuario: { fontSize: '14px', color: '#9ca3af' },
  botonCerrar: { backgroundColor: 'transparent', border: '1px solid #444', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  fechaBar: { padding: '16px 24px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' },
  fechaLabel: { fontSize: '14px', fontWeight: '500' },
  fechaInput: { padding: '6px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' },
  totalCitas: { fontSize: '13px', color: '#6b7280', flex: 1 },
  botonNueva: { backgroundColor: '#1a1a1a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  formulario: { backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '24px', maxWidth: '800px', margin: '0 auto' },
  formTitulo: { margin: '0 0 16px', fontSize: '16px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  campo: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '13px', fontWeight: '500', marginBottom: '4px' },
  input: { padding: '8px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' },
  error: { color: '#dc2626', fontSize: '13px', margin: '8px 0' },
  botonGuardar: { marginTop: '16px', backgroundColor: '#1a1a1a', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  lista: { padding: '24px', maxWidth: '800px', margin: '0 auto' },
  mensaje: { textAlign: 'center', color: '#9ca3af', marginTop: '40px' },
  tarjeta: { backgroundColor: 'white', borderRadius: '10px', padding: '16px', marginBottom: '12px', display: 'flex', gap: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', alignItems: 'flex-start' },
  tarjetaHora: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '52px', paddingTop: '4px' },
  hora: { fontSize: '18px', fontWeight: '600' },
  horaFin: { fontSize: '12px', color: '#9ca3af' },
  tarjetaInfo: { flex: 1 },
  clienteNombre: { margin: '0 0 4px', fontWeight: '600', fontSize: '15px' },
  detalle: { margin: '0 0 4px', fontSize: '13px', color: '#6b7280' },
  notas: { margin: 0, fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' },
  tarjetaDerecha: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' },
  badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  precio: { margin: 0, fontSize: '14px', fontWeight: '600', color: '#1a1a1a' },
  botonesEstado: { display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' },
  btnEstado: { border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }
}

export default Agenda