const pool = require('../db')

const findAll = async (filtros = {}) => {
  let sql = `
    SELECT d.*,
      (SELECT COUNT(*) FROM desvios_evidencias e WHERE e.desvio_id = d.id AND e.tipo = 'antes')   AS evidencias_antes,
      (SELECT COUNT(*) FROM desvios_evidencias e WHERE e.desvio_id = d.id AND e.tipo = 'despues') AS evidencias_despues
    FROM desvios d
    WHERE 1=1
  `
  const params = []
  if (filtros.estado)   { sql += ' AND d.estado = ?';   params.push(filtros.estado) }
  if (filtros.area)     { sql += ' AND d.area = ?';     params.push(filtros.area) }
  if (filtros.gravedad) { sql += ' AND d.gravedad = ?'; params.push(filtros.gravedad) }
  if (filtros.origen)   { sql += ' AND d.origen = ?';   params.push(filtros.origen) }
  sql += ' ORDER BY d.creado_en DESC'
  const [rows] = await pool.query(sql, params)
  return rows
}

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT d.*,
       (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', e.id, 'tipo', e.tipo, 'archivo_path', e.archivo_path,
                      'nombre_original', e.nombre_original, 'creado_en', e.creado_en)
        ) FROM desvios_evidencias e WHERE e.desvio_id = d.id) AS evidencias
     FROM desvios d WHERE d.id = ?`,
    [id]
  )
  return rows[0] ?? null
}

const countTotal = async () => {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM desvios')
  return rows[0].total
}

const insert = async (d) => {
  const [result] = await pool.query(
    `INSERT INTO desvios
       (nro_desvio, fecha, anio, origen, area, descripcion, accion_correctiva,
        responsable_correctiva, metodo_causa_raiz, causa_raiz_data, accion_preventiva,
        gravedad, responsable_verificar, estado, fecha_estado,
        fecha_limite_respuesta, dias_alerta_limite, destinatarios)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      d.nro_desvio, d.fecha, d.anio, d.origen, d.area,
      d.descripcion, d.accion_correctiva, d.responsable_correctiva,
      d.metodo_causa_raiz, JSON.stringify(d.causa_raiz_data),
      d.accion_preventiva, d.gravedad, d.responsable_verificar,
      d.estado, d.fecha_estado,
      d.fecha_limite_respuesta, d.dias_alerta_limite, d.destinatarios,
    ]
  )
  return result.insertId
}

const update = async (id, d) => {
  await pool.query(
    `UPDATE desvios SET
       fecha=?, anio=?, origen=?, area=?, descripcion=?, accion_correctiva=?,
       responsable_correctiva=?, metodo_causa_raiz=?, causa_raiz_data=?,
       accion_preventiva=?, gravedad=?, responsable_verificar=?,
       estado=?, fecha_estado=?, fecha_limite_respuesta=?, dias_alerta_limite=?,
       destinatarios=?, notificacion_limite_enviada=?
     WHERE id=?`,
    [
      d.fecha, d.anio, d.origen, d.area, d.descripcion, d.accion_correctiva,
      d.responsable_correctiva, d.metodo_causa_raiz, JSON.stringify(d.causa_raiz_data),
      d.accion_preventiva, d.gravedad, d.responsable_verificar,
      d.estado, d.fecha_estado, d.fecha_limite_respuesta, d.dias_alerta_limite,
      d.destinatarios, d.notificacion_limite_enviada, id,
    ]
  )
}

const updateEstado = async (id, estado, fecha_estado) => {
  await pool.query(
    'UPDATE desvios SET estado=?, fecha_estado=? WHERE id=?',
    [estado, fecha_estado, id]
  )
}

const marcarNotificado = async (id) => {
  await pool.query('UPDATE desvios SET notificacion_enviada = 1 WHERE id=?', [id])
}

const insertEvidencia = async (ev) => {
  const [result] = await pool.query(
    'INSERT INTO desvios_evidencias (desvio_id, tipo, archivo_path, nombre_original) VALUES (?,?,?,?)',
    [ev.desvio_id, ev.tipo, ev.archivo_path, ev.nombre_original]
  )
  return result.insertId
}

const findEvidencia = async (id) => {
  const [rows] = await pool.query('SELECT * FROM desvios_evidencias WHERE id=?', [id])
  return rows[0] ?? null
}

const deleteEvidencia = async (id) => {
  await pool.query('DELETE FROM desvios_evidencias WHERE id=?', [id])
}

const findPendientesNotificacion = async (forzar) => {
  if (forzar) {
    const [rows] = await pool.query(
      'SELECT * FROM desvios WHERE destinatarios IS NOT NULL AND destinatarios != ""'
    )
    return rows
  }
  const [rows] = await pool.query(
    'SELECT * FROM desvios WHERE destinatarios IS NOT NULL AND destinatarios != "" AND notificacion_enviada = 0'
  )
  return rows
}

// Desvíos con fecha límite de respuesta y destinatarios cargados, aún sin cerrar.
// El filtro por ventana de alerta (dias_alerta_limite / vencidos) lo aplica el service.
const findPendientesLimite = async (forzar) => {
  const sql = `
    SELECT * FROM desvios
    WHERE fecha_limite_respuesta IS NOT NULL
      AND destinatarios IS NOT NULL AND destinatarios != ''
      AND estado != 'Cerrado'
      ${forzar ? '' : 'AND notificacion_limite_enviada = 0'}
  `
  const [rows] = await pool.query(sql)
  return rows
}

const marcarNotificadoLimite = async (id) => {
  await pool.query('UPDATE desvios SET notificacion_limite_enviada = 1 WHERE id=?', [id])
}

const remove = async (id) => {
  await pool.query('DELETE FROM desvios WHERE id=?', [id])
}

module.exports = {
  findAll,
  findById,
  countTotal,
  insert,
  update,
  updateEstado,
  marcarNotificado,
  insertEvidencia,
  findEvidencia,
  deleteEvidencia,
  findPendientesNotificacion,
  findPendientesLimite,
  marcarNotificadoLimite,
  remove,
}
