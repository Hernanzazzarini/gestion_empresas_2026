// ─────────────────────────────────────────────────────────────────────────────
// Controlador HTTP — Proveedores
//
// Capa fina: extrae datos de la request, delega en el service y arma la respuesta.
// El try/catch se resuelve con asyncHandler; los errores de negocio (AppError)
// los traduce el errorHandler central.
// ─────────────────────────────────────────────────────────────────────────────
const service          = require('../services/proveedoresService')
const { asyncHandler } = require('../middleware/errorHandler')

const getProveedores = asyncHandler(async (req, res) => {
  res.json(await service.listarProveedores())
})

const getProveedor = asyncHandler(async (req, res) => {
  res.json(await service.obtenerProveedor(req.params.id))
})

const crearProveedor = asyncHandler(async (req, res) => {
  res.status(201).json(await service.crearProveedor(req.body))
})

const actualizarProveedor = asyncHandler(async (req, res) => {
  res.json(await service.actualizarProveedor(req.params.id, req.body))
})

const eliminarProveedor = asyncHandler(async (req, res) => {
  await service.eliminarProveedor(req.params.id)
  res.json({ ok: true })
})

const crearDocumento = asyncHandler(async (req, res) => {
  res.status(201).json(await service.crearDocumento(req.params.id, req.body, req.file))
})

const actualizarDocumento = asyncHandler(async (req, res) => {
  res.json(await service.actualizarDocumento(req.params.docId, req.body, req.file))
})

const eliminarDocumento = asyncHandler(async (req, res) => {
  await service.eliminarDocumento(req.params.docId)
  res.json({ ok: true })
})

// POST /api/proveedores/notificar/email — disparo manual (forzar=true)
const enviarNotificaciones = asyncHandler(async (req, res) => {
  res.json(await service.procesarNotificaciones(true))
})

module.exports = {
  getProveedores,
  getProveedor,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
  crearDocumento,
  actualizarDocumento,
  eliminarDocumento,
  enviarNotificaciones,
}
