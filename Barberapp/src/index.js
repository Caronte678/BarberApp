
const express = require('express')
require('dotenv').config()
const cors         = require('cors')
const db           = require('./db/pool')
const authRoutes     = require('./routes/authRoutes')
const reservasRoutes = require('./routes/reservasRoutes')
const barberosRoutes  = require('./routes/barberosRoutes')
const serviciosRoutes = require('./routes/serviciosRoutes')

const app  = express()
const PORT = process.env.PORT || 3000

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/auth',     authRoutes)
app.use('/reservas', reservasRoutes)

app.use('/barberos',  barberosRoutes)
app.use('/servicios', serviciosRoutes)

app.get('/ping', (req, res) => {
  res.json({ mensaje: 'Servidor funcionando correctamente' })
})

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`)
})

const reportesRoutes = require('./routes/reportesRoutes')
app.use('/reportes', reportesRoutes)

const horariosRoutes = require('./routes/horariosRoutes')
app.use('/horarios', horariosRoutes)