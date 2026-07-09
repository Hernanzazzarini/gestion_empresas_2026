// ─────────────────────────────────────────────────────────────────────────────
// Capa de negocio (service) — Stock de Lotes
//
// Concentra validación y reglas: calibres válidos, baja automática al llegar a 0,
// reducción atómica de envases. No conoce SQL (usa el repository) ni HTTP
// (lanza AppError). Devuelve filas crudas snake_case (sin mapper), como el
// contrato existente del módulo.
// ─────────────────────────────────────────────────────────────────────────────
const repo         = require('../repositories/stockRepository')
const { AppError } = require('../middleware/errorHandler')

const CALIBRES = [
  '30-35', '38-42', '40-50', '50-60', '60-70', '80-100',
  'SPLIT FINO', 'SPLIT GRUESO', 'CAIDA', 'OTROS',
]

const listarLotes = () => repo.findAllActivos()

const crearLote = async (body) => {
  const { nro_lote, stock_envases, calibre, kilos_por_unidad, ubicacion, anio_cosecha } = body

  if (!nro_lote || stock_envases == null || !calibre || kilos_por_unidad == null || !ubicacion || anio_cosecha == null) {
    throw new AppError('Todos los campos son obligatorios')
  }
  if (!CALIBRES.includes(calibre)) {
    throw new AppError('Calibre no válido')
  }

  const envases = Number(stock_envases)
  const kilos   = Number(kilos_por_unidad)
  const anio    = Number(anio_cosecha)

  if (isNaN(envases) || envases <= 0) throw new AppError('Stock de envases debe ser un número positivo')
  if (isNaN(kilos) || kilos <= 0)     throw new AppError('Kilos por unidad debe ser un número positivo')
  if (isNaN(anio) || anio < 1990 || anio > 2100) throw new AppError('Año de cosecha no válido')

  const id = await repo.insert({
    nro_lote:         nro_lote.trim(),
    stock_envases:    envases,
    calibre,
    kilos_por_unidad: kilos,
    ubicacion:        ubicacion.trim(),
    anio_cosecha:     anio,
  })
  return repo.findById(id)
}

// Reduce envases de forma atómica (bloqueo FOR UPDATE dentro de la transacción).
// Si el stock llega a 0, da de baja el lote automáticamente.
const reducirEnvases = async (id, cantidad) => {
  const cant = Number(cantidad)
  if (!cant || isNaN(cant) || cant <= 0 || !Number.isInteger(cant)) {
    throw new AppError('La cantidad a reducir debe ser un número entero positivo')
  }

  return repo.withTransaction(async (conn) => {
    const lote = await repo.findStockForUpdate(conn, id)
    if (!lote) throw new AppError('Lote no encontrado', 404)
    if (cant > lote.stock_envases) {
      throw new AppError(`No podés reducir ${cant} envases: el lote solo tiene ${lote.stock_envases}`)
    }

    const nuevoStock = lote.stock_envases - cant
    if (nuevoStock === 0) {
      await repo.setStockAndBaja(conn, id)
      return { ok: true, stock_envases: 0, dado_de_baja: true }
    }

    await repo.setStock(conn, id, nuevoStock)
    const actualizado = await repo.findById(id, conn)
    return { ok: true, ...actualizado, dado_de_baja: false }
  })
}

const darDeBajaLote = async (id) => {
  const affected = await repo.darDeBaja(id)
  if (affected === 0) throw new AppError('Lote no encontrado o ya dado de baja', 404)
  return { ok: true }
}

module.exports = {
  listarLotes,
  crearLote,
  reducirEnvases,
  darDeBajaLote,
}
