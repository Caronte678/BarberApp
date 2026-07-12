const express = require('express')
const router  = express.Router()
const { verificarToken } = require('../middlewares/authMiddleware')
const db = require('../db/pool')

router.use(verificarToken)

// GET /barberos — listar activos
router.get('/', async (req, res) => {
  const { local_id } = req.usuario
  try {
    const resultado = await db.query(
      'SELECT id, nombre, telefono, activo FROM barberos WHERE local_id = $1 ORDER BY nombre',
      [local_id]
    )
    res.json(resultado.rows)
  } catch (error) {
    res.status(500).json({ error: 'Error interno' })
  }
})

// POST /barberos — crear barbero
router.post('/', async (req, res) => {
  const { local_id } = req.usuario
  const { nombre, telefono } = req.body
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' })
  try {
    const resultado = await db.query(
      'INSERT INTO barberos (local_id, nombre, telefono) VALUES ($1, $2, $3) RETURNING *',
      [local_id, nombre, telefono || null]
    )
    res.status(201).json(resultado.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Error interno' })
  }
})

// PATCH /barberos/:id/activo — activar o desactivar
router.patch('/:id/activo', async (req, res) => {
  const { local_id } = req.usuario
  const { activo } = req.body
  try {
    const resultado = await db.query(
      'UPDATE barberos SET activo = $1 WHERE id = $2 AND local_id = $3 RETURNING *',
      [activo, req.params.id, local_id]
    )
    if (resultado.rows.length === 0) return res.status(404).json({ error: 'Barbero no encontrado' })
    res.json(resultado.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router