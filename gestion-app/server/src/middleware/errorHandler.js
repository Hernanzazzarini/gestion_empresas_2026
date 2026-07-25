// ─────────────────────────────────────────────────────────────────────────────
// Manejo de errores centralizado
//
//   AppError      → error "esperado" de negocio, con su código HTTP asociado.
//                   Las capas service/repository lanzan estos en vez de tocar `res`.
//   asyncHandler  → envuelve un handler async y deriva cualquier rechazo a `next`,
//                   evitando el try/catch repetido en cada controlador.
//   errorHandler  → última pieza del pipeline de Express: traduce el error a JSON.
// ─────────────────────────────────────────────────────────────────────────────

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true // distingue errores de negocio de fallos inesperados
  }
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// eslint-disable-next-line no-unused-vars -- Express identifica el handler de errores por su aridad (4 args)
const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500

  // Solo los fallos inesperados se loguean; los AppError son parte del flujo normal
  if (!err.isOperational) console.error(err)

  res.status(status).json({
    error: err.isOperational ? err.message : 'Error interno del servidor',
  })
}

module.exports = { AppError, asyncHandler, errorHandler }
