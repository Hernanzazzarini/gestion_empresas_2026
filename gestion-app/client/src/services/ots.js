import { API_URL } from './config'

const BASE_URL = `${API_URL}/ots`

// Traer todas las OTs
export const fetchOTs = async () => {
  const res = await fetch(BASE_URL)
  if (!res.ok) throw new Error('Error al obtener las OTs')
  return res.json()
}

// Crear una OT
export const crearOT = async (form) => {
  const res = await fetch(BASE_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(form),
  })
  if (!res.ok) throw new Error('Error al crear la OT')
  return res.json()
}

// Actualizar una OT (mantenimiento / inocuidad / conformidad)
export const actualizarOT = async (id, data) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al actualizar la OT')
  return res.json()
}