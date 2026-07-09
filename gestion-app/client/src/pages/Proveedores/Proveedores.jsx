import { useState, useEffect, useRef } from 'react'
import { Button, Card, Modal } from '../../components/ui'
import { colors as C } from '../../components/ui/tokens'
import * as svc from '../../services/proveedores'

const API_BASE = 'http://localhost:3000'

const TIPOS_PROVEEDOR = [
  { value: 'insumos_mp', label: 'Insumos-MP' },
  { value: 'servicios',  label: 'Servicios' },
]
const TIPO_LABEL = Object.fromEntries(TIPOS_PROVEEDOR.map(t => [t.value, t.label]))

const AREAS_RESP = [
  { value: 'inocuidad',  label: 'Inocuidad' },
  { value: 'logistica',  label: 'Logística' },
  { value: 'produccion', label: 'Producción' },
]
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ─── Estilos compartidos ─────────────────────────────────────────────────────
const fieldStyle = {
  width: '100%', background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 8, padding: '9px 12px', color: C.textPrimary,
  fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
}
const labelStyle = {
  fontSize: 12, color: C.textSecondary, fontWeight: 600,
  marginBottom: 5, display: 'block',
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
const diasHastaVencimiento = (fecha) => {
  if (!fecha) return null
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  return Math.ceil((new Date(fecha) - hoy) / (1000 * 60 * 60 * 24))
}
const colorAlerta = (dias) => {
  if (dias === null) return null
  if (dias < 0)   return C.red
  if (dias <= 7)  return C.red
  if (dias <= 30) return '#f97316'
  return C.green
}

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

// ─── Formulario Proveedor ────────────────────────────────────────────────────
const PROV_VACIO = {
  nombre: '', tipo_proveedor: '', tipo_insumo_servicio: '', ciudad: '',
  provincia: '', persona_contacto: '', telefono: '', email: '', observaciones: '',
}

function FormProveedor({ inicial, onSubmit, onClose }) {
  const [form,      setForm]      = useState(inicial ?? PROV_VACIO)
  const [error,     setError]     = useState('')
  const [guardando, setGuardando] = useState(false)
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const { nombre, tipo_proveedor, tipo_insumo_servicio, ciudad, persona_contacto, email } = form

    if (!nombre.trim() || !tipo_proveedor || !tipo_insumo_servicio.trim() ||
        !ciudad.trim() || !persona_contacto.trim() || !email.trim()) {
      setError('Completá todos los campos obligatorios (*).')
      return
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError('El formato del email no es válido.')
      return
    }

    setGuardando(true)
    try {
      await onSubmit({
        nombre:               form.nombre.trim(),
        tipo_proveedor:       form.tipo_proveedor,
        tipo_insumo_servicio: form.tipo_insumo_servicio.trim(),
        ciudad:               form.ciudad.trim(),
        provincia:            form.provincia.trim() || null,
        persona_contacto:     form.persona_contacto.trim(),
        telefono:             form.telefono.trim() || null,
        email:                form.email.trim(),
        observaciones:        form.observaciones.trim() || null,
      })
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Nombre del proveedor *</label>
        <input style={fieldStyle} placeholder="Razón social o nombre"
          value={form.nombre} onChange={set('nombre')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Tipo de proveedor *</label>
          <select style={fieldStyle} value={form.tipo_proveedor} onChange={set('tipo_proveedor')}>
            <option value="">— Seleccionar —</option>
            {TIPOS_PROVEEDOR.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Tipo de insumo o servicio *</label>
          <input style={fieldStyle} placeholder="Ej: Cartón, Transporte..."
            value={form.tipo_insumo_servicio} onChange={set('tipo_insumo_servicio')} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Ciudad / Localidad *</label>
          <input style={fieldStyle} value={form.ciudad} onChange={set('ciudad')} />
        </div>
        <div>
          <label style={labelStyle}>Provincia</label>
          <input style={fieldStyle} value={form.provincia} onChange={set('provincia')} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Persona de contacto *</label>
          <input style={fieldStyle} value={form.persona_contacto} onChange={set('persona_contacto')} />
        </div>
        <div>
          <label style={labelStyle}>Teléfono</label>
          <input style={fieldStyle} value={form.telefono} onChange={set('telefono')} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Email *</label>
        <input style={fieldStyle} type="email" placeholder="contacto@proveedor.com"
          value={form.email} onChange={set('email')} />
      </div>

      <div>
        <label style={labelStyle}>Observaciones</label>
        <textarea style={{ ...fieldStyle, resize: 'vertical', minHeight: 60 }}
          value={form.observaciones} onChange={set('observaciones')} />
      </div>

      {error && <ErrorBox msg={error} />}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : (inicial ? 'Guardar cambios' : 'Registrar proveedor')}
        </Button>
      </div>
    </form>
  )
}

// ─── Formulario Documento (crear / editar) ───────────────────────────────────
const DOC_VACIO = {
  nombre: '', fecha_vencimiento: '', observaciones: '',
  dias_alerta: '30', area_responsable: '', nombre_responsable: '', destinatarios_email: '',
}

function FormDocumento({ inicial, onSubmit, onCancel }) {
  const [form,      setForm]      = useState(inicial ?? DOC_VACIO)
  const [archivo,   setArchivo]   = useState(null)
  const [error,     setError]     = useState('')
  const [guardando, setGuardando] = useState(false)
  const inputRef  = useRef()
  const esEdicion = !!inicial

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))
  const tieneVencimiento = !!form.fecha_vencimiento

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.nombre.trim()) { setError('El nombre del documento es obligatorio.'); return }
    if (!esEdicion && !archivo) { setError('Adjuntá un archivo (PDF, JPG o PNG).'); return }

    if (tieneVencimiento) {
      const emails = form.destinatarios_email.split(',').map(x => x.trim()).filter(Boolean)
      for (const em of emails) {
        if (!EMAIL_RE.test(em)) { setError(`El email "${em}" no tiene un formato válido.`); return }
      }
    }

    const data = {
      nombre:              form.nombre.trim(),
      fecha_vencimiento:   form.fecha_vencimiento || '',
      observaciones:       form.observaciones.trim() || '',
      dias_alerta:         form.dias_alerta || '30',
      area_responsable:    tieneVencimiento ? form.area_responsable : '',
      nombre_responsable:  tieneVencimiento ? form.nombre_responsable.trim() : '',
      destinatarios_email: tieneVencimiento ? form.destinatarios_email.trim() : '',
    }
    if (archivo) data.archivo = archivo

    setGuardando(true)
    try {
      await onSubmit(data)
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{
      display: 'flex', flexDirection: 'column', gap: 14,
      background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>
        {esEdicion ? 'Editar documento' : 'Nuevo documento'}
      </div>

      <div>
        <label style={labelStyle}>Nombre del archivo *</label>
        <input style={fieldStyle} placeholder='Ej: "Certificación BRCGS", "Habilitación Municipal"'
          value={form.nombre} onChange={set('nombre')} />
      </div>

      {/* Archivo */}
      <div>
        <label style={labelStyle}>
          Archivo adjunto {esEdicion ? '(dejar vacío para conservar el actual)' : '*'}
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
            onChange={e => setArchivo(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />
          <label onClick={() => inputRef.current?.click()} style={{
            background: `${C.accent}18`, border: `1px solid ${C.accent}44`,
            borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
            fontSize: 13, color: C.accent, fontWeight: 700, whiteSpace: 'nowrap',
          }}>
            📎 {archivo ? 'Cambiar archivo' : (esEdicion ? 'Reemplazar' : 'Seleccionar')}
          </label>
          <span style={{ fontSize: 12, color: C.textSecondary, wordBreak: 'break-all' }}>
            {archivo ? archivo.name : (esEdicion ? (inicial.archivoNombre || 'Sin archivo') : 'PDF, JPG o PNG — máx. 20 MB')}
          </span>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Observaciones del documento</label>
        <textarea style={{ ...fieldStyle, resize: 'vertical', minHeight: 48 }}
          value={form.observaciones} onChange={set('observaciones')} />
      </div>

      {/* Módulo de alertas */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
        <div style={{ fontSize: 11, color: C.textSecondary, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Vencimiento y alertas (opcional)
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Fecha de vencimiento</label>
            <input style={fieldStyle} type="date"
              value={form.fecha_vencimiento} onChange={set('fecha_vencimiento')} />
          </div>
          <div>
            <label style={labelStyle}>Alertar (días antes)</label>
            <input type="number" min="1" max="365" disabled={!tieneVencimiento}
              value={form.dias_alerta} onChange={set('dias_alerta')}
              style={{ ...fieldStyle, opacity: tieneVencimiento ? 1 : 0.4 }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Área responsable</label>
            <select disabled={!tieneVencimiento}
              value={form.area_responsable} onChange={set('area_responsable')}
              style={{ ...fieldStyle, opacity: tieneVencimiento ? 1 : 0.4 }}>
              <option value="">— Seleccionar —</option>
              {AREAS_RESP.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Nombre del responsable</label>
            <input disabled={!tieneVencimiento}
              value={form.nombre_responsable} onChange={set('nombre_responsable')}
              style={{ ...fieldStyle, opacity: tieneVencimiento ? 1 : 0.4 }} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Destinatarios de alerta por email</label>
          <textarea disabled={!tieneVencimiento}
            placeholder="email1@empresa.com, email2@empresa.com"
            value={form.destinatarios_email} onChange={set('destinatarios_email')}
            style={{ ...fieldStyle, resize: 'vertical', minHeight: 48, opacity: tieneVencimiento ? 1 : 0.4 }} />
          {tieneVencimiento && (
            <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 4 }}>
              Separalos con coma. Se envía notificación cuando quedan ≤ {form.dias_alerta || 30} días.
            </div>
          )}
        </div>
      </div>

      {error && <ErrorBox msg={error} />}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Button variant="secondary" type="button" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : (esEdicion ? 'Guardar' : 'Agregar documento')}
        </Button>
      </div>
    </form>
  )
}

// ─── Fila de documento dentro del modal ──────────────────────────────────────
function FilaDoc({ doc, onEditar, onEliminar }) {
  const dias = diasHastaVencimiento(doc.fechaVencimiento)
  const col  = colorAlerta(dias)
  return (
    <div style={{
      background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
      padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 20 }}>📄</span>
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{doc.nombre}</div>
        <div style={{ fontSize: 11, color: C.textSecondary, wordBreak: 'break-all' }}>
          {doc.archivoNombre || 'Sin archivo'}
        </div>
      </div>

      {doc.fechaVencimiento ? (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: col }}>
            {dias < 0 ? `Vencido hace ${Math.abs(dias)}d` : `Vence en ${dias}d`}
          </div>
          <div style={{ fontSize: 10, color: C.textSecondary }}>{doc.fechaVencimiento}</div>
          {doc.destinatariosEmail.length > 0 && (
            <div style={{ fontSize: 10, color: doc.notificacionEnviada ? C.textSecondary : C.green }}>
              {doc.notificacionEnviada ? '✓ Alerta enviada' : '🔔 Alerta activa'}
            </div>
          )}
        </div>
      ) : (
        <span style={{ fontSize: 11, color: C.textMuted }}>Sin vencimiento</span>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        {doc.archivoPath && (
          <a href={`${API_BASE}/uploads/${doc.archivoPath}`} target="_blank" rel="noopener noreferrer"
            style={{
              background: `${C.blue}18`, border: `1px solid ${C.blue}44`, borderRadius: 6,
              padding: '4px 9px', fontSize: 12, color: C.blue, fontWeight: 600, textDecoration: 'none',
            }}>👁</a>
        )}
        <button onClick={() => onEditar(doc)} style={{
          background: `${C.accent}18`, border: `1px solid ${C.accent}44`, borderRadius: 6,
          padding: '4px 9px', cursor: 'pointer', fontSize: 12, color: C.accent, fontWeight: 600, fontFamily: 'inherit',
        }}>Editar</button>
        <button onClick={() => onEliminar(doc)} style={{
          background: 'transparent', border: `1px solid ${C.red}44`, borderRadius: 6,
          padding: '4px 9px', cursor: 'pointer', fontSize: 12, color: C.red, fontWeight: 600, fontFamily: 'inherit',
        }}>🗑</button>
      </div>
    </div>
  )
}

// ─── Modal de documentos de un proveedor ─────────────────────────────────────
function ModalDocumentos({ proveedor, onCrear, onActualizar, onEliminar, onClose }) {
  const [modo,    setModo]    = useState(null) // null | 'nuevo' | doc(editar)
  const [borrando, setBorrando] = useState(null)

  if (!proveedor) return null
  const docs = proveedor.documentos ?? []

  const handleCrear = async (data) => {
    await onCrear(proveedor.id, data)
    setModo(null)
  }
  const handleEditar = async (data) => {
    await onActualizar(modo.id, data)
    setModo(null)
  }
  const handleEliminar = async (doc) => {
    setBorrando(doc.id)
    try {
      await onEliminar(doc.id)
    } finally {
      setBorrando(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 13, color: C.textSecondary }}>
        Documentación de <strong style={{ color: C.textPrimary }}>{proveedor.nombre}</strong>
      </div>

      {docs.length === 0 && !modo && (
        <div style={{
          background: C.bg, border: `2px dashed ${C.border}`, borderRadius: 8,
          padding: 20, textAlign: 'center', color: C.textSecondary, fontSize: 13,
        }}>
          Sin documentos cargados.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {docs.map(doc => (
          <FilaDoc key={doc.id} doc={doc}
            onEditar={setModo}
            onEliminar={handleEliminar}
          />
        ))}
      </div>
      {borrando && <div style={{ fontSize: 12, color: C.textSecondary }}>Eliminando...</div>}

      {modo === 'nuevo' && (
        <FormDocumento onSubmit={handleCrear} onCancel={() => setModo(null)} />
      )}
      {modo && modo !== 'nuevo' && (
        <FormDocumento
          inicial={{
            nombre:              modo.nombre,
            fecha_vencimiento:   modo.fechaVencimiento ?? '',
            observaciones:       modo.observaciones ?? '',
            dias_alerta:         String(modo.diasAlerta ?? 30),
            area_responsable:    modo.areaResponsable ?? '',
            nombre_responsable:  modo.nombreResponsable ?? '',
            destinatarios_email: modo.destinatariosEmail?.join(', ') ?? '',
            archivoNombre:       modo.archivoNombre,
          }}
          onSubmit={handleEditar}
          onCancel={() => setModo(null)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        {!modo
          ? <Button onClick={() => setModo('nuevo')}>+ Agregar documento</Button>
          : <span />}
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </div>
    </div>
  )
}

// ─── Panel de alertas global ─────────────────────────────────────────────────
function PanelAlertas({ proveedores, onEnviarEmail }) {
  const [enviando, setEnviando] = useState(false)
  const [msg,      setMsg]      = useState('')

  const proximos = []
  proveedores.forEach(p => (p.documentos ?? []).forEach(d => {
    if (!d.fechaVencimiento) return
    const dias = diasHastaVencimiento(d.fechaVencimiento)
    if (dias !== null && dias <= (d.diasAlerta ?? 30)) {
      proximos.push({ ...d, proveedorNombre: p.nombre })
    }
  }))
  proximos.sort((a, b) => diasHastaVencimiento(a.fechaVencimiento) - diasHastaVencimiento(b.fechaVencimiento))

  if (proximos.length === 0) return null

  const handleEmail = async () => {
    setMsg(''); setEnviando(true)
    try {
      const result = await onEnviarEmail()
      setMsg(`✓ ${result.mensaje}`)
    } catch (err) {
      setMsg(`✗ ${err.message}`)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{
      background: `${C.red}0d`, border: `1px solid ${C.red}44`,
      borderRadius: 10, padding: '14px 18px', marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.red }}>
            {proximos.length} documento{proximos.length > 1 ? 's' : ''} próximo{proximos.length > 1 ? 's' : ''} a vencer
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {msg && (
            <span style={{ fontSize: 12, color: msg.startsWith('✓') ? C.green : C.red, fontWeight: 600 }}>{msg}</span>
          )}
          <button onClick={handleEmail} disabled={enviando} style={{
            background: `${C.red}18`, border: `1px solid ${C.red}44`, borderRadius: 6,
            padding: '5px 12px', cursor: enviando ? 'default' : 'pointer',
            fontSize: 12, color: C.red, fontFamily: 'inherit', fontWeight: 600, opacity: enviando ? 0.6 : 1,
          }}>
            {enviando ? 'Enviando...' : '📧 Notificar por email'}
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {proximos.map(d => {
          const dias = diasHastaVencimiento(d.fechaVencimiento)
          return (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 13, color: C.textPrimary }}>
              <span style={{ color: C.accent, fontWeight: 700 }}>{d.proveedorNombre}</span>
              <span>{d.nombre}</span>
              <span style={{ color: colorAlerta(dias), fontWeight: 700, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                {dias < 0 ? `Vencido hace ${Math.abs(dias)} día(s)` : `Vence en ${dias} día(s)`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Fila de proveedor ───────────────────────────────────────────────────────
function FilaProveedor({ prov, onDocs, onEditar, onEliminar }) {
  const [hover, setHover] = useState(false)
  const docs = prov.documentos ?? []
  const conVenc = docs.filter(d => d.fechaVencimiento)
  const alertas = conVenc.filter(d => {
    const dias = diasHastaVencimiento(d.fechaVencimiento)
    return dias !== null && dias <= (d.diasAlerta ?? 30)
  })

  return (
    <tr onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: hover ? C.surfaceHigh : 'transparent', transition: 'background 0.15s' }}>
      <td style={tdStyle}>
        <div style={{ fontWeight: 700 }}>{prov.nombre}</div>
        <div style={{ fontSize: 11, color: C.textSecondary }}>{prov.tipoInsumoServicio}</div>
      </td>
      <td style={tdStyle}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          color: prov.tipoProveedor === 'insumos_mp' ? C.blue : C.purple,
          background: `${prov.tipoProveedor === 'insumos_mp' ? C.blue : C.purple}18`,
          border: `1px solid ${prov.tipoProveedor === 'insumos_mp' ? C.blue : C.purple}44`,
          whiteSpace: 'nowrap',
        }}>
          {TIPO_LABEL[prov.tipoProveedor]}
        </span>
      </td>
      <td style={tdStyle}>
        <div>{prov.ciudad}</div>
        {prov.provincia && <div style={{ fontSize: 11, color: C.textSecondary }}>{prov.provincia}</div>}
      </td>
      <td style={tdStyle}>
        <div>{prov.personaContacto}</div>
        <div style={{ fontSize: 11, color: C.textSecondary, wordBreak: 'break-all' }}>{prov.email}</div>
      </td>
      <td style={{ ...tdStyle, textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontWeight: 700, color: docs.length ? C.textPrimary : C.textMuted }}>{docs.length}</span>
          {alertas.length > 0 && (
            <span style={{ fontSize: 10, color: C.red, fontWeight: 700 }}>⚠ {alertas.length} por vencer</span>
          )}
        </div>
      </td>
      <td style={{ ...tdStyle, textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <button onClick={() => onDocs(prov)} title="Documentos" style={{
            background: `${C.blue}18`, border: `1px solid ${C.blue}44`, borderRadius: 6,
            padding: '4px 9px', cursor: 'pointer', fontSize: 12, color: C.blue, fontWeight: 600, fontFamily: 'inherit',
          }}>📎 Docs</button>
          <button onClick={() => onEditar(prov)} style={{
            background: `${C.accent}18`, border: `1px solid ${C.accent}44`, borderRadius: 6,
            padding: '4px 9px', cursor: 'pointer', fontSize: 12, color: C.accent, fontWeight: 600, fontFamily: 'inherit',
          }}>Editar</button>
          <button onClick={() => onEliminar(prov)} style={{
            background: 'transparent', border: `1px solid ${C.red}44`, borderRadius: 6,
            padding: '4px 9px', cursor: 'pointer', fontSize: 12, color: C.red, fontWeight: 600, fontFamily: 'inherit',
          }}>Eliminar</button>
        </div>
      </td>
    </tr>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function Proveedores() {
  const [proveedores, setProveedores] = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [error,       setError]       = useState('')
  const [modalNuevo,  setModalNuevo]  = useState(false)
  const [provEditar,  setProvEditar]  = useState(null)
  const [provDocs,    setProvDocs]    = useState(null)
  const [provEliminar, setProvEliminar] = useState(null)
  const [eliminando,  setEliminando]  = useState(false)

  const [busqueda,   setBusqueda]   = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    try {
      setCargando(true); setError('')
      setProveedores(await svc.fetchProveedores())
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setCargando(false)
    }
  }

  const ordenar = (lista) => [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre))

  const handleCrear = async (data) => {
    const nuevo = await svc.crearProveedor(data)
    setProveedores(prev => ordenar([...prev, nuevo]))
    setModalNuevo(false)
  }

  const handleActualizar = async (data) => {
    const actualizado = await svc.actualizarProveedor(provEditar.id, data)
    setProveedores(prev => ordenar(prev.map(p => p.id === actualizado.id ? actualizado : p)))
    setProvEditar(null)
  }

  const handleEliminar = async () => {
    setEliminando(true)
    try {
      await svc.eliminarProveedor(provEliminar.id)
      setProveedores(prev => prev.filter(p => p.id !== provEliminar.id))
      setProvEliminar(null)
    } finally {
      setEliminando(false)
    }
  }

  // Actualiza los documentos de un proveedor en el estado y en el modal abierto
  const actualizarDocsEnEstado = (proveedorId, mapDocs) => {
    setProveedores(prev => prev.map(p =>
      p.id === proveedorId ? { ...p, documentos: mapDocs(p.documentos ?? []) } : p
    ))
    setProvDocs(prev =>
      prev && prev.id === proveedorId ? { ...prev, documentos: mapDocs(prev.documentos ?? []) } : prev
    )
  }

  const handleCrearDoc = async (proveedorId, data) => {
    const nuevo = await svc.crearDocumento(proveedorId, data)
    actualizarDocsEnEstado(proveedorId, docs => [...docs, nuevo])
  }
  const handleActualizarDoc = async (docId, data) => {
    const actualizado = await svc.actualizarDocumento(docId, data)
    actualizarDocsEnEstado(actualizado.proveedorId, docs => docs.map(d => d.id === docId ? actualizado : d))
  }
  const handleEliminarDoc = async (docId) => {
    const provId = provDocs.id
    await svc.eliminarDocumento(docId)
    actualizarDocsEnEstado(provId, docs => docs.filter(d => d.id !== docId))
  }

  const filtrados = proveedores.filter(p => {
    const term = busqueda.toLowerCase()
    const matchBusq = !busqueda ||
      p.nombre.toLowerCase().includes(term) ||
      p.tipoInsumoServicio.toLowerCase().includes(term) ||
      p.ciudad.toLowerCase().includes(term)
    const matchTipo = !filtroTipo || p.tipoProveedor === filtroTipo
    return matchBusq && matchTipo
  })

  const totalDocs = proveedores.reduce((n, p) => n + (p.documentos?.length ?? 0), 0)

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: C.accent, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          Proveedores
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: C.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
          Seguimiento de Proveedores
        </h1>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total proveedores', value: proveedores.length, color: C.textPrimary },
          { label: 'Insumos-MP',        value: proveedores.filter(p => p.tipoProveedor === 'insumos_mp').length, color: C.blue },
          { label: 'Documentos',        value: totalDocs, color: C.purple },
        ].map(s => (
          <Card key={s.label} style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: "'Courier New', monospace", lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {s.label}
            </div>
          </Card>
        ))}
      </div>

      {/* ALERTAS */}
      <PanelAlertas proveedores={proveedores} onEnviarEmail={svc.enviarNotificaciones} />

      {/* TOOLBAR */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input style={{ ...fieldStyle, width: 240 }} placeholder="Buscar por nombre, insumo o ciudad..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <select style={{ ...fieldStyle, width: 170 }} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {TIPOS_PROVEEDOR.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <div style={{ marginLeft: 'auto' }}>
          <Button onClick={() => setModalNuevo(true)}>+ Nuevo proveedor</Button>
        </div>
      </div>

      {/* CONTENIDO */}
      {cargando && (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 13, color: C.textSecondary }}>Cargando proveedores...</div>
        </Card>
      )}
      {error && !cargando && (
        <Card style={{ textAlign: 'center', padding: 48, borderColor: C.red }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.red }}>{error}</div>
          <Button variant="secondary" style={{ marginTop: 16 }} onClick={cargar}>🔄 Reintentar</Button>
        </Card>
      )}
      {!cargando && !error && proveedores.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏭</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary }}>No hay proveedores registrados</div>
          <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 6 }}>
            Registrá el primero con el botón + Nuevo proveedor.
          </div>
        </Card>
      )}
      {!cargando && !error && proveedores.length > 0 && filtrados.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 13, color: C.textSecondary }}>Ningún proveedor coincide con los filtros.</div>
        </Card>
      )}
      {!cargando && !error && filtrados.length > 0 && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Proveedor</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Ubicación</th>
                  <th style={thStyle}>Contacto</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Docs.</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(prov => (
                  <FilaProveedor key={prov.id} prov={prov}
                    onDocs={setProvDocs} onEditar={setProvEditar} onEliminar={setProvEliminar} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL NUEVO */}
      <Modal open={modalNuevo} onClose={() => setModalNuevo(false)} title="Nuevo Proveedor">
        <FormProveedor onSubmit={handleCrear} onClose={() => setModalNuevo(false)} />
      </Modal>

      {/* MODAL EDITAR */}
      <Modal open={!!provEditar} onClose={() => setProvEditar(null)} title="Editar Proveedor">
        {provEditar && (
          <FormProveedor
            inicial={{
              nombre:               provEditar.nombre,
              tipo_proveedor:       provEditar.tipoProveedor,
              tipo_insumo_servicio: provEditar.tipoInsumoServicio,
              ciudad:               provEditar.ciudad,
              provincia:            provEditar.provincia ?? '',
              persona_contacto:     provEditar.personaContacto,
              telefono:             provEditar.telefono ?? '',
              email:                provEditar.email,
              observaciones:        provEditar.observaciones ?? '',
            }}
            onSubmit={handleActualizar}
            onClose={() => setProvEditar(null)}
          />
        )}
      </Modal>

      {/* MODAL DOCUMENTOS */}
      <Modal open={!!provDocs} onClose={() => setProvDocs(null)} title="Documentación del Proveedor">
        <ModalDocumentos
          proveedor={provDocs}
          onCrear={handleCrearDoc}
          onActualizar={handleActualizarDoc}
          onEliminar={handleEliminarDoc}
          onClose={() => setProvDocs(null)}
        />
      </Modal>

      {/* MODAL ELIMINAR */}
      <Modal open={!!provEliminar} onClose={() => setProvEliminar(null)} title="Eliminar Proveedor">
        {provEliminar && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ textAlign: 'center', fontSize: 40 }}>🗑️</div>
            <p style={{ margin: 0, color: C.textPrimary, fontSize: 14, lineHeight: 1.6, textAlign: 'center' }}>
              Vas a eliminar a <strong style={{ color: C.accent }}>{provEliminar.nombre}</strong> y todos sus documentos adjuntos.
              <br />Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setProvEliminar(null)} disabled={eliminando}>Cancelar</Button>
              <button onClick={handleEliminar} disabled={eliminando} style={{
                background: C.red, color: '#fff', border: 'none', borderRadius: 8,
                padding: '8px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                fontFamily: 'inherit', opacity: eliminando ? 0.6 : 1,
              }}>
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}