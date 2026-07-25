import { useState, useEffect, useMemo } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Button, Card } from '../../components/ui'
import { colors as C } from '../../components/ui/tokens'
import { fetchLotes } from '../../services/stock'

const CALIBRES = [
  '30-35', '38-42', '40-50', '50-60', '60-70', '80-100',
  'SPLIT FINO', 'SPLIT GRUESO', 'CAIDA', 'OTROS',
]

const fmt = (n, dec = 2) =>
  Number(n).toLocaleString('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec })

const fmtPDF = (n, dec = 2) =>
  Number(n).toFixed(dec).replace('.', ',')

const labelStyle = {
  fontSize: 12, color: C.textSecondary, fontWeight: 600,
  marginBottom: 5, display: 'block',
}
const fieldStyle = {
  width: '100%', background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 8, padding: '9px 12px', color: C.textPrimary,
  fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
}
const thStyle = {
  padding: '10px 14px', textAlign: 'left', fontSize: 11,
  color: C.textSecondary, fontWeight: 700, letterSpacing: '0.07em',
  textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`,
  background: C.surface, whiteSpace: 'nowrap',
}
const tdStyle = {
  padding: '11px 14px', borderBottom: `1px solid ${C.border}`,
  fontSize: 13, color: C.textPrimary, verticalAlign: 'middle',
}

// ─── PDF EXPORT ────────────────────────────────────────────────────────────────
function generarPDF(lotesFiltrados, filtros) {
  const COLOR = {
    negro:      [15,  17,  23],
    superficie: [24,  28,  39],
    borde:      [42,  48,  69],
    acento:     [245, 158, 11],
    azul:       [59,  130, 246],
    verde:      [16,  185, 129],
    gris:       [100, 116, 139],
    blanco:     [241, 245, 249],
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()

  const fondo = () => {
    doc.setFillColor(...COLOR.negro)
    doc.rect(0, 0, W, H, 'F')
  }

  const addPie = () => {
    const total = doc.internal.getNumberOfPages()
    for (let i = 1; i <= total; i++) {
      doc.setPage(i)
      doc.setFillColor(...COLOR.superficie)
      doc.rect(0, H - 10, W, 10, 'F')
      doc.setFontSize(7)
      doc.setTextColor(...COLOR.gris)
      const hoy = new Date().toLocaleDateString('es-AR')
      doc.text(`GestiónPro — Reporte de Stock — Generado: ${hoy}`, 10, H - 4)
      doc.text(`Página ${i} de ${total}`, W - 10, H - 4, { align: 'right' })
    }
  }

  // ── PÁGINA 1 ─────────────────────────────────────────────────────────────────
  fondo()

  // Encabezado
  doc.setFillColor(...COLOR.superficie)
  doc.rect(0, 0, W, 28, 'F')
  doc.setFillColor(...COLOR.acento)
  doc.rect(0, 0, 4, 28, 'F')
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLOR.acento)
  doc.text('REPORTE DE CONTROL DE STOCK', 12, 10)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLOR.gris)
  const hoy = new Date().toLocaleDateString('es-AR')
  doc.text(`Generado: ${hoy}`, 12, 17)

  // Filtros activos
  const filtrosActivos = []
  if (filtros.calibre)      filtrosActivos.push(`Calibre: ${filtros.calibre}`)
  if (filtros.anio_cosecha) filtrosActivos.push(`Año cosecha: ${filtros.anio_cosecha}`)
  if (filtros.ubicacion)    filtrosActivos.push(`Ubicación: "${filtros.ubicacion}"`)
  const filtroTexto = filtrosActivos.length > 0
    ? `Filtros aplicados: ${filtrosActivos.join(' | ')}`
    : 'Sin filtros aplicados — todos los lotes'
  doc.setFontSize(8)
  doc.setTextColor(...COLOR.gris)
  doc.text(filtroTexto, 12, 23)

  // Resumen global (derecha)
  const totalEnvases   = lotesFiltrados.reduce((s, l) => s + Number(l.stock_envases), 0)
  const totalTn        = lotesFiltrados.reduce((s, l) => s + Number(l.toneladas_totales), 0)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLOR.blanco)
  doc.text(`${lotesFiltrados.length} lotes`, W - 12, 10, { align: 'right' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLOR.gris)
  doc.text(`${fmtPDF(totalEnvases, 0)} envases  ·  ${fmtPDF(totalTn, 3)} tn`, W - 12, 17, { align: 'right' })

  let y = 34

  // ── TABLA PRINCIPAL ──────────────────────────────────────────────────────────
  const head = [['N° LOTE', 'CALIBRE', 'AÑO COSECHA', 'UBICACIÓN', 'STOCK ENV.', 'KG × UNIDAD', 'KILOS TOTALES', 'TONELADAS']]
  const body = lotesFiltrados.map(l => [
    l.nro_lote,
    l.calibre,
    String(l.anio_cosecha),
    l.ubicacion,
    fmtPDF(l.stock_envases, 0),
    fmtPDF(l.kilos_por_unidad, 3),
    fmtPDF(l.kilos_totales, 3),
    fmtPDF(l.toneladas_totales, 3),
  ])

  // Fila de totales
  body.push([
    { content: 'TOTALES', colSpan: 4, styles: { fontStyle: 'bold', textColor: COLOR.acento, halign: 'right' } },
    { content: fmtPDF(totalEnvases, 0), styles: { fontStyle: 'bold', textColor: COLOR.acento, halign: 'right' } },
    { content: '', styles: {} },
    { content: fmtPDF(lotesFiltrados.reduce((s, l) => s + Number(l.kilos_totales), 0), 3), styles: { fontStyle: 'bold', textColor: COLOR.acento, halign: 'right' } },
    { content: fmtPDF(totalTn, 3), styles: { fontStyle: 'bold', textColor: COLOR.verde, halign: 'right' } },
  ])

  autoTable(doc, {
    startY: y,
    head,
    body,
    theme: 'plain',
    styles: {
      fillColor:   COLOR.superficie,
      textColor:   COLOR.blanco,
      fontSize:    8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor:  COLOR.borde,
      textColor:  COLOR.acento,
      fontStyle:  'bold',
      fontSize:   8,
    },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: 'bold', textColor: COLOR.acento },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 26, halign: 'right' },
      6: { cellWidth: 26, halign: 'right' },
      7: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: COLOR.verde },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === body.length - 1) {
        data.cell.styles.fillColor = [30, 35, 50]
        data.cell.styles.lineWidth = { top: 0.3 }
        data.cell.styles.lineColor = COLOR.acento
      }
    },
    // Pinta el fondo negro en las páginas que la tabla cree al desbordarse.
    // La página 1 (pageNumber === 1) ya tiene fondo + encabezado, no la tocamos.
    willDrawPage: (data) => { if (data.pageNumber > 1) fondo() },
    margin: { left: 10, right: 10, top: 10, bottom: 14 },
  })

  y = doc.lastAutoTable.finalY + 14

  // ── TONELADAS POR CALIBRE ────────────────────────────────────────────────────
  const porCalibre = CALIBRES.reduce((acc, cal) => {
    const tn = lotesFiltrados
      .filter(l => l.calibre === cal)
      .reduce((s, l) => s + Number(l.toneladas_totales), 0)
    if (tn > 0) acc.push([cal, fmtPDF(tn, 3) + ' tn', String(lotesFiltrados.filter(l => l.calibre === cal).length)])
    return acc
  }, [])

  if (porCalibre.length > 0) {
    if (y + 40 > H - 14) { doc.addPage(); fondo(); y = 20 }

    doc.setFillColor(...COLOR.superficie)
    doc.roundedRect(10, y - 2, W - 20, 8, 1, 1, 'F')
    doc.setFillColor(...COLOR.azul)
    doc.rect(10, y - 2, 3, 8, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLOR.azul)
    doc.text('TONELADAS POR CALIBRE', 17, y + 3.5)
    y += 10

    autoTable(doc, {
      startY: y,
      head: [['CALIBRE', 'TONELADAS', 'LOTES']],
      body: porCalibre,
      theme: 'plain',
      styles: {
        fillColor:   COLOR.superficie,
        textColor:   COLOR.blanco,
        fontSize:    8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor:  COLOR.borde,
        textColor:  COLOR.azul,
        fontStyle:  'bold',
        fontSize:   8,
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30, halign: 'right', fontStyle: 'bold', textColor: COLOR.verde },
        2: { cellWidth: 20, halign: 'center', textColor: COLOR.gris },
      },
      tableWidth: 100,
      willDrawPage: (data) => { if (data.pageNumber > 1) fondo() },
      margin: { left: 10, top: 10, bottom: 14 },
    })
  }

  addPie()
  const fechaArchivo = new Date().toISOString().slice(0, 10)
  doc.save(`reporte_stock_${fechaArchivo}.pdf`)
}

// ─── PÁGINA ────────────────────────────────────────────────────────────────────
export default function ReporteStock() {
  const [lotes,    setLotes]    = useState([])
  const [cargando, setCargando] = useState(true)
  const [error,    setError]    = useState('')

  const [filtroCalibre, setFiltroCalibre]   = useState('')
  const [filtroAnio,    setFiltroAnio]      = useState('')
  const [filtroUbicacion, setFiltroUbicacion] = useState('')

  useEffect(() => {
    fetchLotes()
      .then(setLotes)
      .catch(() => setError('No se pudo conectar con el servidor.'))
      .finally(() => setCargando(false))
  }, [])

  const aniosDisponibles = useMemo(() => {
    const set = new Set(lotes.map(l => l.anio_cosecha).filter(Boolean))
    return [...set].sort((a, b) => b - a)
  }, [lotes])

  const lotesFiltrados = useMemo(() => {
    return lotes.filter(l => {
      if (filtroCalibre && l.calibre !== filtroCalibre) return false
      if (filtroAnio    && String(l.anio_cosecha) !== filtroAnio) return false
      if (filtroUbicacion && !l.ubicacion.toLowerCase().includes(filtroUbicacion.toLowerCase())) return false
      return true
    })
  }, [lotes, filtroCalibre, filtroAnio, filtroUbicacion])

  const totalEnvases   = lotesFiltrados.reduce((s, l) => s + Number(l.stock_envases),   0)
  const totalKilos     = lotesFiltrados.reduce((s, l) => s + Number(l.kilos_totales),    0)
  const totalToneladas = totalKilos / 1000

  const porCalibre = CALIBRES.reduce((acc, cal) => {
    const tn = lotesFiltrados
      .filter(l => l.calibre === cal)
      .reduce((s, l) => s + Number(l.toneladas_totales), 0)
    if (tn > 0) acc.push({ calibre: cal, toneladas: tn })
    return acc
  }, [])

  const handleExportar = () => {
    generarPDF(lotesFiltrados, {
      calibre:      filtroCalibre,
      anio_cosecha: filtroAnio,
      ubicacion:    filtroUbicacion,
    })
  }

  const limpiarFiltros = () => {
    setFiltroCalibre('')
    setFiltroAnio('')
    setFiltroUbicacion('')
  }

  const hayFiltros = filtroCalibre || filtroAnio || filtroUbicacion

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          Logística
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: C.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
            Reporte de Stock
          </h1>
          <Button onClick={handleExportar} disabled={cargando || lotesFiltrados.length === 0}>
            ⬇ Exportar PDF
          </Button>
        </div>
      </div>

      {/* FILTROS */}
      <Card style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
          Filtros
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label style={labelStyle}>Calibre</label>
            <select style={fieldStyle} value={filtroCalibre} onChange={e => setFiltroCalibre(e.target.value)}>
              <option value="">Todos</option>
              {CALIBRES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Año Cosecha</label>
            <select style={fieldStyle} value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}>
              <option value="">Todos</option>
              {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Ubicación</label>
            <input
              style={fieldStyle}
              placeholder="Buscar por ubicación..."
              value={filtroUbicacion}
              onChange={e => setFiltroUbicacion(e.target.value)}
            />
          </div>
          {hayFiltros && (
            <button
              onClick={limpiarFiltros}
              style={{
                background: 'transparent', border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '9px 14px', cursor: 'pointer',
                fontSize: 13, color: C.textSecondary, fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              ✕ Limpiar
            </button>
          )}
        </div>
        {hayFiltros && (
          <div style={{ marginTop: 10, fontSize: 12, color: C.textSecondary }}>
            Mostrando <strong style={{ color: C.accent }}>{lotesFiltrados.length}</strong> de {lotes.length} lotes
          </div>
        )}
      </Card>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Lotes',           value: lotesFiltrados.length,    unit: '',    color: C.textPrimary },
          { label: 'Total Envases',   value: fmt(totalEnvases, 0),      unit: 'env', color: C.accent      },
          { label: 'Total Toneladas', value: fmt(totalToneladas, 3),    unit: 'tn',  color: C.green       },
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
        <Card style={{ marginBottom: 20, padding: '16px 20px' }}>
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

      {/* TABLA */}
      {cargando && (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 13, color: C.textSecondary }}>Cargando datos...</div>
        </Card>
      )}
      {error && !cargando && (
        <Card style={{ textAlign: 'center', padding: 48, borderColor: C.red }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.red }}>{error}</div>
        </Card>
      )}
      {!cargando && !error && lotesFiltrados.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary }}>
            {hayFiltros ? 'No hay lotes que coincidan con los filtros' : 'No hay lotes en stock'}
          </div>
          {hayFiltros && (
            <button
              onClick={limpiarFiltros}
              style={{
                marginTop: 14, background: 'transparent', border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '8px 18px', cursor: 'pointer',
                fontSize: 13, color: C.textSecondary, fontFamily: 'inherit',
              }}
            >
              Limpiar filtros
            </button>
          )}
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
                </tr>
              </thead>
              <tbody>
                {lotesFiltrados.map(lote => (
                  <tr key={lote.id}>
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
                    <td style={{ ...tdStyle, textAlign: 'center', fontFamily: "'Courier New', monospace", color: C.textSecondary }}>
                      {lote.anio_cosecha}
                    </td>
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
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: C.surfaceHigh }}>
                  <td colSpan={4} style={{ ...tdStyle, fontWeight: 700, color: C.textSecondary, borderTop: `2px solid ${C.border}` }}>
                    TOTALES
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: C.accent, fontFamily: "'Courier New', monospace", borderTop: `2px solid ${C.border}` }}>
                    {fmt(totalEnvases, 0)}
                  </td>
                  <td style={{ ...tdStyle, borderTop: `2px solid ${C.border}` }} />
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: C.accent, fontFamily: "'Courier New', monospace", borderTop: `2px solid ${C.border}` }}>
                    {fmt(totalKilos, 3)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: C.green, fontFamily: "'Courier New', monospace", borderTop: `2px solid ${C.border}` }}>
                    {fmt(totalToneladas, 3)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

    </div>
  )
}
