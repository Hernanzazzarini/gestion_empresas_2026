const { asyncHandler } = require('../middleware/errorHandler')
const service = require('../services/authService')
const auditoria = require('../services/auditoriaService')

const login = asyncHandler(async (req, res) => {
  const { usuario, password } = req.body
  const result = await service.login(usuario, password)
  auditoria.registrar({
    usuarioId: result.usuario.id, usuario: result.usuario.usuario,
    accion: 'LOGIN', modulo: 'auth', recurso: 'POST /api/auth/login',
    metodo: 'POST', ip: req.ip,
  })
  res.json(result)
})

const logout = asyncHandler(async (req, res) => {
  // Con JWT stateless el logout es del lado del cliente; sólo lo registramos.
  auditoria.registrar({
    usuarioId: req.user.id, usuario: req.user.usuario,
    accion: 'LOGOUT', modulo: 'auth', recurso: 'POST /api/auth/logout',
    metodo: 'POST', ip: req.ip,
  })
  res.json({ ok: true })
})

const me = asyncHandler(async (req, res) => {
  res.json(await service.sesionActual(req.user.id))
})

const listarUsuarios = asyncHandler(async (req, res) => {
  res.json(await service.listarUsuarios())
})

const crearUsuario = asyncHandler(async (req, res) => {
  const nuevo = await service.crearUsuario(req.body)
  auditoria.registrar({
    usuarioId: req.user.id, usuario: req.user.usuario,
    accion: 'CREAR', modulo: 'usuarios', recurso: `usuario:${nuevo.usuario}`,
    metodo: 'POST', ip: req.ip,
  })
  res.status(201).json(nuevo)
})

const actualizarUsuario = asyncHandler(async (req, res) => {
  const actualizado = await service.actualizarUsuario(req.params.id, req.body)
  auditoria.registrar({
    usuarioId: req.user.id, usuario: req.user.usuario,
    accion: 'EDITAR', modulo: 'usuarios', recurso: `usuario:${actualizado.usuario}`,
    metodo: 'PATCH', ip: req.ip,
  })
  res.json(actualizado)
})

const cambiarPassword = asyncHandler(async (req, res) => {
  await service.cambiarPassword(req.params.id, req.body.password)
  auditoria.registrar({
    usuarioId: req.user.id, usuario: req.user.usuario,
    accion: 'EDITAR', modulo: 'usuarios', recurso: `password:usuario#${req.params.id}`,
    metodo: 'PATCH', ip: req.ip,
  })
  res.json({ ok: true })
})

const eliminarUsuario = asyncHandler(async (req, res) => {
  await service.eliminarUsuario(req.params.id, req.user.id)
  auditoria.registrar({
    usuarioId: req.user.id, usuario: req.user.usuario,
    accion: 'ELIMINAR', modulo: 'usuarios', recurso: `usuario#${req.params.id}`,
    metodo: 'DELETE', ip: req.ip,
  })
  res.json({ ok: true })
})

const actualizarPermisos = asyncHandler(async (req, res) => {
  const actualizado = await service.actualizarPermisos(req.params.id, req.body.permisos)
  auditoria.registrar({
    usuarioId: req.user.id, usuario: req.user.usuario,
    accion: 'EDITAR', modulo: 'usuarios', recurso: `permisos:usuario#${req.params.id}`,
    metodo: 'PUT', ip: req.ip,
  })
  res.json(actualizado)
})

module.exports = {
  login, logout, me,
  listarUsuarios, crearUsuario, actualizarUsuario, cambiarPassword, eliminarUsuario,
  actualizarPermisos,
}