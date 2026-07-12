const express = require('express')
const router  = express.Router()
const { verificarToken } = require('../middlewares/authMiddleware')
const db = require('../db/pool')

router.use(verificarToken)

// GET /reportes?mes=2026-06
router.get('/', async (req, res) => {
  const { local_id } = req.usuario
  const { mes } = req.query  // formato: YYYY-MM

  if (!mes) return res.status(400).json({ error: 'Se requiere el parametro mes (YYYY-MM)' })

  try {
    // 1. Resumen general del mes
    const resumen = await db.query(
      `SELECT
        COUNT(*)                                          AS total_citas,
        COUNT(*) FILTER (WHERE estado = 'completada')    AS completadas,
        COUNT(*) FILTER (WHERE estado = 'cancelada')     AS canceladas,
        COUNT(*) FILTER (WHERE estado = 'no_show')       AS no_shows,
        COALESCE(SUM(s.precio) FILTER (WHERE r.estado = 'completada'), 0) AS ingresos
       FROM reservas r
       JOIN servicios s ON r.servicio_id = s.id
       WHERE r.local_id = $1
         AND to_char(r.fecha, 'YYYY-MM') = $2`,
      [local_id, mes]
    )

    // 2. Ranking de barberos
    const barberos = await db.query(
      `SELECT
        b.nombre,
        COUNT(*)                                          AS total_citas,
        COUNT(*) FILTER (WHERE r.estado = 'completada')  AS completadas,
        COALESCE(SUM(s.precio) FILTER (WHERE r.estado = 'completada'), 0) AS ingresos
       FROM reservas r
       JOIN barberos  b ON r.barbero_id  = b.id
       JOIN servicios s ON r.servicio_id = s.id
       WHERE r.local_id = $1
         AND to_char(r.fecha, 'YYYY-MM') = $2
       GROUP BY b.id, b.nombre
       ORDER BY completadas DESC`,
      [local_id, mes]
    )

    // 3. Citas por dia del mes
    const porDia = await db.query(
      `SELECT
        fecha,
        COUNT(*)                                          AS total,
        COUNT(*) FILTER (WHERE estado = 'completada')    AS completadas,
        COALESCE(SUM(s.precio) FILTER (WHERE r.estado = 'completada'), 0) AS ingresos
       FROM reservas r
       JOIN servicios s ON r.servicio_id = s.id
       WHERE r.local_id = $1
         AND to_char(r.fecha, 'YYYY-MM') = $2
       GROUP BY fecha
       ORDER BY fecha ASC`,
      [local_id, mes]
    )

    res.json({
      resumen: resumen.rows[0],
      barberos: barberos.rows,
      porDia: porDia.rows
    })

  } catch (error) {
    console.error('Error en reportes:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router