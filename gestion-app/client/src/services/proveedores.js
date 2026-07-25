import { API_URL } from './config'

const BASE_URL = `${API_URL}/proveedores`

const parseError = async (res, fallback) => {
  const err = await res.json().catch(() => ({}))
  throw new Error(err.error || fallback)
}

// ─── Proveedores ─────────────────────────────────────────────────────────────
export const fetchProveedores = async () => {
  const res = await fetch(BASE_URL)
  if (!res.ok) throw new Error('Error al obtener proveedores')
  return res.json()
}

export const crearProveedor = async (data) => {
  const res = await fetch(BASE_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  })
  if (!res.ok) await parseError(res, 'Error al crear proveedor')
  return res.json()
}

export const actualizarProveedor = async (id, data) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  })
  if (!res.ok) await parseError(res, 'Error al actualizar proveedor')
  return res.json()
}

export const eliminarProveedor = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' })
  if (!res.ok) await parseError(res, 'Error al eliminar proveedor')
  return res.json()
}

// ─── Documentos (multipart) ──────────────────────────────────────────────────
// data = { nombre, archivo (File), fecha_vencimiento, observaciones,
//          dias_alerta, area_responsable, nombre_responsable, destinatarios_email }
const buildFormData = (data) => {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    fd.append(k, v)
  })
  return fd
}

export const crearDocumento = async (proveedorId, data) => {
  const res = await fetch(`${BASE_URL}/${proveedorId}/documentos`, {
    method: 'POST',
    body:   buildFormData(data),
  })
  if (!res.ok) await parseError(res, 'Error al subir documento')
  return res.json()
}

export const actualizarDocumento = async (docId, data) => {
  const res = await fetch(`${BASE_URL}/documentos/${docId}`, {
    method: 'PATCH',
    body:   buildFormData(data),
  })
  if (!res.ok) await parseError(res, 'Error al actualizar documento')
  return res.json()
}

export const eliminarDocumento = async (docId) => {
  const res = await fetch(`${BASE_URL}/documentos/${docId}`, { method: 'DELETE' })
  if (!res.ok) await parseError(res, 'Error al eliminar documento')
  return res.json()
}

export const enviarNotificaciones = async () => {
  const res = await fetch(`${BASE_URL}/notificar/email`, { method: 'POST' })
  if (!res.ok) await parseError(res, 'Error al enviar notificaciones')
  return res.json()
}