const { asyncHandler } = require('../middleware/errorHandler')
const service = require('../services/auditoriaService')

const listar = asyncHandler(async (req, res) => {
  res.json(await service.listar(req.query))
})

const opciones = asyncHandler(async (req, res) => {
  res.json(await service.opcionesFiltros())
})

module.exports = { listar, opciones }