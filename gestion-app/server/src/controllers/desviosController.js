const service         = require('../services/desviosService')
const { asyncHandler } = require('../middleware/errorHandler')

const listar = asyncHandler(async (req, res) => {
  res.json(await service.listarDesvios(req.query))
})

const obtener = asyncHandler(async (req, res) => {
  res.json(await service.obtenerDesvio(Number(req.params.id)))
})

const crear = asyncHandler(async (req, res) => {
  res.status(201).json(await service.crearDesvio(req.body))
})

const actualizar = asyncHandler(async (req, res) => {
  res.json(await service.actualizarDesvio(Number(req.params.id), req.body))
})

const cambiarEstado = asyncHandler(async (req, res) => {
  res.json(await service.cambiarEstado(
    Number(req.params.id),
    req.body.estado,
    req.body.fecha_estado,
  ))
})

const agregarEvidencia = asyncHandler(async (req, res) => {
  res.status(201).json(
    await service.agregarEvidencia(Number(req.params.id), req.file, req.body.tipo)
  )
})

const eliminarEvidencia = asyncHandler(async (req, res) => {
  await service.eliminarEvidencia(Number(req.params.evidenciaId))
  res.json({ ok: true })
})

const eliminar = asyncHandler(async (req, res) => {
  await service.eliminarDesvio(Number(req.params.id))
  res.json({ ok: true })
})

const notificar = asyncHandler(async (req, res) => {
  res.json(await service.procesarNotificaciones(true))
})

const notificarLimite = asyncHandler(async (req, res) => {
  res.json(await service.procesarNotificacionesLimite(true))
})

module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  cambiarEstado,
  agregarEvidencia,
  eliminarEvidencia,
  eliminar,
  notificar,
  notificarLimite,
}
