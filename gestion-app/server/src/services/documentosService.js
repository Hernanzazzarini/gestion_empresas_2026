// ─────────────────────────────────────────────────────────────────────────────
// Capa de negocio (service) — Documentos de Inocuidad
//
// Concentra: validación, mapeo snake_case→camelCase, la regla de coexistencia
// "1 vigente + 1 obsoleto por código", manejo de archivos y notificaciones.
// No conoce SQL (usa el repository) ni HTTP (lanza AppError).
// ─────────────────────────────────────────────────────────────────────────────
const nodemailer = require('nodemailer')
const repo         = require('../repositories/documentosRepository')
const { AppError } = require('../middleware/errorHandler')
const { subir, destruirPorUrl } = require('../cloudinary')

// ─── Mapper snake_case → camelCase ───────────────────────────────────────────
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

// ─── Casos de uso: consultas ─────────────────────────────────────────────────
const listarDocumentos = async () => {
  const rows = await repo.findAll()
  return rows.map(formatear)
}

const obtenerDocumento = async (id) => {
  const row = await repo.findById(id)
  if (!row) throw new AppError('Documento no encontrado', 404)
  return formatear(row)
}

// ─── Casos de uso: alta ──────────────────────────────────────────────────────
// Devuelve { documento, autoObsoletado, eliminadoId } (contrato consumido por el cliente)
const crearDocumento = async (body) => {
  const {
    codigo, nombre, numero_revision, area_uso, estado,
    cantidad_copias_impresas, formato_archivo,
    fecha_revision, dias_alerta, destinatarios_email,
  } = body

  if (!codigo?.trim() || !nombre?.trim() || !numero_revision || !area_uso ||
      !estado || cantidad_copias_impresas === undefined || cantidad_copias_impresas === '' ||
      !formato_archivo) {
    throw new AppError('Faltan campos obligatorios')
  }

  const cod = codigo.trim()
  let autoObsoletado = null
  let eliminadoId    = null

  if (estado === 'vigente') {
    // Si ya hay un vigente para este código → lo pasa a obsoleto automáticamente
    const vigenteExistente = await repo.findVigenteByCodigo(cod)
    if (vigenteExistente) {
      // Solo pueden coexistir 2 por código: si ya hay un obsoleto previo, se elimina
      const obsoletoExistente = await repo.findObsoletoByCodigo(cod)
      if (obsoletoExistente) {
        eliminadoId = obsoletoExistente.id
        await repo.remove(eliminadoId)
      }
      await repo.markObsoleto(vigenteExistente.id)
      autoObsoletado = formatear(await repo.findById(vigenteExistente.id))
    }
  } else {
    // Para obsoleto: sigue bloqueando duplicados
    const obsoletoExistente = await repo.findObsoletoByCodigo(cod)
    if (obsoletoExistente) {
      throw new AppError(`Ya existe un documento obsoleto con código "${cod}". Eliminalo primero para agregar uno nuevo.`)
    }
  }

  const id = await repo.insert({
    codigo:                   cod,
    nombre:                   nombre.trim(),
    numero_revision:          Number(numero_revision),
    area_uso,
    estado,
    cantidad_copias_impresas: Number(cantidad_copias_impresas),
    formato_archivo,
    fecha_revision:           fecha_revision || null,
    dias_alerta:              dias_alerta ? Number(dias_alerta) : 30,
    destinatarios_email:      destinatarios_email?.trim() || null,
  })

  return { documento: formatear(await repo.findById(id)), autoObsoletado, eliminadoId }
}

// ─── Casos de uso: edición ───────────────────────────────────────────────────
const actualizarDocumento = async (id, body) => {
  const doc = await repo.findById(id)
  if (!doc) throw new AppError('Documento no encontrado', 404)

  const {
    codigo, nombre, numero_revision, area_uso, estado,
    cantidad_copias_impresas, formato_archivo,
    fecha_revision, dias_alerta, destinatarios_email,
  } = body

  const nuevoCodigo = (codigo ?? doc.codigo).trim()
  const nuevoEstado = estado ?? doc.estado

  let autoObsoletado = null
  let eliminadoId    = null

  // Si pasa a vigente, auto-obsoleta cualquier otro vigente con el mismo código
  if (nuevoEstado === 'vigente' && (nuevoCodigo !== doc.codigo || doc.estado !== 'vigente')) {
    const vigenteExistente = await repo.findVigenteByCodigo(nuevoCodigo, id)
    if (vigenteExistente) {
      const obsoletoExistente = await repo.findObsoletoByCodigo(nuevoCodigo, id)
      if (obsoletoExistente) {
        eliminadoId = obsoletoExistente.id
        await repo.remove(eliminadoId)
      }
      await repo.markObsoleto(vigenteExistente.id)
      autoObsoletado = formatear(await repo.findById(vigenteExistente.id))
    }
  } else if (nuevoEstado !== 'vigente') {
    // Para obsoleto: bloquear si ya existe otro obsoleto con mismo código
    const obsExistente = await repo.findObsoletoByCodigo(nuevoCodigo, id)
    if (obsExistente) {
      throw new AppError(`Ya existe un documento obsoleto con código "${nuevoCodigo}".`)
    }
  }

  const nuevaFecha  = fecha_revision !== undefined ? (fecha_revision || null) : doc.fecha_revision
  const fechaCambio = nuevaFecha !== (doc.fecha_revision
                        ? new Date(doc.fecha_revision).toISOString().slice(0, 10)
                        : null)
  // Si la fecha de revisión cambió, se resetea la marca de notificación enviada
  const resetNotificacion = fechaCambio ? 0 : doc.notificacion_enviada ?? 0

  await repo.update(id, {
    codigo:                   nuevoCodigo,
    nombre:                   (nombre ?? doc.nombre).trim(),
    numero_revision:          numero_revision !== undefined ? Number(numero_revision) : doc.numero_revision,
    area_uso:                 area_uso ?? doc.area_uso,
    estado:                   nuevoEstado,
    cantidad_copias_impresas: cantidad_copias_impresas !== undefined ? Number(cantidad_copias_impresas) : doc.cantidad_copias_impresas,
    formato_archivo:          formato_archivo ?? doc.formato_archivo,
    fecha_revision:           nuevaFecha,
    dias_alerta:              dias_alerta !== undefined ? Number(dias_alerta) : doc.dias_alerta,
    destinatarios_email:      destinatarios_email !== undefined ? (destinatarios_email?.trim() || null) : doc.destinatarios_email,
    notificacion_enviada:     resetNotificacion,
  })

  return { documento: formatear(await repo.findById(id)), autoObsoletado, eliminadoId }
}

const eliminarDocumento = async (id) => {
  const doc = await repo.findById(id)
  if (!doc) throw new AppError('Documento no encontrado', 404)
  await destruirPorUrl(doc.archivo_path)
  await repo.remove(id)
}

// ─── Casos de uso: archivo adjunto ───────────────────────────────────────────
const subirArchivo = async (id, file) => {
  let urlSubida = null
  try {
    if (!file) throw new AppError('No se recibió ningún archivo')
    const doc = await repo.findById(id)
    if (!doc) throw new AppError('Documento no encontrado', 404)

    urlSubida = await subir(file.buffer, 'documentos')
    await destruirPorUrl(doc.archivo_path) // reemplaza el anterior si había
    await repo.updateArchivo(id, {
      archivo_path:   urlSubida,
      archivo_nombre: file.originalname,
    })
    return formatear(await repo.findById(id))
  } catch (err) {
    if (urlSubida) await destruirPorUrl(urlSubida)
    throw err
  }
}

const eliminarArchivo = async (id) => {
  const doc = await repo.findById(id)
  if (!doc) throw new AppError('Documento no encontrado', 404)
  await destruirPorUrl(doc.archivo_path)
  await repo.updateArchivo(id, { archivo_path: null, archivo_nombre: null })
  return formatear(await repo.findById(id))
}

// ─── Notificaciones de revisión ──────────────────────────────────────────────
// forzar=true  → envía aunque ya haya sido notificado (botón manual)
// forzar=false → solo una vez por ciclo de revisión (cron automático)
const procesarNotificaciones = async (forzar = false) => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new AppError('Servidor de correo no configurado. Completá EMAIL_HOST, EMAIL_USER y EMAIL_PASS en el .env.', 503)
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const rows = await repo.findDocumentosPorRevisar(forzar)
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
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
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

    await repo.marcarNotificado(doc.id)
    enviados++
  }

  return { enviados, mensaje: `Se enviaron ${enviados} notificación(es) por email.` }
}

module.exports = {
  listarDocumentos,
  obtenerDocumento,
  crearDocumento,
  actualizarDocumento,
  eliminarDocumento,
  subirArchivo,
  eliminarArchivo,
  procesarNotificaciones,
}
