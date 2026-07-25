// ─────────────────────────────────────────────────────────────────────────────
// Capa de negocio (service) — Proveedores
//
// Concentra: validación, normalización, mapeo snake_case→camelCase, manejo de
// archivos físicos y notificaciones por email. No conoce SQL (usa el repository)
// ni HTTP (lanza AppError; el controller traduce a respuesta).
// ─────────────────────────────────────────────────────────────────────────────
const nodemailer = require('nodemailer')
const repo             = require('../repositories/proveedoresRepository')
const { AppError }     = require('../middleware/errorHandler')
const { subir, destruirPorUrl } = require('../cloudinary')

const TIPOS_PROVEEDOR   = ['insumos_mp', 'servicios']
const AREAS_RESPONSABLE = ['inocuidad', 'logistica', 'produccion']
const EMAIL_RE          = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ─── Mappers snake_case → camelCase ──────────────────────────────────────────
const formatearDocumento = (row) => ({
  id:                  row.id,
  proveedorId:         row.proveedor_id,
  nombre:              row.nombre,
  archivoPath:         row.archivo_path   ?? null,
  archivoNombre:       row.archivo_nombre ?? null,
  fechaVencimiento:    row.fecha_vencimiento
                         ? new Date(row.fecha_vencimiento).toISOString().slice(0, 10)
                         : null,
  observaciones:       row.observaciones ?? null,
  diasAlerta:          row.dias_alerta ?? 30,
  areaResponsable:     row.area_responsable   ?? null,
  nombreResponsable:   row.nombre_responsable ?? null,
  destinatariosEmail:  row.destinatarios_email
                         ? row.destinatarios_email.split(',').map(e => e.trim()).filter(Boolean)
                         : [],
  notificacionEnviada: !!row.notificacion_enviada,
  creadoEn:            row.created_at,
})

const formatearProveedor = (row, documentos = []) => ({
  id:                 row.id,
  nombre:             row.nombre,
  tipoProveedor:      row.tipo_proveedor,
  tipoInsumoServicio: row.tipo_insumo_servicio,
  ciudad:             row.ciudad,
  provincia:          row.provincia ?? null,
  personaContacto:    row.persona_contacto,
  telefono:           row.telefono ?? null,
  email:              row.email,
  observaciones:      row.observaciones ?? null,
  creadoEn:           row.created_at,
  documentos:         documentos.map(formatearDocumento),
})

// ─── Validación / normalización ──────────────────────────────────────────────
const validarProveedor = (body) => {
  const { nombre, tipo_proveedor, tipo_insumo_servicio, ciudad, persona_contacto, email } = body

  if (!nombre?.trim())               throw new AppError('El nombre del proveedor es obligatorio.')
  if (!TIPOS_PROVEEDOR.includes(tipo_proveedor))
    throw new AppError('El tipo de proveedor debe ser "insumos_mp" o "servicios".')
  if (!tipo_insumo_servicio?.trim()) throw new AppError('El tipo de insumo o servicio es obligatorio.')
  if (!ciudad?.trim())               throw new AppError('La ciudad/localidad es obligatoria.')
  if (!persona_contacto?.trim())     throw new AppError('La persona de contacto es obligatoria.')
  if (!email?.trim())                throw new AppError('El email es obligatorio.')
  if (!EMAIL_RE.test(email.trim()))  throw new AppError('El formato del email no es válido.')
}

const normalizarProveedor = (body) => ({
  nombre:               body.nombre.trim(),
  tipo_proveedor:       body.tipo_proveedor,
  tipo_insumo_servicio: body.tipo_insumo_servicio.trim(),
  ciudad:               body.ciudad.trim(),
  provincia:            body.provincia?.trim() || null,
  persona_contacto:     body.persona_contacto.trim(),
  telefono:             body.telefono?.trim() || null,
  email:                body.email.trim(),
  observaciones:        body.observaciones?.trim() || null,
})

// Los campos de alerta solo aplican si hay fecha_vencimiento
const validarAlerta = (body) => {
  const { fecha_vencimiento, area_responsable, destinatarios_email } = body
  if (!fecha_vencimiento) return // sin vencimiento → sin alerta, campos ignorados

  if (area_responsable && !AREAS_RESPONSABLE.includes(area_responsable))
    throw new AppError('El área responsable no es válida.')

  const emails = (destinatarios_email ?? '').split(',').map(e => e.trim()).filter(Boolean)
  for (const e of emails) {
    if (!EMAIL_RE.test(e)) throw new AppError(`El email de alerta "${e}" no tiene un formato válido.`)
  }
}

const camposAlerta = (body) => {
  const { fecha_vencimiento, dias_alerta, area_responsable, nombre_responsable, destinatarios_email } = body
  if (!fecha_vencimiento) {
    return { fecha_vencimiento: null, dias_alerta: 30, area_responsable: null, nombre_responsable: null, destinatarios_email: null }
  }
  return {
    fecha_vencimiento,
    dias_alerta:         dias_alerta ? Number(dias_alerta) : 30,
    area_responsable:    area_responsable || null,
    nombre_responsable:  nombre_responsable?.trim() || null,
    destinatarios_email: destinatarios_email?.trim() || null,
  }
}

// Adjunta los documentos a una lista de proveedores en una sola consulta
const adjuntarDocumentos = async (proveedores) => {
  if (proveedores.length === 0) return []
  const docs = await repo.findDocumentosByProveedorIds(proveedores.map(p => p.id))
  const porProveedor = docs.reduce((acc, d) => {
    (acc[d.proveedor_id] ??= []).push(d)
    return acc
  }, {})
  return proveedores.map(p => formatearProveedor(p, porProveedor[p.id] ?? []))
}

// ─── Casos de uso: Proveedores ───────────────────────────────────────────────
const listarProveedores = async () => {
  const rows = await repo.findAll()
  return adjuntarDocumentos(rows)
}

const obtenerProveedor = async (id) => {
  const row = await repo.findById(id)
  if (!row) throw new AppError('Proveedor no encontrado', 404)
  const [conDocs] = await adjuntarDocumentos([row])
  return conDocs
}

const crearProveedor = async (body) => {
  validarProveedor(body)
  const id  = await repo.insert(normalizarProveedor(body))
  const row = await repo.findById(id)
  return formatearProveedor(row, [])
}

const actualizarProveedor = async (id, body) => {
  const current = await repo.findById(id)
  if (!current) throw new AppError('Proveedor no encontrado', 404)
  validarProveedor(body)
  await repo.update(id, normalizarProveedor(body))
  const row = await repo.findById(id)
  const [conDocs] = await adjuntarDocumentos([row])
  return conDocs
}

const eliminarProveedor = async (id) => {
  const prov = await repo.findById(id)
  if (!prov) throw new AppError('Proveedor no encontrado', 404)
  // Borrar archivos de Cloudinary antes de que el CASCADE elimine las filas
  const docs = await repo.findDocumentoPaths(id)
  for (const d of docs) await destruirPorUrl(d.archivo_path)
  await repo.remove(id)
}

// ─── Casos de uso: Documentos ────────────────────────────────────────────────
// Ante cualquier error posterior a la subida, se borra de Cloudinary para no dejar huérfanos.
const crearDocumento = async (proveedorId, body, file) => {
  let urlSubida = null
  try {
    const prov = await repo.findById(proveedorId)
    if (!prov)                 throw new AppError('Proveedor no encontrado', 404)
    if (!body.nombre?.trim())  throw new AppError('El nombre del documento es obligatorio.')
    if (!file)                 throw new AppError('El archivo adjunto es obligatorio (PDF, JPG o PNG).')
    validarAlerta(body)

    urlSubida = await subir(file.buffer, 'proveedores')
    const a  = camposAlerta(body)
    const id = await repo.insertDocumento({
      proveedor_id:        proveedorId,
      nombre:              body.nombre.trim(),
      archivo_path:        urlSubida,
      archivo_nombre:      file.originalname,
      fecha_vencimiento:   a.fecha_vencimiento,
      observaciones:       body.observaciones?.trim() || null,
      dias_alerta:         a.dias_alerta,
      area_responsable:    a.area_responsable,
      nombre_responsable:  a.nombre_responsable,
      destinatarios_email: a.destinatarios_email,
    })

    const row = await repo.findDocumentoById(id)
    return formatearDocumento(row)
  } catch (err) {
    if (urlSubida) await destruirPorUrl(urlSubida)
    throw err
  }
}

// multipart: metadatos + `archivo` opcional (si viene, reemplaza el existente)
const actualizarDocumento = async (docId, body, file) => {
  let urlSubida = null
  try {
    const doc = await repo.findDocumentoById(docId)
    if (!doc) throw new AppError('Documento no encontrado', 404)

    if (body.nombre !== undefined && !body.nombre.trim())
      throw new AppError('El nombre del documento no puede quedar vacío.')
    validarAlerta(body)

    // Reemplazo de archivo (opcional): subimos el nuevo y borramos el anterior de Cloudinary
    let archivoPath   = doc.archivo_path
    let archivoNombre = doc.archivo_nombre
    if (file) {
      urlSubida     = await subir(file.buffer, 'proveedores')
      await destruirPorUrl(doc.archivo_path)
      archivoPath   = urlSubida
      archivoNombre = file.originalname
    }

    const a = camposAlerta(body)

    // Si cambió la fecha de vencimiento, se reinicia la marca de notificación
    const fechaAnterior = doc.fecha_vencimiento
      ? new Date(doc.fecha_vencimiento).toISOString().slice(0, 10)
      : null
    const resetNotif = a.fecha_vencimiento !== fechaAnterior ? 0 : (doc.notificacion_enviada ?? 0)

    await repo.updateDocumento(docId, {
      nombre:              body.nombre !== undefined ? body.nombre.trim() : doc.nombre,
      archivo_path:        archivoPath,
      archivo_nombre:      archivoNombre,
      fecha_vencimiento:   a.fecha_vencimiento,
      observaciones:       body.observaciones !== undefined ? (body.observaciones?.trim() || null) : doc.observaciones,
      dias_alerta:         a.dias_alerta,
      area_responsable:    a.area_responsable,
      nombre_responsable:  a.nombre_responsable,
      destinatarios_email: a.destinatarios_email,
      notificacion_enviada: resetNotif,
    })

    const row = await repo.findDocumentoById(docId)
    return formatearDocumento(row)
  } catch (err) {
    if (urlSubida) await destruirPorUrl(urlSubida)
    throw err
  }
}

const eliminarDocumento = async (docId) => {
  const doc = await repo.findDocumentoById(docId)
  if (!doc) throw new AppError('Documento no encontrado', 404)
  await destruirPorUrl(doc.archivo_path)
  await repo.removeDocumento(docId)
}

// ─── Notificaciones de vencimiento ───────────────────────────────────────────
// forzar=true  → envía aunque ya se haya notificado (botón manual)
// forzar=false → solo una vez por vencimiento (cron automático)
const procesarNotificaciones = async (forzar = false) => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new AppError('Servidor de correo no configurado. Completá EMAIL_HOST, EMAIL_USER y EMAIL_PASS en el .env.', 503)
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const rows = await repo.findDocumentosPorVencer(forzar)
  const proximos = rows.filter(doc => {
    const dias = Math.ceil((new Date(doc.fecha_vencimiento) - hoy) / (1000 * 60 * 60 * 24))
    return dias >= 0 && dias <= (doc.dias_alerta ?? 30)
  })

  if (proximos.length === 0) {
    return { enviados: 0, mensaje: 'No hay documentos de proveedores próximos a vencer con destinatarios configurados.' }
  }

  const transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  })

  const AREA_LABEL = { inocuidad: 'Inocuidad', logistica: 'Logística', produccion: 'Producción' }
  let enviados = 0

  for (const doc of proximos) {
    const destinatarios = doc.destinatarios_email.split(',').map(e => e.trim()).filter(Boolean)
    if (destinatarios.length === 0) continue

    const fechaVenc = new Date(doc.fecha_vencimiento)
    const dias      = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24))
    const fechaStr  = fechaVenc.toLocaleDateString('es-AR')

    await transporter.sendMail({
      from:    process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to:      destinatarios.join(', '),
      subject: `[GestiónPro] Documento por vencer: ${doc.nombre} — ${doc.proveedor_nombre}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#dc2626">⚠️ Documento de proveedor próximo a vencer</h2>
          <p>Vence en <strong>${dias} día(s)</strong> — fecha límite: <strong>${fechaStr}</strong></p>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:6px 12px;background:#f8f8f8;font-weight:600">Proveedor</td><td style="padding:6px 12px">${doc.proveedor_nombre}</td></tr>
            <tr><td style="padding:6px 12px;background:#f8f8f8;font-weight:600">Documento</td><td style="padding:6px 12px">${doc.nombre}</td></tr>
            <tr><td style="padding:6px 12px;background:#f8f8f8;font-weight:600">Área responsable</td><td style="padding:6px 12px">${AREA_LABEL[doc.area_responsable] ?? '—'}</td></tr>
            <tr><td style="padding:6px 12px;background:#f8f8f8;font-weight:600">Responsable</td><td style="padding:6px 12px">${doc.nombre_responsable ?? '—'}</td></tr>
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
  listarProveedores,
  obtenerProveedor,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
  crearDocumento,
  actualizarDocumento,
  eliminarDocumento,
  procesarNotificaciones,
}
