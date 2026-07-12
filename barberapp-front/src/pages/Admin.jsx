import { useState, useEffect } from 'react'
import api from '../services/api'
import Reportes from '../components/Reportes'
import Horarios from '../components/Horarios'


function Admin({ usuario, onLogout }) {
  const [seccion, setSeccion] = useState('barberos')
  const [barberos, setBarberos] = useState([])
  const [servicios, setServicios] = useState([])
  const [formBarbero, setFormBarbero] = useState({ nombre: '', telefono: '' })
  const [formServicio, setFormServicio] = useState({ nombre: '', duracion_min: 30, precio: 0 })
  const [mensaje, setMensaje] = useState('')
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null)

  useEffect(() => {
    cargarBarberos()
    cargarServicios()
  }, [])

  const cargarBarberos = async () => {
    const res = await api.get('/barberos')
    setBarberos(res.data)
  }

  const cargarServicios = async () => {
    const res = await api.get('/servicios')
    setServicios(res.data)
  }

  const mostrarMensaje = (texto) => {
    setMensaje(texto)
    setTimeout(() => setMensaje(''), 3000)
  }

  const agregarBarbero = async (e) => {
    e.preventDefault()
    try {
      await api.post('/barberos', formBarbero)
      setFormBarbero({ nombre: '', telefono: '' })
      cargarBarberos()
      mostrarMensaje('Barbero agregado correctamente')
    } catch (err) {
      mostrarMensaje('Error al agregar barbero')
    }
  }

  const toggleBarbero = async (id, activo) => {
    await api.patch(`/barberos/${id}/activo`, { activo: !activo })
    cargarBarberos()
  }

  const agregarServicio = async (e) => {
    e.preventDefault()
    try {
      await api.post('/servicios', formServicio)
      setFormServicio({ nombre: '', duracion_min: 30, precio: 0 })
      cargarServicios()
      mostrarMensaje('Servicio agregado correctamente')
    } catch (err) {
      mostrarMensaje('Error al agregar servicio')
    }
  }

  const toggleServicio = async (id, activo) => {
    await api.patch(`/servicios/${id}/activo`, { activo: !activo })
    cargarServicios()
  }

  return (
    <div style={e.contenedor}>

      {/* HEADER */}
      <div style={e.header}>
        <h1 style={e.titulo}>BarberApp — Administración</h1>
        <div style={e.headerDerecha}>
          <span style={e.nombreUsuario}>{usuario.nombre}</span>
          <button style={e.botonCerrar} onClick={onLogout}>Cerrar sesión</button>
        </div>
      </div>

      {/* TABS */}
      <div style={e.tabs}>
        <button
          style={{ ...e.tab, ...(seccion === 'barberos' ? e.tabActivo : {}) }}
          onClick={() => setSeccion('barberos')}
        >Barberos</button>
        <button
          style={{ ...e.tab, ...(seccion === 'servicios' ? e.tabActivo : {}) }}
          onClick={() => setSeccion('servicios')}
        >Servicios</button>
        <button
          style={{ ...e.tab, ...(seccion === 'reportes' ? e.tabActivo : {}) }}
          onClick={() => setSeccion('reportes')}
        >Reportes</button>
      </div>

      {mensaje && <div style={e.toast}>{mensaje}</div>}

      <div style={e.contenido}>

        {/* SECCIÓN BARBEROS */}
        {seccion === 'barberos' && (
          <div>
            <h2 style={e.subtitulo}>Barberos</h2>

            <form onSubmit={agregarBarbero} style={e.form}>
              <input
                style={e.input} placeholder="Nombre *"
                value={formBarbero.nombre}
                onChange={ev => setFormBarbero({ ...formBarbero, nombre: ev.target.value })}
                required
              />
              <input
                style={e.input} placeholder="Teléfono"
                value={formBarbero.telefono}
                onChange={ev => setFormBarbero({ ...formBarbero, telefono: ev.target.value })}
              />
              <button type="submit" style={e.botonAgregar}>+ Agregar</button>
            </form>

            <table style={e.tabla}>
              <thead>
                <tr>
                  <th style={e.th}>Nombre</th>
                  <th style={e.th}>Teléfono</th>
                  <th style={e.th}>Estado</th>
                  <th style={e.th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {barberos.map(b => (
                  <tr key={b.id} style={{ opacity: b.activo ? 1 : 0.5 }}>
                    <td style={e.td}>{b.nombre}</td>
                    <td style={e.td}>{b.telefono || '—'}</td>
                    <td style={e.td}>
                      <span style={{
                        ...e.badge,
                        backgroundColor: b.activo ? '#16a34a20' : '#dc262620',
                        color: b.activo ? '#16a34a' : '#dc2626'
                      }}>
                        {b.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={e.td}>
                      <button
                        style={{ ...e.botonToggle, color: '#2563eb', marginRight: '8px' }}
                        onClick={() => setBarberoSeleccionado(
                          barberoSeleccionado?.id === b.id ? null : b
                        )}
                      >
                        {barberoSeleccionado?.id === b.id ? 'Cerrar' : 'Horarios'}
                      </button>
                      <button
                        style={{ ...e.botonToggle, color: b.activo ? '#dc2626' : '#16a34a' }}
                        onClick={() => toggleBarbero(b.id, b.activo)}
                      >
                        {b.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {barberoSeleccionado && (
              <div style={{ marginTop: '24px' }}>
                <Horarios
                  barberoId={barberoSeleccionado.id}
                  barberoNombre={barberoSeleccionado.nombre}
                />
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN SERVICIOS */}
        {seccion === 'servicios' && (
          <div>
            <h2 style={e.subtitulo}>Servicios</h2>

            <form onSubmit={agregarServicio} style={e.form}>
              <input
                style={e.input} placeholder="Nombre *"
                value={formServicio.nombre}
                onChange={ev => setFormServicio({ ...formServicio, nombre: ev.target.value })}
                required
              />
              <input
                style={e.input} placeholder="Duración (min) *" type="number"
                value={formServicio.duracion_min}
                onChange={ev => setFormServicio({ ...formServicio, duracion_min: parseInt(ev.target.value) })}
                required
              />
              <input
                style={e.input} placeholder="Precio (CLP) *" type="number"
                value={formServicio.precio}
                onChange={ev => setFormServicio({ ...formServicio, precio: parseInt(ev.target.value) })}
                required
              />
              <button type="submit" style={e.botonAgregar}>+ Agregar</button>
            </form>

            <table style={e.tabla}>
              <thead>
                <tr>
                  <th style={e.th}>Nombre</th>
                  <th style={e.th}>Duración</th>
                  <th style={e.th}>Precio</th>
                  <th style={e.th}>Estado</th>
                  <th style={e.th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {servicios.map(s => (
                  <tr key={s.id} style={{ opacity: s.activo ? 1 : 0.5 }}>
                    <td style={e.td}>{s.nombre}</td>
                    <td style={e.td}>{s.duracion_min} min</td>
                    <td style={e.td}>${s.precio?.toLocaleString('es-CL')}</td>
                    <td style={e.td}>
                      <span style={{
                        ...e.badge,
                        backgroundColor: s.activo ? '#16a34a20' : '#dc262620',
                        color: s.activo ? '#16a34a' : '#dc2626'
                      }}>
                        {s.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={e.td}>
                      <button
                        style={{ ...e.botonToggle, color: s.activo ? '#dc2626' : '#16a34a' }}
                        onClick={() => toggleServicio(s.id, s.activo)}
                      >
                        {s.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        
        {/* SECCIÓN REPORTES */}
        {seccion === 'reportes' && (
          <Reportes />
        )}
      </div>
    </div>
  )
}

const e = {
  contenedor: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' },
  header: { backgroundColor: '#1a1a1a', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { margin: 0, fontSize: '18px' },
  headerDerecha: { display: 'flex', alignItems: 'center', gap: '16px' },
  nombreUsuario: { fontSize: '14px', color: '#9ca3af' },
  botonCerrar: { backgroundColor: 'transparent', border: '1px solid #444', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  tabs: { backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', padding: '0 24px' },
  tab: { padding: '14px 20px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '14px', color: '#6b7280', borderBottom: '2px solid transparent' },
  tabActivo: { color: '#1a1a1a', borderBottom: '2px solid #1a1a1a', fontWeight: '600' },
  toast: { backgroundColor: '#16a34a', color: 'white', padding: '10px 20px', textAlign: 'center', fontSize: '14px' },
  contenido: { padding: '24px', maxWidth: '860px', margin: '0 auto' },
  subtitulo: { fontSize: '18px', marginBottom: '20px' },
  form: { display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' },
  input: { padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', minWidth: '160px' },
  botonAgregar: { backgroundColor: '#1a1a1a', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', backgroundColor: '#f3f4f6', fontSize: '13px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' },
  td: { padding: '12px', borderBottom: '1px solid #f3f4f6', fontSize: '14px' },
  badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  botonToggle: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }
}

export default Admin