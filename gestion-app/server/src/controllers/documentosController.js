const pool     = require('../db')
const path     = require('path')
const fs       = require('fs')
const nodemailer = require('nodemailer')

const formatear = (row) => ({
  id:                     row.id,
  codigo:                 row.codigo,
  nombre:                 row.nombre,
  numeroRevision:         row.numero_revision,
  areaUso:                row.area_uso,
  estado:                 row.estado,
  cantidadCopiasImpresas: row.cantidad_copias_impresas,
  formatoArchivo:         row.formato_archivo,
  archivoPath:            row.archivo_path   ?? null,
  archivoNombre:          row.archivo_nombre ?? null,
  fechaRevision:          row.fecha_revision
                            ? new Date(row.fecha_revision).toISOString().slice(0, 10)
                            : null,
  diasAlerta:             row.dias_alerta ?? 30,
  destinatariosEmail:     row.destinatarios_email
                            ? row.destinatarios_email.split(',').map(e => e.trim()).filter(Boolean)
                            : [],
  notificacionEnviada:    !!row.notificacion_enviada,
  creadoEn:               row.created_at,
})

// GET /api/documentos
const getDocumentos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM documentos_inocuidad ORDER BY codigo ASC, estado DESC'
    )
    res.json(rows.map(formatear))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener documentos' })
  }
}

// GET /api/documentos/:id
const getDocumento = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM documentos_inocuidad WHERE id = ?',
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Documento no encontrado' })
    res.json(formatear(rows[0]))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener documento' })
  }
}

// POST /api/documentos
const crearDocumento = async (req, res) => {
  try {
    const {
      codigo, nombre, numero_revision, area_uso, estado,
      cantidad_copias_impresas, formato_archivo,
      fecha_revision, dias_alerta, destinatarios_email,
    } = req.body

    if (!codigo?.trim() || !nombre?.trim() || !numero_revision || !area_uso ||
        !estado || cantidad_copias_impresas === undefined || cantidad_copias_impresas === '' ||
        !formato_archivo) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' })
    }

    let autoObsoletado = null
    let eliminadoId    = null

    if (estado === 'vigente') {
      // Si ya hay un vigente para este código → lo pasa a obsoleto automáticamente
      const [vigenteExistente] = await pool.query(
        'SELECT * FROM documentos_inocuidad WHERE codigo = ? AND estado = "vigente"',
        [codigo.trim()]
      )
      if (vigenteExistente.length > 0) {
        // Si también hay un obsoleto previo, se elimina (solo pueden coexistir 2 por código)
        const [obsoletoExistente] = await pool.query(
          'SELECT id FROM documentos_inocuidad WHERE codigo = ? AND estado = "obsoleto"',
          [codigo.trim()]
        )
        if (obsoletoExistente.length > 0) {
          eliminadoId = obsoletoExistente[0].id
          await pool.query('DELETE FROM documentos_inocuidad WHERE id = ?', [eliminadoId])
        }

        // Pasar vigente a obsoleto y desactivar notificaciones
        await pool.query(
          `UPDATE documentos_inocuidad
           SET estado = 'obsoleto', fecha_revision = NULL, dias_alerta = 30, destinatarios_email = NULL
           WHERE id = ?`,
          [vigenteExistente[0].id]
        )
        const [rowsObs] = await pool.query(
          'SELECT * FROM documentos_inocuidad WHERE id = ?', [vigenteExistente[0].id]
        )
        autoObsoletado = formatear(rowsObs[0])
      }
    } else {
      // Para obsoleto: sigue bloqueando duplicados
      const [existentes] = await pool.query(
        'SELECT id FROM documentos_inocuidad WHERE codigo = ? AND estado = "obsoleto"',
        [codigo.trim()]
      )
      if (existentes.length > 0) {
        return res.status(400).json({
          error: `Ya existe un documento obsoleto con código "${codigo.trim()}". Eliminalo primero para agregar uno nuevo.`,
        })
      }
    }

    const [result] = await pool.query(
      `INSERT INTO documentos_inocuidad
        (codigo, nombre, numero_revision, area_uso, estado,
         cantidad_copias_impresas, formato_archivo,
         fecha_revision, dias_alerta, destinatarios_email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codigo.trim(),
        nombre.trim(),
        Number(numero_revision),
        area_uso,
        estado,
        Number(cantidad_copias_impresas),
        formato_archivo,
        fecha_revision || null,
        dias_alerta ? Number(dias_alerta) : 30,
        destinatarios_email?.trim() || null,
      ]
    )

    const [rows] = await pool.query(
      'SELECT * FROM documentos_inocuidad WHERE id = ?', [result.insertId]
    )
    res.status(201).json({ documento: formatear(rows[0]), autoObsoletado, eliminadoId })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al crear documento' })
  }
}

// PATCH /api/documentos/:id
const actualizarDocumento = async (req, res) => {
  try {
    const { id } = req.params
    const [current] = await pool.query(
      'SELECT * FROM documentos_inocuidad WHERE id = ?', [id]
    )
    if (current.length === 0) return res.status(404).json({ error: 'Documento no encontrado' })

    const doc = current[0]
    const {
      codigo, nombre, numero_revision, area_uso, estado,
      cantidad_copias_impresas, formato_archivo,
      fecha_revision, dias_alerta, destinatarios_email,
    } = req.body

    const nuevoCodigo = (codigo ?? doc.codigo).trim()
    const nuevoEstado = estado ?? doc.estado

    let autoObsoletado = null
    let eliminadoId    = null

    // Si pasa a vigente, auto-obsoleta cualquier otro vigente con el mismo código
    if (nuevoEstado === 'vigente' && (nuevoCodigo !== doc.codigo || doc.estado !== 'vigente')) {
      const [vigenteExistente] = await pool.query(
        'SELECT * FROM documentos_inocuidad WHERE codigo = ? AND estado = "vigente" AND id != ?',
        [nuevoCodigo, id]
      )
      if (vigenteExistente.length > 0) {
        // Eliminar obsoleto previo si existe (límite de 2 por código)
        const [obsoletoExistente] = await pool.query(
          'SELECT id FROM documentos_inocuidad WHERE codigo = ? AND estado = "obsoleto" AND id != ?',
          [nuevoCodigo, id]
        )
        if (obsoletoExistente.length > 0) {
          eliminadoId = obsoletoExistente[0].id
          await pool.query('DELETE FROM documentos_inocuidad WHERE id = ?', [eliminadoId])
        }
        await pool.query(
          `UPDATE documentos_inocuidad
           SET estado = 'obsoleto', fecha_revision = NULL, dias_alerta = 30, destinatarios_email = NULL
           WHERE id = ?`,
          [vigenteExistente[0].id]
        )
        const [rowsObs] = await pool.query(
          'SELECT * FROM documentos_inocuidad WHERE id = ?', [vigenteExistente[0].id]
        )
        autoObsoletado = formatear(rowsObs[0])
      }
    } else if (nuevoEstado !== 'vigente') {
      // Para obsoleto: bloquear si ya existe otro obsoleto con mismo código
      const [obsExistente] = await pool.query(
        'SELECT id FROM documentos_inocuidad WHERE codigo = ? AND estado = "obsoleto" AND id != ?',
        [nuevoCodigo, id]
      )
      if (obsExistente.length > 0) {
        return res.status(400).json({
          error: `Ya existe un documento obsoleto con código "${nuevoCodigo}".`,
        })
      }
    }

    const nuevaFecha       = fecha_revision !== undefined ? (fecha_revision || null) : doc.fecha_revision
    const fechaCambio      = nuevaFecha !== (doc.fecha_revision
                               ? new Date(doc.fecha_revision).toISOString().slice(0, 10)
                               : null)
    // Si la fecha de revisión cambió, se resetea la marca de notificación enviada
    const resetNotificacion = fechaCambio ? 0 : doc.notificacion_enviada ?? 0

    await pool.query(
      `UPDATE documentos_inocuidad SET
        codigo                  = ?,
        nombre                  = ?,
        numero_revision         = ?,
        area_uso                = ?,
        estado                  = ?,
        cantidad_copias_impresas = ?,
        formato_archivo         = ?,
        fecha_revision          = ?,
        dias_alerta             = ?,
        destinatarios_email     = ?,
        notificacion_enviada    = ?
       WHERE id = ?`,
      [
        nuevoCodigo,
        (nombre ?? doc.nombre).trim(),
        numero_revision !== undefined ? Number(numero_revision) : doc.numero_revision,
        area_uso        ?? doc.area_uso,
        nuevoEstado,
        cantidad_copias_impresas !== undefined ? Number(cantidad_copias_impresas) : doc.cantidad_copias_impresas,
        formato_archivo ?? doc.formato_archivo,
        nuevaFecha,
        dias_alerta !== undefined ? Number(dias_alerta) : doc.dias_alerta,
        destinatarios_email !== undefined ? (destinatarios_email?.trim() || null) : doc.destinatarios_email,
        resetNotificacion,
        id,
      ]
    )

    const [rows] = await pool.query('SELECT * FROM documentos_inocuidad WHERE id = ?', [id])
    res.json({ documento: formatear(rows[0]), autoObsoletado, eliminadoId })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar documento' })
  }
}

// DELETE /api/documentos/:id
const eliminarDocumento = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM documentos_inocuidad WHERE id = ?', [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Documento no encontrado' })

    if (rows[0].archivo_path) {
      const filePath = path.join(__dirname, '../../../uploads', rows[0].archivo_path)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }

    await pool.query('DELETE FROM documentos_inocuidad WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al eliminar documento' })
  }
}

// POST /api/documentos/:id/archivo
const subirArchivo = async (req, res) => {
  try {
    const { id } = req.params
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' })

    const [rows] = await pool.query(
      'SELECT * FROM documentos_inocuidad WHERE id = ?', [id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Documento no encontrado' })

    // Eliminar archivo anterior si existe
    if (rows[0].archivo_path) {
      const oldPath = path.join(__dirname, '../../../uploads', rows[0].archivo_path)
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
    }

    const relativePath = `documentos/${req.file.filename}`
    await pool.query(
      'UPDATE documentos_inocuidad SET archivo_path = ?, archivo_nombre = ? WHERE id = ?',
      [relativePath, req.file.originalname, id]
    )

    const [updated] = await pool.query('SELECT * FROM documentos_inocuidad WHERE id = ?', [id])
    res.json(formatear(updated[0]))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al subir archivo' })
  }
}

// DELETE /api/documentos/:id/archivo
const eliminarArchivo = async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await pool.query(
      'SELECT * FROM documentos_inocuidad WHERE id = ?', [id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Documento no encontrado' })

    if (rows[0].archivo_path) {
      const filePath = path.join(__dirname, '../../../uploads', rows[0].archivo_path)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }

    await pool.query(
      'UPDATE documentos_inocuidad SET archivo_path = NULL, archivo_nombre = NULL WHERE id = ?',
      [id]
    )
    const [updated] = await pool.query('SELECT * FROM documentos_inocuidad WHERE id = ?', [id])
    res.json(formatear(updated[0]))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al eliminar archivo' })
  }
}

// Lógica central de notificaciones — usada por el endpoint manual y el cron automático
// forzar=true  → envía aunque ya haya sido notificado (botón manual)
// forzar=false → solo envía una vez por ciclo de revisión (cron automático)
const procesarNotificaciones = async (forzar = false) => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Servidor de correo no configurado. Completá EMAIL_HOST, EMAIL_USER y EMAIL_PASS en el .env.')
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const [rows] = await pool.query(
    `SELECT * FROM documentos_inocuidad
     WHERE fecha_revision IS NOT NULL
       AND estado = 'vigente'
       AND destinatarios_email IS NOT NULL
       AND destinatarios_email != ''
       ${forzar ? '' : 'AND notificacion_enviada = 0'}`
  )

  const proximos = rows.filter(doc => {
    const diasRestantes = Math.ceil((new Date(doc.fecha_revision) - hoy) / (1000 * 60 * 60 * 24))
    return diasRestantes >= 0 && diasRestantes <= (doc.dias_alerta ?? 30)
  })

  if (proximos.length === 0) {
    return { enviados: 0, mensaje: 'No hay documentos próximos a revisión con destinatarios configurados.' }
  }

  const transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  let enviados = 0
  for (const doc of proximos) {
    const destinatarios = doc.destinatarios_email.split(',').map(e => e.trim()).filter(Boolean)
    if (destinatarios.length === 0) continue

    const fechaRev      = new Date(doc.fecha_revision)
    const diasRestantes = Math.ceil((fechaRev - hoy) / (1000 * 60 * 60 * 24))
    const fechaStr      = fechaRev.toLocaleDateString('es-AR')

    await transporter.sendMail({
      from:    process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to:      destinatarios.join(', '),
      subject: `[GestiónPro] Revisión pendiente: ${doc.codigo} — ${doc.nombre}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#dc2626">⚠️ Documento próximo a revisión</h2>
          <p>Vence en <strong>${diasRestantes} día(s)</strong> — fecha límite: <strong>${fechaStr}</strong></p>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:6px 12px;background:#f8f8f8;font-weight:600">Código</td><td style="padding:6px 12px">${doc.codigo}</td></tr>
            <tr><td style="padding:6px 12px;background:#f8f8f8;font-weight:600">Nombre</td><td style="padding:6px 12px">${doc.nombre}</td></tr>
            <tr><td style="padding:6px 12px;background:#f8f8f8;font-weight:600">N° Revisión</td><td style="padding:6px 12px">${doc.numero_revision}</td></tr>
            <tr><td style="padding:6px 12px;background:#f8f8f8;font-weight:600">Área</td><td style="padding:6px 12px;text-transform:capitalize">${doc.area_uso}</td></tr>
          </table>
          <p style="margin-top:20px;color:#666;font-size:13px">— Sistema GestiónPro</p>
        </div>`,
    })
    // Marcar como notificado para no repetir automáticamente
    await pool.query(
      'UPDATE documentos_inocuidad SET notificacion_enviada = 1 WHERE id = ?',
      [doc.id]
    )
    enviados++
  }

  return { enviados, mensaje: `Se enviaron ${enviados} notificación(es) por email.` }
}

// POST /api/documentos/notificar  — disparo manual (forzar=true: ignora si ya fue notificado)
const enviarNotificaciones = async (_req, res) => {
  try {
    const result = await procesarNotificaciones(true)
    res.json(result)
  } catch (error) {
    console.error(error)
    const status = error.message.includes('no configurado') ? 503 : 500
    res.status(status).json({ error: error.message })
  }
}

module.exports = {
  getDocumentos,
  getDocumento,
  crearDocumento,
  actualizarDocumento,
  eliminarDocumento,
  subirArchivo,
  eliminarArchivo,
  enviarNotificaciones,
  procesarNotificaciones,
}
