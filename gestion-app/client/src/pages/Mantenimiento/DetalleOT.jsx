import { useState } from 'react'
import { Button, Input, Textarea, Modal } from '../../components/ui'
import { colors as C, prioridades, estadoConfig } from '../../components/ui/tokens'
import Badge from '../../components/ui/Badge'
import PrioridadDot from '../../components/ui/PrioridadDot'

// ─── SUB-COMPONENTES INTERNOS ─────────────────────────────────────────────────

function Section({ icon, title, color, children }) {
  return (
    <div style={{
      background: C.bg,
      borderRadius: 12,
      padding: 18,
      border: `1px solid ${C.border}`,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
      }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{
          fontSize: 12,
          fontWeight: 800,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: 11,
        color: C.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: 3,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 14,
        color: value ? C.textPrimary : C.textMuted,
        fontStyle: value ? 'normal' : 'italic',
        lineHeight: 1.5,
      }}>
        {value || 'Sin registrar'}
      </div>
    </div>
  )
}

function AprobacionBtn({ aprueba, setAprueba }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button
        onClick={() => setAprueba(true)}
        style={{
          flex: 1,
          padding: '12px 0',
          borderRadius: 10,
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: 14,
          fontFamily: 'inherit',
          background: aprueba === true ? C.green : C.surfaceHigh,
          color: aprueba === true ? '#fff' : C.textSecondary,
          border: `2px solid ${aprueba === true ? C.green : C.border}`,
          transition: 'all 0.15s',
        }}
      >
        ✅ Apruebo
      </button>
      <button
        onClick={() => setAprueba(false)}
        style={{
          flex: 1,
          padding: '12px 0',
          borderRadius: 10,
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: 14,
          fontFamily: 'inherit',
          background: aprueba === false ? C.red : C.surfaceHigh,
          color: aprueba === false ? '#fff' : C.textSecondary,
          border: `2px solid ${aprueba === false ? C.red : C.border}`,
          transition: 'all 0.15s',
        }}
      >
        ❌ Rechazo
      </button>
    </div>
  )
}

// ─── FORM MANTENIMIENTO ───────────────────────────────────────────────────────

function FormMantenimiento({ ot, onSubmit, onClose }) {
  const [form, setForm] = useState({
    fechaRealizacion: ot.fechaRealizacion || new Date().toISOString().slice(0, 10),
    descripcionTrabajo: ot.descripcionTrabajo || '',
    responsable: ot.responsable || '',
  })
  const [errores, setErrores] = useState({})

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errores[k]) setErrores(p => ({ ...p, [k]: '' }))
  }

  const validar = () => {
    const e = {}
    if (!form.fechaRealizacion)      e.fechaRealizacion  = 'La fecha es obligatoria'
    if (!form.responsable.trim())    e.responsable       = 'El responsable es obligatorio'
    if (!form.descripcionTrabajo.trim()) e.descripcionTrabajo = 'La descripción es obligatoria'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validar()) return
    onSubmit({ ...form, estado: 'completado' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Info OT */}
      <div style={{
        background: C.surfaceHigh,
        borderRadius: 10,
        padding: '14px 16px',
        borderLeft: `3px solid ${C.accent}`,
      }}>
        <div style={{ fontSize: 11, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          OT Asignada
        </div>
        <div style={{ fontSize: 14, color: C.textPrimary, fontWeight: 600 }}>
          {ot.id} — {ot.area}
        </div>
        <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 4 }}>
          {ot.tarea}
        </div>
      </div>

      <div>
        <Input
          label="Fecha de realización *"
          type="date"
          value={form.fechaRealizacion}
          onChange={e => set('fechaRealizacion', e.target.value)}
        />
        {errores.fechaRealizacion && <Err>{errores.fechaRealizacion}</Err>}
      </div>

      <div>
        <Input
          label="Responsable del trabajo *"
          placeholder="Técnico / Operario"
          value={form.responsable}
          onChange={e => set('responsable', e.target.value)}
        />
        {errores.responsable && <Err>{errores.responsable}</Err>}
      </div>

      <div>
        <Textarea
          label="Descripción del trabajo realizado *"
          placeholder="Qué se hizo, materiales utilizados, observaciones..."
          value={form.descripcionTrabajo}
          onChange={e => set('descripcionTrabajo', e.target.value)}
        />
        {errores.descripcionTrabajo && <Err>{errores.descripcionTrabajo}</Err>}
      </div>

      <div style={{
        display: 'flex',
        gap: 10,
        justifyContent: 'flex-end',
        paddingTop: 12,
        borderTop: `1px solid ${C.border}`,
      }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleSubmit}>🔧 Registrar Intervención</Button>
      </div>
    </div>
  )
}

// ─── FORM INOCUIDAD ───────────────────────────────────────────────────────────

function FormInocuidad({ ot, onSubmit, onClose }) {
  const [inspector, setInspector] = useState('')
  const [aprueba, setAprueba] = useState(null)
  const [comentario, setComentario] = useState('')
  const [errores, setErrores] = useState({})

  const handleSubmit = () => {
    const e = {}
    if (!inspector.trim()) e.inspector = 'El nombre del inspector es obligatorio'
    if (aprueba === null)  e.aprueba   = 'Seleccioná si aprobás o rechazás'
    setErrores(e)
    if (Object.keys(e).length > 0) return
    onSubmit({
      okInocuidad: aprueba,
      inspectorInocuidad: inspector,
      comentarioInocuidad: comentario,
      estado: aprueba ? 'aprobado_inocuidad' : 'completado',
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Trabajo realizado */}
      <div style={{
        background: C.bg,
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <div style={{ fontSize: 12, color: C.textSecondary, textTransform: 'uppercase', fontWeight: 700 }}>
          Trabajo Realizado
        </div>
        <div style={{ fontSize: 13, color: C.textPrimary, lineHeight: 1.5 }}>
          {ot.descripcionTrabajo}
        </div>
        <div style={{ fontSize: 12, color: C.textSecondary }}>
          🔧 {ot.responsable} · 📅 {ot.fechaRealizacion}
        </div>
      </div>

      <div>
        <Input
          label="Inspector (nombre y apellido) *"
          placeholder="Tu nombre completo"
          value={inspector}
          onChange={e => {
            setInspector(e.target.value)
            if (errores.inspector) setErrores(p => ({ ...p, inspector: '' }))
          }}
        />
        {errores.inspector && <Err>{errores.inspector}</Err>}
      </div>

      <div>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: C.textSecondary,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          Resultado *
        </div>
        <AprobacionBtn aprueba={aprueba} setAprueba={(v) => {
          setAprueba(v)
          if (errores.aprueba) setErrores(p => ({ ...p, aprueba: '' }))
        }} />
        {errores.aprueba && <Err>{errores.aprueba}</Err>}
      </div>

      <Textarea
        label="Comentario (opcional)"
        placeholder={aprueba === false ? 'Indicá el motivo del rechazo...' : 'Observaciones adicionales...'}
        value={comentario}
        onChange={e => setComentario(e.target.value)}
      />

      <div style={{
        display: 'flex',
        gap: 10,
        justifyContent: 'flex-end',
        paddingTop: 12,
        borderTop: `1px solid ${C.border}`,
      }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button
          variant={aprueba === false ? 'danger' : 'success'}
          onClick={handleSubmit}
        >
          🛡️ Confirmar Revisión
        </Button>
      </div>
    </div>
  )
}

// ─── FORM CONFORMIDAD ─────────────────────────────────────────────────────────

function FormConformidad({ ot, onSubmit, onClose }) {
  const [aprueba, setAprueba] = useState(null)
  const [comentario, setComentario] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (aprueba === null) { setError('Seleccioná si aprobás o rechazás'); return }
    onSubmit({
      okSolicitante: aprueba,
      comentarioSolicitante: comentario,
      estado: aprueba ? 'cerrado' : 'aprobado_inocuidad',
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Resumen */}
      <div style={{
        background: C.bg,
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <div style={{ fontSize: 12, color: C.textSecondary, textTransform: 'uppercase', fontWeight: 700 }}>
          Trabajo Realizado
        </div>
        <div style={{ fontSize: 13, color: C.textPrimary, lineHeight: 1.5 }}>
          {ot.descripcionTrabajo}
        </div>
        <div style={{ fontSize: 12, color: C.textSecondary }}>
          🔧 {ot.responsable} · 📅 {ot.fechaRealizacion}
        </div>
        {ot.okInocuidad && (
          <div style={{ fontSize: 12, color: C.green, marginTop: 4 }}>
            ✅ Aprobado por Inocuidad — {ot.inspectorInocuidad}
          </div>
        )}
      </div>

      <div>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: C.textSecondary,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          ¿El trabajo fue realizado correctamente? *
        </div>
        <AprobacionBtn aprueba={aprueba} setAprueba={(v) => {
          setAprueba(v)
          setError('')
        }} />
        {error && <Err>{error}</Err>}
      </div>

      <Textarea
        label="Comentario (opcional)"
        placeholder={aprueba === false ? 'Indicá qué faltó o qué salió mal...' : 'Observaciones finales...'}
        value={comentario}
        onChange={e => setComentario(e.target.value)}
      />

      <div style={{
        display: 'flex',
        gap: 10,
        justifyContent: 'flex-end',
        paddingTop: 12,
        borderTop: `1px solid ${C.border}`,
      }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button
          variant={aprueba === false ? 'danger' : 'success'}
          onClick={handleSubmit}
        >
          ✅ Confirmar Conformidad
        </Button>
      </div>
    </div>
  )
}

// ─── HELPER ERROR ─────────────────────────────────────────────────────────────
function Err({ children }) {
  return (
    <div style={{ fontSize: 12, color: C.red, marginTop: 5 }}>
      ⚠ {children}
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL DETALLE ─────────────────────────────────────────────
export default function DetalleOT({ ot, rol, onUpdateOT, onClose }) {
  const [modalMant, setModalMant] = useState(false)
  const [modalInocuidad, setModalInocuidad] = useState(false)
  const [modalConformidad, setModalConformidad] = useState(false)

  const canMant        = rol === 'mantenimiento' && (ot.estado === 'pendiente' || ot.estado === 'en_proceso' || ot.estado === 'completado')
  const canInocuidad   = rol === 'inocuidad' && ot.estado === 'completado'
  const canConformidad = rol === 'solicitante' && ot.estado === 'aprobado_inocuidad'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 10,
      }}>
        <div>
          <div style={{
            fontSize: 22,
            fontWeight: 900,
            color: C.accent,
            fontFamily: "'Courier New', monospace",
          }}>
            {ot.id}
          </div>
          <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 2 }}>
            {ot.area} · {ot.fecha} · Solicitado por{' '}
            <strong style={{ color: C.textPrimary }}>{ot.solicitante}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <PrioridadDot id={ot.prioridad} />
          <Badge estado={ot.estado} />
        </div>
      </div>

      {/* TAREA */}
      <div style={{
        background: `${C.accent}11`,
        borderLeft: `3px solid ${C.accent}`,
        borderRadius: 8,
        padding: '12px 16px',
      }}>
        <div style={{
          fontSize: 11,
          color: C.accent,
          textTransform: 'uppercase',
          fontWeight: 700,
          marginBottom: 4,
        }}>
          Tarea Solicitada
        </div>
        <div style={{ fontSize: 14, color: C.textPrimary, lineHeight: 1.6 }}>
          {ot.tarea}
        </div>
      </div>

      {/* SECCIÓN MANTENIMIENTO */}
      <Section icon="🔧" title="Registro de Mantenimiento" color={C.blue}>
        {ot.fechaRealizacion ? (
          <>
            <Field label="Fecha de realización" value={ot.fechaRealizacion} />
            <Field label="Responsable"           value={ot.responsable} />
            <Field label="Trabajo realizado"     value={ot.descripcionTrabajo} />
          </>
        ) : (
          <div style={{ fontSize: 13, color: C.textMuted, fontStyle: 'italic', marginBottom: 12 }}>
            Aún no se registró la intervención.
          </div>
        )}
        {canMant && (
          <Button variant="primary" onClick={() => setModalMant(true)}>
            🔧 {ot.fechaRealizacion ? 'Actualizar Registro' : 'Registrar Intervención'}
          </Button>
        )}
      </Section>

      {/* SECCIÓN INOCUIDAD */}
      <Section icon="🛡️" title="Aprobación de Inocuidad" color={C.green}>
        {ot.okInocuidad ? (
          <>
            <Field label="Inspector"  value={ot.inspectorInocuidad} />
            <Field label="Resultado"  value="✅ Aprobado" />
            {ot.comentarioInocuidad && (
              <Field label="Comentario" value={ot.comentarioInocuidad} />
            )}
          </>
        ) : ot.estado === 'pendiente' || ot.estado === 'en_proceso' ? (
          <div style={{ fontSize: 13, color: C.textMuted, fontStyle: 'italic' }}>
            Disponible una vez completada la intervención.
          </div>
        ) : (
          <div style={{ fontSize: 13, color: C.textMuted, fontStyle: 'italic' }}>
            Pendiente de revisión de inocuidad.
          </div>
        )}
        {canInocuidad && (
          <Button variant="success" style={{ marginTop: 12 }} onClick={() => setModalInocuidad(true)}>
            🛡️ Revisar Inocuidad
          </Button>
        )}
      </Section>

      {/* SECCIÓN CONFORMIDAD */}
      <Section icon="✅" title="Conformidad del Solicitante" color={C.blue}>
        {ot.okSolicitante ? (
          <>
            <Field label="Resultado"  value="✅ Conforme — trabajo aprobado" />
            {ot.comentarioSolicitante && (
              <Field label="Comentario" value={ot.comentarioSolicitante} />
            )}
          </>
        ) : ot.estado !== 'aprobado_inocuidad' && ot.estado !== 'cerrado' ? (
          <div style={{ fontSize: 13, color: C.textMuted, fontStyle: 'italic' }}>
            Disponible tras la aprobación de inocuidad.
          </div>
        ) : (
          <div style={{ fontSize: 13, color: C.textMuted, fontStyle: 'italic' }}>
            Pendiente de conformidad del solicitante.
          </div>
        )}
        {canConformidad && (
          <Button variant="primary" style={{ marginTop: 12 }} onClick={() => setModalConformidad(true)}>
            ✅ Dar Conformidad
          </Button>
        )}
      </Section>

      {/* MODALES */}
      <Modal open={modalMant} onClose={() => setModalMant(false)} title="Registrar Intervención">
        <FormMantenimiento
          ot={ot}
          onClose={() => setModalMant(false)}
          onSubmit={(data) => { onUpdateOT(ot.id, data); setModalMant(false) }}
        />
      </Modal>

      <Modal open={modalInocuidad} onClose={() => setModalInocuidad(false)} title="Revisión de Inocuidad">
        <FormInocuidad
          ot={ot}
          onClose={() => setModalInocuidad(false)}
          onSubmit={(data) => { onUpdateOT(ot.id, data); setModalInocuidad(false) }}
        />
      </Modal>

      <Modal open={modalConformidad} onClose={() => setModalConformidad(false)} title="Conformidad del Solicitante">
        <FormConformidad
          ot={ot}
          onClose={() => setModalConformidad(false)}
          onSubmit={(data) => { onUpdateOT(ot.id, data); setModalConformidad(false) }}
        />
      </Modal>

    </div>
  )
}