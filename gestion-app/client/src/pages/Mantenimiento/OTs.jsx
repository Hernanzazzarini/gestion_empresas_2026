import { useState, useEffect } from 'react'
import { Badge, PrioridadDot, Button, Input, Select, Card, Modal } from '../../components/ui'
import { estadoConfig, prioridades, colors as C } from '../../components/ui/tokens'
import FormNuevaOT from './FormNuevaOT'
import DetalleOT from './DetalleOT'
import * as otsService from '../../services/ots'
import { useAuth } from '../../context/AuthContext'

// ─── ROLES ────────────────────────────────────────────────────────────────────
const roles = [
  { id: 'solicitante',   label: 'Área Solicitante', icon: '📋' },
  { id: 'mantenimiento', label: 'Mantenimiento',     icon: '🔧' },
  { id: 'inocuidad',     label: 'Inocuidad',         icon: '🛡️' },
]

// ─── TARJETA OT ───────────────────────────────────────────────────────────────
function OTCard({ ot, onClick }) {
  const [hover, setHover] = useState(false)
  const prioridad = prioridades.find(p => p.id === ot.prioridad) || prioridades[2]

  const pasos = [
    { label: 'Creada',   done: true },
    { label: 'Mant.',    done: !!ot.fechaRealizacion },
    { label: 'Inocuid.', done: ot.okInocuidad },
    { label: 'OK',       done: ot.okSolicitante },
  ]

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? C.surfaceHigh : C.surface,
        border: `1px solid ${hover ? C.borderHover : C.border}`,
        borderLeft: `4px solid ${prioridad.color}`,
        borderRadius: 12,
        padding: '16px 18px',
        cursor: 'pointer',
        transition: 'all 0.18s',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: "'Courier New', monospace",
            fontWeight: 800,
            color: C.accent,
            fontSize: 14,
          }}>
            {ot.id}
          </span>
          <Badge estado={ot.estado} />
        </div>
        <PrioridadDot id={ot.prioridad} />
      </div>

      <div style={{ fontSize: 14, color: C.textPrimary, fontWeight: 600, lineHeight: 1.4 }}>
        {ot.tarea}
      </div>

      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.textSecondary, flexWrap: 'wrap' }}>
        <span>📍 {ot.area}</span>
        <span>📅 {ot.fecha}</span>
        <span>👤 {ot.solicitante}</span>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {pasos.map((paso, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: paso.done ? C.green : C.border,
              boxShadow: paso.done ? `0 0 5px ${C.green}` : 'none',
              transition: 'all 0.2s',
            }} />
            <span style={{ fontSize: 11, color: paso.done ? C.green : C.textMuted }}>
              {paso.label}
            </span>
            {i < pasos.length - 1 && (
              <span style={{ color: C.border, fontSize: 10, marginLeft: 2 }}>—</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function OTs() {
  const { puede } = useAuth()
  const [ots, setOts]                   = useState([])
  const [rol, setRol]                   = useState('solicitante')
  const [filtroEstado, setFiltroEstado] = useState('all')
  const [busqueda, setBusqueda]         = useState('')
  const [otSeleccionada, setOtSeleccionada] = useState(null)
  const [modalNuevaOT, setModalNuevaOT] = useState(false)
  const [cargando, setCargando]         = useState(true)
  const [error, setError]               = useState('')

  // ── Cargar OTs al iniciar ──
  useEffect(() => {
    cargarOTs()
  }, [])

  const cargarOTs = async () => {
    try {
      setCargando(true)
      setError('')
      const data = await otsService.fetchOTs()
      setOts(data)
    } catch (err) {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setCargando(false)
    }
  }

  // ── Crear OT ──
  const handleCrearOT = async (form) => {
    try {
      const nueva = await otsService.crearOT(form)
      setOts(prev => [nueva, ...prev])
      setModalNuevaOT(false)
    } catch (err) {
      alert('Error al crear la OT. Verificá que el servidor esté corriendo.')
    }
  }

  // ── Actualizar OT ──
  const handleUpdateOT = async (id, data) => {
    try {
      const actualizada = await otsService.actualizarOT(id, data)
      setOts(prev => prev.map(o => o.id === id ? actualizada : o))
      setOtSeleccionada(prev => prev?.id === id ? actualizada : prev)
    } catch (err) {
      alert('Error al actualizar la OT.')
    }
  }

  // ── Filtros ──
  const otsFiltradas = ots.filter(ot => {
    const matchEstado = filtroEstado === 'all' || ot.estado === filtroEstado
    const q = busqueda.toLowerCase()
    const matchBusqueda = !q ||
      ot.id.toLowerCase().includes(q) ||
      ot.tarea.toLowerCase().includes(q) ||
      ot.area.toLowerCase().includes(q) ||
      ot.solicitante.toLowerCase().includes(q)
    return matchEstado && matchBusqueda
  })

  // ── Stats ──
  const stats = [
    { label: 'Total',      value: ots.length,                                       color: C.textPrimary },
    { label: 'Pendientes', value: ots.filter(o => o.estado === 'pendiente').length,  color: C.accent      },
    { label: 'En proceso', value: ots.filter(o => o.estado === 'en_proceso').length, color: C.blue        },
    { label: 'Cerradas',   value: ots.filter(o => o.estado === 'cerrado').length,    color: C.green       },
  ]

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 13,
          color: C.accent,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}>
          Mantenimiento
        </div>
        <h1 style={{
          fontSize: 28,
          fontWeight: 900,
          color: C.textPrimary,
          margin: 0,
          letterSpacing: '-0.02em',
        }}>
          Órdenes de Trabajo
        </h1>
      </div>

      {/* SELECTOR DE ROL */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: 6,
        width: 'fit-content',
      }}>
        {roles.map(r => (
          <button
            key={r.id}
            onClick={() => setRol(r.id)}
            style={{
              background: rol === r.id ? C.accent : 'transparent',
              color: rol === r.id ? '#0f1117' : C.textSecondary,
              border: 'none',
              borderRadius: 7,
              padding: '7px 14px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'inherit',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {r.icon} {r.label}
          </button>
        ))}
      </div>

      {/* STATS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        marginBottom: 24,
      }}>
        {stats.map(s => (
          <Card key={s.label} style={{ padding: '14px 18px' }}>
            <div style={{
              fontSize: 26,
              fontWeight: 900,
              color: s.color,
              fontFamily: "'Courier New', monospace",
              lineHeight: 1,
            }}>
              {s.value}
            </div>
            <div style={{
              fontSize: 11,
              color: C.textSecondary,
              marginTop: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {s.label}
            </div>
          </Card>
        ))}
      </div>

      {/* TOOLBAR */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 20,
        flexWrap: 'wrap',
        alignItems: 'flex-end',
      }}>
        <Input
          placeholder="🔍  Buscar por ID, tarea, área, solicitante..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <Select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          style={{ width: 200 }}
        >
          <option value="all">Todos los estados</option>
          {Object.entries(estadoConfig).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </Select>

        {(rol === 'solicitante' || rol === 'mantenimiento') && puede('mantenimiento', 'editar') && (
          <Button onClick={() => setModalNuevaOT(true)}>
            + Nueva OT
          </Button>
        )}
      </div>

      {/* ESTADOS DE CARGA Y ERROR */}
      {cargando && (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 13, color: C.textSecondary }}>
            Cargando órdenes de trabajo...
          </div>
        </Card>
      )}

      {error && !cargando && (
        <Card style={{ textAlign: 'center', padding: 48, borderColor: C.red }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.red }}>
            {error}
          </div>
          <Button
            variant="secondary"
            style={{ marginTop: 16 }}
            onClick={cargarOTs}
          >
            🔄 Reintentar
          </Button>
        </Card>
      )}

      {/* LISTA */}
      {!cargando && !error && (
        otsFiltradas.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary }}>
              No hay órdenes de trabajo
            </div>
            <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 6 }}>
              {busqueda || filtroEstado !== 'all'
                ? 'Intentá con otros filtros.'
                : 'Creá la primera OT con el botón + Nueva OT.'}
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {otsFiltradas.map(ot => (
              <OTCard
                key={ot.id}
                ot={ot}
                onClick={() => setOtSeleccionada(ot)}
              />
            ))}
          </div>
        )
      )}

      {/* MODAL NUEVA OT */}
      <Modal
        open={modalNuevaOT}
        onClose={() => setModalNuevaOT(false)}
        title="Nueva Orden de Trabajo"
      >
        <FormNuevaOT
          onClose={() => setModalNuevaOT(false)}
          onSubmit={handleCrearOT}
        />
      </Modal>

      {/* MODAL DETALLE OT */}
      <Modal
        open={!!otSeleccionada}
        onClose={() => setOtSeleccionada(null)}
        title={`Detalle — ${otSeleccionada?.id || ''}`}
      >
        {otSeleccionada && (
          <DetalleOT
            ot={otSeleccionada}
            rol={rol}
            onUpdateOT={handleUpdateOT}
            onClose={() => setOtSeleccionada(null)}
          />
        )}
      </Modal>

    </div>
  )
}