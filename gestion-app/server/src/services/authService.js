const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const repo   = require('../repositories/authRepository')
const { AppError } = require('../middleware/errorHandler')
const { MODULOS, ROLES, DEFAULTS_POR_ROL } = require('../auth/constants')

const JWT_SECRET  = process.env.JWT_SECRET || 'dev_secret_cambiar'
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const firmarToken = (usuario) =>
  jwt.sign({ id: usuario.id, usuario: usuario.usuario, rol: usuario.rol }, JWT_SECRET, { expiresIn: JWT_EXPIRES })

const verificarToken = (token) => jwt.verify(token, JWT_SECRET) // lanza si es inválido/expirado

// usuario público (nunca exponer el hash)
const formatear = (row) => row && ({
  id:        row.id,
  usuario:   row.usuario,
  nombre:    row.nombre,
  rol:       row.rol,
  activo:    !!row.activo,
  creadoEn:  row.creado_en,
})

// Devuelve la matriz de permisos como objeto { modulo: {leer,editar,eliminar} }.
// El administrador tiene todo en true por diseño (bypass).
const permisosDeUsuario = async (usuario) => {
  if (usuario.rol === 'administrador') {
    return Object.fromEntries(MODULOS.map(m => [m, { leer: true, editar: true, eliminar: true }]))
  }
  const filas = await repo.findPermisos(usuario.id)
  const mapa = Object.fromEntries(MODULOS.map(m => [m, { leer: false, editar: false, eliminar: false }]))
  for (const f of filas) {
    if (mapa[f.modulo]) mapa[f.modulo] = { leer: !!f.leer, editar: !!f.editar, eliminar: !!f.eliminar }
  }
  return mapa
}

// ─── Login ──────────────────────────────────────────────────────────────────
const login = async (usuario, password) => {
  if (!usuario?.trim() || !password) throw new AppError('Usuario y contraseña son obligatorios', 400)
  const row = await repo.findByUsuario(usuario.trim())
  if (!row || !row.activo) throw new AppError('Credenciales inválidas', 401)
  const ok = await bcrypt.compare(password, row.password_hash)
  if (!ok) throw new AppError('Credenciales inválidas', 401)
  return {
    token: firmarToken(row),
    usuario: formatear(row),
    permisos: await permisosDeUsuario(row),
  }
}

// Datos de la sesión actual (para hidratar el cliente al recargar)
const sesionActual = async (id) => {
  const row = await repo.findById(id)
  if (!row || !row.activo) throw new AppError('Sesión inválida', 401)
  return { usuario: formatear(row), permisos: await permisosDeUsuario(row) }
}

// ─── ABM de usuarios (sólo admin) ─────────────────────────────────────────────
const listarUsuarios = async () => {
  const rows = await repo.findAll()
  return Promise.all(rows.map(async (r) => ({
    ...formatear(r),
    permisos: await permisosDeUsuario(r),
  })))
}

const validarDatos = ({ usuario, rol }, { requiereUsuario = true } = {}) => {
  if (requiereUsuario && !usuario?.trim()) throw new AppError('El usuario es obligatorio', 400)
  if (rol && !ROLES.includes(rol)) throw new AppError('Rol inválido', 400)
}

const crearUsuario = async ({ usuario, password, nombre, rol = 'operarios' }) => {
  validarDatos({ usuario, rol })
  if (!password || password.length < 4) throw new AppError('La contraseña debe tener al menos 4 caracteres', 400)
  if (await repo.findByUsuario(usuario.trim())) throw new AppError('Ya existe un usuario con ese nombre', 409)

  const password_hash = await bcrypt.hash(password, 10)
  const id = await repo.insert({ usuario: usuario.trim(), password_hash, nombre: nombre?.trim() || null, rol })

  // Sembrar permisos por defecto según el rol (para no-admin; el admin bypasea).
  if (rol !== 'administrador') {
    const def = DEFAULTS_POR_ROL[rol] || DEFAULTS_POR_ROL.operarios
    await Promise.all(MODULOS.map(m => repo.upsertPermiso(id, m, def)))
  }
  const row = await repo.findById(id)
  return { ...formatear(row), permisos: await permisosDeUsuario(row) }
}

const actualizarUsuario = async (id, { nombre, rol, activo }) => {
  const row = await repo.findById(id)
  if (!row) throw new AppError('Usuario no encontrado', 404)
  validarDatos({ rol }, { requiereUsuario: false })
  await repo.update(id, {
    nombre: nombre !== undefined ? (nombre?.trim() || null) : row.nombre,
    rol:    rol ?? row.rol,
    activo: activo !== undefined ? (activo ? 1 : 0) : row.activo,
  })
  const fresh = await repo.findById(id)
  return { ...formatear(fresh), permisos: await permisosDeUsuario(fresh) }
}

const cambiarPassword = async (id, password) => {
  const row = await repo.findById(id)
  if (!row) throw new AppError('Usuario no encontrado', 404)
  if (!password || password.length < 4) throw new AppError('La contraseña debe tener al menos 4 caracteres', 400)
  await repo.updatePassword(id, await bcrypt.hash(password, 10))
}

const eliminarUsuario = async (id, solicitanteId) => {
  const row = await repo.findById(id)
  if (!row) throw new AppError('Usuario no encontrado', 404)
  if (Number(id) === Number(solicitanteId)) throw new AppError('No podés eliminar tu propio usuario', 400)
  await repo.remove(id)
}

// ─── Permisos ─────────────────────────────────────────────────────────────────
const actualizarPermisos = async (usuarioId, permisos) => {
  const row = await repo.findById(usuarioId)
  if (!row) throw new AppError('Usuario no encontrado', 404)
  if (row.rol === 'administrador') throw new AppError('El administrador ya tiene acceso total', 400)
  if (!permisos || typeof permisos !== 'object') throw new AppError('Permisos inválidos', 400)

  for (const [modulo, p] of Object.entries(permisos)) {
    if (!MODULOS.includes(modulo)) continue
    await repo.upsertPermiso(usuarioId, modulo, {
      leer: !!p.leer, editar: !!p.editar, eliminar: !!p.eliminar,
    })
  }
  const fresh = await repo.findById(usuarioId)
  return { ...formatear(fresh), permisos: await permisosDeUsuario(fresh) }
}

module.exports = {
  firmarToken,
  verificarToken,
  permisosDeUsuario,
  login,
  sesionActual,
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  cambiarPassword,
  eliminarUsuario,
  actualizarPermisos,
  // expuesto para el middleware
  repo,
}
