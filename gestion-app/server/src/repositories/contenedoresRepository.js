// ─────────────────────────────────────────────────────────────────────────────
// Capa de acceso a datos (repository) — Contenedores
//
// Única capa que conoce SQL. Devuelve filas crudas (snake_case; este módulo no
// usa mapper camelCase). El mapeo body→columnas y la normalización 'na'→null
// viven acá, junto al SQL, porque el orden de columnas es un detalle de la tabla.
// Expone `withTransaction` para las operaciones multi-tabla atómicas.
// ─────────────────────────────────────────────────────────────────────────────
const pool = require('../db')

// Convierte 'na' a null para campos booleanos
const parseBooleano = (val) => {
  if (val === 'na' || val === null || val === undefined) return null
  return val
}

// Valores de sección 1 en el orden exacto de las columnas (15 campos)
const valoresSeccion1 = (b) => [
  b.pestillos_cierre       ?? null, b.contenedor_seco         ?? null,
  b.contenedor_sin_olor    ?? null, b.ausencia_contaminantes  ?? null,
  b.limpio_paredes         ?? null, b.limpio_piso             ?? null,
  b.limpio_techo           ?? null, b.limpio_puertas          ?? null,
  b.paredes_buen_estado    ?? null, b.piso_buen_estado        ?? null,
  b.techo_buen_estado      ?? null, b.puertas_buen_estado     ?? null,
  b.observacion_control    ?? null, b.apto_para_cargar        ?? null,
  b.responsable_inocuidad  ?? null,
]

// Valores de sección 2 en el orden exacto de las columnas (49 campos)
const valoresSeccion2 = (b) => [
  b.hora_salida ?? null, b.destino_descarga ?? null, b.cosecha ?? null, b.tipo_envase ?? null,
  parseBooleano(b.forrado_contenedor), b.material_forrado ?? null,
  parseBooleano(b.sales_geles), b.sales_tipo_gel ?? null, b.sales_cantidad ?? null, b.sales_lote ?? null,
  parseBooleano(b.envases_buen_estado), parseBooleano(b.envases_bien_colocados),
  parseBooleano(b.envases_correctamente_cerrados), parseBooleano(b.envases_identificacion),
  parseBooleano(b.faja_trincado), parseBooleano(b.blister_fosfuro), b.blister_cantidad ?? null, b.blister_lote ?? null,
  parseBooleano(b.pallet_expo), b.pallet_cantidad ?? null, b.pallet_lote ?? null,
  parseBooleano(b.evidencia_insectos), b.obs_control_carga ?? null,
  b.lote ?? null, b.nro_bls_bb ?? null, b.calibre ?? null, parseBooleano(b.va_fumigado),
  b.temp_bb1 ?? null, b.temp_bb5 ?? null, b.temp_bb10 ?? null, b.temp_bb15 ?? null, b.temp_bb20 ?? null, b.temp_promedio ?? null,
  parseBooleano(b.etiqueta_lote), parseBooleano(b.etiqueta_calibre), parseBooleano(b.etiqueta_peso),
  parseBooleano(b.etiqueta_fechas), parseBooleano(b.etiqueta_leyenda), parseBooleano(b.etiqueta_especial),
  b.obs_etiquetas ?? null, b.punto_rocio ?? null, b.temp_tempering ?? null,
  b.humedad_tempering ?? null, b.temp_ambiente ?? null, b.humedad_ambiente ?? null,
  b.firma_cargador ?? null, b.firma_auxiliar ?? null, b.firma_acondicionador ?? null,
]

// ─── Consultas ───────────────────────────────────────────────────────────────
const findAllWithSecciones = async () => {
  const [rows] = await pool.query(`
    SELECT c.*,
      s1.apto_para_cargar, s1.responsable_inocuidad,
      s2.lote, s2.calibre, s2.firma_cargador
    FROM contenedores c
    LEFT JOIN contenedores_seccion1 s1 ON s1.contenedor_id = c.id
    LEFT JOIN contenedores_seccion2 s2 ON s2.contenedor_id = c.id
    ORDER BY c.creado_en DESC
  `)
  return rows
}

const findById = async (id, conn = pool) => {
  const [[row]] = await conn.query('SELECT * FROM contenedores WHERE id = ?', [id])
  return row ?? null
}

const findSecciones = async (id) => {
  const [[seccion1]] = await pool.query('SELECT * FROM contenedores_seccion1 WHERE contenedor_id = ?', [id])
  const [[seccion2]] = await pool.query('SELECT * FROM contenedores_seccion2 WHERE contenedor_id = ?', [id])
  return { seccion1: seccion1 || null, seccion2: seccion2 || null }
}

const countContenedores = async (conn = pool) => {
  const [[{ total }]] = await conn.query('SELECT COUNT(*) as total FROM contenedores')
  return total
}

// ─── Escrituras ──────────────────────────────────────────────────────────────
const insertContenedor = async (conn, registroNro, b) => {
  const [result] = await conn.query(`
    INSERT INTO contenedores
      (registro_nro, orden_carga_nro, fecha, empresa_transportista,
       chofer, patente_tractor, patente_semi, nro_contenedor,
       hora_entrada, tipo_carga, estado)
    VALUES (?,?,?,?,?,?,?,?,?,?,'pendiente_carga')
  `, [
    registroNro, b.orden_carga_nro ?? null, b.fecha,
    b.empresa_transportista, b.chofer,
    b.patente_tractor ?? null, b.patente_semi ?? null,
    b.nro_contenedor, b.hora_entrada ?? null,
    b.tipo_carga ?? 'EXPORTACION',
  ])
  return result.insertId
}

const insertSeccion1 = async (conn, contenedorId, b) => {
  await conn.query(`
    INSERT INTO contenedores_seccion1
      (contenedor_id,
       pestillos_cierre, contenedor_seco, contenedor_sin_olor,
       ausencia_contaminantes, limpio_paredes, limpio_piso,
       limpio_techo, limpio_puertas, paredes_buen_estado,
       piso_buen_estado, techo_buen_estado, puertas_buen_estado,
       observacion_control, apto_para_cargar, responsable_inocuidad)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `, [contenedorId, ...valoresSeccion1(b)])
}

const updateSeccion1 = async (contenedorId, b) => {
  await pool.query(`
    UPDATE contenedores_seccion1 SET
      pestillos_cierre=?, contenedor_seco=?, contenedor_sin_olor=?,
      ausencia_contaminantes=?, limpio_paredes=?, limpio_piso=?,
      limpio_techo=?, limpio_puertas=?, paredes_buen_estado=?,
      piso_buen_estado=?, techo_buen_estado=?, puertas_buen_estado=?,
      observacion_control=?, apto_para_cargar=?, responsable_inocuidad=?
    WHERE contenedor_id=?
  `, [...valoresSeccion1(b), contenedorId])
}

// Inserta o actualiza la sección 2 según exista ya para ese contenedor
const upsertSeccion2 = async (conn, contenedorId, b) => {
  const v = valoresSeccion2(b)
  const [[existe]] = await conn.query(
    'SELECT id FROM contenedores_seccion2 WHERE contenedor_id = ?', [contenedorId]
  )

  if (existe) {
    await conn.query(`
      UPDATE contenedores_seccion2 SET
        hora_salida=?, destino_descarga=?, cosecha=?, tipo_envase=?,
        forrado_contenedor=?, material_forrado=?,
        sales_geles=?, sales_tipo_gel=?, sales_cantidad=?, sales_lote=?,
        envases_buen_estado=?, envases_bien_colocados=?,
        envases_correctamente_cerrados=?, envases_identificacion=?,
        faja_trincado=?, blister_fosfuro=?, blister_cantidad=?, blister_lote=?,
        pallet_expo=?, pallet_cantidad=?, pallet_lote=?,
        evidencia_insectos=?, obs_control_carga=?,
        lote=?, nro_bls_bb=?, calibre=?, va_fumigado=?,
        temp_bb1=?, temp_bb5=?, temp_bb10=?, temp_bb15=?,
        temp_bb20=?, temp_promedio=?,
        etiqueta_lote=?, etiqueta_calibre=?, etiqueta_peso=?,
        etiqueta_fechas=?, etiqueta_leyenda=?, etiqueta_especial=?,
        obs_etiquetas=?, punto_rocio=?, temp_tempering=?,
        humedad_tempering=?, temp_ambiente=?, humedad_ambiente=?,
        firma_cargador=?, firma_auxiliar=?, firma_acondicionador=?
      WHERE contenedor_id=?
    `, [...v, contenedorId])
  } else {
    await conn.query(`
      INSERT INTO contenedores_seccion2
        (contenedor_id,
         hora_salida, destino_descarga, cosecha, tipo_envase,
         forrado_contenedor, material_forrado,
         sales_geles, sales_tipo_gel, sales_cantidad, sales_lote,
         envases_buen_estado, envases_bien_colocados,
         envases_correctamente_cerrados, envases_identificacion,
         faja_trincado, blister_fosfuro, blister_cantidad, blister_lote,
         pallet_expo, pallet_cantidad, pallet_lote,
         evidencia_insectos, obs_control_carga,
         lote, nro_bls_bb, calibre, va_fumigado,
         temp_bb1, temp_bb5, temp_bb10, temp_bb15,
         temp_bb20, temp_promedio,
         etiqueta_lote, etiqueta_calibre, etiqueta_peso,
         etiqueta_fechas, etiqueta_leyenda, etiqueta_especial,
         obs_etiquetas, punto_rocio, temp_tempering,
         humedad_tempering, temp_ambiente, humedad_ambiente,
         firma_cargador, firma_auxiliar, firma_acondicionador)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [contenedorId, ...v])
  }
}

const setEstado = async (conn, id, estado) => {
  await conn.query('UPDATE contenedores SET estado = ? WHERE id = ?', [estado, id])
}

// ─── Transacciones ───────────────────────────────────────────────────────────
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
  findAllWithSecciones,
  findById,
  findSecciones,
  countContenedores,
  insertContenedor,
  insertSeccion1,
  updateSeccion1,
  upsertSeccion2,
  setEstado,
  withTransaction,
}
