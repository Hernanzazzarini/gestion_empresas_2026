// ─────────────────────────────────────────────────────────────────────────────
// Controlador HTTP — Documentos de Inocuidad
//
// Capa fina: extrae datos de la request, delega en el service y arma la respuesta.
// El try/catch se resuelve con asyncHandler; los AppError los traduce el
// errorHandler central.
// ─────────────────────────────────────────────────────────────────────────────
const service          = require('../services/documentosService')
const { asyncHandler } = require('../middleware/errorHandler')

const getDocumentos = asyncHandler(async (req, res) => {
  res.json(await service.listarDocumentos())
})

const getDocumento = asyncHandler(async (req, res) => {
  res.json(await service.obtenerDocumento(req.params.id))
})

const crearDocumento = asyncHandler(async (req, res) => {
  res.status(201).json(await service.crearDocumento(req.body))
})

const actualizarDocumento = asyncHandler(async (req, res) => {
  res.json(await service.actualizarDocumento(req.params.id, req.body))
})

const eliminarDocumento = asyncHandler(async (req, res) => {
  await service.eliminarDocumento(req.params.id)
  res.json({ ok: true })
})

const subirArchivo = asyncHandler(async (req, res) => {
  res.json(await service.subirArchivo(req.params.id, req.file))
})

const eliminarArchivo = asyncHandler(async (req, res) => {
  res.json(await service.eliminarArchivo(req.params.id))
})

// POST /api/documentos/notificar/email — disparo manual (forzar=true)
const enviarNotificaciones = asyncHandler(async (req, res) => {
  res.json(await service.procesarNotificaciones(true))
})

module.exports = {
  getDocumentos,
  getDocumento,
  crearDocumento,
  actualizarDocumento,
  eliminarDocumento,
  subirArchivo,
  eliminarArchivo,
  enviarNotificaciones,
}
