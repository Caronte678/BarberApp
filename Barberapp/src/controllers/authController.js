const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db/pool')

const login = async (req, res) => {
  const { email, password } = req.body

  try {
    // 1. Buscar el usuario por email
    const resultado = await db.query(
      'SELECT * FROM usuarios WHERE email = $1 AND activo = true',
      [email]
    )

    const usuario = resultado.rows[0]

    // 2. Si no existe el usuario
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    // 3. Verificar la contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password_hash)

    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    // 4. Generar el token JWT
    const token = jwt.sign(
      {
        usuario_id: usuario.id,
        local_id:   usuario.local_id,
        rol:        usuario.rol,
        nombre:     usuario.nombre
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    // 5. Responder con el token
    res.json({
      token,
      usuario: {
        nombre:   usuario.nombre,
        rol:      usuario.rol,
        local_id: usuario.local_id
      }
    })

  } catch (error) {
    console.error('Error en login:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

module.exports = { login }