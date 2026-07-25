import { useState, useEffect, useRef } from 'react'
import { Button, Card, Modal } from '../../components/ui'
import { colors as C } from '../../components/ui/tokens'
import * as svc from '../../services/documentos'
import { useAuth } from '../../context/AuthContext'
import { API_ORIGIN } from '../../services/config'

const API_BASE = API_ORIGIN
// Los archivos ahora se guardan como URL absoluta de Cloudinary; las filas viejas
// guardaban una ruta relativa → se resuelven contra el server (/uploads).
const urlArchivo = (p) => (p?.startsWith('http') ? p : `${API_BASE}/uploads/${p}`)

const AREAS = ['inocuidad', 'calidad', 'produccion', 'logistica', 'general']
const AREA_LABEL = {
  inocuidad:  'Inocuidad',
  calidad:    'Calidad',
  produccion: 'Producción',
  logistica:  'Logística',
  general:    'General',
}
const FORMATOS = [
  { value: 'digital',          label: 'Digital' },
  { value: 'impreso',          label: 'Impreso' },
  { value: 'digital_e_impreso', label: 'Digital e Impreso' },
]

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const diasHastaRevision = (fechaRevision) => {
  if (!fechaRevision) return null
  const hoy  = new Date(); hoy.setHours(0, 0, 0, 0)
  const rev  = new Date(fechaRevision)
  return Math.ceil((rev - hoy) / (1000 * 60 * 60 * 24))
}

const colorAlerta = (dias) => {
  if (dias === null) return null
  if (dias < 0)    return C.red
  if (dias <= 7)   return C.red
  if (dias <= 30)  return '#f97316'
  return C.green
}

// ─── Badge estado ──────────────────────────────────────────────────────────────
function BadgeEstado({ estado }) {
  const es = estado === 'vigente'
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      color:       es ? C.green  : C.textSecondary,
      background:  es ? `${C.green}18`  : `${C.textSecondary}18`,
      border:      `1px solid ${es ? C.green + '44' : C.textSecondary + '44'}`,
      whiteSpace: 'nowrap', textTransform: 'uppercase',
    }}>
      {es ? 'Vigente' : 'Obsoleto'}
    </span>
  )
}

// ─── Error box ────────────────────────────────────────────────────────────────
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

// ─── Formulario crear/editar ──────────────────────────────────────────────────
const FORM_VACIO = {
  codigo: '', nombre: '', numero_revision: '1', area_uso: '',
  estado: 'vigente', cantidad_copias_impresas: '0', formato_archivo: '',
  fecha_revision: '', dias_alerta: '30', destinatarios_email: '',
}

function FormDocumento({ inicial, onSubmit, onClose }) {
  const [form,      setForm]      = useState(inicial ?? FORM_VACIO)
  const [error,     setError]     = useState('')
  const [guardando, setGuardando] = useState(false)

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))
  const tieneRevision = !!form.fecha_revision

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const { codigo, nombre, numero_revision, area_uso, estado,
            cantidad_copias_impresas, formato_archivo } = form

    if (!codigo.trim() || !nombre.trim() || !numero_revision ||
        !area_uso || !estado || cantidad_copias_impresas === '' || !formato_archivo) {
      setError('Completá todos los campos obligatorios.')
      return
    }
    if (Number(numero_revision) < 1) {
      setError('El N° de revisión debe ser al menos 1.')
      return
    }
    if (Number(cantidad_copias_impresas) < 0) {
      setError('La cantidad de copias no puede ser negativa.')
      return
    }

    setGuardando(true)
    try {
      await onSubmit({
        codigo:                  form.codigo.trim(),
        nombre:                  form.nombre.trim(),
        numero_revision:         Number(form.numero_revision),
        area_uso:                form.area_uso,
        estado:                  form.estado,
        cantidad_copias_impresas: Number(form.cantidad_copias_impresas),
        formato_archivo:         form.formato_archivo,
        fecha_revision:          form.fecha_revision || null,
        dias_alerta:             form.dias_alerta ? Number(form.dias_alerta) : 30,
        destinatarios_email:     form.destinatarios_email.trim() || null,
      })
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Código + N° Revisión */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Código *</label>
          <input style={fieldStyle} placeholder="Ej: VR AC XX 70"
            value={form.codigo} onChange={set('codigo')} />
        </div>
        <div>
          <label style={labelStyle}>N° Revisión *</label>
          <input style={fieldStyle} type="number" min="1"
            value={form.numero_revision} onChange={set('numero_revision')} />
        </div>
      </div>

      {/* Nombre */}
      <div>
        <label style={labelStyle}>Nombre del documento *</label>
        <input style={fieldStyle} placeholder="Nombre completo del documento"
          value={form.nombre} onChange={set('nombre')} />
      </div>

      {/* Área + Estado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Área de uso *</label>
          <select style={fieldStyle} value={form.area_uso} onChange={set('area_uso')}>
            <option value="">— Seleccionar —</option>
            {AREAS.map(a => <option key={a} value={a}>{AREA_LABEL[a]}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Estado *</label>
          <select style={fieldStyle} value={form.estado} onChange={set('estado')}>
            <option value="vigente">Vigente</option>
            <option value="obsoleto">Obsoleto</option>
          </select>
        </div>
      </div>

      {/* Copias + Formato */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Cantidad copias impresas *</label>
          <input style={fieldStyle} type="number" min="0"
            value={form.cantidad_copias_impresas} onChange={set('cantidad_copias_impresas')} />
        </div>
        <div>
          <label style={labelStyle}>Formato de archivo *</label>
          <select style={fieldStyle} value={form.formato_archivo} onChange={set('formato_archivo')}>
            <option value="">— Seleccionar —</option>
            {FORMATOS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </div>

      {/* Separador revisión */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
        <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
          Revisión periódica (opcional)
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Fecha límite de revisión</label>
            <input style={fieldStyle} type="date"
              value={form.fecha_revision} onChange={set('fecha_revision')} />
          </div>
          <div>
            <label style={labelStyle}>Alertar con (días de anticipación)</label>
            <input type="number" min="1" max="365"
              disabled={!tieneRevision}
              value={form.dias_alerta} onChange={set('dias_alerta')}
              style={{ ...fieldStyle, opacity: tieneRevision ? 1 : 0.4 }} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Destinatarios de alerta por email</label>
          <textarea
            placeholder="email1@empresa.com, email2@empresa.com"
            disabled={!tieneRevision}
            value={form.destinatarios_email}
            onChange={set('destinatarios_email')}
            style={{
              ...fieldStyle, resize: 'vertical', minHeight: 60,
              opacity: tieneRevision ? 1 : 0.4,
            }}
          />
          {tieneRevision && (
            <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 4 }}>
              Separalos con coma. Se envía notificación cuando quedan ≤ {form.dias_alerta || 30} días.
            </div>
          )}
        </div>
      </div>

      {error && <ErrorBox msg={error} />}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : (inicial ? 'Guardar cambios' : 'Crear documento')}
        </Button>
      </div>
    </form>
  )
}

// ─── Panel subida de archivo ──────────────────────────────────────────────────
function PanelArchivo({ doc, onActualizar }) {
  const inputRef             = useRef()
  const [subiendo, setSubiendo] = useState(false)
  const [error,    setError]    = useState('')

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setSubiendo(true)
    try {
      const actualizado = await svc.subirArchivo(doc.id, file)
      onActualizar(actualizado)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubiendo(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleEliminar = async () => {
    if (!confirm('¿Eliminar el archivo adjunto?')) return
    try {
      const actualizado = await svc.eliminarArchivo(doc.id)
      onActualizar(actualizado)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {doc.archivoPath ? (
        <div style={{
          background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
          padding: '12px 16px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>📄</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
                {doc.archivoNombre}
              </div>
              <div style={{ fontSize: 11, color: C.textSecondary }}>Archivo adjunto</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={urlArchivo(doc.archivoPath)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: `${C.blue}18`, border: `1px solid ${C.blue}44`,
                borderRadius: 6, padding: '5px 12px', cursor: 'pointer',
                fontSize: 12, color: C.blue, fontFamily: 'inherit',
                fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              👁 Visualizar
            </a>
            <a
              href={urlArchivo(doc.archivoPath)}
              download={doc.archivoNombre}
              style={{
                background: `${C.green}18`, border: `1px solid ${C.green}44`,
                borderRadius: 6, padding: '5px 12px', cursor: 'pointer',
                fontSize: 12, color: C.green, fontFamily: 'inherit',
                fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              ⬇ Descargar
            </a>
            <button
              onClick={handleEliminar}
              style={{
                background: 'transparent', border: `1px solid ${C.red}44`,
                borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
                fontSize: 12, color: C.red, fontFamily: 'inherit', fontWeight: 600,
              }}
            >
              🗑
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          background: C.bg, border: `2px dashed ${C.border}`, borderRadius: 8,
          padding: '20px', textAlign: 'center', color: C.textSecondary, fontSize: 13,
        }}>
          Sin archivo adjunto
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFile}
          style={{ display: 'none' }}
          id={`file-input-${doc.id}`}
        />
        <label
          htmlFor={`file-input-${doc.id}`}
          style={{
            background: `${C.accent}18`, border: `1px solid ${C.accent}44`,
            borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
            fontSize: 13, color: C.accent, fontWeight: 700,
            opacity: subiendo ? 0.6 : 1,
          }}
        >
          {subiendo ? 'Subiendo...' : (doc.archivoPath ? '📎 Reemplazar archivo' : '📎 Adjuntar archivo')}
        </label>
        <span style={{ fontSize: 11, color: C.textSecondary }}>PDF, DOC, DOCX, XLS, XLSX — máx. 20 MB</span>
      </div>

      {error && <ErrorBox msg={error} />}
    </div>
  )
}

// ─── Modal detalle/archivo ────────────────────────────────────────────────────
function ModalArchivo({ doc, onActualizar, onClose }) {
  if (!doc) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
        padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Courier New', monospace", fontWeight: 800, color: C.accent, fontSize: 15 }}>
            {doc.codigo}
          </span>
          <BadgeEstado estado={doc.estado} />
        </div>
        <div style={{ fontSize: 14, color: C.textPrimary, fontWeight: 600 }}>{doc.nombre}</div>
        <div style={{ fontSize: 12, color: C.textSecondary }}>
          Rev. {doc.numeroRevision} · {AREA_LABEL[doc.areaUso]} · {FORMATOS.find(f => f.value === doc.formatoArchivo)?.label}
        </div>
      </div>
      <PanelArchivo doc={doc} onActualizar={onActualizar} />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </div>
    </div>
  )
}

// ─── Fila de la tabla ──────────────────────────────────────────────────────────
function FilaDocumento({ doc, onEditar, onEliminar, onArchivo, puedeEditar, puedeEliminar }) {
  const [hover,        setHover]        = useState(false)
  const [verEmails,    setVerEmails]    = useState(false)
  const dias      = diasHastaRevision(doc.fechaRevision)
  const colAlerta = colorAlerta(dias)

  const tieneNotif  = doc.estado === 'vigente' && doc.fechaRevision && doc.destinatariosEmail?.length > 0
  const soloFecha   = doc.estado === 'vigente' && doc.fechaRevision && !tieneNotif
  const yaEnviada   = tieneNotif && doc.notificacionEnviada

  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ background: hover ? C.surfaceHigh : 'transparent', transition: 'background 0.15s' }}
    >
      <td style={tdStyle}>
        <span style={{ fontFamily: "'Courier New', monospace", fontWeight: 700, color: C.accent }}>
          {doc.codigo}
        </span>
      </td>
      <td style={tdStyle}>
        <div style={{ fontWeight: 600, maxWidth: 200 }}>{doc.nombre}</div>
      </td>
      <td style={{ ...tdStyle, textAlign: 'center', fontFamily: "'Courier New', monospace", color: C.textSecondary }}>
        {doc.numeroRevision}
      </td>
      <td style={tdStyle}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          color: C.purple, background: `${C.purple}18`, border: `1px solid ${C.purple}44`,
        }}>
          {AREA_LABEL[doc.areaUso]}
        </span>
      </td>
      <td style={tdStyle}>
        <BadgeEstado estado={doc.estado} />
      </td>
      <td style={{ ...tdStyle, textAlign: 'center', color: C.textSecondary }}>
        {doc.cantidadCopiasImpresas}
      </td>
      <td style={tdStyle}>
        <span style={{ fontSize: 12, color: C.textSecondary }}>
          {FORMATOS.find(f => f.value === doc.formatoArchivo)?.label ?? doc.formatoArchivo}
        </span>
      </td>

      {/* Próx. revisión */}
      <td style={{ ...tdStyle, textAlign: 'center' }}>
        {doc.fechaRevision ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 12, color: colAlerta, fontWeight: 700 }}>
              {dias < 0 ? `Vencido hace ${Math.abs(dias)}d` : `${dias}d`}
            </span>
            <span style={{ fontSize: 10, color: C.textSecondary }}>{doc.fechaRevision}</span>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: C.textMuted }}>—</span>
        )}
      </td>

      {/* Notificaciones */}
      <td style={{ ...tdStyle, minWidth: 160 }}>
        {doc.estado === 'obsoleto' ? (
          <span style={{ fontSize: 11, color: C.textMuted, fontStyle: 'italic' }}>Desactivadas</span>
        ) : tieneNotif ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                color:       yaEnviada ? C.textSecondary : '#10b981',
                background:  yaEnviada ? `${C.textSecondary}18` : '#10b98118',
                border:      `1px solid ${yaEnviada ? C.textSecondary + '44' : '#10b98144'}`,
              }}>
                {yaEnviada ? '✓ Enviada' : '🔔 Pendiente'}
              </span>
              <button
                onClick={() => setVerEmails(p => !p)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: C.textSecondary, padding: 0, fontFamily: 'inherit',
                }}
              >
                {verEmails ? '▲ ocultar' : '▼ ver emails'}
              </button>
            </div>
            {verEmails && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {doc.destinatariosEmail.map(email => (
                  <span key={email} style={{
                    fontSize: 11, color: C.textSecondary,
                    background: C.bg, borderRadius: 4, padding: '1px 6px',
                    border: `1px solid ${C.border}`, wordBreak: 'break-all',
                  }}>
                    {email}
                  </span>
                ))}
                <span style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                  Alerta {doc.diasAlerta}d antes
                </span>
              </div>
            )}
          </div>
        ) : soloFecha ? (
          <span style={{ fontSize: 11, color: C.textSecondary }}>📅 Sin destinatarios</span>
        ) : (
          <span style={{ fontSize: 11, color: C.textMuted }}>—</span>
        )}
      </td>

      {/* Archivo */}
      <td style={tdStyle}>
        {doc.archivoPath ? (
          <span style={{ fontSize: 12, color: C.green }}>✓ Adjunto</span>
        ) : (
          <span style={{ fontSize: 12, color: C.textMuted }}>Sin archivo</span>
        )}
      </td>

      {/* Acciones */}
      <td style={{ ...tdStyle, textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <button
            onClick={() => onArchivo(doc)}
            title="Gestionar archivo"
            style={{
              background: `${C.blue}18`, border: `1px solid ${C.blue}44`,
              borderRadius: 6, padding: '4px 9px', cursor: 'pointer',
              fontSize: 12, color: C.blue, fontFamily: 'inherit', fontWeight: 600,
            }}
          >
            📎
          </button>
          {puedeEditar && (
            <button
              onClick={() => onEditar(doc)}
              style={{
                background: `${C.accent}18`, border: `1px solid ${C.accent}44`,
                borderRadius: 6, padding: '4px 9px', cursor: 'pointer',
                fontSize: 12, color: C.accent, fontFamily: 'inherit', fontWeight: 600,
              }}
            >
              Editar
            </button>
          )}
          {puedeEliminar && (
            <button
              onClick={() => onEliminar(doc)}
              style={{
                background: 'transparent', border: `1px solid ${C.red}44`,
                borderRadius: 6, padding: '4px 9px', cursor: 'pointer',
                fontSize: 12, color: C.red, fontFamily: 'inherit', fontWeight: 600,
              }}
            >
              Eliminar
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── Panel de alertas visuales ────────────────────────────────────────────────
function PanelAlertas({ documentos, onEnviarEmail }) {
  const [enviando,  setEnviando]  = useState(false)
  const [msgEmail,  setMsgEmail]  = useState('')

  const proximos = documentos.filter(doc => {
    if (!doc.fechaRevision || doc.estado !== 'vigente') return false
    const dias = diasHastaRevision(doc.fechaRevision)
    return dias !== null && dias <= (doc.diasAlerta ?? 30)
  }).sort((a, b) => diasHastaRevision(a.fechaRevision) - diasHastaRevision(b.fechaRevision))

  if (proximos.length === 0) return null

  const handleEmail = async () => {
    setMsgEmail('')
    setEnviando(true)
    try {
      const result = await onEnviarEmail()
      setMsgEmail(`✓ ${result.mensaje}`)
    } catch (err) {
      setMsgEmail(`✗ ${err.message}`)
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
            {proximos.length} documento{proximos.length > 1 ? 's' : ''} próximo{proximos.length > 1 ? 's' : ''} a revisión
          </span>
        </div>
        <div style={{ display: 'flex', align: 'center', gap: 10, flexWrap: 'wrap' }}>
          {msgEmail && (
            <span style={{ fontSize: 12, color: msgEmail.startsWith('✓') ? C.green : C.red, fontWeight: 600 }}>
              {msgEmail}
            </span>
          )}
          <button
            onClick={handleEmail}
            disabled={enviando}
            style={{
              background: `${C.red}18`, border: `1px solid ${C.red}44`,
              borderRadius: 6, padding: '5px 12px', cursor: enviando ? 'default' : 'pointer',
              fontSize: 12, color: C.red, fontFamily: 'inherit', fontWeight: 600,
              opacity: enviando ? 0.6 : 1,
            }}
          >
            {enviando ? 'Enviando...' : '📧 Notificar por email'}
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {proximos.map(doc => {
          const dias = diasHastaRevision(doc.fechaRevision)
          const col  = colorAlerta(dias)
          return (
            <div key={doc.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              fontSize: 13, color: C.textPrimary,
            }}>
              <span style={{ fontFamily: "'Courier New', monospace", color: C.accent, fontWeight: 700 }}>
                {doc.codigo}
              </span>
              <span>{doc.nombre}</span>
              <span style={{ color: col, fontWeight: 700, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                {dias < 0 ? `Vencido hace ${Math.abs(dias)} día(s)` : `Vence en ${dias} día(s)`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────────
export default function MapeoDocumentos() {
  const { puede } = useAuth()
  const puedeEditar   = puede('inocuidad', 'editar')
  const puedeEliminar = puede('inocuidad', 'eliminar')
  const [documentos,   setDocumentos]   = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [error,        setError]        = useState('')
  const [modalNuevo,   setModalNuevo]   = useState(false)
  const [docEditar,    setDocEditar]    = useState(null)
  const [docEliminar,  setDocEliminar]  = useState(null)
  const [docArchivo,   setDocArchivo]   = useState(null)
  const [eliminando,   setEliminando]   = useState(false)

  // Filtros
  const [busqueda,     setBusqueda]     = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroArea,   setFiltroArea]   = useState('')

  const cargar = async () => {
    try {
      setCargando(true)
      setError('')
      setDocumentos(await svc.fetchDocumentos())
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    let vivo = true
    svc.fetchDocumentos()
      .then(data => { if (vivo) setDocumentos(data) })
      .catch(() => { if (vivo) setError('No se pudo conectar con el servidor.') })
      .finally(() => { if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, [])

  const aplicarCambiosDocs = (prev, { documento, autoObsoletado, eliminadoId }) => {
    let lista = [...prev]
    if (eliminadoId)    lista = lista.filter(d => d.id !== eliminadoId)
    if (autoObsoletado) lista = lista.map(d => d.id === autoObsoletado.id ? autoObsoletado : d)
    const existe = lista.find(d => d.id === documento.id)
    lista = existe
      ? lista.map(d => d.id === documento.id ? documento : d)
      : [...lista, documento]
    return lista.sort((a, b) => a.codigo.localeCompare(b.codigo) || a.estado.localeCompare(b.estado))
  }

  const handleCrear = async (data) => {
    const result = await svc.crearDocumento(data)
    setDocumentos(prev => aplicarCambiosDocs(prev, result))
    setModalNuevo(false)
  }

  const handleActualizar = async (data) => {
    const result = await svc.actualizarDocumento(docEditar.id, data)
    setDocumentos(prev => aplicarCambiosDocs(prev, result))
    setDocEditar(null)
  }

  const handleEliminar = async () => {
    setEliminando(true)
    try {
      await svc.eliminarDocumento(docEliminar.id)
      setDocumentos(prev => prev.filter(d => d.id !== docEliminar.id))
      setDocEliminar(null)
    } finally {
      setEliminando(false)
    }
  }

  const handleArchivoActualizado = (actualizado) => {
    setDocumentos(prev => prev.map(d => d.id === actualizado.id ? actualizado : d))
    setDocArchivo(actualizado)
  }

  // Filtrado
  const filtrados = documentos.filter(doc => {
    const term = busqueda.toLowerCase()
    const matchBusq = !busqueda ||
      doc.codigo.toLowerCase().includes(term) ||
      doc.nombre.toLowerCase().includes(term)
    const matchEstado = !filtroEstado || doc.estado === filtroEstado
    const matchArea   = !filtroArea   || doc.areaUso === filtroArea
    return matchBusq && matchEstado && matchArea
  })

  const vigentes  = documentos.filter(d => d.estado === 'vigente').length
  const obsoletos = documentos.filter(d => d.estado === 'obsoleto').length

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: '#10b981', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          Inocuidad
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: C.textPrimary,
          margin: 0, letterSpacing: '-0.02em' }}>
          Mapeo de Documentos
        </h1>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total documentos', value: documentos.length, color: C.textPrimary },
          { label: 'Vigentes',         value: vigentes,          color: '#10b981' },
          { label: 'Obsoletos',        value: obsoletos,         color: C.textSecondary },
        ].map(s => (
          <Card key={s.label} style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color,
              fontFamily: "'Courier New', monospace", lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 5,
              textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {s.label}
            </div>
          </Card>
        ))}
      </div>

      {/* ALERTAS */}
      <PanelAlertas documentos={documentos} onEnviarEmail={svc.enviarNotificaciones} />

      {/* TOOLBAR */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          style={{ ...fieldStyle, width: 220 }}
          placeholder="Buscar por código o nombre..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <select style={{ ...fieldStyle, width: 150 }} value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="vigente">Vigente</option>
          <option value="obsoleto">Obsoleto</option>
        </select>
        <select style={{ ...fieldStyle, width: 160 }} value={filtroArea} onChange={e => setFiltroArea(e.target.value)}>
          <option value="">Todas las áreas</option>
          {AREAS.map(a => <option key={a} value={a}>{AREA_LABEL[a]}</option>)}
        </select>
        <div style={{ marginLeft: 'auto' }}>
          {puedeEditar && <Button onClick={() => setModalNuevo(true)}>+ Nuevo documento</Button>}
        </div>
      </div>

      {/* TABLA */}
      {cargando && (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 13, color: C.textSecondary }}>Cargando documentos...</div>
        </Card>
      )}
      {error && !cargando && (
        <Card style={{ textAlign: 'center', padding: 48, borderColor: C.red }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.red }}>{error}</div>
          <Button variant="secondary" style={{ marginTop: 16 }} onClick={cargar}>🔄 Reintentar</Button>
        </Card>
      )}
      {!cargando && !error && documentos.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📁</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary }}>No hay documentos registrados</div>
          <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 6 }}>
            Agregá el primer documento con el botón + Nuevo documento.
          </div>
        </Card>
      )}
      {!cargando && !error && documentos.length > 0 && filtrados.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 13, color: C.textSecondary }}>
            Ningún documento coincide con los filtros aplicados.
          </div>
        </Card>
      )}

      {!cargando && !error && filtrados.length > 0 && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Código</th>
                  <th style={thStyle}>Nombre</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Rev.</th>
                  <th style={thStyle}>Área</th>
                  <th style={thStyle}>Estado</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Copias</th>
                  <th style={thStyle}>Formato</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Próx. revisión</th>
                  <th style={thStyle}>Notificaciones</th>
                  <th style={thStyle}>Archivo</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(doc => (
                  <FilaDocumento
                    key={doc.id}
                    doc={doc}
                    onEditar={setDocEditar}
                    onEliminar={setDocEliminar}
                    onArchivo={setDocArchivo}
                    puedeEditar={puedeEditar}
                    puedeEliminar={puedeEliminar}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL NUEVO */}
      <Modal open={modalNuevo} onClose={() => setModalNuevo(false)} title="Nuevo Documento">
        <FormDocumento onSubmit={handleCrear} onClose={() => setModalNuevo(false)} />
      </Modal>

      {/* MODAL EDITAR */}
      <Modal open={!!docEditar} onClose={() => setDocEditar(null)} title="Editar Documento">
        {docEditar && (
          <FormDocumento
            inicial={{
              codigo:                  docEditar.codigo,
              nombre:                  docEditar.nombre,
              numero_revision:         String(docEditar.numeroRevision),
              area_uso:                docEditar.areaUso,
              estado:                  docEditar.estado,
              cantidad_copias_impresas: String(docEditar.cantidadCopiasImpresas),
              formato_archivo:         docEditar.formatoArchivo,
              fecha_revision:          docEditar.fechaRevision ?? '',
              dias_alerta:             String(docEditar.diasAlerta ?? 30),
              destinatarios_email:     docEditar.destinatariosEmail?.join(', ') ?? '',
            }}
            onSubmit={handleActualizar}
            onClose={() => setDocEditar(null)}
          />
        )}
      </Modal>

      {/* MODAL ARCHIVO */}
      <Modal open={!!docArchivo} onClose={() => setDocArchivo(null)} title="Gestionar Archivo">
        <ModalArchivo
          doc={docArchivo}
          onActualizar={handleArchivoActualizado}
          onClose={() => setDocArchivo(null)}
        />
      </Modal>

      {/* MODAL ELIMINAR */}
      <Modal open={!!docEliminar} onClose={() => setDocEliminar(null)} title="Eliminar Documento">
        {docEliminar && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ textAlign: 'center', fontSize: 40 }}>🗑️</div>
            <p style={{ margin: 0, color: C.textPrimary, fontSize: 14, lineHeight: 1.6, textAlign: 'center' }}>
              Vas a eliminar el documento{' '}
              <strong style={{ color: C.accent }}>{docEliminar.codigo}</strong>
              {' '}— {docEliminar.nombre}.
              <br />Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setDocEliminar(null)} disabled={eliminando}>
                Cancelar
              </Button>
              <button
                onClick={handleEliminar}
                disabled={eliminando}
                style={{
                  background: C.red, color: '#fff', border: 'none', borderRadius: 8,
                  padding: '8px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                  fontFamily: 'inherit', opacity: eliminando ? 0.6 : 1,
                }}
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}
