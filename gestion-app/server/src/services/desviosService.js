const nodemailer = require('nodemailer')
const repo         = require('../repositories/desviosRepository')
const { AppError } = require('../middleware/errorHandler')
const { subir, destruirPorUrl } = require('../cloudinary')

const ORIGENES = {
  I:       'Inspecciones',
  AI:      'Auditorías internas',
  OD:      'Operaciones diarias',
  AE:      'Auditoría externa',
  PostPCC: 'Post PCC',
}

const AREAS     = ['Calidad', 'Logistica', 'Mantenimiento', 'Inocuidad', 'Produccion']
const GRAVEDADES = ['Menor', 'Mayor', 'Critico']
const ESTADOS    = ['Abierto', 'En tratamiento', 'Cerrado']
const METODOS    = ['5porques', 'espina']

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

  let evidencias = []
  if (row.evidencias) {
    try {
      const parsed = typeof row.evidencias === 'string'
        ? JSON.parse(row.evidencias)
        : row.evidencias
      evidencias = Array.isArray(parsed) ? parsed.filter(Boolean) : []
    } catch { evidencias = [] }
  }

  return {
    id:                    row.id,
    nroDesvio:             row.nro_desvio,
    fecha:                 row.fecha ? new Date(row.fecha).toISOString().slice(0, 10) : null,
    anio:                  row.anio,
    origen:                row.origen,
    origenLabel:           ORIGENES[row.origen] ?? row.origen,
    area:                  row.area,
    descripcion:           row.descripcion,
    accionCorrectiva:      row.accion_correctiva,
    responsableCorrectiva: row.responsable_correctiva,
    metodoCausaRaiz:       row.metodo_causa_raiz,
    causaRaizData:         causaRaizData,
    accionPreventiva:      row.accion_preventiva || '',
    gravedad:              row.gravedad,
    responsableVerificar:  row.responsable_verificar,
    estado:                row.estado,
    fechaEstado:           row.fecha_estado ? new Date(row.fecha_estado).toISOString().slice(0, 10) : null,
    fechaLimiteRespuesta:  row.fecha_limite_respuesta
                             ? new Date(row.fecha_limite_respuesta).toISOString().slice(0, 10)
                             : null,
    diasAlertaLimite:      row.dias_alerta_limite ?? 7,
    destinatarios:         row.destinatarios || '',
    notificacionEnviada:   !!row.notificacion_enviada,
    notificacionLimiteEnviada: !!row.notificacion_limite_enviada,
    evidencias,
    evidenciasAntes:       row.evidencias_antes   ?? 0,
    evidenciasDespues:     row.evidencias_despues ?? 0,
    creadoEn:              row.creado_en,
    actualizadoEn:         row.actualizado_en,
  }
}

const DIAS_ALERTA_LIMITE_DEFAULT = 7

// Días que faltan hasta una fecha YYYY-MM-DD (negativo = ya vencida).
const diasHasta = (fecha) => {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.ceil((new Date(fecha) - hoy) / (1000 * 60 * 60 * 24))
}

// Normaliza y valida los campos de la fecha límite de respuesta (ambos opcionales).
const normalizarLimite = ({ fecha_limite_respuesta, dias_alerta_limite }, fechaDesvio) => {
  if (!fecha_limite_respuesta) {
    return { fecha_limite_respuesta: null, dias_alerta_limite: DIAS_ALERTA_LIMITE_DEFAULT }
  }
  if (Number.isNaN(new Date(fecha_limite_respuesta).getTime())) {
    throw new AppError('La fecha límite de respuesta no es válida')
  }
  if (fechaDesvio && fecha_limite_respuesta < fechaDesvio) {
    throw new AppError('La fecha límite de respuesta no puede ser anterior a la fecha del desvío')
  }
  const dias = dias_alerta_limite === undefined || dias_alerta_limite === ''
    ? DIAS_ALERTA_LIMITE_DEFAULT
    : Number(dias_alerta_limite)
  if (!Number.isInteger(dias) || dias < 0) {
    throw new AppError('Los días de alerta deben ser un número entero mayor o igual a 0')
  }
  return { fecha_limite_respuesta, dias_alerta_limite: dias }
}

// ─── Generador de N° desvío ──────────────────────────────────────────────────
const generarNro = async () => {
  const total = await repo.countTotal()
  return `DEV-${String(total + 1).padStart(3, '0')}`
}

// ─── Consultas ───────────────────────────────────────────────────────────────
const listarDesvios = async (filtros = {}) => {
  const rows = await repo.findAll(filtros)
  return rows.map(formatear)
}

const obtenerDesvio = async (id) => {
  const row = await repo.findById(id)
  if (!row) throw new AppError('Desvío no encontrado', 404)
  return formatear(row)
}

// ─── Alta ────────────────────────────────────────────────────────────────────
const crearDesvio = async (body) => {
  const {
    fecha, origen, area, descripcion, accion_correctiva, responsable_correctiva,
    metodo_causa_raiz, causa_raiz_data, accion_preventiva,
    gravedad, responsable_verificar, estado, fecha_estado, destinatarios,
  } = body

  // `accion_preventiva` es opcional; el resto son obligatorios.
  if (!fecha || !origen || !area || !descripcion?.trim() ||
      !accion_correctiva?.trim() || !responsable_correctiva?.trim() ||
      !gravedad || !responsable_verificar?.trim() ||
      !estado || !fecha_estado) {
    throw new AppError('Todos los campos obligatorios deben completarse')
  }
  if (!ORIGENES[origen])       throw new AppError('Origen no válido')
  if (!AREAS.includes(area))   throw new AppError('Área no válida')
  if (!GRAVEDADES.includes(gravedad)) throw new AppError('Gravedad no válida')
  if (!ESTADOS.includes(estado))      throw new AppError('Estado no válido')
  if (metodo_causa_raiz && !METODOS.includes(metodo_causa_raiz)) {
    throw new AppError('Método de análisis de causa raíz no válido')
  }

  const anio      = new Date(fecha).getFullYear()
  const nroDesvio = await generarNro()
  const metodo    = metodo_causa_raiz || '5porques'
  const limite    = normalizarLimite(body, fecha)

  const id = await repo.insert({
    nro_desvio:            nroDesvio,
    fecha,
    anio,
    origen,
    area,
    descripcion:           descripcion.trim(),
    accion_correctiva:     accion_correctiva.trim(),
    responsable_correctiva: responsable_correctiva.trim(),
    metodo_causa_raiz:     metodo,
    causa_raiz_data:       causa_raiz_data ?? null,
    accion_preventiva:     accion_preventiva?.trim() || null,
    gravedad,
    responsable_verificar: responsable_verificar.trim(),
    estado,
    fecha_estado,
    fecha_limite_respuesta: limite.fecha_limite_respuesta,
    dias_alerta_limite:     limite.dias_alerta_limite,
    destinatarios:         destinatarios?.trim() || null,
  })

  const desvio = formatear(await repo.findById(id))

  // Notificación inmediata (no bloquea la creación si falla)
  if (desvio.destinatarios) {
    try {
      await enviarEmailDesvio(desvio)
      await repo.marcarNotificado(id)
      desvio.notificacionEnviada = true
    } catch (err) {
      console.error(`[DESVIOS] Error al enviar notificación de ${nroDesvio}: ${err.message}`)
    }
  }

  return desvio
}

// ─── Edición ─────────────────────────────────────────────────────────────────
const actualizarDesvio = async (id, body) => {
  const existente = await repo.findById(id)
  if (!existente) throw new AppError('Desvío no encontrado', 404)

  const {
    fecha, origen, area, descripcion, accion_correctiva, responsable_correctiva,
    metodo_causa_raiz, causa_raiz_data, accion_preventiva,
    gravedad, responsable_verificar, estado, fecha_estado, destinatarios,
  } = body

  // `accion_preventiva` es opcional; el resto son obligatorios.
  if (!fecha || !origen || !area || !descripcion?.trim() ||
      !accion_correctiva?.trim() || !responsable_correctiva?.trim() ||
      !gravedad || !responsable_verificar?.trim() ||
      !estado || !fecha_estado) {
    throw new AppError('Todos los campos obligatorios deben completarse')
  }
  if (!ORIGENES[origen])       throw new AppError('Origen no válido')
  if (!AREAS.includes(area))   throw new AppError('Área no válida')
  if (!GRAVEDADES.includes(gravedad)) throw new AppError('Gravedad no válida')
  if (!ESTADOS.includes(estado))      throw new AppError('Estado no válido')

  const anio   = new Date(fecha).getFullYear()
  const metodo = metodo_causa_raiz || '5porques'
  const limite = normalizarLimite(body, fecha)

  // Si cambia la fecha límite, se rehabilita la alerta para el nuevo plazo.
  const limiteAnterior = existente.fecha_limite_respuesta
    ? new Date(existente.fecha_limite_respuesta).toISOString().slice(0, 10)
    : null
  const notificacionLimite = limite.fecha_limite_respuesta === limiteAnterior
    ? (existente.notificacion_limite_enviada ? 1 : 0)
    : 0

  await repo.update(id, {
    fecha, anio, origen, area,
    descripcion:            descripcion.trim(),
    accion_correctiva:      accion_correctiva.trim(),
    responsable_correctiva: responsable_correctiva.trim(),
    metodo_causa_raiz:      metodo,
    causa_raiz_data:        causa_raiz_data ?? null,
    accion_preventiva:      accion_preventiva?.trim() || null,
    gravedad,
    responsable_verificar:  responsable_verificar.trim(),
    estado,
    fecha_estado,
    fecha_limite_respuesta: limite.fecha_limite_respuesta,
    dias_alerta_limite:     limite.dias_alerta_limite,
    destinatarios:          destinatarios?.trim() || null,
    notificacion_limite_enviada: notificacionLimite,
  })

  return formatear(await repo.findById(id))
}

// ─── Cambio de estado ────────────────────────────────────────────────────────
const cambiarEstado = async (id, estado, fecha_estado) => {
  if (!ESTADOS.includes(estado))  throw new AppError('Estado no válido')
  if (!fecha_estado)              throw new AppError('La fecha de estado es obligatoria')
  const existente = await repo.findById(id)
  if (!existente) throw new AppError('Desvío no encontrado', 404)
  await repo.updateEstado(id, estado, fecha_estado)
  return formatear(await repo.findById(id))
}

// ─── Evidencias ──────────────────────────────────────────────────────────────
const agregarEvidencia = async (id, file, tipo) => {
  if (!file)                          throw new AppError('No se recibió ningún archivo')
  if (!['antes', 'despues'].includes(tipo)) throw new AppError('Tipo de evidencia inválido (antes|despues)')
  const existente = await repo.findById(id)
  if (!existente) throw new AppError('Desvío no encontrado', 404)
  const url = await subir(file.buffer, 'desvios')
  await repo.insertEvidencia({
    desvio_id:      id,
    tipo,
    archivo_path:   url,
    nombre_original: file.originalname,
  })
  return formatear(await repo.findById(id))
}

const eliminarEvidencia = async (evidenciaId) => {
  const ev = await repo.findEvidencia(evidenciaId)
  if (!ev) throw new AppError('Evidencia no encontrada', 404)
  await destruirPorUrl(ev.archivo_path)
  await repo.deleteEvidencia(evidenciaId)
}

// ─── Eliminación ─────────────────────────────────────────────────────────────
const eliminarDesvio = async (id) => {
  const row = await repo.findById(id)
  if (!row) throw new AppError('Desvío no encontrado', 404)
  // Eliminar evidencias físicas
  const evidencias = row.evidencias
    ? (typeof row.evidencias === 'string' ? JSON.parse(row.evidencias) : row.evidencias)
    : []
  for (const ev of (evidencias ?? []).filter(Boolean)) {
    await destruirPorUrl(ev.archivo_path)
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

const enviarEmailDesvio = async (desvio) => {
  const transporter   = crearTransporter()
  const destinatarios = desvio.destinatarios.split(',').map(e => e.trim()).filter(Boolean)
  if (destinatarios.length === 0) return

  const color = gravedadColor[desvio.gravedad] || '#374151'
  const fecha = new Date(desvio.fecha).toLocaleDateString('es-AR')

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to:      destinatarios.join(', '),
    subject: `[GestiónPro] Nuevo desvío ${desvio.nroDesvio} — ${desvio.area} — Gravedad: ${desvio.gravedad}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#dc2626">⚠️ Desvío registrado</h2>
        <p>Se registró un nuevo desvío que requiere atención.</p>
        <table style="border-collapse:collapse;width:100%;font-size:14px">
          <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600;width:40%">N° Desvío</td><td style="padding:8px 12px">${desvio.nroDesvio}</td></tr>
          <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Fecha</td><td style="padding:8px 12px">${fecha}</td></tr>
          <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Área</td><td style="padding:8px 12px">${desvio.area}</td></tr>
          <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Origen</td><td style="padding:8px 12px">${desvio.origenLabel}</td></tr>
          <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Gravedad</td><td style="padding:8px 12px;color:${color};font-weight:700">${desvio.gravedad}</td></tr>
          <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Estado</td><td style="padding:8px 12px">${desvio.estado}</td></tr>
          <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Descripción</td><td style="padding:8px 12px">${desvio.descripcion}</td></tr>
          <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Acción Correctiva</td><td style="padding:8px 12px">${desvio.accionCorrectiva}</td></tr>
          <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Responsable</td><td style="padding:8px 12px">${desvio.responsableCorrectiva}</td></tr>
          <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Acción Preventiva</td><td style="padding:8px 12px">${desvio.accionPreventiva || '—'}</td></tr>
          <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Responsable Verificar</td><td style="padding:8px 12px">${desvio.responsableVerificar}</td></tr>
          ${desvio.fechaLimiteRespuesta ? `
          <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Fecha límite de respuesta</td><td style="padding:8px 12px;color:#dc2626;font-weight:700">${new Date(desvio.fechaLimiteRespuesta).toLocaleDateString('es-AR')}</td></tr>` : ''}
        </table>
        <p style="margin-top:20px;color:#6b7280;font-size:12px">— Sistema GestiónPro</p>
      </div>`,
  })
}

// forzar=false (cron): solo reintenta no enviados | forzar=true (manual): re-envía todos
const procesarNotificaciones = async (forzar = false) => {
  const rows = await repo.findPendientesNotificacion(forzar)
  if (rows.length === 0) {
    return { enviados: 0, mensaje: 'No hay desvíos pendientes de notificación.' }
  }

  const transporter = crearTransporter()
  let enviados = 0

  for (const row of rows) {
    const desvio       = formatear(row)
    const destinatarios = desvio.destinatarios.split(',').map(e => e.trim()).filter(Boolean)
    if (destinatarios.length === 0) continue

    const color = gravedadColor[desvio.gravedad] || '#374151'
    const fecha = desvio.fecha ? new Date(desvio.fecha).toLocaleDateString('es-AR') : '-'

    await transporter.sendMail({
      from:    process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to:      destinatarios.join(', '),
      subject: `[GestiónPro] Desvío ${desvio.nroDesvio} — ${desvio.area} — Gravedad: ${desvio.gravedad}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#dc2626">⚠️ Desvío registrado${forzar ? ' (reenvío)' : ''}</h2>
          <table style="border-collapse:collapse;width:100%;font-size:14px">
            <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600;width:40%">N° Desvío</td><td style="padding:8px 12px">${desvio.nroDesvio}</td></tr>
            <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Fecha</td><td style="padding:8px 12px">${fecha}</td></tr>
            <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Área</td><td style="padding:8px 12px">${desvio.area}</td></tr>
            <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Gravedad</td><td style="padding:8px 12px;color:${color};font-weight:700">${desvio.gravedad}</td></tr>
            <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Estado</td><td style="padding:8px 12px">${desvio.estado}</td></tr>
            <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Descripción</td><td style="padding:8px 12px">${desvio.descripcion}</td></tr>
          </table>
          <p style="margin-top:20px;color:#6b7280;font-size:12px">— Sistema GestiónPro</p>
        </div>`,
    })

    await repo.marcarNotificado(row.id)
    enviados++
  }

  return { enviados, mensaje: `Se enviaron ${enviados} notificación(es) de desvíos.` }
}

// ─── Notificaciones de fecha límite de respuesta ─────────────────────────────
// Avisa cuando el plazo de respuesta está por vencer (dentro de `dias_alerta_limite`)
// o ya venció. Excluye los desvíos cerrados. forzar=true re-envía aunque ya se
// haya notificado; forzar=false (cron) envía una sola vez por fecha límite.
const procesarNotificacionesLimite = async (forzar = false) => {
  const rows = await repo.findPendientesLimite(forzar)

  const enVentana = rows.filter(row =>
    diasHasta(row.fecha_limite_respuesta) <= (row.dias_alerta_limite ?? DIAS_ALERTA_LIMITE_DEFAULT)
  )

  if (enVentana.length === 0) {
    return { enviados: 0, mensaje: 'No hay desvíos con fecha límite de respuesta próxima a vencer.' }
  }

  const transporter = crearTransporter()
  let enviados = 0

  for (const row of enVentana) {
    const desvio        = formatear(row)
    const destinatarios = desvio.destinatarios.split(',').map(e => e.trim()).filter(Boolean)
    if (destinatarios.length === 0) continue

    const dias     = diasHasta(desvio.fechaLimiteRespuesta)
    const vencido  = dias < 0
    const fechaStr = new Date(desvio.fechaLimiteRespuesta).toLocaleDateString('es-AR')
    const color    = vencido ? '#dc2626' : '#d97706'
    const titulo   = vencido
      ? `⛔ Plazo de respuesta VENCIDO — ${desvio.nroDesvio}`
      : `⏰ Plazo de respuesta por vencer — ${desvio.nroDesvio}`
    const detalle  = vencido
      ? `El plazo venció hace <strong>${Math.abs(dias)} día(s)</strong> (${fechaStr}).`
      : dias === 0
        ? `El plazo vence <strong>hoy</strong> (${fechaStr}).`
        : `Vence en <strong>${dias} día(s)</strong> — fecha límite: <strong>${fechaStr}</strong>.`

    await transporter.sendMail({
      from:    process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to:      destinatarios.join(', '),
      subject: `[GestiónPro] ${vencido ? 'Plazo VENCIDO' : 'Plazo por vencer'}: desvío ${desvio.nroDesvio} — ${desvio.area}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:${color}">${titulo}</h2>
          <p>${detalle}</p>
          <table style="border-collapse:collapse;width:100%;font-size:14px">
            <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600;width:40%">N° Desvío</td><td style="padding:8px 12px">${desvio.nroDesvio}</td></tr>
            <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Área</td><td style="padding:8px 12px">${desvio.area}</td></tr>
            <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Gravedad</td><td style="padding:8px 12px;color:${gravedadColor[desvio.gravedad] || '#374151'};font-weight:700">${desvio.gravedad}</td></tr>
            <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Estado</td><td style="padding:8px 12px">${desvio.estado}</td></tr>
            <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Descripción</td><td style="padding:8px 12px">${desvio.descripcion}</td></tr>
            <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Responsable</td><td style="padding:8px 12px">${desvio.responsableCorrectiva}</td></tr>
            <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Fecha límite</td><td style="padding:8px 12px;color:${color};font-weight:700">${fechaStr}</td></tr>
          </table>
          <p style="margin-top:20px;color:#6b7280;font-size:12px">— Sistema GestiónPro</p>
        </div>`,
    })

    await repo.marcarNotificadoLimite(row.id)
    enviados++
  }

  return { enviados, mensaje: `Se enviaron ${enviados} aviso(s) de fecha límite de desvíos.` }
}

module.exports = {
  listarDesvios,
  obtenerDesvio,
  crearDesvio,
  actualizarDesvio,
  cambiarEstado,
  agregarEvidencia,
  eliminarEvidencia,
  eliminarDesvio,
  procesarNotificaciones,
  procesarNotificacionesLimite,
}
