import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      // Reseteamos la URL al inicio antes de entrar, para no quedar en una ruta
      // heredada de una sesión anterior (p.ej. /admin/*) que el nuevo usuario no puede ver.
      if (window.location.pathname !== '/') window.history.replaceState(null, '', '/')
      await login(usuario, password)
      // El router muestra la app al detectar sesión activa (arranca en "/").
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const input = {
    width: '100%', background: '#0f1117', border: '1px solid #2a3045',
    borderRadius: 8, padding: '10px 14px', color: '#f1f5f9', fontSize: 14,
    boxSizing: 'border-box',
  }
  const label = { display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }

  return (
    <div style={{
      minHeight: '100vh', background: '#0f1117', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <form onSubmit={submit} style={{
        width: '100%', maxWidth: 380, background: '#181c27',
        border: '1px solid #2a3045', borderRadius: 16, padding: 36,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: '#f59e0b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 900, color: '#0f1117',
          }}>⚙</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#f1f5f9' }}>GestiónPro</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Iniciar sesión</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={label}>Usuario</label>
          <input style={input} value={usuario} onChange={e => setUsuario(e.target.value)}
            autoFocus autoComplete="username" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={label}>Contraseña</label>
          <input style={input} type="password" value={password} onChange={e => setPassword(e.target.value)}
            autoComplete="current-password" />
        </div>

        {error && (
          <div style={{
            background: '#dc262622', border: '1px solid #dc2626', borderRadius: 8,
            padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={busy}
          style={{
            width: '100%', padding: '11px', background: busy ? '#92400e' : '#f59e0b',
            border: 'none', borderRadius: 8, color: '#0f1117', fontWeight: 700,
            cursor: busy ? 'not-allowed' : 'pointer', fontSize: 14,
          }}>
          {busy ? 'Ingresando...' : 'Ingresar'}
        </button>

        <p style={{ fontSize: 11, color: '#475569', marginTop: 18, textAlign: 'center' }}>
          El acceso es provisto por el administrador del sistema.
        </p>
      </form>
    </div>
  )
}