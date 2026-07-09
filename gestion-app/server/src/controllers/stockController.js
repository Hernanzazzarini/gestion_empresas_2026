// ─────────────────────────────────────────────────────────────────────────────
// Controlador HTTP — Stock de Lotes
//
// Capa fina: extrae datos de la request, delega en el service y arma la respuesta.
// El try/catch se resuelve con asyncHandler; los AppError los traduce el
// errorHandler central.
// ─────────────────────────────────────────────────────────────────────────────
const service          = require('../services/stockService')
const { asyncHandler } = require('../middleware/errorHandler')

const getLotes = asyncHandler(async (req, res) => {
  res.json(await service.listarLotes())
})

const crearLote = asyncHandler(async (req, res) => {
  res.status(201).json(await service.crearLote(req.body))
})

const reducirEnvases = asyncHandler(async (req, res) => {
  res.json(await service.reducirEnvases(req.params.id, req.body.cantidad))
})

const darDeBajaLote = asyncHandler(async (req, res) => {
  res.json(await service.darDeBajaLote(req.params.id))
})

module.exports = { getLotes, crearLote, reducirEnvases, darDeBajaLote }
