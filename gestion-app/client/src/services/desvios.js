import { API_URL } from './config'

const BASE_URL = `${API_URL}/desvios`

const handleRes = async (res) => {
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error del servidor')
  return data
}

export const listarDesvios = (filtros = {}) => {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filtros).filter(([, v]) => v))
  ).toString()
  return fetch(`${BASE_URL}${params ? '?' + params : ''}`).then(handleRes)
}

export const obtenerDesvio = (id) =>
  fetch(`${BASE_URL}/${id}`).then(handleRes)

export const crearDesvio = (data) =>
  fetch(BASE_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  }).then(handleRes)

export const actualizarDesvio = (id, data) =>
  fetch(`${BASE_URL}/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  }).then(handleRes)

export const cambiarEstado = (id, estado, fecha_estado) =>
  fetch(`${BASE_URL}/${id}/estado`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ estado, fecha_estado }),
  }).then(handleRes)

export const agregarEvidencia = (id, archivo, tipo) => {
  const form = new FormData()
  form.append('archivo', archivo)
  form.append('tipo', tipo)
  return fetch(`${BASE_URL}/${id}/evidencias`, { method: 'POST', body: form }).then(handleRes)
}

export const eliminarEvidencia = (desvioId, evidenciaId) =>
  fetch(`${BASE_URL}/${desvioId}/evidencias/${evidenciaId}`, { method: 'DELETE' }).then(handleRes)

export const eliminarDesvio = (id) =>
  fetch(`${BASE_URL}/${id}`, { method: 'DELETE' }).then(handleRes)

export const notificarManual = () =>
  fetch(`${BASE_URL}/notificar/email`, { method: 'POST' }).then(handleRes)

// Avisos de fecha límite de respuesta (próxima a vencer o vencida)
export const notificarLimite = () =>
  fetch(`${BASE_URL}/notificar/limite`, { method: 'POST' }).then(handleRes)
