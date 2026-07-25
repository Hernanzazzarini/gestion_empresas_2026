const pool = require('../db')

const insert = async (a) => {
  const [result] = await pool.query(
    `INSERT INTO auditoria (usuario_id, usuario, accion, modulo, recurso, metodo, detalle, ip)
     VALUES (?,?,?,?,?,?,?,?)`,
    [a.usuario_id, a.usuario, a.accion, a.modulo, a.recurso, a.metodo, a.detalle, a.ip]
  )
  return result.insertId
}

const findAll = async (filtros = {}) => {
  let sql = 'SELECT * FROM auditoria WHERE 1=1'
  const params = []
  if (filtros.usuario) { sql += ' AND usuario = ?';        params.push(filtros.usuario) }
  if (filtros.accion)  { sql += ' AND accion = ?';         params.push(filtros.accion) }
  if (filtros.modulo)  { sql += ' AND modulo = ?';         params.push(filtros.modulo) }
  if (filtros.desde)   { sql += ' AND creado_en >= ?';     params.push(filtros.desde) }
  if (filtros.hasta)   { sql += ' AND creado_en < ?';      params.push(`${filtros.hasta} 23:59:59`) }
  sql += ' ORDER BY creado_en DESC LIMIT 1000'
  const [rows] = await pool.query(sql, params)
  return rows
}

// Valores distintos para poblar los filtros del panel
const distinctUsuarios = async () => {
  const [rows] = await pool.query(
    'SELECT DISTINCT usuario FROM auditoria WHERE usuario IS NOT NULL ORDER BY usuario'
  )
  return rows.map(r => r.usuario)
}

module.exports = { insert, findAll, distinctUsuarios }
