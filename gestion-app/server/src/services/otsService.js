// ─────────────────────────────────────────────────────────────────────────────
// Capa de negocio (service) — Órdenes de Trabajo (OTs)
//
// Concentra: validación, mapeo snake_case→camelCase y la generación del id
// secuencial OT-XXX. No conoce SQL (usa el repository) ni HTTP (lanza AppError).
// ─────────────────────────────────────────────────────────────────────────────
const repo         = require('../repositories/otsRepository')
const { AppError } = require('../middleware/errorHandler')

// Convierte snake_case de MySQL a camelCase para el frontend
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

// Id secuencial OT-XXX basado en COUNT(*) — no es colisión-seguro bajo inserts concurrentes
const generarId = (total) => `OT-${String(total + 1).padStart(3, '0')}`

const listarOTs = async () => {
  const rows = await repo.findAll()
  return rows.map(formatear)
}

const obtenerOT = async (id) => {
  const row = await repo.findById(id)
  if (!row) throw new AppError(`OT ${id} no encontrada`, 404)
  return formatear(row)
}

const crearOT = async (body) => {
  const { fecha, prioridad, area, tarea, solicitante } = body
  if (!fecha || !prioridad || !area || !tarea || !solicitante) {
    throw new AppError('Faltan campos obligatorios')
  }

  const id = generarId(await repo.countOTs())
  await repo.insert(id, { fecha, prioridad, area, tarea, solicitante })
  return formatear(await repo.findById(id))
}

const actualizarOT = async (id, body) => {
  await repo.update(id, body)
  const row = await repo.findById(id)
  if (!row) throw new AppError(`OT ${id} no encontrada`, 404)
  return formatear(row)
}

module.exports = { listarOTs, obtenerOT, crearOT, actualizarOT }
