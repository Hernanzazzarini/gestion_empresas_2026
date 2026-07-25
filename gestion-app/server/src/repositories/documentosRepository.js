// ─────────────────────────────────────────────────────────────────────────────
// Capa de acceso a datos (repository) — Documentos de Inocuidad
//
// Única capa que conoce SQL. Devuelve filas crudas (snake_case) o ids.
// La regla de negocio "1 vigente + 1 obsoleto por código" vive en el service;
// acá solo están las consultas primitivas que esa regla necesita.
// ─────────────────────────────────────────────────────────────────────────────
const pool = require('../db')

const findAll = async () => {
  const [rows] = await pool.query(
    'SELECT * FROM documentos_inocuidad ORDER BY codigo ASC, estado DESC'
  )
  return rows
}

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM documentos_inocuidad WHERE id = ?', [id])
  return rows[0] ?? null
}

// Busca el documento vigente de un código (opcionalmente excluyendo un id, para updates)
const findVigenteByCodigo = async (codigo, excludeId = null) => {
  const where  = excludeId ? 'AND id != ?' : ''
  const params = excludeId ? [codigo, excludeId] : [codigo]
  const [rows] = await pool.query(
    `SELECT * FROM documentos_inocuidad WHERE codigo = ? AND estado = 'vigente' ${where}`,
    params
  )
  return rows[0] ?? null
}

// Busca el documento obsoleto de un código (opcionalmente excluyendo un id)
const findObsoletoByCodigo = async (codigo, excludeId = null) => {
  const where  = excludeId ? 'AND id != ?' : ''
  const params = excludeId ? [codigo, excludeId] : [codigo]
  const [rows] = await pool.query(
    `SELECT * FROM documentos_inocuidad WHERE codigo = ? AND estado = 'obsoleto' ${where}`,
    params
  )
  return rows[0] ?? null
}

const insert = async (d) => {
  const [result] = await pool.query(
    `INSERT INTO documentos_inocuidad
      (codigo, nombre, numero_revision, area_uso, estado,
       cantidad_copias_impresas, formato_archivo,
       fecha_revision, dias_alerta, destinatarios_email)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      d.codigo, d.nombre, d.numero_revision, d.area_uso, d.estado,
      d.cantidad_copias_impresas, d.formato_archivo,
      d.fecha_revision, d.dias_alerta, d.destinatarios_email,
    ]
  )
  return result.insertId
}

const update = async (id, d) => {
  await pool.query(
    `UPDATE documentos_inocuidad SET
      codigo = ?, nombre = ?, numero_revision = ?, area_uso = ?, estado = ?,
      cantidad_copias_impresas = ?, formato_archivo = ?,
      fecha_revision = ?, dias_alerta = ?, destinatarios_email = ?,
      notificacion_enviada = ?
     WHERE id = ?`,
    [
      d.codigo, d.nombre, d.numero_revision, d.area_uso, d.estado,
      d.cantidad_copias_impresas, d.formato_archivo,
      d.fecha_revision, d.dias_alerta, d.destinatarios_email,
      d.notificacion_enviada, id,
    ]
  )
}

// Degrada un vigente a obsoleto y desactiva sus notificaciones
const markObsoleto = async (id) => {
  await pool.query(
    `UPDATE documentos_inocuidad
     SET estado = 'obsoleto', fecha_revision = NULL, dias_alerta = 30, destinatarios_email = NULL
     WHERE id = ?`,
    [id]
  )
}

const remove = async (id) => {
  await pool.query('DELETE FROM documentos_inocuidad WHERE id = ?', [id])
}

// Setea (o limpia con null) el archivo adjunto de un documento
const updateArchivo = async (id, { archivo_path, archivo_nombre }) => {
  await pool.query(
    'UPDATE documentos_inocuidad SET archivo_path = ?, archivo_nombre = ? WHERE id = ?',
    [archivo_path, archivo_nombre, id]
  )
}

// Documentos vigentes con fecha de revisión y destinatarios (para notificaciones).
// forzar=false limita a los que aún no se notificaron.
const findDocumentosPorRevisar = async (forzar) => {
  const [rows] = await pool.query(
    `SELECT * FROM documentos_inocuidad
     WHERE fecha_revision IS NOT NULL
       AND estado = 'vigente'
       AND destinatarios_email IS NOT NULL
       AND destinatarios_email != ''
       ${forzar ? '' : 'AND notificacion_enviada = 0'}`
  )
  return rows
}

const marcarNotificado = async (id) => {
  await pool.query(
    'UPDATE documentos_inocuidad SET notificacion_enviada = 1 WHERE id = ?', [id]
  )
}

module.exports = {
  findAll,
  findById,
  findVigenteByCodigo,
  findObsoletoByCodigo,
  insert,
  update,
  markObsoleto,
  remove,
  updateArchivo,
  findDocumentosPorRevisar,
  marcarNotificado,
}
