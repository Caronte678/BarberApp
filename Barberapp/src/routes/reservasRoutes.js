const express = require('express')
const router = express.Router()
const { verificarToken } = require('../middlewares/authMiddleware')
const {
  getReservasPorFecha,
  crearReserva,
  cambiarEstado
} = require('../controllers/reservasController')

// Todas las rutas requieren token
router.use(verificarToken)

router.get('/',           getReservasPorFecha)
router.post('/',          crearReserva)
router.patch('/:id/estado', cambiarEstado)

module.exports = router