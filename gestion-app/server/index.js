const express = require('express')
const cors    = require('cors')
const path    = require('path')
require('dotenv').config()

const otRoutes           = require('./src/routes/ots')
const contenedoresRoutes = require('./src/routes/contenedores')
const uploadsRoutes      = require('./src/routes/uploads')
const stockRoutes        = require('./src/routes/stock')
const documentosRoutes   = require('./src/routes/documentos')
const proveedoresRoutes  = require('./src/routes/proveedores')
const desviosRoutes      = require('./src/routes/desvios')
const reclamosRoutes     = require('./src/routes/reclamos')
const { iniciarCron }    = require('./src/cron')
const { errorHandler }   = require('./src/middleware/errorHandler')

const app  = express()
const PORT = process.env.PORT || 3000

app.use(cors({ origin: '*' }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Servir fotos con CORS
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  next()
}, express.static(path.join(__dirname, '../uploads')))

app.use('/api/ots',          otRoutes)
app.use('/api/contenedores', contenedoresRoutes)
app.use('/api/uploads',      uploadsRoutes)
app.use('/api/stock',        stockRoutes)
app.use('/api/documentos',   documentosRoutes)
app.use('/api/proveedores',  proveedoresRoutes)
app.use('/api/desvios',      desviosRoutes)
app.use('/api/reclamos',     reclamosRoutes)

app.get('/', (req, res) => {
  res.json({ mensaje: 'API GestiónPro funcionando ✅' })
})

// Manejo de errores centralizado — debe ir después de todas las rutas
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
  iniciarCron()
})