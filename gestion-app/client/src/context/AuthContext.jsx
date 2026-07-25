import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { instalarInterceptor, getToken, clearToken } from '../services/http'
import * as authApi from '../services/auth'

// Instalar el interceptor de fetch lo antes posible (una sola vez).
instalarInterceptor()

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario]   = useState(null)
  const [permisos, setPermisos] = useState({})
  // Sólo arrancamos "cargando" si hay un token que hidratar; si no, no hay nada que esperar.
  const [cargando, setCargando] = useState(() => !!getToken())

  // Hidratar sesión al montar (si hay token guardado)
  useEffect(() => {
    let vivo = true
    if (!getToken()) return
    authApi.me()
      .then(({ usuario, permisos }) => { if (vivo) { setUsuario(usuario); setPermisos(permisos) } })
      .catch(() => { clearToken() })
      .finally(() => { if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, [])

  // Cerrar sesión si el server devuelve 401 en cualquier request
  useEffect(() => {
    const onExpirada = () => { setUsuario(null); setPermisos({}) }
    window.addEventListener('auth:401', onExpirada)
    return () => window.removeEventListener('auth:401', onExpirada)
  }, [])

  const login = useCallback(async (user, pass) => {
    const { usuario, permisos } = await authApi.login(user, pass)
    setUsuario(usuario)
    setPermisos(permisos)
    return usuario
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUsuario(null)
    setPermisos({})
  }, [])

  // Refrescar permisos/usuario (p.ej. tras el admin editarse a sí mismo)
  const refrescar = useCallback(async () => {
    const { usuario, permisos } = await authApi.me()
    setUsuario(usuario); setPermisos(permisos)
  }, [])

  const esAdmin = usuario?.rol === 'administrador'

  // ¿El usuario puede <accion> en <modulo>? El admin siempre puede.
  const puede = useCallback((modulo, accion = 'leer') => {
    if (esAdmin) return true
    return !!permisos?.[modulo]?.[accion]
  }, [esAdmin, permisos])

  const value = {
    usuario, permisos, cargando, esAdmin,
    login, logout, refrescar, puede,
    autenticado: !!usuario,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}