const express = require('express')
const router  = express.Router()
const { verificarToken } = require('../middlewares/authMiddleware')
const db = require('../db/pool')

router.use(verificarToken)

// GET /horarios/:barbero_id — obtener horarios de un barbero
router.get('/:barbero_id', async (req, res) => {
  const { local_id } = req.usuario
  const { barbero_id } = req.params

  try {
    // Verificar que el barbero pertenece al local
    const barbero = await db.query(
      'SELECT id FROM barberos WHERE id = $1 AND local_id = $2',
      [barbero_id, local_id]
    )
    if (barbero.rows.length === 0) {
      return res.status(404).json({ error: 'Barbero no encontrado' })
    }

    const resultado = await db.query(
      'SELECT id, dia_semana, hora_inicio, hora_fin FROM horarios WHERE barbero_id = $1 ORDER BY dia_semana',
      [barbero_id]
    )
    res.json(resultado.rows)
  } catch (error) {
    console.error('Error obteniendo horarios:', error.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// POST /horarios — guardar horarios de un barbero (reemplaza todos)
router.post('/', async (req, res) => {
  const { local_id } = req.usuario
  const { barbero_id, horarios } = req.body

  // horarios es un array: [{ dia_semana: 1, hora_inicio: '09:00', hora_fin: '18:00' }, ...]

  if (!barbero_id || !horarios) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  try {
    // Verificar que el barbero pertenece al local
    const barbero = await db.query(
      'SELECT id FROM barberos WHERE id = $1 AND local_id = $2',
      [barbero_id, local_id]
    )
    if (barbero.rows.length === 0) {
      return res.status(404).json({ error: 'Barbero no encontrado' })
    }

    // Borrar horarios anteriores y reemplazar por los nuevos
    await db.query('DELETE FROM horarios WHERE barbero_id = $1', [barbero_id])

    for (const h of horarios) {
      await db.query(
        'INSERT INTO horarios (barbero_id, dia_semana, hora_inicio, hora_fin) VALUES ($1, $2, $3, $4)',
        [barbero_id, h.dia_semana, h.hora_inicio, h.hora_fin]
      )
    }

    res.json({ mensaje: 'Horarios guardados correctamente' })
  } catch (error) {
    console.error('Error guardando horarios:', error.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// GET /horarios/:barbero_id/disponibilidad?fecha=2026-06-21&duracion=30
router.get('/:barbero_id/disponibilidad', async (req, res) => {
  const { local_id } = req.usuario
  const { barbero_id } = req.params
  const { fecha, duracion } = req.query

  if (!fecha || !duracion) {
    return res.status(400).json({ error: 'Se requiere fecha y duracion' })
  }

  try {
    // 1. Obtener el día de la semana de la fecha pedida (0=domingo, 1=lunes...)
    const diaSemana = new Date(fecha + 'T12:00:00').getDay()

    // 2. Obtener horario del barbero ese día
    const horario = await db.query(
      'SELECT hora_inicio, hora_fin FROM horarios WHERE barbero_id = $1 AND dia_semana = $2',
      [barbero_id, diaSemana]
    )

    if (horario.rows.length === 0) {
      return res.json({ disponibles: [], mensaje: 'El barbero no trabaja ese día' })
    }

    const { hora_inicio, hora_fin } = horario.rows[0]

    // 3. Obtener reservas ya existentes ese día
    const reservas = await db.query(
      `SELECT hora_inicio, hora_fin FROM reservas
       WHERE barbero_id = $1 AND fecha = $2 AND estado NOT IN ('cancelada')`,
      [barbero_id, fecha]
    )

    // 4. Verificar bloqueos ese día
    const bloqueos = await db.query(
      `SELECT hora_inicio, hora_fin FROM bloqueos
       WHERE barbero_id = $1 AND fecha = $2`,
      [barbero_id, fecha]
    )

    // 5. Generar bloques de tiempo disponibles
    const duracionMin  = parseInt(duracion)
    const disponibles  = []

    // Convertir hora a minutos
    const toMin = (hora) => {
      const [h, m] = hora.slice(0, 5).split(':').map(Number)
      return h * 60 + m
    }

    // Convertir minutos a hora HH:MM
    const toHora = (min) => {
      const h = Math.floor(min / 60)
      const m = min % 60
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }

    const inicio  = toMin(hora_inicio)
    const fin     = toMin(hora_fin)

    // Ocupados = reservas + bloqueos
    const ocupados = [
      ...reservas.rows.map(r => ({ inicio: toMin(r.hora_inicio), fin: toMin(r.hora_fin) })),
      ...bloqueos.rows.map(b => ({
        inicio: b.hora_inicio ? toMin(b.hora_inicio) : inicio,
        fin:    b.hora_fin    ? toMin(b.hora_fin)    : fin
      }))
    ]

    // Generar bloques cada 30 minutos
    for (let slot = inicio; slot + duracionMin <= fin; slot += 30) {
      const slotFin = slot + duracionMin

      // Verificar que no choca con ningún ocupado
      const libre = !ocupados.some(o => slot < o.fin && slotFin > o.inicio)

      if (libre) {
        disponibles.push(toHora(slot))
      }
    }

    res.json({ disponibles })

  } catch (error) {
    console.error('Error calculando disponibilidad:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router