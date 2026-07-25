// Interceptor global de fetch: agrega el Bearer token a las llamadas a la API
// y avisa (evento 'auth:401') cuando el servidor rechaza por sesión inválida.
// Se instala una sola vez; los servicios existentes siguen usando fetch normal.

const TOKEN_KEY = 'gp_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

let instalado = false

export function instalarInterceptor() {
  if (instalado) return
  instalado = true
  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || ''
    // Detecta llamadas a la API tanto con URL absoluta (dev: http://localhost:3000/api/…)
    // como relativa (prod: /api/…, mismo origen detrás de Nginx).
    const esApi = url.includes('/api/') && !url.includes('/api/auth/login')

    if (esApi) {
      const token = getToken()
      if (token) {
        init = { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` } }
      }
    }

    const res = await originalFetch(input, init)

    // Sesión inválida/expirada → limpiar y notificar (excepto en el propio login)
    if (esApi && res.status === 401) {
      clearToken()
      window.dispatchEvent(new CustomEvent('auth:401'))
    }
    return res
  }
}