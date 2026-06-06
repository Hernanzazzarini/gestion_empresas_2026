const BASE_URL = 'http://localhost:3000/api/contenedores'

export const fetchContenedores = async () => {
  const res = await fetch(BASE_URL)
  if (!res.ok) throw new Error('Error al obtener contenedores')
  return res.json()
}

export const fetchContenedor = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}`)
  if (!res.ok) throw new Error('Error al obtener contenedor')
  return res.json()
}

export const crearContenedor = async (data) => {
  const res = await fetch(BASE_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al crear contenedor')
  return res.json()
}

export const actualizarSeccion1 = async (id, data) => {
  const res = await fetch(`${BASE_URL}/${id}/sec1`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al actualizar sección 1')
  return res.json()
}

export const completarSeccion2 = async (id, data) => {
  const res = await fetch(`${BASE_URL}/${id}/sec2`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al completar sección 2')
  return res.json()
}