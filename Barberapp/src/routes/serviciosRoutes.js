const express = require('express')
const router  = express.Router()
const { verificarToken } = require('../middlewares/authMiddleware')
const db = require('../db/pool')

router.use(verificarToken)

// GET /servicios
router.get('/', async (req, res) => {
  const { local_id } = req.usuario
  try {
    const resultado = await db.query(
      'SELECT id, nombre, duracion_min, precio, activo FROM servicios WHERE local_id = $1 ORDER BY nombre',
      [local_id]
    )
    res.json(resultado.rows)
  } catch (error) {
    res.status(500).json({ error: 'Error interno' })
  }
})

// POST /servicios
router.post('/', async (req, res) => {
  const { local_id } = req.usuario
  const { nombre, duracion_min, precio } = req.body
  if (!nombre || !duracion_min || precio === undefined) {
    return res.status(400).json({ error: 'Nombre, duración y precio son obligatorios' })
  }
  try {
    const resultado = await db.query(
      'INSERT INTO servicios (local_id, nombre, duracion_min, precio) VALUES ($1, $2, $3, $4) RETURNING *',
      [local_id, nombre, duracion_min, precio]
    )
    res.status(201).json(resultado.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Error interno' })
  }
})

// PATCH /servicios/:id/activo
router.patch('/:id/activo', async (req, res) => {
  const { local_id } = req.usuario
  const { activo } = req.body
  try {
    const resultado = await db.query(
      'UPDATE servicios SET activo = $1 WHERE id = $2 AND local_id = $3 RETURNING *',
      [activo, req.params.id, local_id]
    )
    if (resultado.rows.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' })
    res.json(resultado.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router