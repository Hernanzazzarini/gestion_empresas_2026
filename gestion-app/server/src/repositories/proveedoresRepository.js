// ─────────────────────────────────────────────────────────────────────────────
// Capa de acceso a datos (repository) — Proveedores
//
// Única capa que conoce SQL y la forma de las tablas. Devuelve filas crudas
// (snake_case) o ids; NO valida, NO formatea, NO decide códigos HTTP.
// ─────────────────────────────────────────────────────────────────────────────
const pool = require('../db')

// ─── Proveedores ─────────────────────────────────────────────────────────────
const findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM proveedores ORDER BY nombre ASC')
  return rows
}

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM proveedores WHERE id = ?', [id])
  return rows[0] ?? null
}

const insert = async (p) => {
  const [result] = await pool.query(
    `INSERT INTO proveedores
      (nombre, tipo_proveedor, tipo_insumo_servicio, ciudad, provincia,
       persona_contacto, telefono, email, observaciones)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      p.nombre, p.tipo_proveedor, p.tipo_insumo_servicio, p.ciudad, p.provincia,
      p.persona_contacto, p.telefono, p.email, p.observaciones,
    ]
  )
  return result.insertId
}

const update = async (id, p) => {
  await pool.query(
    `UPDATE proveedores SET
      nombre = ?, tipo_proveedor = ?, tipo_insumo_servicio = ?,
      ciudad = ?, provincia = ?, persona_contacto = ?,
      telefono = ?, email = ?, observaciones = ?
     WHERE id = ?`,
    [
      p.nombre, p.tipo_proveedor, p.tipo_insumo_servicio, p.ciudad, p.provincia,
      p.persona_contacto, p.telefono, p.email, p.observaciones, id,
    ]
  )
}

const remove = async (id) => {
  // ON DELETE CASCADE elimina también sus documentos en la BD
  await pool.query('DELETE FROM proveedores WHERE id = ?', [id])
}

// ─── Documentos ──────────────────────────────────────────────────────────────
const findDocumentosByProveedorIds = async (ids) => {
  if (ids.length === 0) return []
  const [rows] = await pool.query(
    `SELECT * FROM proveedores_documentos
     WHERE proveedor_id IN (?)
     ORDER BY created_at ASC`,
    [ids]
  )
  return rows
}

const findDocumentoById = async (docId) => {
  const [rows] = await pool.query('SELECT * FROM proveedores_documentos WHERE id = ?', [docId])
  return rows[0] ?? null
}

const findDocumentoPaths = async (proveedorId) => {
  const [rows] = await pool.query(
    'SELECT archivo_path FROM proveedores_documentos WHERE proveedor_id = ?', [proveedorId]
  )
  return rows
}

const insertDocumento = async (d) => {
  const [result] = await pool.query(
    `INSERT INTO proveedores_documentos
      (proveedor_id, nombre, archivo_path, archivo_nombre,
       fecha_vencimiento, observaciones, dias_alerta,
       area_responsable, nombre_responsable, destinatarios_email)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      d.proveedor_id, d.nombre, d.archivo_path, d.archivo_nombre,
      d.fecha_vencimiento, d.observaciones, d.dias_alerta,
      d.area_responsable, d.nombre_responsable, d.destinatarios_email,
    ]
  )
  return result.insertId
}

const updateDocumento = async (docId, d) => {
  await pool.query(
    `UPDATE proveedores_documentos SET
      nombre = ?, archivo_path = ?, archivo_nombre = ?,
      fecha_vencimiento = ?, observaciones = ?, dias_alerta = ?,
      area_responsable = ?, nombre_responsable = ?, destinatarios_email = ?,
      notificacion_enviada = ?
     WHERE id = ?`,
    [
      d.nombre, d.archivo_path, d.archivo_nombre,
      d.fecha_vencimiento, d.observaciones, d.dias_alerta,
      d.area_responsable, d.nombre_responsable, d.destinatarios_email,
      d.notificacion_enviada, docId,
    ]
  )
}

const removeDocumento = async (docId) => {
  await pool.query('DELETE FROM proveedores_documentos WHERE id = ?', [docId])
}

// Documentos con vencimiento y destinatarios cargados (para las notificaciones).
// forzar=false limita a los que aún no se notificaron.
const findDocumentosPorVencer = async (forzar) => {
  const [rows] = await pool.query(
    `SELECT d.*, p.nombre AS proveedor_nombre
     FROM proveedores_documentos d
     JOIN proveedores p ON p.id = d.proveedor_id
     WHERE d.fecha_vencimiento IS NOT NULL
       AND d.destinatarios_email IS NOT NULL
       AND d.destinatarios_email != ''
       ${forzar ? '' : 'AND d.notificacion_enviada = 0'}`
  )
  return rows
}

const marcarNotificado = async (docId) => {
  await pool.query(
    'UPDATE proveedores_documentos SET notificacion_enviada = 1 WHERE id = ?', [docId]
  )
}

module.exports = {
  findAll,
  findById,
  insert,
  update,
  remove,
  findDocumentosByProveedorIds,
  findDocumentoById,
  findDocumentoPaths,
  insertDocumento,
  updateDocumento,
  removeDocumento,
  findDocumentosPorVencer,
  marcarNotificado,
}
