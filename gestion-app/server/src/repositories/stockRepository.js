// ─────────────────────────────────────────────────────────────────────────────
// Capa de acceso a datos (repository) — Stock de Lotes
//
// Única capa que conoce SQL. Devuelve filas crudas (snake_case; este módulo no
// usa mapper camelCase, igual que el resto de Logística). Expone además un
// helper `withTransaction` para que el service orqueste operaciones atómicas
// sin manejar conexiones a mano.
// ─────────────────────────────────────────────────────────────────────────────
const pool = require('../db')

// Kilos/toneladas se calculan en SQL, no se almacenan
const SELECT_LOTE = `
  SELECT *,
    (stock_envases * kilos_por_unidad)        AS kilos_totales,
    (stock_envases * kilos_por_unidad / 1000) AS toneladas_totales
  FROM stock_lotes
`

const findAllActivos = async () => {
  const [rows] = await pool.query(SELECT_LOTE + ' WHERE activo = 1 ORDER BY creado_en DESC')
  return rows
}

// Acepta una conexión opcional para poder leer dentro de una transacción
const findById = async (id, conn = pool) => {
  const [rows] = await conn.query(SELECT_LOTE + ' WHERE id = ?', [id])
  return rows[0] ?? null
}

const insert = async (lote) => {
  const [result] = await pool.query(
    `INSERT INTO stock_lotes (nro_lote, stock_envases, calibre, kilos_por_unidad, ubicacion, anio_cosecha)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [lote.nro_lote, lote.stock_envases, lote.calibre, lote.kilos_por_unidad, lote.ubicacion, lote.anio_cosecha]
  )
  return result.insertId
}

// Lee y bloquea la fila (FOR UPDATE) — debe usarse dentro de withTransaction
const findStockForUpdate = async (conn, id) => {
  const [rows] = await conn.query(
    'SELECT stock_envases FROM stock_lotes WHERE id = ? AND activo = 1 FOR UPDATE',
    [id]
  )
  return rows[0] ?? null
}

const setStock = async (conn, id, stock) => {
  await conn.query('UPDATE stock_lotes SET stock_envases = ? WHERE id = ?', [stock, id])
}

// Deja el stock en 0 y da de baja lógica el lote (sin stock)
const setStockAndBaja = async (conn, id) => {
  await conn.query('UPDATE stock_lotes SET stock_envases = 0, activo = 0 WHERE id = ?', [id])
}

// Baja lógica total. Devuelve la cantidad de filas afectadas (0 si ya estaba de baja)
const darDeBaja = async (id) => {
  const [result] = await pool.query(
    'UPDATE stock_lotes SET activo = 0 WHERE id = ? AND activo = 1', [id]
  )
  return result.affectedRows
}

// Ejecuta `fn(conn)` dentro de una transacción; commitea, o hace rollback ante
// cualquier error, y siempre libera la conexión.
const withTransaction = async (fn) => {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

module.exports = {
  findAllActivos,
  findById,
  insert,
  findStockForUpdate,
  setStock,
  setStockAndBaja,
  darDeBaja,
  withTransaction,
}
