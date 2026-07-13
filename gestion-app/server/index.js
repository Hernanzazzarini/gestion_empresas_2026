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
const authRoutes         = require('./src/routes/auth')
const auditoriaRoutes    = require('./src/routes/auditoria')
const { iniciarCron }    = require('./src/cron')
const { errorHandler }   = require('./src/middleware/errorHandler')
const { protegerModulo } = require('./src/middleware/auth')

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

// Autenticación (login es público; el resto valida token/rol dentro del router)
app.use('/api/auth',        authRoutes)
app.use('/api/auditoria',   auditoriaRoutes)

// Módulos de negocio — protegidos con auth + permisos + auditoría.
// protegerModulo(clave) = [authRequired, gateModulo(clave), auditarModulo(clave)]
app.use('/api/ots',          protegerModulo('mantenimiento'), otRoutes)
app.use('/api/contenedores', protegerModulo('logistica'),     contenedoresRoutes)
app.use('/api/uploads',      protegerModulo('logistica'),     uploadsRoutes)
app.use('/api/stock',        protegerModulo('logistica'),     stockRoutes)
app.use('/api/documentos',   protegerModulo('inocuidad'),     documentosRoutes)
app.use('/api/proveedores',  protegerModulo('proveedores'),   proveedoresRoutes)
app.use('/api/desvios',      protegerModulo('desvios'),       desviosRoutes)
app.use('/api/reclamos',     protegerModulo('reclamos'),      reclamosRoutes)

app.get('/', (req, res) => {
  res.json({ mensaje: 'API GestiónPro funcionando ✅' })
})

// Manejo de errores centralizado — debe ir después de todas las rutas
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
  iniciarCron()
})