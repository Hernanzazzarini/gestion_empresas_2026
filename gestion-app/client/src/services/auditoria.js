const BASE_URL = 'http://localhost:3000/api/auditoria'

const handleRes = async (res) => {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Error del servidor')
  return data
}

export const listarAuditoria = (filtros = {}) => {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filtros).filter(([, v]) => v))
  ).toString()
  return fetch(`${BASE_URL}${params ? '?' + params : ''}`).then(handleRes)
}

export const opcionesAuditoria = () => fetch(`${BASE_URL}/opciones`).then(handleRes)