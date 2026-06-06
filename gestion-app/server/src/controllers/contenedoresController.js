const pool = require('../db')

// Convierte 'na' a null para campos booleanos
const parseBooleano = (val) => {
  if (val === 'na' || val === null || val === undefined) return null
  return val
}

// ─── Generar número de registro REG-XXX ───────────────────────────────────────
const generarRegistroNro = async (conn) => {
  const [rows] = await conn.query(
    'SELECT COUNT(*) as total FROM contenedores'
  )
  const siguiente = rows[0].total + 1
  return `REG-${String(siguiente).padStart(3, '0')}`
}

// ─── GET todos ────────────────────────────────────────────────────────────────
const getContenedores = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*,
        s1.apto_para_cargar, s1.responsable_inocuidad,
        s2.lote, s2.calibre, s2.firma_cargador
      FROM contenedores c
      LEFT JOIN contenedores_seccion1 s1 ON s1.contenedor_id = c.id
      LEFT JOIN contenedores_seccion2 s2 ON s2.contenedor_id = c.id
      ORDER BY c.creado_en DESC
    `)
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener contenedores' })
  }
}

// ─── GET uno ──────────────────────────────────────────────────────────────────
const getContenedor = async (req, res) => {
  try {
    const { id } = req.params
    const [[contenedor]] = await pool.query(
      'SELECT * FROM contenedores WHERE id = ?', [id]
    )
    if (!contenedor) return res.status(404).json({ error: 'No encontrado' })

    const [[seccion1]] = await pool.query(
      'SELECT * FROM contenedores_seccion1 WHERE contenedor_id = ?', [id]
    )
    const [[seccion2]] = await pool.query(
      'SELECT * FROM contenedores_seccion2 WHERE contenedor_id = ?', [id]
    )

    res.json({ ...contenedor, seccion1: seccion1 || null, seccion2: seccion2 || null })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener contenedor' })
  }
}

// ─── POST crear ───────────────────────────────────────────────────────────────
const crearContenedor = async (req, res) => {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const {
      orden_carga_nro, fecha, empresa_transportista,
      chofer, patente_tractor, patente_semi, nro_contenedor,
      hora_entrada, tipo_carga,
      pestillos_cierre, contenedor_seco, contenedor_sin_olor,
      ausencia_contaminantes, limpio_paredes, limpio_piso,
      limpio_techo, limpio_puertas, paredes_buen_estado,
      piso_buen_estado, techo_buen_estado, puertas_buen_estado,
      observacion_control, apto_para_cargar, responsable_inocuidad,
    } = req.body

    const registro_nro = await generarRegistroNro(conn)

    const [result] = await conn.query(`
      INSERT INTO contenedores
        (registro_nro, orden_carga_nro, fecha, empresa_transportista,
         chofer, patente_tractor, patente_semi, nro_contenedor,
         hora_entrada, tipo_carga, estado)
      VALUES (?,?,?,?,?,?,?,?,?,?,'pendiente_carga')
    `, [
      registro_nro, orden_carga_nro ?? null, fecha,
      empresa_transportista, chofer,
      patente_tractor ?? null, patente_semi ?? null,
      nro_contenedor, hora_entrada ?? null,
      tipo_carga ?? 'EXPORTACION',
    ])

    const contenedor_id = result.insertId

    await conn.query(`
      INSERT INTO contenedores_seccion1
        (contenedor_id,
         pestillos_cierre, contenedor_seco, contenedor_sin_olor,
         ausencia_contaminantes, limpio_paredes, limpio_piso,
         limpio_techo, limpio_puertas, paredes_buen_estado,
         piso_buen_estado, techo_buen_estado, puertas_buen_estado,
         observacion_control, apto_para_cargar, responsable_inocuidad)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      contenedor_id,
      pestillos_cierre       ?? null, contenedor_seco         ?? null,
      contenedor_sin_olor    ?? null, ausencia_contaminantes  ?? null,
      limpio_paredes         ?? null, limpio_piso             ?? null,
      limpio_techo           ?? null, limpio_puertas          ?? null,
      paredes_buen_estado    ?? null, piso_buen_estado        ?? null,
      techo_buen_estado      ?? null, puertas_buen_estado     ?? null,
      observacion_control    ?? null, apto_para_cargar        ?? null,
      responsable_inocuidad  ?? null,
    ])

    await conn.commit()

    const [[nuevo]] = await conn.query(
      'SELECT * FROM contenedores WHERE id = ?', [contenedor_id]
    )
    res.status(201).json(nuevo)

  } catch (error) {
    await conn.rollback()
    console.error(error)
    res.status(500).json({ error: 'Error al crear contenedor' })
  } finally {
    conn.release()
  }
}

// ─── PATCH sección 1 ──────────────────────────────────────────────────────────
const actualizarSeccion1 = async (req, res) => {
  try {
    const { id } = req.params
    const {
      pestillos_cierre, contenedor_seco, contenedor_sin_olor,
      ausencia_contaminantes, limpio_paredes, limpio_piso,
      limpio_techo, limpio_puertas, paredes_buen_estado,
      piso_buen_estado, techo_buen_estado, puertas_buen_estado,
      observacion_control, apto_para_cargar, responsable_inocuidad,
    } = req.body

    await pool.query(`
      UPDATE contenedores_seccion1 SET
        pestillos_cierre=?, contenedor_seco=?, contenedor_sin_olor=?,
        ausencia_contaminantes=?, limpio_paredes=?, limpio_piso=?,
        limpio_techo=?, limpio_puertas=?, paredes_buen_estado=?,
        piso_buen_estado=?, techo_buen_estado=?, puertas_buen_estado=?,
        observacion_control=?, apto_para_cargar=?, responsable_inocuidad=?
      WHERE contenedor_id=?
    `, [
      pestillos_cierre       ?? null, contenedor_seco         ?? null,
      contenedor_sin_olor    ?? null, ausencia_contaminantes  ?? null,
      limpio_paredes         ?? null, limpio_piso             ?? null,
      limpio_techo           ?? null, limpio_puertas          ?? null,
      paredes_buen_estado    ?? null, piso_buen_estado        ?? null,
      techo_buen_estado      ?? null, puertas_buen_estado     ?? null,
      observacion_control    ?? null, apto_para_cargar        ?? null,
      responsable_inocuidad  ?? null,
      id,
    ])

    res.json({ ok: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar sección 1' })
  }
}

// ─── PATCH sección 2 ──────────────────────────────────────────────────────────
const completarSeccion2 = async (req, res) => {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const { id } = req.params
    const {
      hora_salida, destino_descarga, cosecha, tipo_envase,
      forrado_contenedor, material_forrado,
      sales_geles, sales_tipo_gel, sales_cantidad, sales_lote,
      envases_buen_estado, envases_bien_colocados,
      envases_correctamente_cerrados, envases_identificacion,
      faja_trincado, blister_fosfuro, blister_cantidad, blister_lote,
      pallet_expo, pallet_cantidad, pallet_lote,
      evidencia_insectos, obs_control_carga,
      lote, nro_bls_bb, calibre, va_fumigado,
      temp_bb1, temp_bb5, temp_bb10, temp_bb15, temp_bb20, temp_promedio,
      etiqueta_lote, etiqueta_calibre, etiqueta_peso,
      etiqueta_fechas, etiqueta_leyenda, etiqueta_especial, obs_etiquetas,
      punto_rocio, temp_tempering, humedad_tempering,
      temp_ambiente, humedad_ambiente,
      firma_cargador, firma_auxiliar, firma_acondicionador,
    } = req.body

    const v = [
      hora_salida                    ?? null,
      destino_descarga               ?? null,
      cosecha                        ?? null,
      tipo_envase                    ?? null,
      parseBooleano(forrado_contenedor),
      material_forrado               ?? null,
      parseBooleano(sales_geles),
      sales_tipo_gel                 ?? null,
      sales_cantidad                 ?? null,
      sales_lote                     ?? null,
      parseBooleano(envases_buen_estado),
      parseBooleano(envases_bien_colocados),
      parseBooleano(envases_correctamente_cerrados),
      parseBooleano(envases_identificacion),
      parseBooleano(faja_trincado),
      parseBooleano(blister_fosfuro),
      blister_cantidad               ?? null,
      blister_lote                   ?? null,
      parseBooleano(pallet_expo),
      pallet_cantidad                ?? null,
      pallet_lote                    ?? null,
      parseBooleano(evidencia_insectos),
      obs_control_carga              ?? null,
      lote                           ?? null,
      nro_bls_bb                     ?? null,
      calibre                        ?? null,
      parseBooleano(va_fumigado),
      temp_bb1                       ?? null,
      temp_bb5                       ?? null,
      temp_bb10                      ?? null,
      temp_bb15                      ?? null,
      temp_bb20                      ?? null,
      temp_promedio                  ?? null,
      parseBooleano(etiqueta_lote),
      parseBooleano(etiqueta_calibre),
      parseBooleano(etiqueta_peso),
      parseBooleano(etiqueta_fechas),
      parseBooleano(etiqueta_leyenda),
      parseBooleano(etiqueta_especial),
      obs_etiquetas                  ?? null,
      punto_rocio                    ?? null,
      temp_tempering                 ?? null,
      humedad_tempering              ?? null,
      temp_ambiente                  ?? null,
      humedad_ambiente               ?? null,
      firma_cargador                 ?? null,
      firma_auxiliar                 ?? null,
      firma_acondicionador           ?? null,
    ]

    const [[existe]] = await conn.query(
      'SELECT id FROM contenedores_seccion2 WHERE contenedor_id = ?', [id]
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
      `, [...v, id])
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
      `, [id, ...v])
    }

    await conn.query(
      "UPDATE contenedores SET estado = 'completado' WHERE id = ?", [id]
    )

    await conn.commit()
    res.json({ ok: true })

  } catch (error) {
    await conn.rollback()
    console.error(error)
    res.status(500).json({ error: 'Error al completar sección 2' })
  } finally {
    conn.release()
  }
}

module.exports = {
  getContenedores,
  getContenedor,
  crearContenedor,
  actualizarSeccion1,
  completarSeccion2,
}