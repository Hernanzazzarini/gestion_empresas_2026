import { API_URL } from './config'

const BASE_URL = `${API_URL}/stock`

export const fetchLotes = async () => {
  const res = await fetch(BASE_URL)
  if (!res.ok) throw new Error('Error al obtener lotes')
  return res.json()
}

export const crearLote = async (data) => {
  const res = await fetch(BASE_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Error al crear lote')
  }
  return res.json()
}

export const reducirEnvases = async (id, cantidad) => {
  const res = await fetch(`${BASE_URL}/${id}/reducir`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ cantidad }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Error al reducir envases')
  }
  return res.json()
}

export const darDeBajaLote = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Error al dar de baja el lote')
  return res.json()
}
