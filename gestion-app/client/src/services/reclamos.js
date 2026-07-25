import { API_URL } from './config'

const BASE_URL = `${API_URL}/reclamos`

const handleRes = async (res) => {
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error del servidor')
  return data
}

export const listarReclamos = (filtros = {}) => {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filtros).filter(([, v]) => v))
  ).toString()
  return fetch(`${BASE_URL}${params ? '?' + params : ''}`).then(handleRes)
}

export const obtenerReclamo = (id) =>
  fetch(`${BASE_URL}/${id}`).then(handleRes)

export const crearReclamo = (data) =>
  fetch(BASE_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  }).then(handleRes)

export const actualizarReclamo = (id, data) =>
  fetch(`${BASE_URL}/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  }).then(handleRes)

export const cambiarEstado = (id, estado, fecha_cierre) =>
  fetch(`${BASE_URL}/${id}/estado`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ estado, fecha_cierre }),
  }).then(handleRes)

export const agregarAdjunto = (id, archivo, tipo) => {
  const form = new FormData()
  form.append('archivo', archivo)
  form.append('tipo', tipo)
  return fetch(`${BASE_URL}/${id}/adjuntos`, { method: 'POST', body: form }).then(handleRes)
}

export const eliminarAdjunto = (reclamoId, adjuntoId) =>
  fetch(`${BASE_URL}/${reclamoId}/adjuntos/${adjuntoId}`, { method: 'DELETE' }).then(handleRes)

export const eliminarReclamo = (id) =>
  fetch(`${BASE_URL}/${id}`, { method: 'DELETE' }).then(handleRes)

export const notificarManual = () =>
  fetch(`${BASE_URL}/notificar/email`, { method: 'POST' }).then(handleRes)
