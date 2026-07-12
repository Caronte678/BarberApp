const bcrypt = require('bcryptjs')
const db = require('../db/pool')
require('dotenv').config()

const crearUsuario = async () => {
  const local = await db.query(
    "SELECT id FROM locales WHERE slug = 'demo-chillan'"
  )

  if (local.rows.length === 0) {
    console.error('No existe el local demo-chillan en la base de datos')
    process.exit(1)
  }

  const local_id = local.rows[0].id

  // Crear secretario
  const hashSecretario = await bcrypt.hash('123456', 10)
  await db.query(
    `INSERT INTO usuarios (local_id, nombre, email, password_hash, rol)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO NOTHING`,
    [local_id, 'Secretaria Demo', 'demo@agenda.cl', hashSecretario, 'secretario']
  )
  console.log('Secretario: demo@agenda.cl / 123456')

  // Crear admin
  const hashAdmin = await bcrypt.hash('123456', 10)
  await db.query(
    `INSERT INTO usuarios (local_id, nombre, email, password_hash, rol)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO NOTHING`,
    [local_id, 'Admin Demo', 'admin@agenda.cl', hashAdmin, 'admin']
  )
  console.log('Admin: admin@agenda.cl / 123456')

  process.exit(0)
}

crearUsuario()