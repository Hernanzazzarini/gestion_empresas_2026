import { useState, useEffect } from 'react'
import { Button, Card, Modal } from '../../components/ui'
import { colors as C } from '../../components/ui/tokens'
import * as svc from '../../services/stock'
import { useAuth } from '../../context/AuthContext'

const CALIBRES = [
  '30-35', '38-42', '40-50', '50-60', '60-70', '80-100',
  'SPLIT FINO', 'SPLIT GRUESO', 'CAIDA', 'OTROS',
]

const fmt = (n, decimals = 2) =>
  Number(n).toLocaleString('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

const fieldStyle = {
  width: '100%', background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 8, padding: '9px 12px', color: C.textPrimary,
  fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
}
const labelStyle = {
  fontSize: 12, color: C.textSecondary, fontWeight: 600,
  marginBottom: 5, display: 'block',
}

// ─── Formulario nuevo lote ─────────────────────────────────────────────────────
const ANIOS_COSECHA = Array.from({ length: new Date().getFullYear() - 2009 }, (_, i) => 2010 + i).reverse()

function FormNuevoLote({ onSubmit, onClose }) {
  const [form, setForm] = useState({
    nro_lote: '', stock_envases: '', calibre: '', kilos_por_unidad: '', ubicacion: '', anio_cosecha: '',
  })
  const [error,     setError]     = useState('')
  const [guardando, setGuardando] = useState(false)

  const kilosTotales   = Number(form.stock_envases) * Number(form.kilos_por_unidad)
  const toneladasTotal = kilosTotales / 1000
  const mostrarPreview = Number(form.stock_envases) > 0 && Number(form.kilos_por_unidad) > 0

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const { nro_lote, stock_envases, calibre, kilos_por_unidad, ubicacion, anio_cosecha } = form
    if (!nro_lote.trim() || !stock_envases || !calibre || !kilos_por_unidad || !ubicacion.trim() || !anio_cosecha) {
      setError('Todos los campos son obligatorios.')
      return
    }
    if (Number(stock_envases) <= 0 || Number(kilos_por_unidad) <= 0) {
      setError('Stock de envases y Kilos por unidad deben ser mayores a cero.')
      return
    }
    setGuardando(true)
    try {
      await onSubmit({
        nro_lote:         nro_lote.trim(),
        stock_envases:    Number(stock_envases),
        calibre,
        kilos_por_unidad: Number(kilos_por_unidad),
        ubicacion:        ubicacion.trim(),
        anio_cosecha:     Number(anio_cosecha),
      })
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* N° Lote */}
      <div>
        <label style={labelStyle}>N° Lote *</label>
        <input style={fieldStyle} placeholder="Ej: RE04001H26" value={form.nro_lote} onChange={set('nro_lote')} />
      </div>

      {/* Calibre + Año Cosecha */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Calibre *</label>
          <select style={fieldStyle} value={form.calibre} onChange={set('calibre')}>
            <option value="">— Seleccionar —</option>
            {CALIBRES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Año Cosecha *</label>
          <select style={fieldStyle} value={form.anio_cosecha} onChange={set('anio_cosecha')}>
            <option value="">— Año —</option>
            {ANIOS_COSECHA.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Stock envases + Kilos x unidad */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Stock Envases *</label>
          <input
            style={fieldStyle} type="number" min="1" step="1"
            placeholder="Ej: 1 - 21"
            value={form.stock_envases} onChange={set('stock_envases')}
          />
        </div>
        <div>
          <label style={labelStyle}>Kilos × Unidad *</label>
          <input
            style={fieldStyle} type="number" min="0.001" step="0.001"
            placeholder="Ej: 22.500"
            value={form.kilos_por_unidad} onChange={set('kilos_por_unidad')}
          />
        </div>
      </div>

      {/* Ubicación */}
      <div>
        <label style={labelStyle}>Ubicación *</label>
        <input
          style={fieldStyle}
          placeholder="Ej: D1 - R3"
          value={form.ubicacion}
          onChange={set('ubicacion')}
        />
      </div>

      {/* Preview totales */}
      {mostrarPreview && (
        <div style={{
          background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
          padding: '10px 14px', display: 'flex', gap: 24,
        }}>
          <div>
            <div style={{ fontSize: 11, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kilos Totales</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.accent, fontFamily: "'Courier New', monospace" }}>
              {fmt(kilosTotales, 3)} kg
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Toneladas</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.green, fontFamily: "'Courier New', monospace" }}>
              {fmt(toneladasTotal, 3)} tn
            </div>
          </div>
        </div>
      )}

      {error && <ErrorBox msg={error} />}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Agregar al Stock'}</Button>
      </div>
    </form>
  )
}

// ─── Modal reducir envases ─────────────────────────────────────────────────────
function FormReducirEnvases({ lote, onSubmit, onClose }) {
  const [cantidad,   setCantidad]   = useState('')
  const [error,      setError]      = useState('')
  const [procesando, setProcesando] = useState(false)

  const cantNum      = Number(cantidad)
  const nuevoStock   = cantNum > 0 ? lote.stock_envases - cantNum : null
  const nuevosKilos  = nuevoStock != null ? nuevoStock * Number(lote.kilos_por_unidad) : null
  const nuevasTn     = nuevosKilos != null ? nuevosKilos / 1000 : null
  const vaAQuedarEnCero = nuevoStock === 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!cantidad || isNaN(cantNum) || cantNum <= 0 || !Number.isInteger(cantNum)) {
      setError('Ingresá un número entero mayor a cero.')
      return
    }
    if (cantNum > lote.stock_envases) {
      setError(`El lote solo tiene ${fmt(lote.stock_envases, 0)} envases disponibles.`)
      return
    }
    setProcesando(true)
    try {
      await onSubmit(cantNum)
    } catch (err) {
      setError(err.message)
      setProcesando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Info del lote */}
      <div style={{
        background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
        padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: C.textSecondary }}>
            Lote: <strong style={{ color: C.accent }}>{lote.nro_lote}</strong>
          </span>
          <span style={{ fontSize: 13, color: C.textSecondary }}>
            Calibre: <strong style={{ color: C.textPrimary }}>{lote.calibre}</strong>
          </span>
          <span style={{ fontSize: 13, color: C.textSecondary }}>
            Ubicación: <strong style={{ color: C.textPrimary }}>{lote.ubicacion}</strong>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <span style={{ fontSize: 13, color: C.textSecondary }}>
            Stock actual: <strong style={{ color: C.textPrimary, fontFamily: "'Courier New', monospace" }}>{fmt(lote.stock_envases, 0)} env</strong>
          </span>
          <span style={{ fontSize: 13, color: C.textSecondary }}>
            Toneladas: <strong style={{ color: C.green, fontFamily: "'Courier New', monospace" }}>{fmt(lote.toneladas_totales, 3)} tn</strong>
          </span>
        </div>
      </div>

      {/* Input cantidad a reducir */}
      <div>
        <label style={labelStyle}>Cantidad de envases a dar de baja *</label>
        <input
          style={fieldStyle}
          type="number"
          min="1"
          step="1"
          max={lote.stock_envases}
          placeholder={`Máx. ${lote.stock_envases}`}
          value={cantidad}
          onChange={e => setCantidad(e.target.value)}
          autoFocus
        />
      </div>

      {/* Preview resultado */}
      {cantNum > 0 && cantNum <= lote.stock_envases && (
        <div style={{
          borderRadius: 8, padding: '12px 16px',
          border: `1px solid ${vaAQuedarEnCero ? C.red + '44' : C.border}`,
          background: vaAQuedarEnCero ? `${C.red}10` : C.bg,
        }}>
          {vaAQuedarEnCero ? (
            <div style={{ color: C.red, fontSize: 13, fontWeight: 600 }}>
              ⚠️ El lote quedará en <strong>0 envases</strong> y se dará de baja automáticamente.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Stock resultante</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.accent, fontFamily: "'Courier New', monospace" }}>
                  {fmt(nuevoStock, 0)} env
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Toneladas resultantes</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.green, fontFamily: "'Courier New', monospace" }}>
                  {fmt(nuevasTn, 3)} tn
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <ErrorBox msg={error} />}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        <Button variant="secondary" type="button" onClick={onClose} disabled={procesando}>Cancelar</Button>
        <button
          type="submit"
          disabled={procesando}
          style={{
            background: C.accent, color: '#0f1117', border: 'none', borderRadius: 8,
            padding: '8px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14,
            fontFamily: 'inherit', opacity: procesando ? 0.6 : 1,
          }}
        >
          {procesando ? 'Procesando...' : 'Confirmar baja parcial'}
        </button>
      </div>
    </form>
  )
}

// ─── Confirm baja total ────────────────────────────────────────────────────────
function ConfirmBajaTotal({ lote, onConfirm, onClose }) {
  const [procesando, setProcesando] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ textAlign: 'center', fontSize: 40 }}>⚠️</div>
      <p style={{ margin: 0, color: C.textPrimary, fontSize: 14, lineHeight: 1.6, textAlign: 'center' }}>
        Vas a dar de baja <strong>todo</strong> el lote <strong style={{ color: C.accent }}>{lote.nro_lote}</strong>.<br />
        Ya no aparecerá en el stock.
      </p>
      <div style={{
        background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
        padding: '10px 16px', fontSize: 13, color: C.textSecondary,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <span>Calibre: <strong style={{ color: C.textPrimary }}>{lote.calibre}</strong></span>
        <span>Ubicación: <strong style={{ color: C.textPrimary }}>{lote.ubicacion}</strong></span>
        <span>Envases: <strong style={{ color: C.textPrimary }}>{fmt(lote.stock_envases, 0)}</strong></span>
        <span>Toneladas: <strong style={{ color: C.textPrimary }}>{fmt(lote.toneladas_totales, 3)} tn</strong></span>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onClose} disabled={procesando}>Cancelar</Button>
        <button
          onClick={async () => { setProcesando(true); await onConfirm() }}
          disabled={procesando}
          style={{
            background: C.red, color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14,
            fontFamily: 'inherit', opacity: procesando ? 0.6 : 1,
          }}
        >
          {procesando ? 'Dando de baja...' : 'Sí, dar de baja todo'}
        </button>
      </div>
    </div>
  )
}

// ─── Helper ────────────────────────────────────────────────────────────────────
function ErrorBox({ msg }) {
  return (
    <div style={{
      background: `${C.red}18`, border: `1px solid ${C.red}44`,
      borderRadius: 8, padding: '9px 14px', color: C.red, fontSize: 13,
    }}>
      {msg}
    </div>
  )
}

// ─── Fila de la tabla ──────────────────────────────────────────────────────────
function FilaLote({ lote, onReducir, onBajaTotal, puedeEditar, puedeEliminar }) {
  const [hover, setHover] = useState(false)
  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ background: hover ? C.surfaceHigh : 'transparent', transition: 'background 0.15s' }}
    >
      <td style={tdStyle}>
        <span style={{ fontFamily: "'Courier New', monospace", fontWeight: 700, color: C.accent }}>
          {lote.nro_lote}
        </span>
      </td>
      <td style={tdStyle}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          color: C.blue, background: `${C.blue}18`, border: `1px solid ${C.blue}44`,
          whiteSpace: 'nowrap',
        }}>
          {lote.calibre}
        </span>
      </td>
      <td style={{ ...tdStyle, textAlign: 'center', fontFamily: "'Courier New', monospace", color: C.textSecondary }}>{lote.anio_cosecha}</td>
      <td style={{ ...tdStyle, color: C.textSecondary, fontSize: 12 }}>{lote.ubicacion}</td>
      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: "'Courier New', monospace" }}>
        {fmt(lote.stock_envases, 0)}
      </td>
      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: "'Courier New', monospace" }}>
        {fmt(lote.kilos_por_unidad, 3)}
      </td>
      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: "'Courier New', monospace", color: C.accent }}>
        {fmt(lote.kilos_totales, 3)}
      </td>
      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: "'Courier New', monospace", color: C.green, fontWeight: 700 }}>
        {fmt(lote.toneladas_totales, 3)}
      </td>
      <td style={{ ...tdStyle, textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {puedeEditar && (
            <button
              onClick={() => onReducir(lote)}
              style={{
                background: `${C.accent}18`, border: `1px solid ${C.accent}44`,
                borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                fontSize: 12, color: C.accent, fontFamily: 'inherit', fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              − Envases
            </button>
          )}
          {puedeEliminar && (
            <button
              onClick={() => onBajaTotal(lote)}
              style={{
                background: 'transparent', border: `1px solid ${C.red}44`,
                borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                fontSize: 12, color: C.red, fontFamily: 'inherit', fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              Dar de baja
            </button>
          )}
          {!puedeEditar && !puedeEliminar && <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>}
        </div>
      </td>
    </tr>
  )
}

const tdStyle = {
  padding: '11px 14px', borderBottom: `1px solid ${C.border}`,
  fontSize: 13, color: C.textPrimary, verticalAlign: 'middle',
}
const thStyle = {
  padding: '10px 14px', textAlign: 'left', fontSize: 11,
  color: C.textSecondary, fontWeight: 700, letterSpacing: '0.07em',
  textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`,
  background: C.surface, whiteSpace: 'nowrap',
}

// ─── Página principal ──────────────────────────────────────────────────────────
export default function StockLotes() {
  const { puede } = useAuth()
  const puedeEditar   = puede('logistica', 'editar')
  const puedeEliminar = puede('logistica', 'eliminar')
  const [lotes, setLotes]             = useState([])
  const [cargando, setCargando]       = useState(true)
  const [error, setError]             = useState('')
  const [modalNuevo, setModalNuevo]   = useState(false)
  const [loteReducir, setLoteReducir] = useState(null)
  const [loteBajaTotal, setLoteBajaTotal] = useState(null)
  const [filtro, setFiltro]           = useState('')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try {
      setCargando(true)
      setError('')
      setLotes(await svc.fetchLotes())
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setCargando(false)
    }
  }

  const handleCrear = async (form) => {
    const nuevo = await svc.crearLote(form)
    setLotes(prev => [nuevo, ...prev])
    setModalNuevo(false)
  }

  const handleReducir = async (cantidad) => {
    const result = await svc.reducirEnvases(loteReducir.id, cantidad)
    if (result.dado_de_baja) {
      setLotes(prev => prev.filter(l => l.id !== loteReducir.id))
    } else {
      setLotes(prev => prev.map(l => l.id === loteReducir.id ? { ...l, ...result } : l))
    }
    setLoteReducir(null)
  }

  const handleBajaTotal = async () => {
    await svc.darDeBajaLote(loteBajaTotal.id)
    setLotes(prev => prev.filter(l => l.id !== loteBajaTotal.id))
    setLoteBajaTotal(null)
  }

  // ── Totales globales ─────────────────────────────────────────────────────────
  const totalEnvases   = lotes.reduce((s, l) => s + Number(l.stock_envases),   0)
  const totalKilos     = lotes.reduce((s, l) => s + Number(l.kilos_totales),    0)
  const totalToneladas = totalKilos / 1000

  // ── Filtro de búsqueda (N° lote / calibre / ubicación) ───────────────────────
  const q = filtro.trim().toLowerCase()
  const lotesFiltrados = q
    ? lotes.filter(l =>
        l.nro_lote.toLowerCase().includes(q) ||
        l.calibre.toLowerCase().includes(q) ||
        l.ubicacion.toLowerCase().includes(q)
      )
    : lotes

  // Totales de la tabla (reflejan el filtro para que el pie coincida con lo visible)
  const filtradoEnvases   = lotesFiltrados.reduce((s, l) => s + Number(l.stock_envases), 0)
  const filtradoKilos     = lotesFiltrados.reduce((s, l) => s + Number(l.kilos_totales),  0)
  const filtradoToneladas = filtradoKilos / 1000

  // ── Toneladas por calibre ────────────────────────────────────────────────────
  const porCalibre = CALIBRES.reduce((acc, cal) => {
    const tn = lotes
      .filter(l => l.calibre === cal)
      .reduce((s, l) => s + Number(l.toneladas_totales), 0)
    if (tn > 0) acc.push({ calibre: cal, toneladas: tn })
    return acc
  }, [])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          Logística
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: C.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
          Control de Stock
        </h1>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Lotes en Stock',  value: lotes.length,           unit: '',    color: C.textPrimary },
          { label: 'Total Envases',   value: fmt(totalEnvases, 0),   unit: 'env', color: C.accent      },
          { label: 'Total Toneladas', value: fmt(totalToneladas, 3), unit: 'tn',  color: C.green       },
        ].map(s => (
          <Card key={s.label} style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: "'Courier New', monospace", lineHeight: 1 }}>
                {s.value}
              </span>
              {s.unit && <span style={{ fontSize: 13, color: C.textSecondary, fontWeight: 600 }}>{s.unit}</span>}
            </div>
            <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {s.label}
            </div>
          </Card>
        ))}
      </div>

      {/* TONELADAS POR CALIBRE */}
      {porCalibre.length > 0 && (
        <Card style={{ marginBottom: 24, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
            Toneladas por Calibre
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {porCalibre.map(({ calibre, toneladas }) => (
              <div key={calibre} style={{
                background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
                padding: '8px 14px', minWidth: 120,
              }}>
                <div style={{ fontSize: 11, color: C.blue, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{calibre}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: C.green, fontFamily: "'Courier New', monospace" }}>
                  {fmt(toneladas, 3)} tn
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TOOLBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 360 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: C.textSecondary, pointerEvents: 'none' }}>🔍</span>
          <input
            style={{ ...fieldStyle, paddingLeft: 34, paddingRight: filtro ? 34 : 12 }}
            placeholder="Buscar por N° lote, calibre o ubicación…"
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          />
          {filtro && (
            <button
              onClick={() => setFiltro('')}
              aria-label="Limpiar búsqueda"
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: C.textSecondary, fontSize: 16, lineHeight: 1, padding: 4,
              }}
            >
              ×
            </button>
          )}
        </div>
        {puedeEditar && <Button onClick={() => setModalNuevo(true)}>+ Nuevo Lote</Button>}
      </div>

      {/* TABLA */}
      {cargando && (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 13, color: C.textSecondary }}>Cargando stock...</div>
        </Card>
      )}
      {error && !cargando && (
        <Card style={{ textAlign: 'center', padding: 48, borderColor: C.red }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.red }}>{error}</div>
          <Button variant="secondary" style={{ marginTop: 16 }} onClick={cargar}>🔄 Reintentar</Button>
        </Card>
      )}
      {!cargando && !error && lotes.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary }}>No hay lotes en stock</div>
          <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 6 }}>
            Agregá el primer lote con el botón + Nuevo Lote.
          </div>
        </Card>
      )}

      {!cargando && !error && lotes.length > 0 && lotesFiltrados.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary }}>
            Ningún lote coincide con «{filtro.trim()}»
          </div>
          <Button variant="secondary" style={{ marginTop: 16 }} onClick={() => setFiltro('')}>
            Limpiar búsqueda
          </Button>
        </Card>
      )}

      {!cargando && !error && lotesFiltrados.length > 0 && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>N° Lote</th>
                  <th style={thStyle}>Calibre</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Año Cosecha</th>
                  <th style={thStyle}>Ubicación</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Stock Envases</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Kg × Unidad</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Kilos Totales</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Toneladas</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lotesFiltrados.map(lote => (
                  <FilaLote
                    key={lote.id}
                    lote={lote}
                    onReducir={setLoteReducir}
                    onBajaTotal={setLoteBajaTotal}
                    puedeEditar={puedeEditar}
                    puedeEliminar={puedeEliminar}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: C.surfaceHigh }}>
                  <td colSpan={4} style={{ ...tdStyle, fontWeight: 700, color: C.textSecondary, borderTop: `2px solid ${C.border}` }}>
                    {q ? `TOTALES (${lotesFiltrados.length} de ${lotes.length})` : 'TOTALES'}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: C.accent, fontFamily: "'Courier New', monospace", borderTop: `2px solid ${C.border}` }}>
                    {fmt(filtradoEnvases, 0)}
                  </td>
                  <td style={{ ...tdStyle, borderTop: `2px solid ${C.border}` }} />
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: C.accent, fontFamily: "'Courier New', monospace", borderTop: `2px solid ${C.border}` }}>
                    {fmt(filtradoKilos, 3)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: C.green, fontFamily: "'Courier New', monospace", borderTop: `2px solid ${C.border}` }}>
                    {fmt(filtradoToneladas, 3)}
                  </td>
                  <td style={{ ...tdStyle, borderTop: `2px solid ${C.border}` }} />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL NUEVO LOTE */}
      <Modal open={modalNuevo} onClose={() => setModalNuevo(false)} title="Agregar Lote al Stock">
        <FormNuevoLote onSubmit={handleCrear} onClose={() => setModalNuevo(false)} />
      </Modal>

      {/* MODAL REDUCIR ENVASES */}
      <Modal
        open={!!loteReducir}
        onClose={() => setLoteReducir(null)}
        title="Reducir Stock — Baja Parcial"
      >
        {loteReducir && (
          <FormReducirEnvases
            lote={loteReducir}
            onSubmit={handleReducir}
            onClose={() => setLoteReducir(null)}
          />
        )}
      </Modal>

      {/* MODAL BAJA TOTAL */}
      <Modal
        open={!!loteBajaTotal}
        onClose={() => setLoteBajaTotal(null)}
        title="Dar de Baja Total — Confirmación"
      >
        {loteBajaTotal && (
          <ConfirmBajaTotal
            lote={loteBajaTotal}
            onConfirm={handleBajaTotal}
            onClose={() => setLoteBajaTotal(null)}
          />
        )}
      </Modal>

    </div>
  )
}
