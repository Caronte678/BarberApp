const db = require('../db/pool')

// GET /reservas?fecha=2026-06-20
const getReservasPorFecha = async (req, res) => {
  const { fecha } = req.query
  const { local_id } = req.usuario

  if (!fecha) {
    return res.status(400).json({ error: 'Se requiere el parámetro fecha' })
  }

  try {
    const resultado = await db.query(
      `SELECT 
        r.id,
        r.fecha,
        r.hora_inicio,
        r.hora_fin,
        r.estado,
        r.notas,
        b.nombre  AS barbero,
        s.nombre  AS servicio,
        s.precio,
        c.nombre  AS cliente,
        c.telefono AS cliente_telefono
       FROM reservas r
       JOIN barberos  b ON r.barbero_id  = b.id
       JOIN servicios s ON r.servicio_id = s.id
       LEFT JOIN clientes c ON r.cliente_id = c.id
       WHERE r.local_id = $1 AND r.fecha = $2
       ORDER BY r.hora_inicio ASC`,
      [local_id, fecha]
    )

    res.json(resultado.rows)
  } catch (error) {
    console.error('Error al obtener reservas:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// POST /reservas
const crearReserva = async (req, res) => {
  const { local_id } = req.usuario
  const {
    barbero_id,
    servicio_id,
    fecha,
    hora_inicio,
    cliente_nombre,
    cliente_telefono,
    notas
  } = req.body

  if (!barbero_id || !servicio_id || !fecha || !hora_inicio || !cliente_nombre) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  try {
    // 1. Obtener duración del servicio para calcular hora_fin
    const servicio = await db.query(
      'SELECT duracion_min FROM servicios WHERE id = $1 AND local_id = $2',
      [servicio_id, local_id]
    )

    if (servicio.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' })
    }

    const duracion = servicio.rows[0].duracion_min

    // 2. Calcular hora_fin
    const hora_fin = calcularHoraFin(hora_inicio, duracion)

    // 3. Verificar que no haya otra reserva en ese horario para ese barbero
    const conflicto = await db.query(
      `SELECT id FROM reservas
       WHERE barbero_id = $1
         AND fecha = $2
         AND estado NOT IN ('cancelada')
         AND hora_inicio < $3
         AND hora_fin > $4`,
      [barbero_id, fecha, hora_fin, hora_inicio]
    )

    if (conflicto.rows.length > 0) {
      return res.status(409).json({ error: 'El barbero ya tiene una reserva en ese horario' })
    }

    // 4. Buscar o crear el cliente
    let cliente_id = null

    if (cliente_telefono) {
      const clienteExistente = await db.query(
        'SELECT id FROM clientes WHERE local_id = $1 AND telefono = $2',
        [local_id, cliente_telefono]
      )

      if (clienteExistente.rows.length > 0) {
        cliente_id = clienteExistente.rows[0].id
        // Actualizar última visita
        await db.query(
          'UPDATE clientes SET ultima_visita = $1 WHERE id = $2',
          [fecha, cliente_id]
        )
      } else {
        const nuevoCliente = await db.query(
          `INSERT INTO clientes (local_id, nombre, telefono, ultima_visita)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [local_id, cliente_nombre, cliente_telefono, fecha]
        )
        cliente_id = nuevoCliente.rows[0].id
      }
    }

    // 5. Crear la reserva
    const reserva = await db.query(
      `INSERT INTO reservas 
        (local_id, barbero_id, servicio_id, cliente_id, fecha, hora_inicio, hora_fin, notas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [local_id, barbero_id, servicio_id, cliente_id, fecha, hora_inicio, hora_fin, notas]
    )

    res.status(201).json(reserva.rows[0])

  } catch (error) {
    console.error('Error al crear reserva:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// PATCH /reservas/:id/estado
const cambiarEstado = async (req, res) => {
  const { id } = req.params
  const { estado } = req.body
  const { local_id } = req.usuario

  const estadosValidos = ['pendiente', 'confirmada', 'completada', 'cancelada', 'no_show']

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: 'Estado no válido' })
  }

  try {
    const resultado = await db.query(
      `UPDATE reservas SET estado = $1
       WHERE id = $2 AND local_id = $3
       RETURNING *`,
      [estado, id, local_id]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' })
    }

    res.json(resultado.rows[0])
  } catch (error) {
    console.error('Error al cambiar estado:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// Función auxiliar para calcular hora_fin
const calcularHoraFin = (hora_inicio, duracion_min) => {
  const [horas, minutos] = hora_inicio.split(':').map(Number)
  const totalMinutos = horas * 60 + minutos + duracion_min
  const horaFin = Math.floor(totalMinutos / 60)
  const minFin  = totalMinutos % 60
  return `${String(horaFin).padStart(2, '0')}:${String(minFin).padStart(2, '0')}`
}

module.exports = { getReservasPorFecha, crearReserva, cambiarEstado }