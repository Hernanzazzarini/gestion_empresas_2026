const pool = require('../db')

const CALIBRES = [
  '30-35', '38-42', '40-50', '50-60', '60-70', '80-100',
  'SPLIT FINO', 'SPLIT GRUESO', 'CAIDA', 'OTROS',
]

const SELECT_LOTE = `
  SELECT *,
    (stock_envases * kilos_por_unidad)        AS kilos_totales,
    (stock_envases * kilos_por_unidad / 1000) AS toneladas_totales
  FROM stock_lotes
`

// ─── GET todos los lotes activos ──────────────────────────────────────────────
const getLotes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      SELECT_LOTE + ' WHERE activo = 1 ORDER BY creado_en DESC'
    )
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener lotes' })
  }
}

// ─── POST crear lote ──────────────────────────────────────────────────────────
const crearLote = async (req, res) => {
  try {
    const { nro_lote, stock_envases, calibre, kilos_por_unidad, ubicacion, anio_cosecha } = req.body

    if (!nro_lote || stock_envases == null || !calibre || kilos_por_unidad == null || !ubicacion || anio_cosecha == null) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' })
    }
    if (!CALIBRES.includes(calibre)) {
      return res.status(400).json({ error: 'Calibre no válido' })
    }

    const envases = Number(stock_envases)
    const kilos   = Number(kilos_por_unidad)
    const anio    = Number(anio_cosecha)

    if (isNaN(envases) || envases <= 0) {
      return res.status(400).json({ error: 'Stock de envases debe ser un número positivo' })
    }
    if (isNaN(kilos) || kilos <= 0) {
      return res.status(400).json({ error: 'Kilos por unidad debe ser un número positivo' })
    }
    if (isNaN(anio) || anio < 1990 || anio > 2100) {
      return res.status(400).json({ error: 'Año de cosecha no válido' })
    }

    const [result] = await pool.query(
      `INSERT INTO stock_lotes (nro_lote, stock_envases, calibre, kilos_por_unidad, ubicacion, anio_cosecha)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nro_lote.trim(), envases, calibre, kilos, ubicacion.trim(), anio]
    )

    const [[nuevo]] = await pool.query(SELECT_LOTE + ' WHERE id = ?', [result.insertId])
    res.status(201).json(nuevo)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al crear lote' })
  }
}

// ─── PATCH reducir envases ────────────────────────────────────────────────────
const reducirEnvases = async (req, res) => {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const { id }      = req.params
    const { cantidad } = req.body

    const cant = Number(cantidad)
    if (!cant || isNaN(cant) || cant <= 0 || !Number.isInteger(cant)) {
      return res.status(400).json({ error: 'La cantidad a reducir debe ser un número entero positivo' })
    }

    const [[lote]] = await conn.query(
      'SELECT stock_envases FROM stock_lotes WHERE id = ? AND activo = 1 FOR UPDATE',
      [id]
    )
    if (!lote) {
      await conn.rollback()
      return res.status(404).json({ error: 'Lote no encontrado' })
    }
    if (cant > lote.stock_envases) {
      await conn.rollback()
      return res.status(400).json({ error: `No podés reducir ${cant} envases: el lote solo tiene ${lote.stock_envases}` })
    }

    const nuevoStock = lote.stock_envases - cant
    if (nuevoStock === 0) {
      // Sin stock → baja automática
      await conn.query('UPDATE stock_lotes SET stock_envases = 0, activo = 0 WHERE id = ?', [id])
      await conn.commit()
      return res.json({ ok: true, stock_envases: 0, dado_de_baja: true })
    }

    await conn.query('UPDATE stock_lotes SET stock_envases = ? WHERE id = ?', [nuevoStock, id])
    await conn.commit()

    const [[actualizado]] = await conn.query(SELECT_LOTE + ' WHERE id = ?', [id])
    res.json({ ok: true, ...actualizado, dado_de_baja: false })
  } catch (error) {
    await conn.rollback()
    console.error(error)
    res.status(500).json({ error: 'Error al reducir envases' })
  } finally {
    conn.release()
  }
}

// ─── DELETE (baja lógica total) lote ─────────────────────────────────────────
const darDeBajaLote = async (req, res) => {
  try {
    const { id } = req.params
    const [result] = await pool.query(
      'UPDATE stock_lotes SET activo = 0 WHERE id = ? AND activo = 1',
      [id]
    )
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Lote no encontrado o ya dado de baja' })
    }
    res.json({ ok: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al dar de baja el lote' })
  }
}

module.exports = { getLotes, crearLote, reducirEnvases, darDeBajaLote }
