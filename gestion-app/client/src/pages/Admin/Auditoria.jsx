import { useState, useEffect, useCallback } from 'react'
import { listarAuditoria, opcionesAuditoria } from '../../services/auditoria'

const card = { background: '#181c27', borderRadius: 12, border: '1px solid #2a3045', padding: 24 }
const filterSel = {
  background: '#0f1117', border: '1px solid #2a3045', borderRadius: 8,
  padding: '8px 12px', color: '#f1f5f9', fontSize: 14, minWidth: 150,
}

const accionColor = {
  LOGIN: '#3b82f6', LOGOUT: '#64748b', CREAR: '#16a34a', EDITAR: '#d97706', ELIMINAR: '#dc2626',
}

const moduloLabel = {
  mantenimiento: 'Mantenimiento', contenedores: 'Contenedores', stock: 'Stock',
  inocuidad: 'Inocuidad', desvios: 'Desvíos', reclamos: 'Reclamos',
  proveedores: 'Proveedores', auth: 'Autenticación', usuarios: 'Usuarios',
  logistica: 'Logística (histórico)', // eventos previos a separar contenedores/stock
}

const fmtFecha = (f) => f ? new Date(f).toLocaleString('es-AR') : '—'

export default function Auditoria() {
  const [eventos, setEventos] = useState([])
  const [opciones, setOpciones] = useState({ usuarios: [], modulos: [], acciones: [] })
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({ usuario: '', accion: '', modulo: '', desde: '', hasta: '' })

  const cargar = useCallback(async () => {
    setLoading(true)
    try { setEventos(await listarAuditoria(filtros)) } finally { setLoading(false) }
  }, [filtros])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => { opcionesAuditoria().then(setOpciones).catch(() => {}) }, [])

  const set = (k) => (e) => setFiltros(f => ({ ...f, [k]: e.target.value }))
  const limpiar = () => setFiltros({ usuario: '', accion: '', modulo: '', desde: '', hasta: '' })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#f1f5f9', fontSize: 24, fontWeight: 800, margin: 0 }}>Auditoría</h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>
          Registro de acciones: quién hizo qué, cuándo y sobre qué recurso
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Usuario</div>
          <select style={filterSel} value={filtros.usuario} onChange={set('usuario')}>
            <option value="">Todos</option>
            {opciones.usuarios.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Acción</div>
          <select style={filterSel} value={filtros.accion} onChange={set('accion')}>
            <option value="">Todas</option>
            {opciones.acciones.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Módulo</div>
          <select style={filterSel} value={filtros.modulo} onChange={set('modulo')}>
            <option value="">Todos</option>
            {opciones.modulos.map(m => <option key={m} value={m}>{moduloLabel[m] || m}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Desde</div>
          <input type="date" style={filterSel} value={filtros.desde} onChange={set('desde')} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Hasta</div>
          <input type="date" style={filterSel} value={filtros.hasta} onChange={set('hasta')} />
        </div>
        <button onClick={limpiar} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #2a3045', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
          Limpiar
        </button>
      </div>

      {/* Tabla */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ color: '#64748b', padding: 32, textAlign: 'center' }}>Cargando...</p>
        ) : eventos.length === 0 ? (
          <p style={{ color: '#64748b', padding: 32, textAlign: 'center' }}>No hay eventos para los filtros seleccionados.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a3045' }}>
                  {['Fecha', 'Usuario', 'Acción', 'Módulo', 'Recurso', 'IP'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eventos.map(ev => (
                  <tr key={ev.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px 14px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmtFecha(ev.creadoEn)}</td>
                    <td style={{ padding: '12px 14px', color: '#f1f5f9', fontWeight: 600 }}>{ev.usuario || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: (accionColor[ev.accion] || '#64748b') + '22', color: accionColor[ev.accion] || '#64748b',
                        border: `1px solid ${(accionColor[ev.accion] || '#64748b')}44`,
                      }}>
                        {ev.accion}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#f1f5f9' }}>{moduloLabel[ev.modulo] || ev.modulo || '—'}</td>
                    <td style={{ padding: '12px 14px', color: '#94a3b8', fontFamily: 'monospace', fontSize: 12 }}>{ev.recurso || '—'}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>{ev.ip || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p style={{ color: '#475569', fontSize: 12, marginTop: 10 }}>Se muestran hasta 1000 eventos más recientes.</p>
    </div>
  )
}