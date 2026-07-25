import { API_URL } from './config'

const BASE_URL = `${API_URL}/documentos`

export const fetchDocumentos = async () => {
  const res = await fetch(BASE_URL)
  if (!res.ok) throw new Error('Error al obtener documentos')
  return res.json()
}

// Retorna { documento, autoObsoletado, eliminadoId }
export const crearDocumento = async (data) => {
  const res = await fetch(BASE_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Error al crear documento')
  }
  return res.json()
}

// Retorna { documento, autoObsoletado, eliminadoId }
export const actualizarDocumento = async (id, data) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Error al actualizar documento')
  }
  return res.json()
}

export const eliminarDocumento = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Error al eliminar documento')
  return res.json()
}

export const subirArchivo = async (id, file) => {
  const formData = new FormData()
  formData.append('archivo', file)
  const res = await fetch(`${BASE_URL}/${id}/archivo`, {
    method: 'POST',
    body:   formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Error al subir archivo')
  }
  return res.json()
}

export const eliminarArchivo = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}/archivo`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Error al eliminar archivo')
  return res.json()
}

export const enviarNotificaciones = async () => {
  const res = await fetch(`${BASE_URL}/notificar/email`, { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Error al enviar notificaciones')
  }
  return res.json()
}
