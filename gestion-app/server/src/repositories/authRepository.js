const pool = require('../db')

// ─── Usuarios ─────────────────────────────────────────────────────────────────
const findByUsuario = async (usuario) => {
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario])
  return rows[0] ?? null
}

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id])
  return rows[0] ?? null
}

const findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM usuarios ORDER BY creado_en DESC')
  return rows
}

const insert = async (u) => {
  const [result] = await pool.query(
    'INSERT INTO usuarios (usuario, password_hash, nombre, rol, activo) VALUES (?,?,?,?,?)',
    [u.usuario, u.password_hash, u.nombre, u.rol, u.activo ?? 1]
  )
  return result.insertId
}

const update = async (id, u) => {
  await pool.query(
    'UPDATE usuarios SET nombre = ?, rol = ?, activo = ? WHERE id = ?',
    [u.nombre, u.rol, u.activo, id]
  )
}

const updatePassword = async (id, password_hash) => {
  await pool.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [password_hash, id])
}

const remove = async (id) => {
  await pool.query('DELETE FROM usuarios WHERE id = ?', [id])
}

// ─── Permisos ─────────────────────────────────────────────────────────────────
const findPermisos = async (usuarioId) => {
  const [rows] = await pool.query('SELECT * FROM permisos WHERE usuario_id = ?', [usuarioId])
  return rows
}

const findPermiso = async (usuarioId, modulo) => {
  const [rows] = await pool.query(
    'SELECT * FROM permisos WHERE usuario_id = ? AND modulo = ?',
    [usuarioId, modulo]
  )
  return rows[0] ?? null
}

// Upsert de una fila de permisos (usuario + módulo)
const upsertPermiso = async (usuarioId, modulo, { leer, editar, eliminar }) => {
  await pool.query(
    `INSERT INTO permisos (usuario_id, modulo, leer, editar, eliminar)
     VALUES (?,?,?,?,?)
     ON DUPLICATE KEY UPDATE leer = VALUES(leer), editar = VALUES(editar), eliminar = VALUES(eliminar)`,
    [usuarioId, modulo, leer ? 1 : 0, editar ? 1 : 0, eliminar ? 1 : 0]
  )
}

module.exports = {
  findByUsuario,
  findById,
  findAll,
  insert,
  update,
  updatePassword,
  remove,
  findPermisos,
  findPermiso,
  upsertPermiso,
}
