// ─────────────────────────────────────────────────────────────────────────────
// Controlador HTTP — Órdenes de Trabajo (OTs)
//
// Capa fina: extrae datos de la request, delega en el service y arma la respuesta.
// El try/catch se resuelve con asyncHandler; los AppError los traduce el
// errorHandler central.
// ─────────────────────────────────────────────────────────────────────────────
const service          = require('../services/otsService')
const { asyncHandler } = require('../middleware/errorHandler')

const getOTs = asyncHandler(async (req, res) => {
  res.json(await service.listarOTs())
})

const getOT = asyncHandler(async (req, res) => {
  res.json(await service.obtenerOT(req.params.id))
})

const crearOT = asyncHandler(async (req, res) => {
  res.status(201).json(await service.crearOT(req.body))
})

const actualizarOT = asyncHandler(async (req, res) => {
  res.json(await service.actualizarOT(req.params.id, req.body))
})

module.exports = { getOTs, getOT, crearOT, actualizarOT }
