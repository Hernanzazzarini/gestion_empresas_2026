import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

// Imagen de portada (Cloudinary). En desktop ocupa el panel izquierdo;
// en pantallas chicas pasa a ser el fondo atenuado del formulario.
// Las transformaciones `f_auto,q_auto,w_1600` la sirven en WebP/AVIF según el
// navegador: el PNG original pesa 2 MB y así baja a ~125 KB sin pérdida visible.
const PORTADA = 'https://res.cloudinary.com/dhayjfkli/image/upload/f_auto,q_auto,w_1600/v1785588894/imagen_para_login_fwi7mc.png'

const MODULOS = ['Mantenimiento', 'Logística', 'Stock', 'Mapeo de documentos', 'Desvíos', 'Reclamos', 'Proveedores']

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
    <div className="gp-login">
      <style>{`
        @keyframes gpLoginIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gpHeroIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes gpSpin { to { transform: rotate(360deg); } }

        .gp-login { min-height: 100vh; display: flex; background: #0f1117; }

        /* Panel izquierdo: la portada a sangre con un degradado que oscurece
           el borde derecho para que empalme con el panel del formulario. */
        .gp-login-hero {
          position: relative; flex: 1 1 58%; min-width: 0;
          background-image: url("${PORTADA}");
          background-size: cover; background-position: center;
          display: flex; align-items: flex-end;
          animation: gpHeroIn 0.6s ease-out;
        }
        .gp-login-hero::after {
          content: ''; position: absolute; inset: 0;
          background:
            linear-gradient(90deg, rgba(15,17,23,0.55) 0%, rgba(15,17,23,0.10) 35%, rgba(15,17,23,0.75) 82%, #0f1117 100%),
            linear-gradient(0deg,  rgba(15,17,23,0.92) 0%, rgba(15,17,23,0) 60%);
        }
        .gp-login-hero-content { position: relative; z-index: 1; padding: 56px 48px; max-width: 620px; }

        .gp-login-panel {
          flex: 1 1 42%; display: flex; align-items: center; justify-content: center;
          padding: 24px; min-width: 0;
        }
        .gp-login-card {
          width: 100%; max-width: 400px; background: #181c27;
          border: 1px solid #2a3045; border-radius: 16px; padding: 36px;
          box-shadow: 0 20px 60px -20px rgba(0,0,0,0.6);
          animation: gpLoginIn 0.35s ease-out;
        }
        .gp-login-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; }
        .gp-login-chip {
          font-size: 12px; color: #cbd5e1; padding: 5px 11px; border-radius: 999px;
          border: 1px solid #ffffff26; background: #ffffff0f; backdrop-filter: blur(4px);
        }
        /* La marca del formulario sólo aparece cuando el hero no está visible. */
        .gp-login-brand { display: none; }

        @media (max-width: 980px) {
          .gp-login-hero { display: none; }
          .gp-login {
            background-image:
              linear-gradient(rgba(15,17,23,0.90), rgba(15,17,23,0.96)),
              url("${PORTADA}");
            background-size: cover; background-position: center; background-attachment: fixed;
          }
          .gp-login-card { background: #181c27f2; backdrop-filter: blur(6px); }
          .gp-login-brand { display: flex; }
        }
        @media (max-width: 420px) {
          .gp-login-panel { padding: 16px; }
          .gp-login-card { padding: 26px 20px; }
        }
      `}</style>

      <section className="gp-login-hero">
        <div className="gp-login-hero-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: '#f59e0b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 900, color: '#0f1117',
              boxShadow: '0 8px 24px -8px #f59e0bcc',
            }}>⚙</div>
            <div style={{ fontWeight: 800, fontSize: 22, color: '#f1f5f9', letterSpacing: 0.2 }}>
              Gestión<span style={{ color: '#f59e0b' }}>Pro</span>
            </div>
          </div>

          <h1 style={{
            margin: 0, fontSize: 38, lineHeight: 1.15, fontWeight: 800, color: '#f8fafc',
            textShadow: '0 2px 24px rgba(0,0,0,0.6)',
          }}>
            Toda la operación<br />en un solo lugar.
          </h1>
          <p style={{ marginTop: 14, marginBottom: 0, fontSize: 15, lineHeight: 1.6, color: '#94a3b8', maxWidth: 460 }}>
            Control y mantenimiento, documentación —
            centralizados, trazables y con reportes en tiempo real.
          </p>

          <div className="gp-login-chips">
            {MODULOS.map(m => <span key={m} className="gp-login-chip">{m}</span>)}
          </div>
        </div>
      </section>

      <div className="gp-login-panel">
        <form onSubmit={submit} className="gp-login-card">
          <div className="gp-login-brand" style={{ alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: '#f59e0b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 900, color: '#0f1117',
            }}>⚙</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#f1f5f9' }}>
              Gestión<span style={{ color: '#f59e0b' }}>Pro</span>
            </div>
          </div>

          <div style={{ marginBottom: 26 }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#f1f5f9' }}>Iniciar sesión</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
              Ingresá con tus credenciales para continuar.
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
    </div>
  )
}
