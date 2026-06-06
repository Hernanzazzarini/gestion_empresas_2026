import { useState, useMemo } from 'react'
import { Input, Card } from '../../components/ui'
import { colors as C } from '../../components/ui/tokens'

const estadoConfig = {
  pendiente_carga: { label: 'Pendiente Carga', color: '#f59e0b', bg: '#451a03' },
  completado:      { label: 'Completado',      color: '#10b981', bg: '#064e3b' },
}

function EstadoBadge({ estado }) {
  const cfg = estadoConfig[estado] || estadoConfig.pendiente_carga
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
      textTransform: 'uppercase', padding: '2px 8px', borderRadius: 20,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}44`,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

const COLUMNAS = [
  { key: 'registro_nro',        label: 'Registro',    width: '90px'  },
  { key: 'nro_contenedor',      label: 'Contenedor',  width: '110px' },
  { key: 'fecha',               label: 'Fecha',       width: '80px'  },
  { key: 'empresa_transportista', label: 'Empresa',   width: '1fr'   },
  { key: 'chofer',              label: 'Chofer',      width: '1fr'   },
  { key: 'lote',                label: 'Lote',        width: '110px' },
  { key: 'calibre',             label: 'Calibre',     width: '80px'  },
  { key: 'estado',              label: 'Estado',      width: '110px' },
  { key: 'apto_para_cargar',    label: 'Apto',        width: '90px'  },
  { key: 'acciones',            label: '',            width: '50px'  },
]

const gridTemplate = COLUMNAS.map(c => c.width).join(' ')

export default function HistorialContenedores({ items, onExportar }) {
  const [filtroLote,    setFiltroLote]    = useState('')
  const [filtroFecha,   setFiltroFecha]   = useState('')
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [filtroContenedor, setFiltroContenedor] = useState('')
  const [seleccionado,  setSeleccionado]  = useState(null)

  // ── Filtrar ──
  const filtrados = useMemo(() => {
    return items.filter(item => {
      const matchLote = !filtroLote ||
        (item.lote || '').toLowerCase().includes(filtroLote.toLowerCase())
      const matchFecha = !filtroFecha ||
        (item.fecha || '').slice(0, 10) === filtroFecha
      const matchEmpresa = !filtroEmpresa ||
        (item.empresa_transportista || '').toLowerCase().includes(filtroEmpresa.toLowerCase())
      const matchContenedor = !filtroContenedor ||
        (item.nro_contenedor || '').toLowerCase().includes(filtroContenedor.toLowerCase())
      return matchLote && matchFecha && matchEmpresa && matchContenedor
    })
  }, [items, filtroLote, filtroFecha, filtroEmpresa, filtroContenedor])

  const limpiarFiltros = () => {
    setFiltroLote('')
    setFiltroFecha('')
    setFiltroEmpresa('')
    setFiltroContenedor('')
    setSeleccionado(null)
  }

  const hayFiltros = filtroLote || filtroFecha || filtroEmpresa || filtroContenedor

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* FILTROS */}
      <Card style={{ padding: 20 }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: C.textSecondary,
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14,
        }}>
          🔍 Filtros
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
          <Input
            label="Nº de Lote"
            placeholder="Ej: FR04025H26"
            value={filtroLote}
            onChange={e => setFiltroLote(e.target.value)}
          />
          <Input
            label="Fecha"
            type="date"
            value={filtroFecha}
            onChange={e => setFiltroFecha(e.target.value)}
          />
          <Input
            label="Empresa Transportista"
            placeholder="Nombre de la empresa"
            value={filtroEmpresa}
            onChange={e => setFiltroEmpresa(e.target.value)}
          />
          <Input
            label="Nº Contenedor"
            placeholder="Ej: TCKU1234567"
            value={filtroContenedor}
            onChange={e => setFiltroContenedor(e.target.value)}
          />
        </div>
        {hayFiltros && (
          <button
            onClick={limpiarFiltros}
            style={{
              marginTop: 12, background: 'transparent',
              border: `1px solid ${C.border}`, borderRadius: 7,
              padding: '6px 14px', color: C.textSecondary,
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ✕ Limpiar filtros
          </button>
        )}
      </Card>

      {/* BARRA RESULTADO + EXPORTAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, color: C.textSecondary }}>
          {filtrados.length} registro{filtrados.length !== 1 ? 's' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}
          {hayFiltros && (
            <span style={{ color: C.accent, marginLeft: 6 }}>
              (filtrado de {items.length} total)
            </span>
          )}
        </div>
        {seleccionado && (
          <button
            onClick={() => onExportar(seleccionado)}
            style={{
              background: C.accent, color: '#0f1117',
              border: 'none', borderRadius: 8,
              padding: '8px 16px', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            📄 Exportar PDF — {seleccionado.registro_nro}
          </button>
        )}
      </div>

      {/* TABLA */}
      {filtrados.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🗂️</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary }}>
            No hay registros
          </div>
          <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 6 }}>
            {hayFiltros ? 'Intentá con otros filtros.' : 'Aún no hay contenedores registrados.'}
          </div>
        </Card>
      ) : (
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, overflow: 'auto',
        }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: gridTemplate,
            gap: 8, padding: '10px 16px',
            background: C.surfaceHigh,
            borderBottom: `1px solid ${C.border}`,
            minWidth: 900,
          }}>
            {COLUMNAS.map(col => (
              <div key={col.key} style={{
                fontSize: 10, fontWeight: 700, color: C.textSecondary,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {col.label}
              </div>
            ))}
          </div>

          {/* Filas */}
          {filtrados.map(item => {
            const isSelected = seleccionado?.id === item.id
            return (
              <div
                key={item.id}
                onClick={() => setSeleccionado(isSelected ? null : item)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: gridTemplate,
                  gap: 8, padding: '12px 16px',
                  borderBottom: `1px solid ${C.border}`,
                  cursor: 'pointer',
                  background: isSelected ? `${C.accent}11` : 'transparent',
                  borderLeft: isSelected ? `3px solid ${C.accent}` : '3px solid transparent',
                  transition: 'all 0.15s',
                  minWidth: 900,
                }}
              >
                {/* Registro */}
                <div style={{
                  fontFamily: "'Courier New', monospace",
                  fontWeight: 800, color: C.accent, fontSize: 12,
                }}>
                  {item.registro_nro || '—'}
                </div>

                {/* Contenedor */}
                <div style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 11, color: C.textPrimary, fontWeight: 600,
                }}>
                  {item.nro_contenedor || '—'}
                </div>

                {/* Fecha */}
                <div style={{ fontSize: 12, color: C.textSecondary }}>
                  {item.fecha ? new Date(item.fecha).toLocaleDateString('es-AR') : '—'}
                </div>

                {/* Empresa */}
                <div style={{
                  fontSize: 12, color: C.textPrimary,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.empresa_transportista || '—'}
                </div>

                {/* Chofer */}
                <div style={{
                  fontSize: 12, color: C.textSecondary,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.chofer || '—'}
                </div>

                {/* Lote */}
                <div style={{
                  fontSize: 12, color: C.textPrimary, fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.lote ? (
                    <span style={{
                      background: `${C.purple}22`, color: C.purple,
                      padding: '2px 8px', borderRadius: 6,
                      fontSize: 11, fontWeight: 700,
                    }}>
                      {item.lote}
                    </span>
                  ) : '—'}
                </div>

                {/* Calibre */}
                <div style={{ fontSize: 12, color: C.textSecondary }}>
                  {item.calibre || '—'}
                </div>

                {/* Estado */}
                <div><EstadoBadge estado={item.estado} /></div>

                {/* Apto */}
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  color: item.apto_para_cargar === 1 ? C.green
                       : item.apto_para_cargar === 0 ? C.red
                       : C.textMuted,
                }}>
                  {item.apto_para_cargar === 1 ? '✅ Apto'
                  : item.apto_para_cargar === 0 ? '❌ No Apto'
                  : '—'}
                </div>

                {/* PDF */}
                <div>
                  <button
                    onClick={e => { e.stopPropagation(); onExportar(item) }}
                    title="Exportar PDF"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${C.border}`,
                      borderRadius: 6, padding: '3px 8px',
                      cursor: 'pointer', fontSize: 11,
                      color: C.textSecondary, fontFamily: 'inherit',
                    }}
                  >
                    📄
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TIP */}
      {filtrados.length > 0 && !seleccionado && (
        <div style={{ fontSize: 12, color: C.textMuted, textAlign: 'center' }}>
          Hacé click en una fila para seleccionarla y exportar su PDF
        </div>
      )}

    </div>
  )
}