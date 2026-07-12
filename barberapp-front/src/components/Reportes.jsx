import { useState, useEffect } from 'react'
import api from '../services/api'

// Obtiene el mes actual en formato YYYY-MM
const mesActual = () => new Date().toISOString().slice(0, 7)

function Reportes() {
  const [mes, setMes]         = useState(mesActual())
  const [datos, setDatos]     = useState(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    cargarReporte()
  }, [mes])

  const cargarReporte = async () => {
    setCargando(true)
    try {
      const res = await api.get(`/reportes?mes=${mes}`)
      setDatos(res.data)
    } catch (err) {
      console.error('Error cargando reporte:', err)
    } finally {
      setCargando(false)
    }
  }

  const fmt = (n) => Number(n).toLocaleString('es-CL')

  return (
    <div>
      {/* SELECTOR DE MES */}
      <div style={e.mesBar}>
        <label style={e.label}>Mes:</label>
        <input
          type="month"
          value={mes}
          onChange={(ev) => setMes(ev.target.value)}
          style={e.inputMes}
        />
      </div>

      {cargando && <p style={e.mensaje}>Cargando...</p>}

      {!cargando && datos && (
        <>
          {/* TARJETAS DE RESUMEN */}
          <div style={e.grid4}>
            <div style={e.tarjeta}>
              <p style={e.tarjetaLabel}>Total citas</p>
              <p style={e.tarjetaValor}>{fmt(datos.resumen.total_citas)}</p>
            </div>
            <div style={{ ...e.tarjeta, borderTop: '3px solid #16a34a' }}>
              <p style={e.tarjetaLabel}>Completadas</p>
              <p style={{ ...e.tarjetaValor, color: '#16a34a' }}>{fmt(datos.resumen.completadas)}</p>
            </div>
            <div style={{ ...e.tarjeta, borderTop: '3px solid #dc2626' }}>
              <p style={e.tarjetaLabel}>Canceladas + No show</p>
              <p style={{ ...e.tarjetaValor, color: '#dc2626' }}>
                {fmt(Number(datos.resumen.canceladas) + Number(datos.resumen.no_shows))}
              </p>
            </div>
            <div style={{ ...e.tarjeta, borderTop: '3px solid #2563eb' }}>
              <p style={e.tarjetaLabel}>Ingresos del mes</p>
              <p style={{ ...e.tarjetaValor, color: '#2563eb' }}>${fmt(datos.resumen.ingresos)}</p>
            </div>
          </div>

          {/* RANKING DE BARBEROS */}
          <h3 style={e.subtitulo}>Rendimiento por barbero</h3>
          <table style={e.tabla}>
            <thead>
              <tr>
                <th style={e.th}>Barbero</th>
                <th style={e.th}>Total citas</th>
                <th style={e.th}>Completadas</th>
                <th style={e.th}>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {datos.barberos.length === 0 && (
                <tr><td colSpan={4} style={{ ...e.td, color: '#9ca3af', textAlign: 'center' }}>Sin datos para este mes</td></tr>
              )}
              {datos.barberos.map((b, i) => (
                <tr key={i}>
                  <td style={e.td}>{b.nombre}</td>
                  <td style={e.td}>{fmt(b.total_citas)}</td>
                  <td style={e.td}>{fmt(b.completadas)}</td>
                  <td style={e.td}>${fmt(b.ingresos)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* CITAS POR DÍA */}
          <h3 style={e.subtitulo}>Detalle por día</h3>
          <table style={e.tabla}>
            <thead>
              <tr>
                <th style={e.th}>Fecha</th>
                <th style={e.th}>Total citas</th>
                <th style={e.th}>Completadas</th>
                <th style={e.th}>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {datos.porDia.length === 0 && (
                <tr><td colSpan={4} style={{ ...e.td, color: '#9ca3af', textAlign: 'center' }}>Sin datos para este mes</td></tr>
              )}
              {datos.porDia.map((d, i) => (
                <tr key={i}>
                  <td style={e.td}>{d.fecha}</td>
                  <td style={e.td}>{fmt(d.total)}</td>
                  <td style={e.td}>{fmt(d.completadas)}</td>
                  <td style={e.td}>${fmt(d.ingresos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

const e = {
  mesBar: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' },
  label: { fontSize: '14px', fontWeight: '500' },
  inputMes: { padding: '6px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' },
  mensaje: { textAlign: 'center', color: '#9ca3af', marginTop: '40px' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' },
  tarjeta: { backgroundColor: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: '3px solid #e5e7eb' },
  tarjetaLabel: { margin: '0 0 8px', fontSize: '13px', color: '#6b7280' },
  tarjetaValor: { margin: 0, fontSize: '28px', fontWeight: '700', color: '#1a1a1a' },
  subtitulo: { fontSize: '16px', fontWeight: '600', margin: '0 0 16px' },
  tabla: { width: '100%', borderCollapse: 'collapse', marginBottom: '32px' },
  th: { textAlign: 'left', padding: '10px 12px', backgroundColor: '#f3f4f6', fontSize: '13px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' },
  td: { padding: '12px', borderBottom: '1px solid #f3f4f6', fontSize: '14px' }
}

export default Reportes