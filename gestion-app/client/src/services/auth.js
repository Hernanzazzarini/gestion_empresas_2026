import { setToken, clearToken } from './http'

const BASE_URL = 'http://localhost:3000/api/auth'

const handleRes = async (res) => {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Error del servidor')
  return data
}

// ─── Sesión ───────────────────────────────────────────────────────────────────
export const login = async (usuario, password) => {
  const data = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, password }),
  }).then(handleRes)
  setToken(data.token)
  return data // { token, usuario, permisos }
}

export const logout = async () => {
  try { await fetch(`${BASE_URL}/logout`, { method: 'POST' }) } catch { /* noop */ }
  clearToken()
}

export const me = () => fetch(`${BASE_URL}/me`).then(handleRes) // { usuario, permisos }

// ─── Usuarios (sólo admin) ──────────────────────────────────────────────────────
export const listarUsuarios = () => fetch(`${BASE_URL}/usuarios`).then(handleRes)

export const crearUsuario = (data) =>
  fetch(`${BASE_URL}/usuarios`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(handleRes)

export const actualizarUsuario = (id, data) =>
  fetch(`${BASE_URL}/usuarios/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(handleRes)

export const cambiarPassword = (id, password) =>
  fetch(`${BASE_URL}/usuarios/${id}/password`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }),
  }).then(handleRes)

export const eliminarUsuario = (id) =>
  fetch(`${BASE_URL}/usuarios/${id}`, { method: 'DELETE' }).then(handleRes)

export const actualizarPermisos = (id, permisos) =>
  fetch(`${BASE_URL}/usuarios/${id}/permisos`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ permisos }),
  }).then(handleRes)