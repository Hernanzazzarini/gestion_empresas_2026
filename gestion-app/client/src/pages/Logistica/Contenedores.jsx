import { useState, useEffect } from 'react'
import { Button, Card, Modal } from '../../components/ui'
import { colors as C } from '../../components/ui/tokens'
import FormSeccion1 from './FormSeccion1'
import FormSeccion2 from './FormSeccion2'
import HistorialContenedores from './HistorialContenedores'
import DashboardContenedores from './DashboardContenedores'
import * as svc from '../../services/contenedores'
import { useAuth } from '../../context/AuthContext'

const estadoConfig = {
  pendiente_carga: { label: 'Pendiente Carga', color: '#f59e0b', bg: '#451a03' },
  completado:      { label: 'Completado',      color: '#10b981', bg: '#064e3b' },
}

function EstadoBadge({ estado }) {
  const cfg = estadoConfig[estado] || estadoConfig.pendiente_carga
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
      textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}44`,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

function ContenedorCard({ item, onClick, onExportar }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        background: hover ? C.surfaceHigh : C.surface,
        border: `1px solid ${hover ? C.borderHover : C.border}`,
        borderLeft: `4px solid ${item.estado === 'completado' ? C.green : C.accent}`,
        borderRadius: 12, padding: '16px 18px', cursor: 'pointer',
        transition: 'all 0.18s', display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'Courier New', monospace", fontWeight: 800, color: C.accent, fontSize: 14 }}>
            {item.registro_nro || '—'}
          </span>
          <span style={{ fontFamily: "'Courier New', monospace", fontWeight: 600, color: C.textSecondary, fontSize: 13 }}>
            {item.nro_contenedor || '—'}
          </span>
          <EstadoBadge estado={item.estado} />
          {item.apto_para_cargar !== null && item.apto_para_cargar !== undefined && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              border: `1px solid ${item.apto_para_cargar ? C.green + '44' : C.red + '44'}`,
              color: item.apto_para_cargar ? C.green : C.red,
              background: item.apto_para_cargar ? C.green + '11' : C.red + '11',
            }}>
              {item.apto_para_cargar ? '✅ Apto' : '❌ No Apto'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: C.textSecondary }}>
            📅 {item.fecha ? new Date(item.fecha).toLocaleDateString('es-AR') : '—'}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onExportar(item) }}
            style={{
              background: 'transparent', border: `1px solid ${C.border}`,
              borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
              fontSize: 12, color: C.textSecondary, fontFamily: 'inherit',
            }}
          >
            📄 PDF
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.textSecondary, flexWrap: 'wrap' }}>
        <span>🚛 {item.empresa_transportista || '—'}</span>
        <span>👤 {item.chofer || '—'}</span>
        {item.lote && <span>📦 Lote: {item.lote}</span>}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {[
          { label: 'Inspección', done: true },
          { label: 'Carga',      done: item.estado === 'completado' },
        ].map((paso, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: paso.done ? C.green : C.border,
              boxShadow: paso.done ? `0 0 5px ${C.green}` : 'none',
            }} />
            <span style={{ fontSize: 11, color: paso.done ? C.green : C.textMuted }}>{paso.label}</span>
            {i === 0 && <span style={{ color: C.border, fontSize: 10, marginLeft: 2 }}>—</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

const roles = [
  { id: 'inocuidad', label: 'Inocuidad', icon: '🛡️' },
  { id: 'logistica', label: 'Logística', icon: '🚛' },
]

const tabs = [
  { id: 'registros',  label: 'Registros',  icon: '📋' },
  { id: 'historial',  label: 'Historial',  icon: '🗂️' },
  { id: 'dashboard',  label: 'Dashboard',  icon: '📊' },
]

export default function Contenedores() {
  const { puede } = useAuth()
  const [items, setItems]               = useState([])
  const [rol, setRol]                   = useState('inocuidad')
  const [tab, setTab]                   = useState('registros')
  const [cargando, setCargando]         = useState(true)
  const [error, setError]               = useState('')
  const [seleccionado, setSeleccionado] = useState(null)
  const [modalNuevo, setModalNuevo]     = useState(false)
  const [modalSec1, setModalSec1]       = useState(false)
  const [modalSec2, setModalSec2]       = useState(false)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try {
      setCargando(true)
      setError('')
      const data = await svc.fetchContenedores()
      setItems(data)
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setCargando(false)
    }
  }

  const abrirDetalle = async (item) => {
    try {
      const data = await svc.fetchContenedor(item.id)
      setSeleccionado(data)
      if (rol === 'inocuidad') setModalSec1(true)
      else if (rol === 'logistica' && item.estado === 'pendiente_carga') setModalSec2(true)
      else setModalSec1(true)
    } catch {
      alert('Error al cargar el registro.')
    }
  }

  const handleCrear = async (form) => {
    try {
      const nuevo = await svc.crearContenedor(form)
      setItems(prev => [nuevo, ...prev])
      setModalNuevo(false)
    } catch {
      alert('Error al crear el registro.')
    }
  }

  const handleEditarSec1 = async (form) => {
    try {
      await svc.actualizarSeccion1(seleccionado.id, form)
      await cargar()
      setModalSec1(false)
    } catch {
      alert('Error al guardar los cambios.')
    }
  }

  const handleCompletarSec2 = async (form) => {
    try {
      await svc.completarSeccion2(seleccionado.id, form)
      await cargar()
      setModalSec2(false)
    } catch {
      alert('Error al guardar los cambios.')
    }
  }

  const cargarFotoBase64 = async (url) => {
    try {
      const res  = await fetch(url)
      const blob = await res.blob()
      return new Promise((resolve) => {
        const reader    = new FileReader()
        reader.onload  = () => resolve(reader.result)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })
    } catch {
      return null
    }
  }
  
  const handleExportarPDF = async (item) => {
    try {
      const data = await svc.fetchContenedor(item.id)
      const s2   = data.seccion2 || {}
  
      // Pre-cargar todas las fotos como base64
      const fotosBase64 = {}
      for (const key of ['foto1', 'foto2', 'foto3', 'foto4']) {
        if (s2[key]) {
          fotosBase64[key] = await cargarFotoBase64(s2[key])
        }
      }
  
      // Armar data con fotos en base64
      const dataConFotos = {
        ...data,
        seccion2: { ...s2, ...fotosBase64 },
      }
  
      const { exportarContenedorPDF } = await import('./ExportarPDF')
      exportarContenedorPDF(dataConFotos)
  
    } catch (err) {
      console.error(err)
      alert('Error al exportar el PDF.')
    }
  }

  const stats = [
    { label: 'Total',           value: items.length,                                            color: C.textPrimary },
    { label: 'Pendiente Carga', value: items.filter(i => i.estado === 'pendiente_carga').length, color: C.accent     },
    { label: 'Completados',     value: items.filter(i => i.estado === 'completado').length,      color: C.green      },
    { label: 'No Aptos',        value: items.filter(i => i.apto_para_cargar === 0).length,       color: C.red        },
  ]

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          Logística
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: C.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
          Control de Contenedores
        </h1>
      </div>

      {/* TABS */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 10, padding: 5, width: 'fit-content',
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? C.accent : 'transparent',
              color: tab === t.id ? '#0f1117' : C.textSecondary,
              border: 'none', borderRadius: 7, padding: '7px 16px',
              cursor: 'pointer', fontSize: 13, fontWeight: 700,
              fontFamily: 'inherit', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB HISTORIAL ── */}
      {tab === 'historial' && (
        <HistorialContenedores
          items={items}
          onExportar={handleExportarPDF}
        />
      )}

      {/* ── TAB DASHBOARD ── */}
      {tab === 'dashboard' && (
        <DashboardContenedores items={items} />
      )}

      {/* ── TAB REGISTROS ── */}
      {tab === 'registros' && (
        <>
          {/* Selector Rol */}
          <div style={{
            display: 'flex', gap: 8, marginBottom: 20,
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: 6, width: 'fit-content',
          }}>
            {roles.map(r => (
              <button
                key={r.id}
                onClick={() => setRol(r.id)}
                style={{
                  background: rol === r.id ? C.accent : 'transparent',
                  color: rol === r.id ? '#0f1117' : C.textSecondary,
                  border: 'none', borderRadius: 7, padding: '7px 14px',
                  cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  fontFamily: 'inherit', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {r.icon} {r.label}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {stats.map(s => (
              <Card key={s.label} style={{ padding: '14px 18px' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: s.color, fontFamily: "'Courier New', monospace", lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {s.label}
                </div>
              </Card>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            {rol === 'inocuidad' && puede('contenedores', 'editar') && (
              <Button onClick={() => setModalNuevo(true)}>+ Nuevo Control</Button>
            )}
          </div>

          {/* Lista */}
          {cargando && (
            <Card style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 13, color: C.textSecondary }}>Cargando registros...</div>
            </Card>
          )}
          {error && !cargando && (
            <Card style={{ textAlign: 'center', padding: 48, borderColor: C.red }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.red }}>{error}</div>
              <Button variant="secondary" style={{ marginTop: 16 }} onClick={cargar}>🔄 Reintentar</Button>
            </Card>
          )}
          {!cargando && !error && (
            items.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: 48 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🚛</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary }}>No hay registros todavía</div>
                <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 6 }}>
                  {rol === 'inocuidad' ? 'Creá el primer control con el botón + Nuevo Control.' : 'Inocuidad debe crear el registro primero.'}
                </div>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.map(item => (
                  <ContenedorCard
                    key={item.id}
                    item={item}
                    rol={rol}
                    onClick={() => abrirDetalle(item)}
                    onExportar={handleExportarPDF}
                  />
                ))}
              </div>
            )
          )}
        </>
      )}

      {/* MODALES */}
      <Modal open={modalNuevo} onClose={() => setModalNuevo(false)} title="Nuevo Control — Sección 1 (Inocuidad)">
        <FormSeccion1
          registroNro={`REG-${String(items.length + 1).padStart(3, '0')}`}
          onClose={() => setModalNuevo(false)}
          onSubmit={handleCrear}
        />
      </Modal>

      <Modal open={modalSec1} onClose={() => setModalSec1(false)} title={`Control — Sección 1 | ${seleccionado?.nro_contenedor || ''}`}>
        {seleccionado && (
          <FormSeccion1
            registroNro={seleccionado.registro_nro}
            inicial={seleccionado.seccion1 ? { ...seleccionado, ...seleccionado.seccion1 } : seleccionado}
            onClose={() => setModalSec1(false)}
            onSubmit={handleEditarSec1}
            modoEdicion
          />
        )}
      </Modal>
      {/* MODAL SECCIÓN 2 */}
      <Modal
         open={modalSec2}
         onClose={() => setModalSec2(false)}
         title={`Control — Sección 2 | ${seleccionado?.nro_contenedor || ''}`}
      >
        {seleccionado && (
          <FormSeccion2
            contenedorId={seleccionado.id}
            inicial={seleccionado.seccion2 || undefined}
            onClose={() => setModalSec2(false)}
            onSubmit={handleCompletarSec2}
            modoEdicion={!!seleccionado.seccion2}
          />
        )}
      </Modal>


      

      

    </div>
  )
}