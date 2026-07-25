// ─────────────────────────────────────────────────────────────────────────────
// Capa de negocio (service) — Contenedores
//
// El módulo no tiene validaciones ni reglas complejas: el service se limita a
// orquestar las operaciones multi-tabla dentro de transacciones y a formatear
// la respuesta. No conoce SQL (usa el repository) ni HTTP (lanza AppError).
// ─────────────────────────────────────────────────────────────────────────────
const repo         = require('../repositories/contenedoresRepository')
const { AppError } = require('../middleware/errorHandler')

// Genera el número de registro REG-XXX a partir del total actual.
// (Basado en COUNT(*), no es colisión-seguro bajo inserts concurrentes.)
const generarRegistroNro = (total) => `REG-${String(total + 1).padStart(3, '0')}`

const listarContenedores = () => repo.findAllWithSecciones()

const obtenerContenedor = async (id) => {
  const contenedor = await repo.findById(id)
  if (!contenedor) throw new AppError('No encontrado', 404)
  const { seccion1, seccion2 } = await repo.findSecciones(id)
  return { ...contenedor, seccion1, seccion2 }
}

// Crea el contenedor + su sección 1 de forma atómica
const crearContenedor = async (body) => {
  return repo.withTransaction(async (conn) => {
    const total       = await repo.countContenedores(conn)
    const registroNro = generarRegistroNro(total)

    const contenedorId = await repo.insertContenedor(conn, registroNro, body)
    await repo.insertSeccion1(conn, contenedorId, body)

    return repo.findById(contenedorId, conn)
  })
}

const actualizarSeccion1 = async (id, body) => {
  await repo.updateSeccion1(id, body)
  return { ok: true }
}

// Completa la sección 2 (insert o update) y marca el contenedor como 'completado'
const completarSeccion2 = async (id, body) => {
  return repo.withTransaction(async (conn) => {
    // El lote no puede repetirse en otro contenedor
    const lote = (body.lote ?? '').trim()
    if (lote && await repo.existeLoteEnOtro(lote, id, conn)) {
      throw new AppError('Este lote ya fue cargado en otro contenedor', 409)
    }
    await repo.upsertSeccion2(conn, id, body)
    await repo.setEstado(conn, id, 'completado')
    return { ok: true }
  })
}

module.exports = {
  listarContenedores,
  obtenerContenedor,
  crearContenedor,
  actualizarSeccion1,
  completarSeccion2,
}
