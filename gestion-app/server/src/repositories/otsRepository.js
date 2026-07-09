// ─────────────────────────────────────────────────────────────────────────────
// Capa de acceso a datos (repository) — Órdenes de Trabajo (OTs)
//
// Única capa que conoce SQL. Devuelve filas crudas (snake_case); el mapeo a
// camelCase lo hace el service. La actualización usa COALESCE para respetar los
// campos no enviados (patch parcial).
// ─────────────────────────────────────────────────────────────────────────────
const pool = require('../db')

const findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM ots ORDER BY creado_en DESC')
  return rows
}

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM ots WHERE id = ?', [id])
  return rows[0] ?? null
}

const countOTs = async () => {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM ots')
  return total
}

const insert = async (id, o) => {
  await pool.query(
    `INSERT INTO ots
      (id, fecha, prioridad, area, tarea, solicitante, estado)
     VALUES (?, ?, ?, ?, ?, ?, 'pendiente')`,
    [id, o.fecha, o.prioridad, o.area, o.tarea, o.solicitante]
  )
}

// Patch parcial: COALESCE deja el valor actual cuando el campo llega como null
const update = async (id, o) => {
  await pool.query(
    `UPDATE ots SET
      estado                 = COALESCE(?, estado),
      fecha_realizacion      = COALESCE(?, fecha_realizacion),
      descripcion_trabajo    = COALESCE(?, descripcion_trabajo),
      responsable            = COALESCE(?, responsable),
      ok_inocuidad           = COALESCE(?, ok_inocuidad),
      comentario_inocuidad   = COALESCE(?, comentario_inocuidad),
      inspector_inocuidad    = COALESCE(?, inspector_inocuidad),
      ok_solicitante         = COALESCE(?, ok_solicitante),
      comentario_solicitante = COALESCE(?, comentario_solicitante)
     WHERE id = ?`,
    [
      o.estado                ?? null,
      o.fechaRealizacion      ?? null,
      o.descripcionTrabajo    ?? null,
      o.responsable           ?? null,
      o.okInocuidad           ?? null,
      o.comentarioInocuidad   ?? null,
      o.inspectorInocuidad    ?? null,
      o.okSolicitante         ?? null,
      o.comentarioSolicitante ?? null,
      id,
    ]
  )
}

module.exports = { findAll, findById, countOTs, insert, update }
