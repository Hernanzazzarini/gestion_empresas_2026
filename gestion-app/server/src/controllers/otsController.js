const pool = require('../db')

// Contador para generar IDs
const generarId = async () => {
  const [rows] = await pool.query('SELECT COUNT(*) as total FROM ots')
  const total = rows[0].total + 1
  return `OT-${String(total).padStart(3, '0')}`
}

// GET /api/ots — Traer todas
const getOTs = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM ots ORDER BY creado_en DESC'
    )
    res.json(rows.map(formatear))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener las OTs' })
  }
}

// GET /api/ots/:id — Traer una
const getOT = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM ots WHERE id = ?',
      [req.params.id]
    )
    if (rows.length === 0) {
      return res.status(404).json({ error: `OT ${req.params.id} no encontrada` })
    }
    res.json(formatear(rows[0]))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener la OT' })
  }
}

// POST /api/ots — Crear nueva
const crearOT = async (req, res) => {
  try {
    const { fecha, prioridad, area, tarea, solicitante } = req.body

    if (!fecha || !prioridad || !area || !tarea || !solicitante) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' })
    }

    const id = await generarId()

    await pool.query(
      `INSERT INTO ots
        (id, fecha, prioridad, area, tarea, solicitante, estado)
       VALUES (?, ?, ?, ?, ?, ?, 'pendiente')`,
      [id, fecha, prioridad, area, tarea, solicitante]
    )

    const [rows] = await pool.query('SELECT * FROM ots WHERE id = ?', [id])
    res.status(201).json(formatear(rows[0]))

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al crear la OT' })
  }
}

// PATCH /api/ots/:id — Actualizar
const actualizarOT = async (req, res) => {
  try {
    const { id } = req.params
    const {
      estado,
      fechaRealizacion,
      descripcionTrabajo,
      responsable,
      okInocuidad,
      comentarioInocuidad,
      inspectorInocuidad,
      okSolicitante,
      comentarioSolicitante,
    } = req.body

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
        estado              ?? null,
        fechaRealizacion    ?? null,
        descripcionTrabajo  ?? null,
        responsable         ?? null,
        okInocuidad         ?? null,
        comentarioInocuidad ?? null,
        inspectorInocuidad  ?? null,
        okSolicitante       ?? null,
        comentarioSolicitante ?? null,
        id,
      ]
    )

    const [rows] = await pool.query('SELECT * FROM ots WHERE id = ?', [id])
    if (rows.length === 0) {
      return res.status(404).json({ error: `OT ${id} no encontrada` })
    }
    res.json(formatear(rows[0]))

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar la OT' })
  }
}

// ─── Convierte snake_case de MySQL a camelCase para el frontend ───────────────
const formatear = (row) => ({
  id:                    row.id,
  fecha:                 row.fecha?.toISOString().slice(0, 10) ?? '',
  prioridad:             row.prioridad,
  area:                  row.area,
  tarea:                 row.tarea,
  solicitante:           row.solicitante,
  estado:                row.estado,
  fechaRealizacion:      row.fecha_realizacion?.toISOString().slice(0, 10) ?? '',
  descripcionTrabajo:    row.descripcion_trabajo  ?? '',
  responsable:           row.responsable          ?? '',
  okInocuidad:           !!row.ok_inocuidad,
  comentarioInocuidad:   row.comentario_inocuidad  ?? '',
  inspectorInocuidad:    row.inspector_inocuidad   ?? '',
  okSolicitante:         !!row.ok_solicitante,
  comentarioSolicitante: row.comentario_solicitante ?? '',
  creadoEn:              row.creado_en,
})

module.exports = { getOTs, getOT, crearOT, actualizarOT }