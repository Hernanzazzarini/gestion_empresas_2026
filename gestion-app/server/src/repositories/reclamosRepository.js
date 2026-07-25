const pool = require('../db')

const findAll = async (filtros = {}) => {
  let sql = `
    SELECT r.*,
      (SELECT COUNT(*) FROM reclamos_adjuntos a WHERE a.reclamo_id = r.id AND a.tipo = 'reclamo')   AS adjuntos_reclamo,
      (SELECT COUNT(*) FROM reclamos_adjuntos a WHERE a.reclamo_id = r.id AND a.tipo = 'evidencia') AS adjuntos_evidencia
    FROM reclamos r
    WHERE 1=1
  `
  const params = []
  if (filtros.estado)       { sql += ' AND r.estado = ?';        params.push(filtros.estado) }
  if (filtros.tipo)         { sql += ' AND r.tipo = ?';          params.push(filtros.tipo) }
  if (filtros.destinatario) { sql += ' AND r.destinatario = ?';  params.push(filtros.destinatario) }
  if (filtros.motivo)       { sql += ' AND r.motivo = ?';        params.push(filtros.motivo) }
  if (filtros.gravedad)     { sql += ' AND r.gravedad = ?';      params.push(filtros.gravedad) }
  if (filtros.anio)         { sql += ' AND r.anio_lote = ?';     params.push(filtros.anio) }
  sql += ' ORDER BY r.creado_en DESC'
  const [rows] = await pool.query(sql, params)
  return rows
}

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT r.*,
       (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', a.id, 'tipo', a.tipo, 'archivo_path', a.archivo_path,
                      'nombre_original', a.nombre_original, 'creado_en', a.creado_en)
        ) FROM reclamos_adjuntos a WHERE a.reclamo_id = r.id) AS adjuntos
     FROM reclamos r WHERE r.id = ?`,
    [id]
  )
  return rows[0] ?? null
}

const countTotal = async () => {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM reclamos')
  return rows[0].total
}

const insert = async (r) => {
  const [result] = await pool.query(
    `INSERT INTO reclamos
       (nro_reclamo, fecha_reclamo, tipo, codigo, origen_cliente, destinatario,
        lote_reclamado, anio_lote, motivo, descripcion, gravedad, observaciones,
        estado, fecha_cierre, metodo_causa_raiz, causa_raiz_data,
        accion_preventiva, accion_correctiva, responsable_area, destinatarios)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      r.nro_reclamo, r.fecha_reclamo, r.tipo, r.codigo, r.origen_cliente, r.destinatario,
      r.lote_reclamado, r.anio_lote, r.motivo, r.descripcion, r.gravedad, r.observaciones,
      r.estado, r.fecha_cierre, r.metodo_causa_raiz, JSON.stringify(r.causa_raiz_data),
      r.accion_preventiva, r.accion_correctiva, r.responsable_area, r.destinatarios,
    ]
  )
  return result.insertId
}

const update = async (id, r) => {
  await pool.query(
    `UPDATE reclamos SET
       fecha_reclamo=?, tipo=?, codigo=?, origen_cliente=?, destinatario=?,
       lote_reclamado=?, anio_lote=?, motivo=?, descripcion=?, gravedad=?, observaciones=?,
       estado=?, fecha_cierre=?, metodo_causa_raiz=?, causa_raiz_data=?,
       accion_preventiva=?, accion_correctiva=?, responsable_area=?, destinatarios=?
     WHERE id=?`,
    [
      r.fecha_reclamo, r.tipo, r.codigo, r.origen_cliente, r.destinatario,
      r.lote_reclamado, r.anio_lote, r.motivo, r.descripcion, r.gravedad, r.observaciones,
      r.estado, r.fecha_cierre, r.metodo_causa_raiz, JSON.stringify(r.causa_raiz_data),
      r.accion_preventiva, r.accion_correctiva, r.responsable_area, r.destinatarios, id,
    ]
  )
}

const updateEstado = async (id, estado, fecha_cierre) => {
  await pool.query(
    'UPDATE reclamos SET estado=?, fecha_cierre=? WHERE id=?',
    [estado, fecha_cierre, id]
  )
}

const marcarNotificado = async (id) => {
  await pool.query('UPDATE reclamos SET notificacion_enviada = 1 WHERE id=?', [id])
}

const insertAdjunto = async (a) => {
  const [result] = await pool.query(
    'INSERT INTO reclamos_adjuntos (reclamo_id, tipo, archivo_path, nombre_original) VALUES (?,?,?,?)',
    [a.reclamo_id, a.tipo, a.archivo_path, a.nombre_original]
  )
  return result.insertId
}

const findAdjunto = async (id) => {
  const [rows] = await pool.query('SELECT * FROM reclamos_adjuntos WHERE id=?', [id])
  return rows[0] ?? null
}

const deleteAdjunto = async (id) => {
  await pool.query('DELETE FROM reclamos_adjuntos WHERE id=?', [id])
}

const findPendientesNotificacion = async (forzar) => {
  if (forzar) {
    const [rows] = await pool.query(
      'SELECT * FROM reclamos WHERE destinatarios IS NOT NULL AND destinatarios != ""'
    )
    return rows
  }
  const [rows] = await pool.query(
    'SELECT * FROM reclamos WHERE destinatarios IS NOT NULL AND destinatarios != "" AND notificacion_enviada = 0'
  )
  return rows
}

const remove = async (id) => {
  await pool.query('DELETE FROM reclamos WHERE id=?', [id])
}

module.exports = {
  findAll,
  findById,
  countTotal,
  insert,
  update,
  updateEstado,
  marcarNotificado,
  insertAdjunto,
  findAdjunto,
  deleteAdjunto,
  findPendientesNotificacion,
  remove,
}
