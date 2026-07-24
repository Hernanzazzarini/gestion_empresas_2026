import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuth } from '../../context/AuthContext'
import {
  listarReclamos, obtenerReclamo, crearReclamo, actualizarReclamo,
  cambiarEstado, agregarAdjunto, eliminarAdjunto, eliminarReclamo, notificarManual,
} from '../../services/reclamos'

const API_UPLOADS = 'http://localhost:3000/uploads'

// Paleta del PDF: mismo tema oscuro que el checklist/desvíos, pero con el
// acento celeste que identifica a Reclamos.
const PDF = {
  negro:      [15,  17,  23],
  superficie: [24,  28,  39],
  borde:      [42,  48,  69],
  acento:     [8,   145, 178],
  gris:       [148, 163, 184],
  blanco:     [241, 245, 249],
}

// ─── Catálogos ───────────────────────────────────────────────────────────────
const TIPOS         = ['Formal', 'No Formal']
const DESTINATARIOS = ['Produccion', 'Logistica', 'Calidad']
const MOTIVOS       = ['Calidad', 'Carga', 'Plagas', 'Envases']
const GRAVEDADES    = ['Menor', 'Mayor', 'Critico']
const ESTADOS       = ['Abierto', 'En tratamiento', 'Cerrado']

// ─── Colores ─────────────────────────────────────────────────────────────────
const gravedadColor = { Menor: '#16a34a', Mayor: '#d97706', Critico: '#dc2626' }
const estadoColor   = { 'Abierto': '#3b82f6', 'En tratamiento': '#eab308', 'Cerrado': '#16a34a' }

const esImagen = (p) => /\.(jpe?g|png|gif|webp)$/i.test(p || '')

const Badge = ({ label, color }) => (
  <span style={{
    display: 'inline-block', padding: '2px 10px', borderRadius: 20,
    fontSize: 12, fontWeight: 700,
    background: color + '22', color,
    border: `1px solid ${color}44`,
  }}>{label}</span>
)

// ─── Estilos compartidos ─────────────────────────────────────────────────────
const card  = { background: '#181c27', borderRadius: 12, border: '1px solid #2a3045', padding: 24 }
const label = { display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }
const input = {
  width: '100%', background: '#0f1117', border: '1px solid #2a3045',
  borderRadius: 8, padding: '8px 12px', color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box',
}
const textarea = { ...input, minHeight: 80, resize: 'vertical' }
const select   = { ...input }
const sectionTitle = {
  fontSize: 13, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase',
  letterSpacing: '0.08em', marginBottom: 12, marginTop: 4,
}
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }
const grid3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }

// ─── Formulario 5 Porqués ────────────────────────────────────────────────────
const Form5Porques = ({ data, onChange }) => {
  const set = (k) => (e) => onChange({ ...data, [k]: e.target.value })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <div key={n}>
          <label style={label}>¿Por qué {n}?</label>
          <input style={input} value={data[`por${n}`] || ''} onChange={set(`por${n}`)} />
        </div>
      ))}
      <div>
        <label style={label}>Causa raíz identificada</label>
        <textarea style={textarea} value={data.causa_final || ''} onChange={set('causa_final')} />
      </div>
    </div>
  )
}

// ─── Formulario Espina de Pescado ────────────────────────────────────────────
const ESPINA_CATS = [
  { k: 'metodo',         label: 'Método' },
  { k: 'maquina',        label: 'Máquina' },
  { k: 'material',       label: 'Material' },
  { k: 'mano_obra',      label: 'Mano de obra' },
  { k: 'medio_ambiente', label: 'Medio ambiente' },
  { k: 'medicion',       label: 'Medición' },
]

const FormEspina = ({ data, onChange }) => {
  const set = (k) => (e) => onChange({ ...data, [k]: e.target.value })
  return (
    <div style={grid2}>
      {ESPINA_CATS.map(cat => (
        <div key={cat.k}>
          <label style={label}>{cat.label}</label>
          <textarea style={{ ...textarea, minHeight: 60 }} value={data[cat.k] || ''} onChange={set(cat.k)} />
        </div>
      ))}
    </div>
  )
}

// ─── Formulario Reclamo (crear / editar) ─────────────────────────────────────
const FORM_INIT = {
  fecha_reclamo: '', tipo: '', codigo: '', origen_cliente: '',
  destinatario: '', lote_reclamado: '', anio_lote: '', motivo: '',
  descripcion: '', gravedad: '', observaciones: '',
  estado: 'Abierto', fecha_cierre: '',
  metodo_causa_raiz: '5porques', causa_raiz_data: {},
  accion_preventiva: '', accion_correctiva: '', responsable_area: '',
  destinatarios: '',
}

const FormReclamo = ({ initial, onSuccess, onClose }) => {
  const [form, setForm]   = useState(initial ?? FORM_INIT)
  const [error, setError] = useState('')
  const [busy, setBusy]   = useState(false)
  const esEdicion = !!initial?.id

  const set = (k) => (e) => {
    const val = e.target.value
    setForm(f => ({
      ...f,
      [k]: val,
      ...(k === 'metodo_causa_raiz' ? { causa_raiz_data: {} } : {}),
    }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const payload = { ...form }
      const result = esEdicion
        ? await actualizarReclamo(initial.id, payload)
        : await crearReclamo(payload)
      onSuccess(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Sección 1 — Datos del reclamo */}
      <div style={card}>
        <p style={sectionTitle}>Datos del reclamo</p>
        <div style={grid3}>
          <div>
            <label style={label}>Fecha del reclamo *</label>
            <input type="date" style={input} value={form.fecha_reclamo} onChange={set('fecha_reclamo')} required />
          </div>
          <div>
            <label style={label}>Tipo *</label>
            <select style={select} value={form.tipo} onChange={set('tipo')} required>
              <option value="">Seleccionar...</option>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Código *</label>
            <input style={input} value={form.codigo} onChange={set('codigo')} placeholder="Código del reclamo" required />
          </div>
        </div>
        <div style={{ ...grid3, marginTop: 16 }}>
          <div>
            <label style={label}>Origen / Cliente *</label>
            <input style={input} value={form.origen_cliente} onChange={set('origen_cliente')} placeholder="Cliente que reclama" required />
          </div>
          <div>
            <label style={label}>Destinatario *</label>
            <select style={select} value={form.destinatario} onChange={set('destinatario')} required>
              <option value="">Seleccionar...</option>
              {DESTINATARIOS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Motivo *</label>
            <select style={select} value={form.motivo} onChange={set('motivo')} required>
              <option value="">Seleccionar...</option>
              {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div style={{ ...grid3, marginTop: 16 }}>
          <div>
            <label style={label}>Lote reclamado *</label>
            <input style={input} value={form.lote_reclamado} onChange={set('lote_reclamado')} placeholder="N° de lote" required />
          </div>
          <div>
            <label style={label}>Año del lote *</label>
            <input type="number" style={input} value={form.anio_lote} onChange={set('anio_lote')}
              placeholder="2025" min="2000" max="2100" required />
          </div>
          <div>
            <label style={label}>Gravedad *</label>
            <select style={select} value={form.gravedad} onChange={set('gravedad')} required>
              <option value="">Seleccionar...</option>
              {GRAVEDADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div style={{ ...grid2, marginTop: 16 }}>
          <div>
            <label style={label}>Estado *</label>
            <select style={select} value={form.estado} onChange={set('estado')} required>
              {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Fecha de cierre *</label>
            <input type="date" style={input} value={form.fecha_cierre} onChange={set('fecha_cierre')} required />
          </div>
        </div>
      </div>

      {/* Sección 2 — Descripción */}
      <div style={card}>
        <p style={sectionTitle}>Descripción del reclamo</p>
        <textarea style={{ ...textarea, minHeight: 100 }}
          value={form.descripcion} onChange={set('descripcion')}
          placeholder="Describí el reclamo recibido..." required />
        <div style={{ marginTop: 12 }}>
          <label style={label}>Observaciones (opcional)</label>
          <textarea style={textarea} value={form.observaciones} onChange={set('observaciones')}
            placeholder="Observaciones adicionales..." />
        </div>
      </div>

      {/* Sección 3 — Causa raíz */}
      <div style={card}>
        <p style={sectionTitle}>Análisis de causa raíz</p>
        <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
          {[
            { value: '5porques', label: '5 Porqués' },
            { value: 'espina',   label: 'Espina de pescado (Ishikawa)' },
          ].map(opt => (
            <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#f1f5f9', fontSize: 14 }}>
              <input type="radio" name="metodo" value={opt.value}
                checked={form.metodo_causa_raiz === opt.value}
                onChange={set('metodo_causa_raiz')} />
              {opt.label}
            </label>
          ))}
        </div>
        {form.metodo_causa_raiz === '5porques'
          ? <Form5Porques data={form.causa_raiz_data} onChange={cr => setForm(f => ({ ...f, causa_raiz_data: cr }))} />
          : <FormEspina   data={form.causa_raiz_data} onChange={cr => setForm(f => ({ ...f, causa_raiz_data: cr }))} />
        }
      </div>

      {/* Sección 4 — Acciones */}
      <div style={card}>
        <p style={sectionTitle}>Acciones</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={label}>Acción correctiva (opcional)</label>
            <textarea style={textarea} value={form.accion_correctiva} onChange={set('accion_correctiva')}
              placeholder="Describí la acción correctiva..." />
          </div>
          <div>
            <label style={label}>Acción preventiva (opcional)</label>
            <textarea style={textarea} value={form.accion_preventiva} onChange={set('accion_preventiva')}
              placeholder="Describí la acción preventiva..." />
          </div>
          <div>
            <label style={label}>Responsable / Área *</label>
            <input style={input} value={form.responsable_area} onChange={set('responsable_area')}
              placeholder="Responsable y área" required />
          </div>
        </div>
      </div>

      {/* Sección 5 — Notificaciones */}
      <div style={card}>
        <p style={sectionTitle}>Notificaciones por email</p>
        <label style={label}>Destinatarios (emails separados por coma)</label>
        <input style={input} value={form.destinatarios} onChange={set('destinatarios')}
          placeholder="email1@empresa.com, email2@empresa.com" />
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
          Opcional. Se valida el formato de cada correo y se envía un aviso automático al registrar el reclamo.
        </p>
      </div>

      {error && (
        <div style={{ background: '#dc262622', border: '1px solid #dc2626', borderRadius: 8, padding: '10px 16px', color: '#fca5a5', fontSize: 14 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose}
          style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #2a3045', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>
          Cancelar
        </button>
        <button type="submit" disabled={busy}
          style={{ padding: '10px 24px', background: busy ? '#92400e' : '#f59e0b', border: 'none', borderRadius: 8, color: '#0f1117', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', fontSize: 14 }}>
          {busy ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Registrar reclamo'}
        </button>
      </div>
    </form>
  )
}

// ─── Detalle ───────────────────────────────────────────────────────────────────
const InfoRow = ({ label: lbl, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lbl}</span>
    <span style={{ fontSize: 14, color: '#f1f5f9' }}>{value || '—'}</span>
  </div>
)

const exportarPDF = async (reclamo) => {
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // Fondo oscuro en toda la página (igual que el checklist / desvíos).
  const fondo = () => {
    doc.setFillColor(...PDF.negro)
    doc.rect(0, 0, pageW, pageH, 'F')
  }
  // Páginas ya pintadas: evita repintar (y borrar) una página con contenido.
  const paginasPintadas = new Set()
  const pintarPagina = () => {
    const n = doc.getCurrentPageInfo().pageNumber
    if (paginasPintadas.has(n)) return
    fondo()
    paginasPintadas.add(n)
  }
  pintarPagina()

  // Header
  doc.setFillColor(...PDF.superficie)
  doc.rect(0, 0, pageW, 40, 'F')
  doc.setFillColor(...PDF.acento)
  doc.rect(0, 0, 4, 40, 'F')
  doc.setTextColor(...PDF.acento)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(`Reclamo ${reclamo.nroReclamo}`, 14, 16)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...PDF.gris)
  doc.text(`${reclamo.destinatario}  |  ${reclamo.motivo}  |  ${new Date(reclamo.fechaReclamo).toLocaleDateString('es-AR')}`, 14, 26)
  doc.text(`Estado: ${reclamo.estado}  |  Gravedad: ${reclamo.gravedad}`, 14, 34)

  let y = 48
  const addSection = (title, rows) => {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...PDF.acento)
    doc.text(title, 14, y)
    y += 2
    autoTable(doc, {
      startY: y,
      head: [],
      body: rows,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 4, fillColor: PDF.superficie, textColor: PDF.blanco },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55, fillColor: PDF.borde, textColor: PDF.acento } },
      margin: { left: 14, right: 14, top: 14 },
      // Si la tabla desborda a una página nueva, pintar su fondo oscuro
      // ANTES de dibujar las celdas (si no, quedaría blanca).
      willDrawPage: pintarPagina,
    })
    y = doc.lastAutoTable.finalY + 10
  }

  addSection('Información general', [
    ['N° Reclamo',    reclamo.nroReclamo],
    ['Fecha',         new Date(reclamo.fechaReclamo).toLocaleDateString('es-AR')],
    ['Tipo',          reclamo.tipo],
    ['Código',        reclamo.codigo],
    ['Cliente / Origen', reclamo.origenCliente],
    ['Destinatario',  reclamo.destinatario],
    ['Lote reclamado', `${reclamo.loteReclamado} (${reclamo.anioLote})`],
    ['Motivo',        reclamo.motivo],
    ['Gravedad',      reclamo.gravedad],
    ['Estado',        reclamo.estado],
    ['Fecha de cierre', reclamo.fechaCierre ? new Date(reclamo.fechaCierre).toLocaleDateString('es-AR') : '—'],
  ])

  addSection('Descripción', [['Descripción', reclamo.descripcion]])
  if (reclamo.observaciones) addSection('Observaciones', [['Observaciones', reclamo.observaciones]])

  // Causa raíz
  const crData = reclamo.causaRaizData || {}
  if (reclamo.metodoCausaRaiz === '5porques') {
    const porques = [1,2,3,4,5].filter(n => crData[`por${n}`]).map(n => [`¿Por qué ${n}?`, crData[`por${n}`]])
    if (crData.causa_final) porques.push(['Causa raíz', crData.causa_final])
    if (porques.length) addSection('Análisis causa raíz — 5 Porqués', porques)
  } else {
    const cats = ESPINA_CATS.filter(c => crData[c.k]).map(c => [c.label, crData[c.k]])
    if (cats.length) addSection('Análisis causa raíz — Espina de pescado', cats)
  }

  const acciones = []
  if (reclamo.accionCorrectiva) acciones.push(['Acción correctiva', reclamo.accionCorrectiva])
  if (reclamo.accionPreventiva) acciones.push(['Acción preventiva', reclamo.accionPreventiva])
  acciones.push(['Responsable / Área', reclamo.responsableArea])
  addSection('Acciones', acciones)

  // Adjuntos e imágenes
  const adjuntos = reclamo.adjuntos || []
  if (adjuntos.length) {
    addSection('Archivos adjuntos', adjuntos.map(a => [
      a.tipo === 'reclamo' ? 'Reclamo' : 'Evidencia',
      a.nombre_original || a.archivo_path,
    ]))

    for (const a of adjuntos.filter(x => esImagen(x.archivo_path))) {
      try {
        const url  = `${API_UPLOADS}/${a.archivo_path}`
        const resp = await fetch(url)
        const blob = await resp.blob()
        const dataUrl = await new Promise(resolve => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(blob)
        })
        if (y + 80 > pageH - 20) { doc.addPage(); pintarPagina(); y = 20 }
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...PDF.gris)
        doc.text(`${a.tipo === 'reclamo' ? 'Reclamo' : 'Evidencia'}: ${a.nombre_original || ''}`, 14, y)
        y += 4
        doc.addImage(dataUrl, 'JPEG', 14, y, 80, 60)
        y += 68
      } catch { /* imagen no accesible, se omite */ }
    }
  }

  doc.save(`Reclamo-${reclamo.nroReclamo}.pdf`)
}

// Bloque de adjuntos (subida + grilla) por tipo
const AdjuntosBloque = ({ titulo, tipo, adjuntos, onUpload, onDelete, uploading, readOnly }) => (
  <div style={card}>
    <p style={sectionTitle}>{titulo}</p>
    {!readOnly && (
      <label style={{
        display: 'inline-block', padding: '8px 18px',
        background: uploading ? '#374151' : '#1e293b',
        border: '1px dashed #475569', borderRadius: 8, color: '#94a3b8',
        cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 13, marginBottom: 16,
      }}>
        {uploading ? 'Subiendo...' : '+ Subir archivo'}
        <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
          onChange={(e) => onUpload(e, tipo)} disabled={uploading} />
      </label>
    )}

    {adjuntos.length > 0 ? (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {adjuntos.map(a => (
          <div key={a.id} style={{ position: 'relative' }}>
            {esImagen(a.archivo_path) ? (
              <a href={`${API_UPLOADS}/${a.archivo_path}`} target="_blank" rel="noreferrer">
                <img src={`${API_UPLOADS}/${a.archivo_path}`} alt={a.nombre_original}
                  style={{ width: 160, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #2a3045' }} />
              </a>
            ) : (
              <a href={`${API_UPLOADS}/${a.archivo_path}`} target="_blank" rel="noreferrer"
                style={{
                  width: 160, height: 120, borderRadius: 8, border: '1px solid #2a3045',
                  background: '#0f1117', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none',
                }}>
                <span style={{ fontSize: 32 }}>📄</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Ver PDF</span>
              </a>
            )}
            {!readOnly && (
              <button onClick={() => onDelete(a.id)}
                style={{ position: 'absolute', top: 4, right: 4, background: '#dc262688', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', padding: '2px 6px', fontSize: 12 }}>
                ✕
              </button>
            )}
            <p style={{ fontSize: 11, color: '#64748b', marginTop: 4, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {a.nombre_original}
            </p>
          </div>
        ))}
      </div>
    ) : (
      <p style={{ color: '#475569', fontSize: 13 }}>Sin archivos cargados.</p>
    )}
  </div>
)

const DetalleReclamo = ({ reclamo: initialReclamo, onClose, onUpdate, onEdit }) => {
  const { puede } = useAuth()
  const puedeEditar = puede('reclamos', 'editar')
  const [reclamo, setReclamo]       = useState(initialReclamo)
  const [uploading, setUploading]   = useState(false)
  const [estadoEdit, setEstadoEdit] = useState({ estado: reclamo.estado, fecha: reclamo.fechaCierre || '' })
  const [busyEstado, setBusyEstado] = useState(false)
  const [busyNotif, setBusyNotif]   = useState(false)
  const [notifMsg, setNotifMsg]     = useState('')
  const [err, setErr]               = useState('')
  const [exportando, setExportando] = useState(false)

  const reload = async () => {
    const fresh = await obtenerReclamo(reclamo.id)
    setReclamo(fresh)
    onUpdate(fresh)
  }

  // La lista sólo trae contadores de adjuntos; al abrir el detalle
  // re-consultamos el registro completo (incluye el array de adjuntos).
  useEffect(() => {
    obtenerReclamo(initialReclamo.id).then(setReclamo).catch(() => {})
  }, [initialReclamo.id])

  const handleUpload = async (e, tipo) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setErr('')
    try {
      const updated = await agregarAdjunto(reclamo.id, file, tipo)
      setReclamo(updated); onUpdate(updated)
    } catch (err2) { setErr(err2.message) }
    finally { setUploading(false); e.target.value = '' }
  }

  const handleDeleteAdjunto = async (adjId) => {
    if (!confirm('¿Eliminar este archivo?')) return
    setErr('')
    try {
      await eliminarAdjunto(reclamo.id, adjId)
      await reload()
    } catch (err2) { setErr(err2.message) }
  }

  const handleEstado = async () => {
    setBusyEstado(true); setErr('')
    try {
      const updated = await cambiarEstado(reclamo.id, estadoEdit.estado, estadoEdit.fecha)
      setReclamo(updated); onUpdate(updated)
    } catch (err2) { setErr(err2.message) }
    finally { setBusyEstado(false) }
  }

  const handleNotif = async () => {
    setBusyNotif(true); setNotifMsg(''); setErr('')
    try {
      const r = await notificarManual()
      setNotifMsg(r.mensaje)
    } catch (err2) { setErr(err2.message) }
    finally { setBusyNotif(false) }
  }

  const handleExport = async () => {
    setExportando(true)
    try { await exportarPDF(reclamo) }
    catch (err2) { setErr(err2.message) }
    finally { setExportando(false) }
  }

  const cr = reclamo.causaRaizData || {}
  const reclamoAdjuntos = reclamo.reclamoAdjuntos || (reclamo.adjuntos || []).filter(a => a.tipo === 'reclamo')
  const evidencias      = reclamo.evidencias      || (reclamo.adjuntos || []).filter(a => a.tipo === 'evidencia')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>{reclamo.nroReclamo}</span>
        <Badge label={reclamo.tipo} color="#0891b2" />
        <Badge label={reclamo.gravedad} color={gravedadColor[reclamo.gravedad] || '#64748b'} />
        <Badge label={reclamo.estado}   color={estadoColor[reclamo.estado] || '#64748b'} />
      </div>

      {/* Info general */}
      <div style={card}>
        <p style={sectionTitle}>Información general</p>
        <div style={grid3}>
          <InfoRow label="Fecha"        value={reclamo.fechaReclamo ? new Date(reclamo.fechaReclamo + 'T00:00:00').toLocaleDateString('es-AR') : '—'} />
          <InfoRow label="Tipo"         value={reclamo.tipo} />
          <InfoRow label="Código"       value={reclamo.codigo} />
          <InfoRow label="Cliente / Origen" value={reclamo.origenCliente} />
          <InfoRow label="Destinatario" value={reclamo.destinatario} />
          <InfoRow label="Motivo"       value={reclamo.motivo} />
          <InfoRow label="Lote"         value={reclamo.loteReclamado} />
          <InfoRow label="Año lote"     value={reclamo.anioLote} />
          <InfoRow label="Gravedad"     value={reclamo.gravedad} />
          <InfoRow label="Fecha cierre" value={reclamo.fechaCierre ? new Date(reclamo.fechaCierre + 'T00:00:00').toLocaleDateString('es-AR') : '—'} />
          <InfoRow label="Registrado"   value={reclamo.creadoEn ? new Date(reclamo.creadoEn).toLocaleDateString('es-AR') : '—'} />
        </div>
      </div>

      {/* Descripción */}
      <div style={card}>
        <p style={sectionTitle}>Descripción del reclamo</p>
        <p style={{ color: '#f1f5f9', fontSize: 14, lineHeight: 1.6 }}>{reclamo.descripcion}</p>
        {reclamo.observaciones && (
          <div style={{ marginTop: 12, borderTop: '1px solid #2a3045', paddingTop: 12 }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>Observaciones</span>
            <p style={{ color: '#f1f5f9', fontSize: 14, margin: '2px 0 0', lineHeight: 1.6 }}>{reclamo.observaciones}</p>
          </div>
        )}
      </div>

      {/* Causa raíz */}
      <div style={card}>
        <p style={sectionTitle}>Análisis causa raíz — {reclamo.metodoCausaRaiz === '5porques' ? '5 Porqués' : 'Espina de pescado'}</p>
        {reclamo.metodoCausaRaiz === '5porques' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1,2,3,4,5].map(n => cr[`por${n}`] && (
              <div key={n}>
                <span style={{ fontSize: 11, color: '#64748b' }}>¿Por qué {n}?</span>
                <p style={{ color: '#f1f5f9', fontSize: 14, margin: '2px 0 0' }}>{cr[`por${n}`]}</p>
              </div>
            ))}
            {cr.causa_final && (
              <div style={{ marginTop: 4, borderTop: '1px solid #2a3045', paddingTop: 8 }}>
                <span style={{ fontSize: 11, color: '#f59e0b' }}>Causa raíz identificada</span>
                <p style={{ color: '#f1f5f9', fontSize: 14, margin: '2px 0 0' }}>{cr.causa_final}</p>
              </div>
            )}
          </div>
        ) : (
          <div style={grid2}>
            {ESPINA_CATS.map(cat => cr[cat.k] && (
              <div key={cat.k}>
                <span style={{ fontSize: 11, color: '#64748b' }}>{cat.label}</span>
                <p style={{ color: '#f1f5f9', fontSize: 14, margin: '2px 0 0' }}>{cr[cat.k]}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div style={card}>
        <p style={sectionTitle}>Acciones</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reclamo.accionCorrectiva && (
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Acción correctiva</span>
              <p style={{ color: '#f1f5f9', fontSize: 14, margin: '2px 0 0', lineHeight: 1.6 }}>{reclamo.accionCorrectiva}</p>
            </div>
          )}
          {reclamo.accionPreventiva && (
            <div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Acción preventiva</span>
              <p style={{ color: '#f1f5f9', fontSize: 14, margin: '2px 0 0', lineHeight: 1.6 }}>{reclamo.accionPreventiva}</p>
            </div>
          )}
          <InfoRow label="Responsable / Área" value={reclamo.responsableArea} />
        </div>
      </div>

      {/* Estado */}
      {puedeEditar && (
      <div style={card}>
        <p style={sectionTitle}>Estado</p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={label}>Estado</label>
            <select style={select} value={estadoEdit.estado}
              onChange={e => setEstadoEdit(s => ({ ...s, estado: e.target.value }))}>
              {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>Fecha de cierre</label>
            <input type="date" style={input} value={estadoEdit.fecha}
              onChange={e => setEstadoEdit(s => ({ ...s, fecha: e.target.value }))} />
          </div>
          <button onClick={handleEstado} disabled={busyEstado}
            style={{ padding: '8px 18px', background: '#f59e0b', border: 'none', borderRadius: 8, color: '#0f1117', fontWeight: 700, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>
            {busyEstado ? 'Guardando...' : 'Actualizar'}
          </button>
        </div>
      </div>
      )}

      {/* Adjuntos del reclamo */}
      <AdjuntosBloque
        titulo="Archivos adjuntos del reclamo"
        tipo="reclamo"
        adjuntos={reclamoAdjuntos}
        onUpload={handleUpload}
        onDelete={handleDeleteAdjunto}
        uploading={uploading}
        readOnly={!puedeEditar}
      />

      {/* Evidencias */}
      <AdjuntosBloque
        titulo="Evidencias"
        tipo="evidencia"
        adjuntos={evidencias}
        onUpload={handleUpload}
        onDelete={handleDeleteAdjunto}
        uploading={uploading}
        readOnly={!puedeEditar}
      />

      {/* Notificación manual */}
      {reclamo.destinatarios && (
        <div style={card}>
          <p style={sectionTitle}>Notificaciones</p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={handleNotif} disabled={busyNotif}
              style={{ padding: '8px 18px', background: '#1e40af', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: busyNotif ? 'not-allowed' : 'pointer', fontSize: 13 }}>
              {busyNotif ? 'Enviando...' : 'Reenviar notificación'}
            </button>
            <span style={{ fontSize: 12, color: '#64748b' }}>{reclamo.destinatarios}</span>
          </div>
          {notifMsg && <p style={{ fontSize: 13, color: '#86efac', marginTop: 8 }}>{notifMsg}</p>}
        </div>
      )}

      {err && (
        <div style={{ background: '#dc262622', border: '1px solid #dc2626', borderRadius: 8, padding: '10px 16px', color: '#fca5a5', fontSize: 14 }}>
          {err}
        </div>
      )}

      {/* Acciones finales */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
        {puedeEditar && (
          <button onClick={() => onEdit(reclamo)}
            style={{ padding: '9px 18px', background: 'transparent', border: '1px solid #f59e0b', borderRadius: 8, color: '#f59e0b', cursor: 'pointer', fontSize: 13 }}>
            Editar
          </button>
        )}
        <button onClick={handleExport} disabled={exportando}
          style={{ padding: '9px 18px', background: exportando ? '#374151' : '#166534', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: exportando ? 'not-allowed' : 'pointer', fontSize: 13 }}>
          {exportando ? 'Generando...' : 'Exportar PDF'}
        </button>
        <button onClick={onClose}
          style={{ padding: '9px 18px', background: 'transparent', border: '1px solid #2a3045', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
          Cerrar
        </button>
      </div>
    </div>
  )
}

// ─── Fila skeleton (carga) ────────────────────────────────────────────────────
const FilaSkeleton = ({ cols }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} style={{ padding: '14px' }}>
        <div style={{ height: 12, borderRadius: 4, background: '#1e293b', animation: 'gpSkeleton 1.2s ease-in-out infinite' }} />
      </td>
    ))}
  </tr>
)

// ─── Panel lateral (slide-in) ─────────────────────────────────────────────────
const Panel = ({ title, onClose, children, wide }) => {
  // Cerrar con Escape + bloquear el scroll del fondo mientras el panel está abierto.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', justifyContent: 'flex-end',
    }}>
      <style>{`
        @keyframes gpBackdrop { from { opacity: 0 } to { opacity: 1 } }
        @keyframes gpSlideIn  { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: '#00000088', animation: 'gpBackdrop 0.2s ease-out' }} />
      <div style={{
        position: 'relative',
        width: wide ? 860 : 740,
        maxWidth: '95vw',
        height: '100%',
        background: '#0f1117',
        borderLeft: '1px solid #2a3045',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        animation: 'gpSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '-20px 0 60px -20px rgba(0,0,0,0.7)',
      }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid #2a3045', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, position: 'sticky', top: 0, background: '#0f1117', zIndex: 1 }}>
          <h2 style={{ color: '#f1f5f9', fontSize: 18, margin: 0 }}>{title}</h2>
          <button onClick={onClose} title="Cerrar (Esc)" style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: 28, flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function Reclamos() {
  const { puede } = useAuth()
  const puedeEditar   = puede('reclamos', 'editar')
  const puedeEliminar = puede('reclamos', 'eliminar')
  const [reclamos, setReclamos]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [filtros, setFiltros]       = useState({ estado: '', tipo: '', destinatario: '', motivo: '', gravedad: '', anio: '' })
  const [anios, setAnios]           = useState([])
  const [panel, setPanel]           = useState(null) // null | 'form' | 'detalle' | 'edit'
  const [selected, setSelected]     = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  // Carga la lista cada vez que cambian los filtros. El guard `vivo` evita que
  // una respuesta tardía pise a la más reciente y actualizar tras desmontar.
  useEffect(() => {
    let vivo = true
    listarReclamos(filtros)
      .then(data => { if (vivo) setReclamos(data) })
      .catch(() => { if (vivo) setReclamos([]) })
      .finally(() => { if (vivo) setLoading(false) })
    return () => { vivo = false }
  }, [filtros])

  // Años disponibles para el filtro (una sola carga, sin filtrar)
  useEffect(() => {
    listarReclamos().then(data => {
      const set = new Set(data.map(r => r.anioLote).filter(Boolean))
      setAnios([...set].sort((a, b) => b - a))
    }).catch(() => {})
  }, [])

  const setFiltro = (k) => (e) => setFiltros(f => ({ ...f, [k]: e.target.value }))
  const hayFiltros = Object.values(filtros).some(Boolean)
  const limpiarFiltros = () => setFiltros({ estado: '', tipo: '', destinatario: '', motivo: '', gravedad: '', anio: '' })

  const handleSuccess = (reclamo) => {
    setReclamos(prev => {
      const idx = prev.findIndex(r => r.id === reclamo.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = reclamo; return next }
      return [reclamo, ...prev]
    })
    setSelected(reclamo)
    setPanel('detalle')
  }

  const handleUpdate = (reclamo) => {
    setReclamos(prev => prev.map(r => r.id === reclamo.id ? reclamo : r))
    setSelected(reclamo)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este reclamo? Esta acción no se puede deshacer.')) return
    setDeletingId(id)
    try {
      await eliminarReclamo(id)
      setReclamos(prev => prev.filter(r => r.id !== id))
      if (selected?.id === id) setPanel(null)
    } catch (err) { alert(err.message) }
    finally { setDeletingId(null) }
  }

  const filterSel = { ...input, width: 'auto', minWidth: 150 }

  return (
    <div>
      <style>{`@keyframes gpSkeleton { 0%,100% { opacity: 0.4 } 50% { opacity: 0.75 } }`}</style>

      {/* Título */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: 24, fontWeight: 800, margin: 0 }}>Reclamos</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>Seguimiento de reclamos de clientes</p>
        </div>
        {puedeEditar && (
          <button onClick={() => { setSelected(null); setPanel('form') }}
            style={{ padding: '10px 20px', background: '#f59e0b', border: 'none', borderRadius: 8, color: '#0f1117', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            + Nuevo reclamo
          </button>
        )}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select style={filterSel} value={filtros.estado}       onChange={setFiltro('estado')}>
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select style={filterSel} value={filtros.tipo}         onChange={setFiltro('tipo')}>
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select style={filterSel} value={filtros.destinatario} onChange={setFiltro('destinatario')}>
          <option value="">Todos los destinatarios</option>
          {DESTINATARIOS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select style={filterSel} value={filtros.motivo}       onChange={setFiltro('motivo')}>
          <option value="">Todos los motivos</option>
          {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select style={filterSel} value={filtros.gravedad}     onChange={setFiltro('gravedad')}>
          <option value="">Todas las gravedades</option>
          {GRAVEDADES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select style={filterSel} value={filtros.anio}         onChange={setFiltro('anio')}>
          <option value="">Todos los años</option>
          {anios.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        {hayFiltros && (
          <button onClick={limpiarFiltros}
            style={{ padding: '8px 14px', background: 'transparent', border: '1px solid #2a3045', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
            ✕ Limpiar
          </button>
        )}
        <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 13 }}>
          {loading ? '' : `${reclamos.length} resultado${reclamos.length === 1 ? '' : 's'}`}
        </span>
      </div>

      {/* Tabla */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a3045' }}>
                {['N° Reclamo', 'Fecha', 'Tipo', 'Cliente', 'Destinatario', 'Motivo', 'Lote', 'Año', 'Gravedad', 'Estado', 'Adjuntos', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <FilaSkeleton key={i} cols={12} />)
              ) : reclamos.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ padding: 48, textAlign: 'center' }}>
                    <div style={{ fontSize: 34, marginBottom: 10 }}>{hayFiltros ? '🔍' : '📋'}</div>
                    <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: hayFiltros ? 14 : 0 }}>
                      {hayFiltros ? 'No hay reclamos que coincidan con los filtros.' : 'Aún no hay reclamos registrados.'}
                    </div>
                    {hayFiltros && (
                      <button onClick={limpiarFiltros}
                        style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #2a3045', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
                        Limpiar filtros
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                reclamos.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #1e293b', cursor: 'pointer' }}
                    onClick={() => { setSelected(r); setPanel('detalle') }}
                    onMouseEnter={e => e.currentTarget.style.background = '#181c27'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 14px', color: '#f59e0b', fontWeight: 600 }}>{r.nroReclamo}</td>
                    <td style={{ padding: '12px 14px', color: '#f1f5f9', whiteSpace: 'nowrap' }}>
                      {r.fechaReclamo ? new Date(r.fechaReclamo + 'T00:00:00').toLocaleDateString('es-AR') : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#f1f5f9' }}>{r.tipo}</td>
                    <td style={{ padding: '12px 14px', color: '#94a3b8', maxWidth: 200 }}>
                      <span title={r.origenCliente}>{r.origenCliente?.length > 30 ? r.origenCliente.slice(0, 30) + '…' : r.origenCliente}</span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#f1f5f9' }}>{r.destinatario}</td>
                    <td style={{ padding: '12px 14px', color: '#f1f5f9' }}>{r.motivo}</td>
                    <td style={{ padding: '12px 14px', color: '#f1f5f9', whiteSpace: 'nowrap' }}>{r.loteReclamado || '—'}</td>
                    <td style={{ padding: '12px 14px', color: '#94a3b8' }}>{r.anioLote || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <Badge label={r.gravedad} color={gravedadColor[r.gravedad] || '#64748b'} />
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <Badge label={r.estado} color={estadoColor[r.estado] || '#64748b'} />
                    </td>
                    <td style={{ padding: '12px 14px', color: '#94a3b8', textAlign: 'center' }}>
                      {(r.adjuntosReclamo > 0 || r.adjuntosEvidencia > 0) ? (
                        <span title={`Reclamo: ${r.adjuntosReclamo} | Evidencia: ${r.adjuntosEvidencia}`}>
                          {(r.adjuntosReclamo + r.adjuntosEvidencia)}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={(e) => { e.stopPropagation(); setSelected(r); setPanel('detalle') }}
                          style={{ padding: '4px 10px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>
                          Ver
                        </button>
                        {puedeEliminar && (
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id) }} disabled={deletingId === r.id}
                            style={{ padding: '4px 10px', background: '#dc262614', border: '1px solid #dc262640', borderRadius: 6, color: '#f87171', cursor: 'pointer', fontSize: 12 }}>
                            {deletingId === r.id ? '...' : 'Eliminar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel Nuevo / Editar */}
      {(panel === 'form' || panel === 'edit') && (
        <Panel
          title={panel === 'edit' ? `Editar ${selected?.nroReclamo}` : 'Nuevo reclamo'}
          onClose={() => setPanel(null)}
          wide
        >
          <FormReclamo
            initial={panel === 'edit' ? {
              id: selected.id,
              fecha_reclamo: selected.fechaReclamo || '',
              tipo: selected.tipo || '',
              codigo: selected.codigo || '',
              origen_cliente: selected.origenCliente || '',
              destinatario: selected.destinatario || '',
              lote_reclamado: selected.loteReclamado || '',
              anio_lote: selected.anioLote || '',
              motivo: selected.motivo || '',
              descripcion: selected.descripcion || '',
              gravedad: selected.gravedad || '',
              observaciones: selected.observaciones || '',
              estado: selected.estado || 'Abierto',
              fecha_cierre: selected.fechaCierre || '',
              metodo_causa_raiz: selected.metodoCausaRaiz || '5porques',
              causa_raiz_data: selected.causaRaizData || {},
              accion_preventiva: selected.accionPreventiva || '',
              accion_correctiva: selected.accionCorrectiva || '',
              responsable_area: selected.responsableArea || '',
              destinatarios: selected.destinatarios || '',
            } : null}
            onSuccess={handleSuccess}
            onClose={() => setPanel(null)}
          />
        </Panel>
      )}

      {/* Panel Detalle */}
      {panel === 'detalle' && selected && (
        <Panel title={`Reclamo ${selected.nroReclamo}`} onClose={() => setPanel(null)} wide>
          <DetalleReclamo
            reclamo={selected}
            onClose={() => setPanel(null)}
            onUpdate={handleUpdate}
            onEdit={(r) => { setSelected(r); setPanel('edit') }}
          />
        </Panel>
      )}
    </div>
  )
}
