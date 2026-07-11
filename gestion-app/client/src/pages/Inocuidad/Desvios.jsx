import { useState, useEffect, useCallback } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  listarDesvios, obtenerDesvio, crearDesvio, actualizarDesvio,
  cambiarEstado, agregarEvidencia, eliminarEvidencia, eliminarDesvio, notificarManual,
} from '../../services/desvios'

const API_UPLOADS = 'http://localhost:3000/uploads'

// ─── Catálogos ───────────────────────────────────────────────────────────────
const ORIGENES = [
  { value: 'I',       label: 'I — Inspecciones' },
  { value: 'AI',      label: 'AI — Auditorías internas' },
  { value: 'OD',      label: 'OD — Operaciones diarias' },
  { value: 'AE',      label: 'AE — Auditoría externa' },
  { value: 'PostPCC', label: 'Post PCC' },
]
const AREAS     = ['Calidad', 'Logistica', 'Mantenimiento', 'Inocuidad', 'Produccion']
const GRAVEDADES = ['Menor', 'Mayor', 'Critico']
const ESTADOS   = ['Abierto', 'En tratamiento', 'Cerrado']

// ─── Colores ─────────────────────────────────────────────────────────────────
const gravedadColor = { Menor: '#16a34a', Mayor: '#d97706', Critico: '#dc2626' }
const estadoColor   = { 'Abierto': '#3b82f6', 'En tratamiento': '#eab308', 'Cerrado': '#16a34a' }

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
  { k: 'metodo',        label: 'Método' },
  { k: 'maquina',       label: 'Máquina' },
  { k: 'material',      label: 'Material' },
  { k: 'mano_obra',     label: 'Mano de obra' },
  { k: 'medio_ambiente', label: 'Medio ambiente' },
  { k: 'medicion',      label: 'Medición' },
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

// ─── Formulario Desvío (crear / editar) ──────────────────────────────────────
const FORM_INIT = {
  fecha: '', origen: '', area: '', descripcion: '',
  accion_correctiva: '', responsable_correctiva: '',
  metodo_causa_raiz: '5porques', causa_raiz_data: {},
  accion_preventiva: '', gravedad: '', responsable_verificar: '',
  estado: 'Abierto', fecha_estado: '', destinatarios: '',
}

const FormDesvio = ({ initial, onSuccess, onClose }) => {
  const [form, setForm]   = useState(initial ?? FORM_INIT)
  const [error, setError] = useState('')
  const [busy, setBusy]   = useState(false)
  const esEdicion = !!initial?.id

  const set = (k) => (e) => {
    const val = e.target.value
    setForm(f => ({
      ...f,
      [k]: val,
      ...(k === 'fecha' ? { anio: val ? new Date(val).getFullYear() : '' } : {}),
      ...(k === 'metodo_causa_raiz' ? { causa_raiz_data: {} } : {}),
    }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const payload = { ...form }
      const result = esEdicion
        ? await actualizarDesvio(initial.id, payload)
        : await crearDesvio(payload)
      onSuccess(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Sección 1 — Datos generales */}
      <div style={card}>
        <p style={sectionTitle}>Datos generales</p>
        <div style={grid3}>
          <div>
            <label style={label}>Fecha *</label>
            <input type="date" style={input} value={form.fecha} onChange={set('fecha')} required />
          </div>
          <div>
            <label style={label}>Origen *</label>
            <select style={select} value={form.origen} onChange={set('origen')} required>
              <option value="">Seleccionar...</option>
              {ORIGENES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Área *</label>
            <select style={select} value={form.area} onChange={set('area')} required>
              <option value="">Seleccionar...</option>
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <div style={{ ...grid3, marginTop: 16 }}>
          <div>
            <label style={label}>Gravedad *</label>
            <select style={select} value={form.gravedad} onChange={set('gravedad')} required>
              <option value="">Seleccionar...</option>
              {GRAVEDADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Estado *</label>
            <select style={select} value={form.estado} onChange={set('estado')} required>
              {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Fecha de estado *</label>
            <input type="date" style={input} value={form.fecha_estado} onChange={set('fecha_estado')} required />
          </div>
        </div>
      </div>

      {/* Sección 2 — Descripción */}
      <div style={card}>
        <p style={sectionTitle}>Descripción del desvío</p>
        <textarea style={{ ...textarea, minHeight: 100 }}
          value={form.descripcion} onChange={set('descripcion')}
          placeholder="Describí el desvío detectado..." required />
      </div>

      {/* Sección 3 — Acción correctiva */}
      <div style={card}>
        <p style={sectionTitle}>Acción correctiva</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={label}>Acción correctiva *</label>
            <textarea style={textarea} value={form.accion_correctiva} onChange={set('accion_correctiva')}
              placeholder="Describí la acción correctiva a implementar..." required />
          </div>
          <div>
            <label style={label}>Responsable de implementar *</label>
            <input style={input} value={form.responsable_correctiva} onChange={set('responsable_correctiva')}
              placeholder="Nombre del responsable" required />
          </div>
        </div>
      </div>

      {/* Sección 4 — Causa raíz */}
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

      {/* Sección 5 — Acción preventiva */}
      <div style={card}>
        <p style={sectionTitle}>Acción preventiva</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={label}>Acción preventiva *</label>
            <textarea style={textarea} value={form.accion_preventiva} onChange={set('accion_preventiva')}
              placeholder="Describí la acción preventiva..." required />
          </div>
          <div>
            <label style={label}>Responsable de verificar *</label>
            <input style={input} value={form.responsable_verificar} onChange={set('responsable_verificar')}
              placeholder="Nombre del responsable de verificar" required />
          </div>
        </div>
      </div>

      {/* Sección 6 — Notificaciones */}
      <div style={card}>
        <p style={sectionTitle}>Notificaciones por email</p>
        <label style={label}>Destinatarios (emails separados por coma)</label>
        <input style={input} value={form.destinatarios} onChange={set('destinatarios')}
          placeholder="email1@empresa.com, email2@empresa.com" />
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
          Se enviará un aviso automático al registrar el desvío.
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
          {busy ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Registrar desvío'}
        </button>
      </div>
    </form>
  )
}

// ─── Detalle Desvío ───────────────────────────────────────────────────────────
const InfoRow = ({ label: lbl, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lbl}</span>
    <span style={{ fontSize: 14, color: '#f1f5f9' }}>{value || '—'}</span>
  </div>
)

const ORIGEN_LABELS = { I: 'Inspecciones', AI: 'Auditorías internas', OD: 'Operaciones diarias', AE: 'Auditoría externa', PostPCC: 'Post PCC' }

const exportarPDF = async (desvio) => {
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()

  // Header
  doc.setFillColor(15, 17, 23)
  doc.rect(0, 0, pageW, 40, 'F')
  doc.setTextColor(245, 158, 11)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(`Desvío ${desvio.nroDesvio}`, 14, 16)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text(`${desvio.area}  |  ${desvio.origenLabel || ORIGEN_LABELS[desvio.origen] || desvio.origen}  |  ${new Date(desvio.fecha).toLocaleDateString('es-AR')}`, 14, 26)
  doc.text(`Estado: ${desvio.estado}  |  Gravedad: ${desvio.gravedad}`, 14, 34)

  let y = 48
  const addSection = (title, rows) => {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(245, 158, 11)
    doc.text(title, 14, y)
    y += 2
    autoTable(doc, {
      startY: y,
      head: [],
      body: rows,
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 4, textColor: [30, 30, 30] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55, fillColor: [240, 240, 240] } },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 10
  }

  addSection('Información general', [
    ['N° Desvío',   desvio.nroDesvio],
    ['Fecha',       new Date(desvio.fecha).toLocaleDateString('es-AR')],
    ['Año',         String(desvio.anio)],
    ['Origen',      desvio.origenLabel || ORIGEN_LABELS[desvio.origen] || desvio.origen],
    ['Área',        desvio.area],
    ['Gravedad',    desvio.gravedad],
    ['Estado',      desvio.estado],
    ['Fecha estado', desvio.fechaEstado ? new Date(desvio.fechaEstado).toLocaleDateString('es-AR') : '—'],
  ])

  addSection('Descripción del desvío', [['Descripción', desvio.descripcion]])

  addSection('Acción correctiva', [
    ['Acción correctiva',    desvio.accionCorrectiva],
    ['Responsable',          desvio.responsableCorrectiva],
  ])

  // Causa raíz
  const crData = desvio.causaRaizData || {}
  if (desvio.metodoCausaRaiz === '5porques') {
    const porques = [1,2,3,4,5].filter(n => crData[`por${n}`]).map(n => [`¿Por qué ${n}?`, crData[`por${n}`]])
    if (crData.causa_final) porques.push(['Causa raíz', crData.causa_final])
    if (porques.length) addSection('Análisis causa raíz — 5 Porqués', porques)
  } else {
    const cats = ESPINA_CATS.filter(c => crData[c.k]).map(c => [c.label, crData[c.k]])
    if (cats.length) addSection('Análisis causa raíz — Espina de pescado', cats)
  }

  addSection('Acción preventiva', [
    ['Acción preventiva',     desvio.accionPreventiva],
    ['Responsable verificar', desvio.responsableVerificar],
  ])

  // Evidencias
  if (desvio.evidencias?.length) {
    const evRows = desvio.evidencias.map(ev => [
      ev.tipo === 'antes' ? 'Antes' : 'Después',
      ev.nombre_original || ev.archivo_path,
    ])
    addSection('Evidencias', evRows)

    // Intentar embeber imágenes
    for (const ev of desvio.evidencias) {
      try {
        const url  = `${API_UPLOADS}/${ev.archivo_path}`
        const resp = await fetch(url)
        const blob = await resp.blob()
        const dataUrl = await new Promise(resolve => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(blob)
        })
        if (y + 80 > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); y = 20 }
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100)
        doc.text(`${ev.tipo === 'antes' ? 'Antes' : 'Después'}: ${ev.nombre_original || ''}`, 14, y)
        y += 4
        doc.addImage(dataUrl, 'JPEG', 14, y, 80, 60)
        y += 68
      } catch { /* imagen no accesible, se omite */ }
    }
  }

  doc.save(`Desvio-${desvio.nroDesvio}.pdf`)
}

const DetalleDesvio = ({ desvio: initialDesvio, onClose, onUpdate, onEdit }) => {
  const [desvio, setDesvio]           = useState(initialDesvio)
  const [uploadTipo, setUploadTipo]   = useState('antes')
  const [uploading, setUploading]     = useState(false)
  const [estadoEdit, setEstadoEdit]   = useState({ estado: desvio.estado, fecha: desvio.fechaEstado || '' })
  const [busyEstado, setBusyEstado]   = useState(false)
  const [busyNotif, setBusyNotif]     = useState(false)
  const [notifMsg, setNotifMsg]       = useState('')
  const [err, setErr]                 = useState('')
  const [exportando, setExportando]   = useState(false)

  const reload = async () => {
    const fresh = await obtenerDesvio(desvio.id)
    setDesvio(fresh)
    onUpdate(fresh)
  }

  // La lista sólo trae contadores de evidencias; al abrir el detalle
  // re-consultamos el registro completo (incluye el array de evidencias).
  useEffect(() => {
    obtenerDesvio(initialDesvio.id).then(setDesvio).catch(() => {})
  }, [initialDesvio.id])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setErr('')
    try {
      const updated = await agregarEvidencia(desvio.id, file, uploadTipo)
      setDesvio(updated); onUpdate(updated)
    } catch (err2) { setErr(err2.message) }
    finally { setUploading(false); e.target.value = '' }
  }

  const handleDeleteEv = async (evId) => {
    if (!confirm('¿Eliminar esta evidencia?')) return
    setErr('')
    try {
      await eliminarEvidencia(desvio.id, evId)
      await reload()
    } catch (err2) { setErr(err2.message) }
  }

  const handleEstado = async () => {
    setBusyEstado(true); setErr('')
    try {
      const updated = await cambiarEstado(desvio.id, estadoEdit.estado, estadoEdit.fecha)
      setDesvio(updated); onUpdate(updated)
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
    try { await exportarPDF(desvio) }
    catch (err2) { setErr(err2.message) }
    finally { setExportando(false) }
  }

  const cr = desvio.causaRaizData || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>{desvio.nroDesvio}</span>
        <Badge label={desvio.gravedad} color={gravedadColor[desvio.gravedad] || '#64748b'} />
        <Badge label={desvio.estado}   color={estadoColor[desvio.estado] || '#64748b'} />
      </div>

      {/* Info general */}
      <div style={card}>
        <p style={sectionTitle}>Información general</p>
        <div style={grid3}>
          <InfoRow label="Fecha"  value={desvio.fecha ? new Date(desvio.fecha + 'T00:00:00').toLocaleDateString('es-AR') : '—'} />
          <InfoRow label="Año"    value={desvio.anio} />
          <InfoRow label="Origen" value={ORIGEN_LABELS[desvio.origen] || desvio.origen} />
          <InfoRow label="Área"   value={desvio.area} />
          <InfoRow label="Gravedad" value={desvio.gravedad} />
          <InfoRow label="Registrado" value={desvio.creadoEn ? new Date(desvio.creadoEn).toLocaleDateString('es-AR') : '—'} />
        </div>
      </div>

      {/* Descripción */}
      <div style={card}>
        <p style={sectionTitle}>Descripción del desvío</p>
        <p style={{ color: '#f1f5f9', fontSize: 14, lineHeight: 1.6 }}>{desvio.descripcion}</p>
      </div>

      {/* Acción correctiva */}
      <div style={card}>
        <p style={sectionTitle}>Acción correctiva</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ color: '#f1f5f9', fontSize: 14, lineHeight: 1.6 }}>{desvio.accionCorrectiva}</p>
          <InfoRow label="Responsable" value={desvio.responsableCorrectiva} />
        </div>
      </div>

      {/* Causa raíz */}
      <div style={card}>
        <p style={sectionTitle}>Análisis causa raíz — {desvio.metodoCausaRaiz === '5porques' ? '5 Porqués' : 'Espina de pescado'}</p>
        {desvio.metodoCausaRaiz === '5porques' ? (
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

      {/* Acción preventiva */}
      <div style={card}>
        <p style={sectionTitle}>Acción preventiva</p>
        <p style={{ color: '#f1f5f9', fontSize: 14, lineHeight: 1.6 }}>{desvio.accionPreventiva}</p>
        <div style={{ marginTop: 8 }}>
          <InfoRow label="Responsable de verificar" value={desvio.responsableVerificar} />
        </div>
      </div>

      {/* Estado */}
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
            <label style={label}>Fecha</label>
            <input type="date" style={input} value={estadoEdit.fecha}
              onChange={e => setEstadoEdit(s => ({ ...s, fecha: e.target.value }))} />
          </div>
          <button onClick={handleEstado} disabled={busyEstado}
            style={{ padding: '8px 18px', background: '#f59e0b', border: 'none', borderRadius: 8, color: '#0f1117', fontWeight: 700, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>
            {busyEstado ? 'Guardando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* Evidencias */}
      <div style={card}>
        <p style={sectionTitle}>Evidencias</p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <select style={{ ...select, width: 160 }} value={uploadTipo} onChange={e => setUploadTipo(e.target.value)}>
            <option value="antes">Antes</option>
            <option value="despues">Después</option>
          </select>
          <label style={{
            padding: '8px 18px', background: uploading ? '#374151' : '#1e293b',
            border: '1px dashed #475569', borderRadius: 8, color: '#94a3b8',
            cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 13,
          }}>
            {uploading ? 'Subiendo...' : '+ Subir imagen'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        {desvio.evidencias?.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {desvio.evidencias.map(ev => (
              <div key={ev.id} style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: 4, left: 4, zIndex: 1 }}>
                  <Badge label={ev.tipo === 'antes' ? 'Antes' : 'Después'}
                    color={ev.tipo === 'antes' ? '#3b82f6' : '#16a34a'} />
                </div>
                <img src={`${API_UPLOADS}/${ev.archivo_path}`} alt={ev.nombre_original}
                  style={{ width: 160, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #2a3045' }} />
                <button onClick={() => handleDeleteEv(ev.id)}
                  style={{ position: 'absolute', top: 4, right: 4, background: '#dc262688', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', padding: '2px 6px', fontSize: 12 }}>
                  ✕
                </button>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 4, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ev.nombre_original}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#475569', fontSize: 13 }}>Sin evidencias cargadas.</p>
        )}
      </div>

      {/* Notificación manual */}
      {desvio.destinatarios && (
        <div style={card}>
          <p style={sectionTitle}>Notificaciones</p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={handleNotif} disabled={busyNotif}
              style={{ padding: '8px 18px', background: '#1e40af', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: busyNotif ? 'not-allowed' : 'pointer', fontSize: 13 }}>
              {busyNotif ? 'Enviando...' : 'Reenviar notificación'}
            </button>
            <span style={{ fontSize: 12, color: '#64748b' }}>{desvio.destinatarios}</span>
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
        <button onClick={() => onEdit(desvio)}
          style={{ padding: '9px 18px', background: 'transparent', border: '1px solid #f59e0b', borderRadius: 8, color: '#f59e0b', cursor: 'pointer', fontSize: 13 }}>
          Editar
        </button>
        {desvio.estado === 'Cerrado' && (
          <button onClick={handleExport} disabled={exportando}
            style={{ padding: '9px 18px', background: exportando ? '#374151' : '#166534', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: exportando ? 'not-allowed' : 'pointer', fontSize: 13 }}>
            {exportando ? 'Generando...' : 'Exportar PDF'}
          </button>
        )}
        <button onClick={onClose}
          style={{ padding: '9px 18px', background: 'transparent', border: '1px solid #2a3045', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
          Cerrar
        </button>
      </div>
    </div>
  )
}

// ─── Panel lateral (slide-in) ─────────────────────────────────────────────────
const Panel = ({ title, onClose, children, wide }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 1000,
    display: 'flex', justifyContent: 'flex-end',
  }}>
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: '#00000088' }} />
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
    }}>
      <div style={{ padding: '20px 28px', borderBottom: '1px solid #2a3045', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <h2 style={{ color: '#f1f5f9', fontSize: 18, margin: 0 }}>{title}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ padding: 28, flex: 1 }}>
        {children}
      </div>
    </div>
  </div>
)

// ─── Componente principal ────────────────────────────────────────────────────
export default function Desvios() {
  const [desvios, setDesvios]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [filtros, setFiltros]     = useState({ estado: '', area: '', gravedad: '', origen: '' })
  const [panel, setPanel]         = useState(null) // null | 'form' | 'detalle' | 'edit'
  const [selected, setSelected]   = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listarDesvios(filtros)
      setDesvios(data)
    } finally { setLoading(false) }
  }, [filtros])

  useEffect(() => { cargar() }, [cargar])

  const setFiltro = (k) => (e) => setFiltros(f => ({ ...f, [k]: e.target.value }))

  const handleSuccess = (desvio) => {
    setDesvios(prev => {
      const idx = prev.findIndex(d => d.id === desvio.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = desvio; return next }
      return [desvio, ...prev]
    })
    setSelected(desvio)
    setPanel('detalle')
  }

  const handleUpdate = (desvio) => {
    setDesvios(prev => prev.map(d => d.id === desvio.id ? desvio : d))
    setSelected(desvio)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este desvío? Esta acción no se puede deshacer.')) return
    setDeletingId(id)
    try {
      await eliminarDesvio(id)
      setDesvios(prev => prev.filter(d => d.id !== id))
      if (selected?.id === id) setPanel(null)
    } catch (err) { alert(err.message) }
    finally { setDeletingId(null) }
  }

  const filterSel = { ...input, width: 'auto', minWidth: 160 }

  return (
    <div>
      {/* Título */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: 24, fontWeight: 800, margin: 0 }}>Desvíos</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>Acciones correctivas y preventivas</p>
        </div>
        <button onClick={() => { setSelected(null); setPanel('form') }}
          style={{ padding: '10px 20px', background: '#f59e0b', border: 'none', borderRadius: 8, color: '#0f1117', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
          + Nuevo desvío
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select style={filterSel} value={filtros.estado}   onChange={setFiltro('estado')}>
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select style={filterSel} value={filtros.area}     onChange={setFiltro('area')}>
          <option value="">Todas las áreas</option>
          {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select style={filterSel} value={filtros.gravedad} onChange={setFiltro('gravedad')}>
          <option value="">Todas las gravedades</option>
          {GRAVEDADES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select style={filterSel} value={filtros.origen}   onChange={setFiltro('origen')}>
          <option value="">Todos los orígenes</option>
          {ORIGENES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ color: '#64748b', padding: 32, textAlign: 'center' }}>Cargando...</p>
        ) : desvios.length === 0 ? (
          <p style={{ color: '#64748b', padding: 32, textAlign: 'center' }}>
            No hay desvíos registrados.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a3045' }}>
                  {['N° Desvío', 'Fecha', 'Área', 'Descripción', 'Gravedad', 'Estado', 'Responsable', 'Evidencias', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {desvios.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #1e293b' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#181c27'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 14px', color: '#f59e0b', fontWeight: 600 }}>{d.nroDesvio}</td>
                    <td style={{ padding: '12px 14px', color: '#f1f5f9', whiteSpace: 'nowrap' }}>
                      {d.fecha ? new Date(d.fecha + 'T00:00:00').toLocaleDateString('es-AR') : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#f1f5f9' }}>{d.area}</td>
                    <td style={{ padding: '12px 14px', color: '#94a3b8', maxWidth: 240 }}>
                      <span title={d.descripcion}>{d.descripcion?.length > 70 ? d.descripcion.slice(0, 70) + '…' : d.descripcion}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <Badge label={d.gravedad} color={gravedadColor[d.gravedad] || '#64748b'} />
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <Badge label={d.estado} color={estadoColor[d.estado] || '#64748b'} />
                    </td>
                    <td style={{ padding: '12px 14px', color: '#f1f5f9' }}>{d.responsableCorrectiva}</td>
                    <td style={{ padding: '12px 14px', color: '#94a3b8', textAlign: 'center' }}>
                      {(d.evidenciasAntes > 0 || d.evidenciasDespues > 0) ? (
                        <span title={`Antes: ${d.evidenciasAntes} | Después: ${d.evidenciasDespues}`}>
                          {(d.evidenciasAntes + d.evidenciasDespues)} img
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { setSelected(d); setPanel('detalle') }}
                          style={{ padding: '4px 10px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>
                          Ver
                        </button>
                        <button onClick={() => handleDelete(d.id)} disabled={deletingId === d.id}
                          style={{ padding: '4px 10px', background: '#dc262614', border: '1px solid #dc262640', borderRadius: 6, color: '#f87171', cursor: 'pointer', fontSize: 12 }}>
                          {deletingId === d.id ? '...' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Panel Nuevo / Editar */}
      {(panel === 'form' || panel === 'edit') && (
        <Panel
          title={panel === 'edit' ? `Editar ${selected?.nroDesvio}` : 'Nuevo desvío'}
          onClose={() => setPanel(null)}
          wide
        >
          <FormDesvio
            initial={panel === 'edit' ? {
              id: selected.id,
              fecha: selected.fecha || '',
              origen: selected.origen || '',
              area: selected.area || '',
              descripcion: selected.descripcion || '',
              accion_correctiva: selected.accionCorrectiva || '',
              responsable_correctiva: selected.responsableCorrectiva || '',
              metodo_causa_raiz: selected.metodoCausaRaiz || '5porques',
              causa_raiz_data: selected.causaRaizData || {},
              accion_preventiva: selected.accionPreventiva || '',
              gravedad: selected.gravedad || '',
              responsable_verificar: selected.responsableVerificar || '',
              estado: selected.estado || 'Abierto',
              fecha_estado: selected.fechaEstado || '',
              destinatarios: selected.destinatarios || '',
            } : null}
            onSuccess={handleSuccess}
            onClose={() => setPanel(null)}
          />
        </Panel>
      )}

      {/* Panel Detalle */}
      {panel === 'detalle' && selected && (
        <Panel title={`Desvío ${selected.nroDesvio}`} onClose={() => setPanel(null)} wide>
          <DetalleDesvio
            desvio={selected}
            onClose={() => setPanel(null)}
            onUpdate={handleUpdate}
            onEdit={(d) => { setSelected(d); setPanel('edit') }}
          />
        </Panel>
      )}
    </div>
  )
}
