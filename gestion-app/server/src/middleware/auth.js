const { AppError } = require('./errorHandler')
const authService = require('../services/authService')
const auditoriaService = require('../services/auditoriaService')
const { accionDeMetodo, etiquetaAccion } = require('../auth/constants')

// ─── authRequired ─────────────────────────────────────────────────────────────
// Verifica el Bearer token, carga el usuario y sus permisos en req.user.
const authRequired = async (req, res, next) => {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) throw new AppError('No autenticado', 401)

    let payload
    try {
      payload = authService.verificarToken(token)
    } catch {
      throw new AppError('Sesión expirada o inválida', 401)
    }

    const row = await authService.repo.findById(payload.id)
    if (!row || !row.activo) throw new AppError('Usuario inexistente o inactivo', 401)

    req.user = {
      id: row.id,
      usuario: row.usuario,
      rol: row.rol,
      permisos: await authService.permisosDeUsuario(row),
    }
    next()
  } catch (e) {
    next(e)
  }
}

// ─── requireAdmin ─────────────────────────────────────────────────────────────
const requireAdmin = (req, res, next) => {
  if (req.user?.rol !== 'administrador') return next(new AppError('Requiere rol administrador', 403))
  next()
}

// ─── gateModulo ───────────────────────────────────────────────────────────────
// Chequea el permiso del módulo según el método HTTP (GET=leer, DELETE=eliminar, resto=editar).
const gateModulo = (modulo) => (req, res, next) => {
  if (req.user?.rol === 'administrador') return next() // bypass total
  const accion = accionDeMetodo(req.method)
  const permiso = req.user?.permisos?.[modulo]
  if (!permiso || !permiso[accion]) {
    return next(new AppError(`No tenés permiso de ${accion} en ${modulo}`, 403))
  }
  next()
}

// ─── auditarModulo ────────────────────────────────────────────────────────────
// Registra las mutaciones (POST/PUT/PATCH/DELETE) exitosas de forma no bloqueante.
const auditarModulo = (modulo) => (req, res, next) => {
  if (req.method === 'GET') return next()
  res.on('finish', () => {
    if (res.statusCode >= 400) return
    auditoriaService.registrar({
      usuarioId: req.user?.id,
      usuario:   req.user?.usuario,
      accion:    etiquetaAccion(req.method),
      modulo,
      recurso:   `${req.method} ${req.baseUrl}${req.path}`,
      metodo:    req.method,
      ip:        req.ip,
    })
  })
  next()
}

// Helper: protege un grupo de rutas de un módulo (auth + permiso + auditoría).
const protegerModulo = (modulo) => [authRequired, gateModulo(modulo), auditarModulo(modulo)]

module.exports = { authRequired, requireAdmin, gateModulo, auditarModulo, protegerModulo }