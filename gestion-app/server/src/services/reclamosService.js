const nodemailer = require('nodemailer')
const repo         = require('../repositories/reclamosRepository')
const { AppError } = require('../middleware/errorHandler')
const { subir, destruirPorUrl } = require('../cloudinary')

const TIPOS         = ['Formal', 'No Formal']
const DESTINATARIOS = ['Produccion', 'Logistica', 'Calidad']
const MOTIVOS       = ['Calidad', 'Carga', 'Plagas', 'Envases']
const GRAVEDADES    = ['Menor', 'Mayor', 'Critico']
const ESTADOS       = ['Abierto', 'En tratamiento', 'Cerrado']
const METODOS       = ['5porques', 'espina']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Valida que cada email de la lista separada por comas tenga formato válido
const validarEmails = (destinatarios) => {
  if (!destinatarios || !destinatarios.trim()) return null
  const lista = destinatarios.split(',').map(e => e.trim()).filter(Boolean)
  const invalidos = lista.filter(e => !EMAIL_RE.test(e))
  if (invalidos.length > 0) {
    throw new AppError(`Email(s) con formato inválido: ${invalidos.join(', ')}`)
  }
  return lista.join(', ')
}

// ─── Mapper snake_case → camelCase ───────────────────────────────────────────
const formatear = (row) => {
  let causaRaizData = null
  if (row.causa_raiz_data) {
    try {
      causaRaizData = typeof row.causa_raiz_data === 'string'
        ? JSON.parse(row.causa_raiz_data)
        : row.causa_raiz_data
    } catch { causaRaizData = null }
  }

  let adjuntos = []
  if (row.adjuntos) {
    try {
      const parsed = typeof row.adjuntos === 'string'
        ? JSON.parse(row.adjuntos)
        : row.adjuntos
      adjuntos = Array.isArray(parsed) ? parsed.filter(Boolean) : []
    } catch { adjuntos = [] }
  }

  return {
    id:               row.id,
    nroReclamo:       row.nro_reclamo,
    fechaReclamo:     row.fecha_reclamo ? new Date(row.fecha_reclamo).toISOString().slice(0, 10) : null,
    tipo:             row.tipo,
    codigo:           row.codigo,
    origenCliente:    row.origen_cliente,
    destinatario:     row.destinatario,
    loteReclamado:    row.lote_reclamado,
    anioLote:         row.anio_lote,
    motivo:           row.motivo,
    descripcion:      row.descripcion,
    gravedad:         row.gravedad,
    observaciones:    row.observaciones || '',
    estado:           row.estado,
    fechaCierre:      row.fecha_cierre ? new Date(row.fecha_cierre).toISOString().slice(0, 10) : null,
    metodoCausaRaiz:  row.metodo_causa_raiz,
    causaRaizData:    causaRaizData,
    accionPreventiva: row.accion_preventiva || '',
    accionCorrectiva: row.accion_correctiva || '',
    responsableArea:  row.responsable_area,
    destinatarios:    row.destinatarios || '',
    notificacionEnviada: !!row.notificacion_enviada,
    adjuntos,
    reclamoAdjuntos:  adjuntos.filter(a => a.tipo === 'reclamo'),
    evidencias:       adjuntos.filter(a => a.tipo === 'evidencia'),
    adjuntosReclamo:   row.adjuntos_reclamo   ?? 0,
    adjuntosEvidencia: row.adjuntos_evidencia ?? 0,
    creadoEn:         row.creado_en,
    actualizadoEn:    row.actualizado_en,
  }
}

// ─── Generador de N° reclamo ─────────────────────────────────────────────────
const generarNro = async () => {
  const total = await repo.countTotal()
  return `REC-${String(total + 1).padStart(3, '0')}`
}

// ─── Validación común ────────────────────────────────────────────────────────
const validar = (body) => {
  const {
    fecha_reclamo, tipo, codigo, origen_cliente, destinatario,
    lote_reclamado, anio_lote, motivo, descripcion, gravedad,
    estado, fecha_cierre, metodo_causa_raiz, responsable_area,
  } = body

  if (!fecha_reclamo || !tipo || !codigo?.trim() || !origen_cliente?.trim() ||
      !destinatario || !lote_reclamado?.trim() || !anio_lote || !motivo ||
      !descripcion?.trim() || !gravedad || !estado || !fecha_cierre ||
      !responsable_area?.trim()) {
    throw new AppError('Todos los campos obligatorios deben completarse')
  }
  if (!TIPOS.includes(tipo))                 throw new AppError('Tipo no válido')
  if (!DESTINATARIOS.includes(destinatario)) throw new AppError('Destinatario no válido')
  if (!MOTIVOS.includes(motivo))             throw new AppError('Motivo no válido')
  if (!GRAVEDADES.includes(gravedad))        throw new AppError('Gravedad no válida')
  if (!ESTADOS.includes(estado))             throw new AppError('Estado no válido')
  if (metodo_causa_raiz && !METODOS.includes(metodo_causa_raiz)) {
    throw new AppError('Método de análisis de causa raíz no válido')
  }
}

// ─── Consultas ───────────────────────────────────────────────────────────────
const listarReclamos = async (filtros = {}) => {
  const rows = await repo.findAll(filtros)
  return rows.map(formatear)
}

const obtenerReclamo = async (id) => {
  const row = await repo.findById(id)
  if (!row) throw new AppError('Reclamo no encontrado', 404)
  return formatear(row)
}

// ─── Alta ────────────────────────────────────────────────────────────────────
const crearReclamo = async (body) => {
  validar(body)
  const destinatarios = validarEmails(body.destinatarios)
  const nroReclamo    = await generarNro()
  const metodo        = body.metodo_causa_raiz || '5porques'

  const id = await repo.insert({
    nro_reclamo:       nroReclamo,
    fecha_reclamo:     body.fecha_reclamo,
    tipo:              body.tipo,
    codigo:            body.codigo.trim(),
    origen_cliente:    body.origen_cliente.trim(),
    destinatario:      body.destinatario,
    lote_reclamado:    body.lote_reclamado.trim(),
    anio_lote:         Number(body.anio_lote),
    motivo:            body.motivo,
    descripcion:       body.descripcion.trim(),
    gravedad:          body.gravedad,
    observaciones:     body.observaciones?.trim() || null,
    estado:            body.estado,
    fecha_cierre:      body.fecha_cierre,
    metodo_causa_raiz: metodo,
    causa_raiz_data:   body.causa_raiz_data ?? null,
    accion_preventiva: body.accion_preventiva?.trim() || null,
    accion_correctiva: body.accion_correctiva?.trim() || null,
    responsable_area:  body.responsable_area.trim(),
    destinatarios:     destinatarios,
  })

  const reclamo = formatear(await repo.findById(id))

  // Notificación inmediata (no bloquea la creación si falla)
  if (reclamo.destinatarios) {
    try {
      await enviarEmailReclamo(reclamo)
      await repo.marcarNotificado(id)
      reclamo.notificacionEnviada = true
    } catch (err) {
      console.error(`[RECLAMOS] Error al enviar notificación de ${nroReclamo}: ${err.message}`)
    }
  }

  return reclamo
}

// ─── Edición ─────────────────────────────────────────────────────────────────
const actualizarReclamo = async (id, body) => {
  const existente = await repo.findById(id)
  if (!existente) throw new AppError('Reclamo no encontrado', 404)

  validar(body)
  const destinatarios = validarEmails(body.destinatarios)
  const metodo        = body.metodo_causa_raiz || '5porques'

  await repo.update(id, {
    fecha_reclamo:     body.fecha_reclamo,
    tipo:              body.tipo,
    codigo:            body.codigo.trim(),
    origen_cliente:    body.origen_cliente.trim(),
    destinatario:      body.destinatario,
    lote_reclamado:    body.lote_reclamado.trim(),
    anio_lote:         Number(body.anio_lote),
    motivo:            body.motivo,
    descripcion:       body.descripcion.trim(),
    gravedad:          body.gravedad,
    observaciones:     body.observaciones?.trim() || null,
    estado:            body.estado,
    fecha_cierre:      body.fecha_cierre,
    metodo_causa_raiz: metodo,
    causa_raiz_data:   body.causa_raiz_data ?? null,
    accion_preventiva: body.accion_preventiva?.trim() || null,
    accion_correctiva: body.accion_correctiva?.trim() || null,
    responsable_area:  body.responsable_area.trim(),
    destinatarios:     destinatarios,
  })

  return formatear(await repo.findById(id))
}

// ─── Cambio de estado ────────────────────────────────────────────────────────
const cambiarEstado = async (id, estado, fecha_cierre) => {
  if (!ESTADOS.includes(estado)) throw new AppError('Estado no válido')
  if (!fecha_cierre)             throw new AppError('La fecha de cierre es obligatoria')
  const existente = await repo.findById(id)
  if (!existente) throw new AppError('Reclamo no encontrado', 404)
  await repo.updateEstado(id, estado, fecha_cierre)
  return formatear(await repo.findById(id))
}

// ─── Adjuntos (reclamo | evidencia) ───────────────────────────────────────────
const agregarAdjunto = async (id, file, tipo) => {
  if (!file)                                    throw new AppError('No se recibió ningún archivo')
  if (!['reclamo', 'evidencia'].includes(tipo)) throw new AppError('Tipo de adjunto inválido (reclamo|evidencia)')
  const existente = await repo.findById(id)
  if (!existente) throw new AppError('Reclamo no encontrado', 404)
  const url = await subir(file.buffer, 'reclamos')
  await repo.insertAdjunto({
    reclamo_id:      id,
    tipo,
    archivo_path:    url,
    nombre_original: file.originalname,
  })
  return formatear(await repo.findById(id))
}

const eliminarAdjunto = async (adjuntoId) => {
  const a = await repo.findAdjunto(adjuntoId)
  if (!a) throw new AppError('Adjunto no encontrado', 404)
  await destruirPorUrl(a.archivo_path)
  await repo.deleteAdjunto(adjuntoId)
}

// ─── Eliminación ─────────────────────────────────────────────────────────────
const eliminarReclamo = async (id) => {
  const row = await repo.findById(id)
  if (!row) throw new AppError('Reclamo no encontrado', 404)
  const adjuntos = row.adjuntos
    ? (typeof row.adjuntos === 'string' ? JSON.parse(row.adjuntos) : row.adjuntos)
    : []
  for (const a of (adjuntos ?? []).filter(Boolean)) {
    await destruirPorUrl(a.archivo_path)
  }
  await repo.remove(id)
}

// ─── Email ───────────────────────────────────────────────────────────────────
const crearTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new AppError('Servidor de correo no configurado. Completá EMAIL_HOST, EMAIL_USER y EMAIL_PASS en el .env.', 503)
  }
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth:   { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  })
}

const gravedadColor = { Menor: '#16a34a', Mayor: '#d97706', Critico: '#dc2626' }

const filasEmail = (reclamo) => {
  const fecha = reclamo.fechaReclamo ? new Date(reclamo.fechaReclamo).toLocaleDateString('es-AR') : '-'
  const color = gravedadColor[reclamo.gravedad] || '#374151'
  return `
    <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600;width:40%">N° Reclamo</td><td style="padding:8px 12px">${reclamo.nroReclamo}</td></tr>
    <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Fecha</td><td style="padding:8px 12px">${fecha}</td></tr>
    <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Tipo</td><td style="padding:8px 12px">${reclamo.tipo}</td></tr>
    <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Código</td><td style="padding:8px 12px">${reclamo.codigo}</td></tr>
    <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Cliente / Origen</td><td style="padding:8px 12px">${reclamo.origenCliente}</td></tr>
    <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Destinatario</td><td style="padding:8px 12px">${reclamo.destinatario}</td></tr>
    <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Lote (año)</td><td style="padding:8px 12px">${reclamo.loteReclamado} (${reclamo.anioLote})</td></tr>
    <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Motivo</td><td style="padding:8px 12px">${reclamo.motivo}</td></tr>
    <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Gravedad</td><td style="padding:8px 12px;color:${color};font-weight:700">${reclamo.gravedad}</td></tr>
    <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Estado</td><td style="padding:8px 12px">${reclamo.estado}</td></tr>
    <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Descripción</td><td style="padding:8px 12px">${reclamo.descripcion}</td></tr>`
}

const enviarEmailReclamo = async (reclamo, opts = {}) => {
  const transporter   = opts.transporter || crearTransporter()
  const destinatarios = reclamo.destinatarios.split(',').map(e => e.trim()).filter(Boolean)
  if (destinatarios.length === 0) return

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to:      destinatarios.join(', '),
    subject: `[GestiónPro] Reclamo ${reclamo.nroReclamo} — ${reclamo.destinatario} — Gravedad: ${reclamo.gravedad}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#0891b2">📣 Reclamo registrado${opts.reenvio ? ' (reenvío)' : ''}</h2>
        <p>Se registró un nuevo reclamo que requiere atención.</p>
        <table style="border-collapse:collapse;width:100%;font-size:14px">${filasEmail(reclamo)}</table>
        <p style="margin-top:20px;color:#6b7280;font-size:12px">— Sistema GestiónPro</p>
      </div>`,
  })
}

// forzar=false (cron): solo reintenta no enviados | forzar=true (manual): re-envía todos
const procesarNotificaciones = async (forzar = false) => {
  const rows = await repo.findPendientesNotificacion(forzar)
  if (rows.length === 0) {
    return { enviados: 0, mensaje: 'No hay reclamos pendientes de notificación.' }
  }

  const transporter = crearTransporter()
  let enviados = 0

  for (const row of rows) {
    const reclamo       = formatear(row)
    const destinatarios = reclamo.destinatarios.split(',').map(e => e.trim()).filter(Boolean)
    if (destinatarios.length === 0) continue

    await enviarEmailReclamo(reclamo, { transporter, reenvio: forzar })
    await repo.marcarNotificado(row.id)
    enviados++
  }

  return { enviados, mensaje: `Se enviaron ${enviados} notificación(es) de reclamos.` }
}

module.exports = {
  listarReclamos,
  obtenerReclamo,
  crearReclamo,
  actualizarReclamo,
  cambiarEstado,
  agregarAdjunto,
  eliminarAdjunto,
  eliminarReclamo,
  procesarNotificaciones,
}
