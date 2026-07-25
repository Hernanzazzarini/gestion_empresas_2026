import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  listarUsuarios, crearUsuario, actualizarUsuario,
  cambiarPassword, eliminarUsuario, actualizarPermisos,
} from '../../services/auth'

// Debe coincidir con MODULOS del backend (auth/constants.js)
const MODULOS = [
  { key: 'mantenimiento', label: 'Mantenimiento' },
  { key: 'contenedores',  label: 'Control de Contenedores' },
  { key: 'stock',         label: 'Stock (Control + Reporte)' },
  { key: 'inocuidad',     label: 'Inocuidad (Mapeo)' },
  { key: 'desvios',       label: 'Desvíos' },
  { key: 'reclamos',      label: 'Reclamos' },
  { key: 'proveedores',   label: 'Proveedores' },
]
const ROLES = [
  { key: 'administrador', label: 'Administrador' },
  { key: 'mandos_medios', label: 'Mandos medios' },
  { key: 'operarios',     label: 'Operarios' },
]
const ACCIONES = ['leer', 'editar', 'eliminar']

// ─── Estilos ─────────────────────────────────────────────────────────────────
const card  = { background: '#181c27', borderRadius: 12, border: '1px solid #2a3045', padding: 24 }
const label = { display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }
const input = {
  width: '100%', background: '#0f1117', border: '1px solid #2a3045',
  borderRadius: 8, padding: '8px 12px', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box',
}
const btnPrimary = { padding: '10px 20px', background: '#f59e0b', border: 'none', borderRadius: 8, color: '#0f1117', fontWeight: 700, cursor: 'pointer', fontSize: 14 }
const btnGhost = { padding: '8px 16px', background: 'transparent', border: '1px solid #2a3045', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }

const rolBadge = {
  administrador: '#a855f7', mandos_medios: '#3b82f6', operarios: '#16a34a',
}

// ─── Panel lateral ─────────────────────────────────────────────────────────────
function Panel({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: '#00000088' }} />
      <div style={{
        position: 'relative', width: 640, maxWidth: '95vw', height: '100%',
        background: '#0f1117', borderLeft: '1px solid #2a3045', overflowY: 'auto',
      }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid #2a3045', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#f1f5f9', fontSize: 18, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 28 }}>{children}</div>
      </div>
    </div>
  )
}

// ─── Formulario nuevo usuario ──────────────────────────────────────────────────
function FormUsuario({ onSuccess, onClose }) {
  const [form, setForm] = useState({ usuario: '', password: '', nombre: '', rol: 'operarios' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const nuevo = await crearUsuario(form)
      onSuccess(nuevo)
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={label}>Usuario *</label>
        <input style={input} value={form.usuario} onChange={set('usuario')} autoComplete="off" required />
      </div>
      <div>
        <label style={label}>Nombre</label>
        <input style={input} value={form.nombre} onChange={set('nombre')} />
      </div>
      <div>
        <label style={label}>Contraseña * (mínimo 4)</label>
        <input style={input} type="text" value={form.password} onChange={set('password')} autoComplete="new-password" required />
      </div>
      <div>
        <label style={label}>Rol *</label>
        <select style={input} value={form.rol} onChange={set('rol')}>
          {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
          Se cargan permisos por defecto según el rol; podés ajustarlos luego en la matriz.
        </p>
      </div>
      {error && <div style={{ background: '#dc262622', border: '1px solid #dc2626', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
        <button type="submit" disabled={busy} style={btnPrimary}>{busy ? 'Guardando...' : 'Crear usuario'}</button>
      </div>
    </form>
  )
}

// ─── Detalle / edición de usuario (datos + permisos + password) ────────────────
function DetalleUsuario({ usuario: u, onUpdate, onClose, onDelete, propioId }) {
  const [datos, setDatos] = useState({ nombre: u.nombre || '', rol: u.rol, activo: u.activo })
  const [permisos, setPermisos] = useState(u.permisos || {})
  const [pass, setPass] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const esAdmin = datos.rol === 'administrador'
  const toggle = (modulo, accion) => setPermisos(p => ({
    ...p,
    [modulo]: { ...p[modulo], [accion]: !p[modulo]?.[accion] },
  }))

  const guardarDatos = async () => {
    setBusy(true); setErr(''); setMsg('')
    try {
      const upd = await actualizarUsuario(u.id, datos)
      setPermisos(upd.permisos); onUpdate(upd); setMsg('Datos actualizados.')
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  const guardarPermisos = async () => {
    setBusy(true); setErr(''); setMsg('')
    try {
      const upd = await actualizarPermisos(u.id, permisos)
      onUpdate(upd); setMsg('Permisos actualizados.')
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  const guardarPass = async () => {
    setBusy(true); setErr(''); setMsg('')
    try {
      await cambiarPassword(u.id, pass); setPass(''); setMsg('Contraseña actualizada.')
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Datos */}
      <div style={card}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginTop: 0 }}>Datos</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={label}>Usuario</label>
            <input style={{ ...input, opacity: 0.6 }} value={u.usuario} disabled />
          </div>
          <div>
            <label style={label}>Nombre</label>
            <input style={input} value={datos.nombre} onChange={e => setDatos(d => ({ ...d, nombre: e.target.value }))} />
          </div>
          <div>
            <label style={label}>Rol</label>
            <select style={input} value={datos.rol} onChange={e => setDatos(d => ({ ...d, rol: e.target.value }))}>
              {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Estado</label>
            <select style={input} value={datos.activo ? '1' : '0'} onChange={e => setDatos(d => ({ ...d, activo: e.target.value === '1' }))}>
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: 14, textAlign: 'right' }}>
          <button onClick={guardarDatos} disabled={busy} style={btnPrimary}>Guardar datos</button>
        </div>
      </div>

      {/* Permisos */}
      <div style={card}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginTop: 0 }}>Permisos por módulo</p>
        {esAdmin ? (
          <p style={{ color: '#94a3b8', fontSize: 13 }}>
            El administrador tiene acceso total a todos los módulos.
          </p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a3045' }}>
                  <th style={{ textAlign: 'left', padding: '8px 6px', color: '#64748b', fontWeight: 600 }}>Módulo</th>
                  {ACCIONES.map(a => (
                    <th key={a} style={{ padding: '8px 6px', color: '#64748b', fontWeight: 600, textTransform: 'capitalize', width: 90 }}>{a}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULOS.map(m => (
                  <tr key={m.key} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '8px 6px', color: '#f1f5f9' }}>{m.label}</td>
                    {ACCIONES.map(a => (
                      <td key={a} style={{ padding: '8px 6px', textAlign: 'center' }}>
                        <input type="checkbox"
                          checked={!!permisos[m.key]?.[a]}
                          onChange={() => toggle(m.key, a)}
                          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#f59e0b' }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 14, textAlign: 'right' }}>
              <button onClick={guardarPermisos} disabled={busy} style={btnPrimary}>Guardar permisos</button>
            </div>
          </>
        )}
      </div>

      {/* Contraseña */}
      <div style={card}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginTop: 0 }}>Restablecer contraseña</p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={label}>Nueva contraseña (mínimo 4)</label>
            <input style={input} type="text" value={pass} onChange={e => setPass(e.target.value)} autoComplete="new-password" />
          </div>
          <button onClick={guardarPass} disabled={busy || !pass} style={btnPrimary}>Cambiar</button>
        </div>
      </div>

      {msg && <div style={{ background: '#16a34a22', border: '1px solid #16a34a', borderRadius: 8, padding: '10px 14px', color: '#86efac', fontSize: 13 }}>{msg}</div>}
      {err && <div style={{ background: '#dc262622', border: '1px solid #dc2626', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13 }}>{err}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={() => onDelete(u)}
          disabled={u.id === propioId}
          title={u.id === propioId ? 'No podés eliminar tu propio usuario' : ''}
          style={{ ...btnGhost, borderColor: '#dc262640', color: u.id === propioId ? '#475569' : '#f87171', cursor: u.id === propioId ? 'not-allowed' : 'pointer' }}>
          Eliminar usuario
        </button>
        <button onClick={onClose} style={btnGhost}>Cerrar</button>
      </div>
    </div>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────────
export default function Usuarios() {
  const { usuario: yo, refrescar } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [panel, setPanel] = useState(null) // null | 'nuevo' | 'detalle'
  const [sel, setSel] = useState(null)

  // `loading` ya arranca en true, así que el efecto de carga inicial no necesita
  // (ni debe) llamar setState de forma sincrónica.
  const cargar = useCallback(async () => {
    try { setUsuarios(await listarUsuarios()) } finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const onCreado = (u) => { setUsuarios(prev => [u, ...prev]); setPanel(null) }

  const onActualizado = async (u) => {
    setUsuarios(prev => prev.map(x => x.id === u.id ? u : x))
    setSel(u)
    if (u.id === yo.id) refrescar() // si me edité a mí mismo, refresco mi sesión
  }

  const onEliminar = async (u) => {
    if (!confirm(`¿Eliminar al usuario "${u.usuario}"?`)) return
    try {
      await eliminarUsuario(u.id)
      setUsuarios(prev => prev.filter(x => x.id !== u.id))
      setPanel(null)
    } catch (e) { alert(e.message) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: 24, fontWeight: 800, margin: 0 }}>Usuarios y permisos</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>Alta de usuarios, roles y asignación de permisos por módulo</p>
        </div>
        <button onClick={() => setPanel('nuevo')} style={btnPrimary}>+ Nuevo usuario</button>
      </div>

      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ color: '#64748b', padding: 32, textAlign: 'center' }}>Cargando...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a3045' }}>
                {['Usuario', 'Nombre', 'Rol', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '12px 14px', color: '#f1f5f9', fontWeight: 600 }}>
                    {u.usuario}{u.id === yo.id && <span style={{ color: '#64748b', fontWeight: 400 }}> (vos)</span>}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#94a3b8' }}>{u.nombre || '—'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: (rolBadge[u.rol] || '#64748b') + '22', color: rolBadge[u.rol] || '#64748b',
                      border: `1px solid ${(rolBadge[u.rol] || '#64748b')}44`,
                    }}>
                      {ROLES.find(r => r.key === u.rol)?.label || u.rol}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: u.activo ? '#86efac' : '#f87171' }}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => { setSel(u); setPanel('detalle') }} style={{ ...btnGhost, padding: '4px 12px', fontSize: 12 }}>
                      Gestionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {panel === 'nuevo' && (
        <Panel title="Nuevo usuario" onClose={() => setPanel(null)}>
          <FormUsuario onSuccess={onCreado} onClose={() => setPanel(null)} />
        </Panel>
      )}

      {panel === 'detalle' && sel && (
        <Panel title={`Usuario: ${sel.usuario}`} onClose={() => setPanel(null)}>
          <DetalleUsuario
            usuario={sel}
            propioId={yo.id}
            onUpdate={onActualizado}
            onDelete={onEliminar}
            onClose={() => setPanel(null)}
          />
        </Panel>
      )}
    </div>
  )
}