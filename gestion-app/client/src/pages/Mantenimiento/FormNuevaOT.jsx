import { useState } from 'react'
import { Button, Input, Select, Textarea } from '../../components/ui'
import { areas, prioridades, colors as C } from '../../components/ui/tokens'

const initialForm = {
  fecha: new Date().toISOString().slice(0, 10),
  prioridad: 'media',
  area: areas[0],
  tarea: '',
  solicitante: '',
}

export default function FormNuevaOT({ onSubmit, onClose }) {
  const [form, setForm] = useState(initialForm)
  const [errores, setErrores] = useState({})

  const set = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }))
    // Limpiar error del campo cuando el usuario escribe
    if (errores[campo]) setErrores(prev => ({ ...prev, [campo]: '' }))
  }

  const validar = () => {
    const nuevosErrores = {}
    if (!form.solicitante.trim()) nuevosErrores.solicitante = 'El nombre del solicitante es obligatorio'
    if (!form.tarea.trim())       nuevosErrores.tarea       = 'La descripción de la tarea es obligatoria'
    if (!form.fecha)              nuevosErrores.fecha        = 'La fecha es obligatoria'
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const handleSubmit = () => {
    if (!validar()) return
    onSubmit(form)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Fila: Fecha + Prioridad */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <Input
            label="Fecha *"
            type="date"
            value={form.fecha}
            onChange={e => set('fecha', e.target.value)}
          />
          {errores.fecha && <ErrorMsg>{errores.fecha}</ErrorMsg>}
        </div>

        <Select
          label="Prioridad *"
          value={form.prioridad}
          onChange={e => set('prioridad', e.target.value)}
        >
          {prioridades.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </Select>
      </div>

      {/* Fila: Área + Solicitante */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Select
          label="Área solicitante *"
          value={form.area}
          onChange={e => set('area', e.target.value)}
        >
          {areas.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </Select>

        <div>
          <Input
            label="Solicitante *"
            placeholder="Nombre y apellido"
            value={form.solicitante}
            onChange={e => set('solicitante', e.target.value)}
          />
          {errores.solicitante && <ErrorMsg>{errores.solicitante}</ErrorMsg>}
        </div>
      </div>

      {/* Tarea */}
      <div>
        <Textarea
          label="Descripción de la tarea *"
          placeholder="Detallá qué trabajo se necesita realizar, dónde y por qué..."
          value={form.tarea}
          onChange={e => set('tarea', e.target.value)}
          style={{ minHeight: 110 }}
        />
        {errores.tarea && <ErrorMsg>{errores.tarea}</ErrorMsg>}
      </div>

      {/* Preview prioridad */}
      <PrioridadPreview prioridad={form.prioridad} />

      {/* Botones */}
      <div style={{
        display: 'flex',
        gap: 10,
        justifyContent: 'flex-end',
        marginTop: 4,
        paddingTop: 16,
        borderTop: `1px solid ${C.border}`,
      }}>
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          📋 Crear OT
        </Button>
      </div>

    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function ErrorMsg({ children }) {
  return (
    <div style={{
      fontSize: 12,
      color: '#ef4444',
      marginTop: 5,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    }}>
      ⚠ {children}
    </div>
  )
}

function PrioridadPreview({ prioridad }) {
  const config = {
    critica: {
      color: '#ef4444',
      bg: '#450a0a',
      texto: 'Se notificará al área de mantenimiento de forma inmediata.',
      icon: '🚨',
    },
    alta: {
      color: '#f97316',
      bg: '#431407',
      texto: 'Se gestionará dentro de las próximas 24 horas.',
      icon: '⚠️',
    },
    media: {
      color: '#f59e0b',
      bg: '#451a03',
      texto: 'Se planificará dentro de la semana.',
      icon: '📋',
    },
    baja: {
      color: '#10b981',
      bg: '#064e3b',
      texto: 'Se agendará según disponibilidad.',
      icon: '📌',
    },
  }

  const c = config[prioridad] || config.media

  return (
    <div style={{
      background: c.bg,
      border: `1px solid ${c.color}44`,
      borderLeft: `3px solid ${c.color}`,
      borderRadius: 8,
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      <span style={{ fontSize: 18 }}>{c.icon}</span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: c.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Prioridad {prioridad}
        </div>
        <div style={{ fontSize: 13, color: c.color + 'cc', marginTop: 2 }}>
          {c.texto}
        </div>
      </div>
    </div>
  )
}