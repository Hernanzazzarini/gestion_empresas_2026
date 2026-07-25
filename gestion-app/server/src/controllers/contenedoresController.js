// ─────────────────────────────────────────────────────────────────────────────
// Controlador HTTP — Contenedores
//
// Capa fina: extrae datos de la request, delega en el service y arma la respuesta.
// El try/catch se resuelve con asyncHandler; los AppError los traduce el
// errorHandler central.
// ─────────────────────────────────────────────────────────────────────────────
const service          = require('../services/contenedoresService')
const { asyncHandler } = require('../middleware/errorHandler')

const getContenedores = asyncHandler(async (req, res) => {
  res.json(await service.listarContenedores())
})

const getContenedor = asyncHandler(async (req, res) => {
  res.json(await service.obtenerContenedor(req.params.id))
})

const crearContenedor = asyncHandler(async (req, res) => {
  res.status(201).json(await service.crearContenedor(req.body))
})

const actualizarSeccion1 = asyncHandler(async (req, res) => {
  res.json(await service.actualizarSeccion1(req.params.id, req.body))
})

const completarSeccion2 = asyncHandler(async (req, res) => {
  res.json(await service.completarSeccion2(req.params.id, req.body))
})

module.exports = {
  getContenedores,
  getContenedor,
  crearContenedor,
  actualizarSeccion1,
  completarSeccion2,
}
