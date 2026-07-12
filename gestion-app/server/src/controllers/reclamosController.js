const service         = require('../services/reclamosService')
const { asyncHandler } = require('../middleware/errorHandler')

const listar = asyncHandler(async (req, res) => {
  res.json(await service.listarReclamos(req.query))
})

const obtener = asyncHandler(async (req, res) => {
  res.json(await service.obtenerReclamo(Number(req.params.id)))
})

const crear = asyncHandler(async (req, res) => {
  res.status(201).json(await service.crearReclamo(req.body))
})

const actualizar = asyncHandler(async (req, res) => {
  res.json(await service.actualizarReclamo(Number(req.params.id), req.body))
})

const cambiarEstado = asyncHandler(async (req, res) => {
  res.json(await service.cambiarEstado(
    Number(req.params.id),
    req.body.estado,
    req.body.fecha_cierre,
  ))
})

const agregarAdjunto = asyncHandler(async (req, res) => {
  res.status(201).json(
    await service.agregarAdjunto(Number(req.params.id), req.file, req.body.tipo)
  )
})

const eliminarAdjunto = asyncHandler(async (req, res) => {
  await service.eliminarAdjunto(Number(req.params.adjuntoId))
  res.json({ ok: true })
})

const eliminar = asyncHandler(async (req, res) => {
  await service.eliminarReclamo(Number(req.params.id))
  res.json({ ok: true })
})

const notificar = asyncHandler(async (req, res) => {
  res.json(await service.procesarNotificaciones(true))
})

module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  cambiarEstado,
  agregarAdjunto,
  eliminarAdjunto,
  eliminar,
  notificar,
}
