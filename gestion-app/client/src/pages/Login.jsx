import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [verPass, setVerPass] = useState(false)
  const [mayus, setMayus] = useState(false)
  const [foco, setFoco] = useState(null) // 'usuario' | 'password' | null

  const puedeEnviar = usuario.trim() !== '' && password !== '' && !busy

  const submit = async (e) => {
    e.preventDefault()
    if (!puedeEnviar) return
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

  // Detecta Bloq Mayús para avisar en el campo de contraseña (causa típica de error de login).
  const chequearMayus = (e) => {
    if (typeof e.getModifierState === 'function') setMayus(e.getModifierState('CapsLock'))
  }

  const inputBase = {
    width: '100%', background: '#0f1117', borderRadius: 8,
    padding: '10px 14px', color: '#f1f5f9', fontSize: 14,
    boxSizing: 'border-box', outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }
  const inputEstilo = (campo) => ({
    ...inputBase,
    border: `1px solid ${foco === campo ? '#f59e0b' : '#2a3045'}`,
    boxShadow: foco === campo ? '0 0 0 3px #f59e0b22' : 'none',
  })
  const label = { display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(1200px 600px at 50% -10%, #1e243580, #0f1117 60%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <form onSubmit={submit} style={{
        width: '100%', maxWidth: 380, background: '#181c27',
        border: '1px solid #2a3045', borderRadius: 16, padding: 36,
        boxShadow: '0 20px 60px -20px rgba(0,0,0,0.6)',
        animation: 'gpLoginIn 0.35s ease-out',
      }}>
        <style>{`
          @keyframes gpLoginIn {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes gpSpin { to { transform: rotate(360deg); } }
        `}</style>

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
          <label style={label} htmlFor="gp-usuario">Usuario</label>
          <input
            id="gp-usuario"
            style={inputEstilo('usuario')}
            value={usuario}
            onChange={e => setUsuario(e.target.value)}
            onFocus={() => setFoco('usuario')}
            onBlur={() => setFoco(null)}
            autoFocus autoComplete="username"
            disabled={busy}
          />
        </div>

        <div style={{ marginBottom: mayus ? 8 : 20 }}>
          <label style={label} htmlFor="gp-password">Contraseña</label>
          <div style={{ position: 'relative' }}>
            <input
              id="gp-password"
              style={{ ...inputEstilo('password'), paddingRight: 60 }}
              type={verPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFoco('password')}
              onBlur={() => { setFoco(null); setMayus(false) }}
              onKeyUp={chequearMayus}
              autoComplete="current-password"
              disabled={busy}
            />
            <button
              type="button"
              onClick={() => setVerPass(v => !v)}
              tabIndex={-1}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', color: '#94a3b8',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 6px',
              }}
            >
              {verPass ? 'Ocultar' : 'Ver'}
            </button>
          </div>
        </div>

        {mayus && (
          <div style={{ fontSize: 12, color: '#fbbf24', marginBottom: 16 }}>
            ⚠ Bloq Mayús está activado
          </div>
        )}

        {error && (
          <div style={{
            background: '#dc262622', border: '1px solid #dc2626', borderRadius: 8,
            padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={!puedeEnviar}
          style={{
            width: '100%', padding: '11px', background: puedeEnviar ? '#f59e0b' : '#92400e',
            border: 'none', borderRadius: 8, color: '#0f1117', fontWeight: 700,
            cursor: puedeEnviar ? 'pointer' : 'not-allowed', fontSize: 14,
            opacity: puedeEnviar ? 1 : 0.7,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.15s, opacity 0.15s',
          }}>
          {busy && (
            <span style={{
              width: 14, height: 14, borderRadius: '50%',
              border: '2px solid #0f111755', borderTopColor: '#0f1117',
              display: 'inline-block', animation: 'gpSpin 0.6s linear infinite',
            }} />
          )}
          {busy ? 'Ingresando...' : 'Ingresar'}
        </button>

        <p style={{ fontSize: 11, color: '#475569', marginTop: 18, textAlign: 'center' }}>
          El acceso es provisto por el administrador del sistema.
        </p>
      </form>
    </div>
  )
}