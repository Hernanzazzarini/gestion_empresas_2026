import { useState } from 'react'
import { Button, Input, Textarea } from '../../components/ui'
import { colors as C } from '../../components/ui/tokens'

const itemsControl = [
  { key: 'pestillos_cierre',       label: 'Pestillos de cierre de puertas' },
  { key: 'contenedor_seco',        label: 'Contenedor seco' },
  { key: 'contenedor_sin_olor',    label: 'Contenedor sin olor' },
  { key: 'ausencia_contaminantes', label: 'Ausencia de materiales contaminantes' },
  { key: 'limpio_paredes',         label: 'Contenedor limpio (paredes)' },
  { key: 'limpio_piso',            label: 'Contenedor limpio (piso)' },
  { key: 'limpio_techo',           label: 'Contenedor limpio (techo)' },
  { key: 'limpio_puertas',         label: 'Contenedor limpio (puertas)' },
  { key: 'paredes_buen_estado',    label: 'Paredes en buen estado (sin roturas ni perforaciones)' },
  { key: 'piso_buen_estado',       label: 'Piso en buen estado (sin roturas ni perforaciones)' },
  { key: 'techo_buen_estado',      label: 'Techo en buen estado (sin roturas ni perforaciones)' },
  { key: 'puertas_buen_estado',    label: 'Puertas en buen estado (sin roturas ni perforaciones)' },
]

const initialForm = {
  orden_carga_nro:       '',
  fecha:                 new Date().toISOString().slice(0, 10),
  empresa_transportista: '',
  chofer:                '',
  patente_tractor:       '',
  patente_semi:          '',
  nro_contenedor:        '',
  hora_entrada:          '',
  tipo_carga:            'EXPORTACION',
  pestillos_cierre:       null,
  contenedor_seco:        null,
  contenedor_sin_olor:    null,
  ausencia_contaminantes: null,
  limpio_paredes:         null,
  limpio_piso:            null,
  limpio_techo:           null,
  limpio_puertas:         null,
  paredes_buen_estado:    null,
  piso_buen_estado:       null,
  techo_buen_estado:      null,
  puertas_buen_estado:    null,
  observacion_control:    '',
  apto_para_cargar:       null,
  responsable_inocuidad:  '',
}

function SiNoItem({ label, value, onChange }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 80px 80px',
      alignItems: 'center',
      gap: 8,
      padding: '10px 14px',
      borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{ fontSize: 13, color: C.textPrimary }}>{label}</span>
      {[{ val: 1, label: 'SI' }, { val: 0, label: 'NO' }].map(op => (
        <button
          key={op.val}
          onClick={() => onChange(op.val)}
          style={{
            padding: '6px 0', borderRadius: 6, cursor: 'pointer',
            fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
            border: `1.5px solid ${value === op.val ? op.val === 1 ? C.green : C.red : C.border}`,
            background: value === op.val ? op.val === 1 ? C.green + '22' : C.red + '22' : 'transparent',
            color: value === op.val ? op.val === 1 ? C.green : C.red : C.textSecondary,
            transition: 'all 0.15s',
          }}
        >
          {op.label}
        </button>
      ))}
    </div>
  )
}

function SeccionTitulo({ icon, title, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 0', borderBottom: `2px solid ${color}`, marginBottom: 16,
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{
        fontSize: 13, fontWeight: 800, color,
        textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        {title}
      </span>
    </div>
  )
}

export default function FormSeccion1({ inicial, registroNro, onSubmit, onClose, modoEdicion }) {
  const [form, setForm]       = useState(inicial || initialForm)
  const [errores, setErrores] = useState({})

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errores[k]) setErrores(p => ({ ...p, [k]: '' }))
  }

  const validar = () => {
    const e = {}
    if (!form.fecha)                    e.fecha                 = 'Obligatorio'
    if (!form.empresa_transportista)    e.empresa_transportista = 'Obligatorio'
    if (!form.chofer)                   e.chofer                = 'Obligatorio'
    if (!form.nro_contenedor)           e.nro_contenedor        = 'Obligatorio'
    if (!form.responsable_inocuidad)    e.responsable_inocuidad = 'Obligatorio'
    if (form.apto_para_cargar === null) e.apto_para_cargar      = 'Seleccioná una opción'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* NÚMERO DE REGISTRO — solo lectura, generado automático */}
      {registroNro && (
        <div style={{
          background: `${C.accent}11`,
          border: `1px solid ${C.accent}44`,
          borderRadius: 10,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>📋</span>
          <div>
            <div style={{
              fontSize: 11, color: C.accent, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Número de Registro
            </div>
            <div style={{
              fontSize: 22, fontWeight: 900, color: C.accent,
              fontFamily: "'Courier New', monospace",
            }}>
              {registroNro}
            </div>
          </div>
        </div>
      )}

      {/* DATOS GENERALES */}
      <div>
        <SeccionTitulo icon="📋" title="Datos Generales" color={C.accent} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Input
            label="Orden de Carga Nº"
            value={form.orden_carga_nro}
            onChange={e => set('orden_carga_nro', e.target.value)}
          />
          <div>
            <Input
              label="Fecha *"
              type="date"
              value={form.fecha}
              onChange={e => set('fecha', e.target.value)}
            />
            {errores.fecha && <Err>{errores.fecha}</Err>}
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <Input
            label="Empresa Transportista *"
            value={form.empresa_transportista}
            onChange={e => set('empresa_transportista', e.target.value)}
          />
          {errores.empresa_transportista && <Err>{errores.empresa_transportista}</Err>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
          <div>
            <Input
              label="Chofer *"
              value={form.chofer}
              onChange={e => set('chofer', e.target.value)}
            />
            {errores.chofer && <Err>{errores.chofer}</Err>}
          </div>
          <div>
            <Input
              label="Nº Contenedor *"
              value={form.nro_contenedor}
              onChange={e => set('nro_contenedor', e.target.value)}
            />
            {errores.nro_contenedor && <Err>{errores.nro_contenedor}</Err>}
          </div>
          <Input
            label="Patente Tractor"
            value={form.patente_tractor}
            onChange={e => set('patente_tractor', e.target.value)}
          />
          <Input
            label="Patente Semi"
            value={form.patente_semi}
            onChange={e => set('patente_semi', e.target.value)}
          />
          <Input
            label="Hora Entrada"
            type="time"
            value={form.hora_entrada}
            onChange={e => set('hora_entrada', e.target.value)}
          />
        </div>
      </div>

      {/* CONTROL ANTES DE LA CARGA */}
      <div>
        <SeccionTitulo icon="🔍" title="Control Antes de la Carga" color={C.blue} />
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 80px 80px',
          gap: 8, padding: '8px 14px',
          background: C.surfaceHigh, borderRadius: '8px 8px 0 0',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase' }}>Ítem</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.green, textAlign: 'center', textTransform: 'uppercase' }}>SI</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.red, textAlign: 'center', textTransform: 'uppercase' }}>NO</span>
        </div>
        <div style={{ border: `1px solid ${C.border}`, borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
          {itemsControl.map(item => (
            <SiNoItem
              key={item.key}
              label={item.label}
              value={form[item.key]}
              onChange={v => set(item.key, v)}
            />
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <Textarea
            label="Observaciones"
            placeholder="Observaciones del control..."
            value={form.observacion_control}
            onChange={e => set('observacion_control', e.target.value)}
          />
        </div>
      </div>

      {/* RESULTADO */}
      <div>
        <SeccionTitulo icon="✅" title="Resultado de Inspección" color={C.green} />
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          {[
            { val: 1, label: '✅ APTO para cargar',    color: C.green },
            { val: 0, label: '❌ NO APTO para cargar', color: C.red   },
          ].map(op => (
            <button
              key={op.val}
              onClick={() => set('apto_para_cargar', op.val)}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 10,
                cursor: 'pointer', fontWeight: 700, fontSize: 14,
                fontFamily: 'inherit',
                background: form.apto_para_cargar === op.val ? op.color + '22' : C.surfaceHigh,
                color: form.apto_para_cargar === op.val ? op.color : C.textSecondary,
                border: `2px solid ${form.apto_para_cargar === op.val ? op.color : C.border}`,
                transition: 'all 0.15s',
              }}
            >
              {op.label}
            </button>
          ))}
        </div>
        {errores.apto_para_cargar && <Err>{errores.apto_para_cargar}</Err>}
        <div>
          <Input
            label="Responsable Inocuidad *"
            placeholder="Nombre y apellido del inspector"
            value={form.responsable_inocuidad}
            onChange={e => set('responsable_inocuidad', e.target.value)}
          />
          {errores.responsable_inocuidad && <Err>{errores.responsable_inocuidad}</Err>}
        </div>
      </div>

      {/* BOTONES */}
      <div style={{
        display: 'flex', gap: 10, justifyContent: 'flex-end',
        paddingTop: 16, borderTop: `1px solid ${C.border}`,
      }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button
          variant="primary"
          onClick={() => { if (validar()) onSubmit(form) }}
        >
          {modoEdicion ? '💾 Guardar Cambios' : '🛡️ Guardar Inspección'}
        </Button>
      </div>

    </div>
  )
}

function Err({ children }) {
  return <div style={{ fontSize: 12, color: C.red, marginTop: 5 }}>⚠ {children}</div>
}

