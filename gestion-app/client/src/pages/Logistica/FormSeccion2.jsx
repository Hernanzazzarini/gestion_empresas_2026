import { useState, useRef } from 'react'
import { Button, Input, Select, Textarea } from '../../components/ui'
import { colors as C } from '../../components/ui/tokens'
import { subirFoto, eliminarFoto } from '../../services/uploads'

const itemsPostCarga = [
  { key: 'forrado_contenedor',             label: 'Forrado de contenedor' },
  { key: 'envases_buen_estado',            label: 'Envases en perfecto estado (sin manchas ni roturas)' },
  { key: 'envases_bien_colocados',         label: 'Envases perfectamente colocados' },
  { key: 'envases_correctamente_cerrados', label: 'Envases correctamente cerrados' },
  { key: 'envases_identificacion',         label: 'Todos los envases poseen identificación de expedición' },
  { key: 'faja_trincado',                  label: 'Faja de trincado correctamente colocada' },
  { key: 'evidencia_insectos',             label: 'Evidencia de insectos' },
]

const itemsEtiquetas = [
  { key: 'etiqueta_lote',     label: 'Lote' },
  { key: 'etiqueta_calibre',  label: 'Calibre' },
  { key: 'etiqueta_peso',     label: 'Peso' },
  { key: 'etiqueta_fechas',   label: 'Fechas Producción / Vencimiento' },
  { key: 'etiqueta_leyenda',  label: 'Leyenda' },
  { key: 'etiqueta_especial', label: 'Etiquetas Especial' },
]

const tiposEnvase = [
  'BIG BAG EXPO 1250 KGS',
  'BIG BAG EXPO 1050 KGS',
  'POLI EXPO 50 KGS',
  'POLI EXPO 25 KGS',
  'TAMBORES 230 KGS',
]

const tiposGel = [
  { label: '1000g — 3.6 L/unidad', gramos: 1000, absorcion: 3.6 },
  { label: '1500g — 5.4 L/unidad', gramos: 1500, absorcion: 5.4 },
  { label: '2000g — 7.2 L/unidad', gramos: 2000, absorcion: 7.2 },
]

const initialForm = {
  hora_salida:      '',
  destino_descarga: '',
  cosecha:          '',
  tipo_envase:      tiposEnvase[0],
  forrado_contenedor:             null,
  material_forrado:               '',
  sales_geles:                    null,
  sales_cantidad:                 '',
  sales_tipo_gel:                 tiposGel[0].gramos,
  sales_lote:                     '',
  envases_buen_estado:            null,
  envases_bien_colocados:         null,
  envases_correctamente_cerrados: null,
  envases_identificacion:         null,
  faja_trincado:                  null,
  blister_fosfuro:                null,
  blister_cantidad:               '',
  blister_lote:                   '',
  pallet_expo:                    null,
  pallet_cantidad:                '',
  pallet_lote:                    '',
  evidencia_insectos:             null,
  obs_control_carga:              '',
  lote:          '',
  nro_bls_bb:    '',
  calibre:       '',
  va_fumigado:   null,
  temp_bb1:      '',
  temp_bb5:      '',
  temp_bb10:     '',
  temp_bb15:     '',
  temp_bb20:     '',
  temp_promedio: '',
  etiqueta_lote:     null,
  etiqueta_calibre:  null,
  etiqueta_peso:     null,
  etiqueta_fechas:   null,
  etiqueta_leyenda:  null,
  etiqueta_especial: null,
  obs_etiquetas:     '',
  punto_rocio:       '',
  temp_tempering:    '',
  humedad_tempering: '',
  temp_ambiente:     '',
  humedad_ambiente:  '',
  foto1: '', foto1_filename: '',
  foto2: '', foto2_filename: '',
  foto3: '', foto3_filename: '',
  foto4: '', foto4_filename: '',
  firma_cargador:       '',
  firma_auxiliar:       '',
  firma_acondicionador: '',
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const calcularPromedio = (form) => {
  const valores = [
    form.temp_bb1, form.temp_bb5, form.temp_bb10,
    form.temp_bb15, form.temp_bb20,
  ].map(v => parseFloat(v)).filter(v => !isNaN(v))
  if (valores.length === 0) return ''
  return (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2)
}

const calcularAbsorcion = (cantidad, gramos) => {
  const gel = tiposGel.find(g => g.gramos === parseInt(gramos))
  if (!gel || !cantidad || isNaN(parseInt(cantidad))) return null
  return (parseInt(cantidad) * gel.absorcion).toFixed(1)
}

// ─── SUB-COMPONENTES ──────────────────────────────────────────────────────────
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

function SiNoNaItem({ label, value, onChange }) {
  const opciones = [
    { val: 1,    label: 'SI',  colorOn: C.green },
    { val: 0,    label: 'NO',  colorOn: C.red   },
    { val: 'na', label: 'N/A', colorOn: C.textSecondary },
  ]
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 70px 70px 70px',
      alignItems: 'center',
      gap: 6, padding: '10px 14px',
      borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{ fontSize: 13, color: C.textPrimary }}>{label}</span>
      {opciones.map(op => (
        <button key={op.val} onClick={() => onChange(op.val)} style={{
          padding: '5px 0', borderRadius: 6, cursor: 'pointer',
          fontWeight: 700, fontSize: 11, fontFamily: 'inherit',
          border: `1.5px solid ${value === op.val ? op.colorOn : C.border}`,
          background: value === op.val ? op.colorOn + '22' : 'transparent',
          color: value === op.val ? op.colorOn : C.textSecondary,
          transition: 'all 0.15s',
        }}>
          {op.label}
        </button>
      ))}
    </div>
  )
}

function SiNoNaGrande({ label, value, onChange }) {
  const opciones = [
    { val: 1,    label: 'SI',  colorOn: C.green },
    { val: 0,    label: 'NO',  colorOn: C.red   },
    { val: 'na', label: 'N/A', colorOn: C.textSecondary },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && (
        <div style={{
          fontSize: 12, fontWeight: 600, color: C.textSecondary,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {label}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        {opciones.map(op => (
          <button key={op.val} onClick={() => onChange(op.val)} style={{
            padding: '7px 20px', borderRadius: 8, cursor: 'pointer',
            fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
            background: value === op.val ? op.colorOn + '22' : C.surfaceHigh,
            color: value === op.val ? op.colorOn : C.textSecondary,
            border: `2px solid ${value === op.val ? op.colorOn : C.border}`,
            transition: 'all 0.15s',
          }}>
            {op.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function FotoSlot({ numero, url, filename, onSubir, onEliminar, subiendo }) {
  const inputRef = useRef()
  const [hover, setHover] = useState(false)

  return (
    <div style={{
      border: `2px dashed ${url ? C.green : C.border}`,
      borderRadius: 12, overflow: 'hidden',
      background: C.bg, transition: 'all 0.2s',
      aspectRatio: '4/3', position: 'relative',
      minHeight: 140,
    }}>
      {url ? (
        <>
          <img
            src={url}
            alt={`Foto ${numero}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 8,
              opacity: hover ? 1 : 0,
              transition: 'opacity 0.2s',
            }}
          >
            <div style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>
              📷 Foto {numero}
            </div>
            <button
              onClick={() => onEliminar(filename, numero)}
              style={{
                background: C.red, color: '#fff', border: 'none',
                borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
              }}
            >
              🗑️ Eliminar
            </button>
          </div>
        </>
      ) : (
        <div
          onClick={() => !subiendo && inputRef.current?.click()}
          style={{
            width: '100%', height: '100%', minHeight: 140,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 8, cursor: subiendo ? 'default' : 'pointer',
          }}
        >
          {subiendo ? (
            <>
              <div style={{ fontSize: 28 }}>⏳</div>
              <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 600 }}>
                Subiendo...
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 32, opacity: 0.3 }}>📷</div>
              <div style={{ fontSize: 13, color: C.textSecondary, fontWeight: 700 }}>
                Foto {numero}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted }}>
                Click para agregar
              </div>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={e => {
          const archivo = e.target.files?.[0]
          if (archivo) onSubir(archivo, numero)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
// Agregar contenedorId como prop
export default function FormSeccion2({ inicial, contenedorId, onSubmit, onClose, modoEdicion }) {
  const [form, setForm]         = useState(inicial || initialForm)
  const [errores, setErrores]   = useState({})
  const [subiendo, setSubiendo] = useState({ 1: false, 2: false, 3: false, 4: false })

  const set = (k, v) => {
    setForm(prev => {
      const nuevo = { ...prev, [k]: v }
      if (['temp_bb1','temp_bb5','temp_bb10','temp_bb15','temp_bb20'].includes(k)) {
        nuevo.temp_promedio = calcularPromedio(nuevo)
      }
      return nuevo
    })
    if (errores[k]) setErrores(p => ({ ...p, [k]: '' }))
  }

  const validar = () => {
    const e = {}
    if (!form.firma_cargador.trim()) e.firma_cargador = 'La firma del cargador es obligatoria'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const handleSubirFoto = async (archivo, numero) => {
    if (!contenedorId) {
      alert('Guardá primero la sección 1 antes de subir fotos.')
      return
    }
    setSubiendo(p => ({ ...p, [numero]: true }))
    try {
      const resultado = await subirFoto(archivo, contenedorId, numero)
      set(`foto${numero}`, resultado.url)
      set(`foto${numero}_filename`, resultado.filename)
    } catch {
      alert('Error al subir la foto.')
    } finally {
      setSubiendo(p => ({ ...p, [numero]: false }))
    }
  }
  
  const handleEliminarFoto = async (filename, numero) => {
    try {
      if (contenedorId) await eliminarFoto(contenedorId, numero, filename)
    } catch { /* continuar */ }
    set(`foto${numero}`, '')
    set(`foto${numero}_filename`, '')
  }

  const absorcionTotal = calcularAbsorcion(form.sales_cantidad, form.sales_tipo_gel)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── DATOS DE LA CARGA ── */}
      <div>
        <SeccionTitulo icon="🚛" title="Datos de la Carga" color={C.accent} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Input label="Hora Salida" type="time" value={form.hora_salida}
            onChange={e => set('hora_salida', e.target.value)} />
          <Input label="Cosecha" value={form.cosecha}
            onChange={e => set('cosecha', e.target.value)} />
          <Input label="Destino de Descarga" value={form.destino_descarga}
            onChange={e => set('destino_descarga', e.target.value)} />
          <Select label="Tipo de Envase" value={form.tipo_envase}
            onChange={e => set('tipo_envase', e.target.value)}>
            {tiposEnvase.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
      </div>

      {/* ── CONTROL POST CARGA ── */}
      <div>
        <SeccionTitulo icon="📦" title="Control Después de la Carga" color={C.blue} />
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 70px 70px 70px',
          gap: 6, padding: '8px 14px',
          background: C.surfaceHigh, borderRadius: '8px 8px 0 0',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase' }}>Ítem</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.green, textAlign: 'center', textTransform: 'uppercase' }}>SI</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.red, textAlign: 'center', textTransform: 'uppercase' }}>NO</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, textAlign: 'center', textTransform: 'uppercase' }}>N/A</span>
        </div>
        <div style={{ border: `1px solid ${C.border}`, borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
          {itemsPostCarga.map(item => (
            <SiNoNaItem key={item.key} label={item.label}
              value={form[item.key]} onChange={v => set(item.key, v)} />
          ))}
        </div>

        <div style={{ marginTop: 14 }}>
          <Input label="Material de Forrado" placeholder="Especificá el material..."
            value={form.material_forrado}
            onChange={e => set('material_forrado', e.target.value)} />
        </div>

        {/* Sales / Geles */}
        <div style={{
          marginTop: 14, background: C.surfaceHigh,
          borderRadius: 10, padding: 16,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <SiNoNaGrande label="Sales o Geles Absorbentes"
            value={form.sales_geles} onChange={v => set('sales_geles', v)} />
          {form.sales_geles === 1 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <Select label="Tamaño del Gel" value={form.sales_tipo_gel}
                  onChange={e => set('sales_tipo_gel', parseInt(e.target.value))}>
                  {tiposGel.map(g => (
                    <option key={g.gramos} value={g.gramos}>{g.label}</option>
                  ))}
                </Select>
                <Input label="Cantidad (unidades)" type="number" min="1"
                  placeholder="Ej: 4" value={form.sales_cantidad}
                  onChange={e => set('sales_cantidad', e.target.value)} />
                <Input label="Lote" value={form.sales_lote}
                  onChange={e => set('sales_lote', e.target.value)} />
              </div>
              {absorcionTotal && (
                <div style={{
                  background: `${C.green}11`, border: `1px solid ${C.green}44`,
                  borderRadius: 8, padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 20 }}>💧</span>
                  <div>
                    <div style={{
                      fontSize: 11, color: C.green, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                      Capacidad de Absorción Total
                    </div>
                    <div style={{
                      fontSize: 22, fontWeight: 900, color: C.green,
                      fontFamily: "'Courier New', monospace",
                    }}>
                      {absorcionTotal} litros
                    </div>
                    <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>
                      {form.sales_cantidad} unidad{form.sales_cantidad > 1 ? 'es' : ''} × {tiposGel.find(g => g.gramos === parseInt(form.sales_tipo_gel))?.absorcion} L/unidad
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Blíster */}
        <div style={{
          marginTop: 14, background: C.surfaceHigh,
          borderRadius: 10, padding: 16,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <SiNoNaGrande label="Blíster con Fosfuro"
            value={form.blister_fosfuro} onChange={v => set('blister_fosfuro', v)} />
          {form.blister_fosfuro === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Input label="Cantidad" value={form.blister_cantidad}
                onChange={e => set('blister_cantidad', e.target.value)} />
              <Input label="Lote" value={form.blister_lote}
                onChange={e => set('blister_lote', e.target.value)} />
            </div>
          )}
        </div>

        {/* Pallet */}
        <div style={{
          marginTop: 14, background: C.surfaceHigh,
          borderRadius: 10, padding: 16,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <SiNoNaGrande label="Pallet Expo"
            value={form.pallet_expo} onChange={v => set('pallet_expo', v)} />
          {form.pallet_expo === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Input label="Cantidad" value={form.pallet_cantidad}
                onChange={e => set('pallet_cantidad', e.target.value)} />
              <Input label="Lote" value={form.pallet_lote}
                onChange={e => set('pallet_lote', e.target.value)} />
            </div>
          )}
        </div>

        <div style={{ marginTop: 14 }}>
          <Textarea label="Observaciones Control de Carga"
            placeholder="Observaciones..." value={form.obs_control_carga}
            onChange={e => set('obs_control_carga', e.target.value)} />
        </div>
      </div>

      {/* ── DATOS DEL LOTE ── */}
      <div>
        <SeccionTitulo icon="📦" title="Datos del Lote" color={C.purple} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <Input label="Lote" value={form.lote}
            onChange={e => set('lote', e.target.value)} />
          <Input label="Nº BLS / BB" value={form.nro_bls_bb}
            onChange={e => set('nro_bls_bb', e.target.value)} />
          <Input label="Calibre" value={form.calibre}
            onChange={e => set('calibre', e.target.value)} />
        </div>
        <div style={{ marginTop: 14 }}>
          <SiNoNaGrande label="¿Va Fumigado el Lote?"
            value={form.va_fumigado} onChange={v => set('va_fumigado', v)} />
        </div>
      </div>

      {/* ── TEMPERATURAS ── */}
      <div>
        <SeccionTitulo icon="🌡️" title="Temperatura Final del Lote" color={C.blue} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {[
            { key: 'temp_bb1',  label: 'BB N°1'  },
            { key: 'temp_bb5',  label: 'BB N°5'  },
            { key: 'temp_bb10', label: 'BB N°10' },
            { key: 'temp_bb15', label: 'BB N°15' },
            { key: 'temp_bb20', label: 'BB N°20' },
          ].map(t => (
            <Input key={t.key} label={t.label} type="number" step="0.1"
              placeholder="°C" value={form[t.key]}
              onChange={e => set(t.key, e.target.value)} />
          ))}
        </div>
        <div style={{
          marginTop: 14, background: `${C.blue}11`,
          border: `1px solid ${C.blue}44`, borderRadius: 10,
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>🌡️</span>
          <div>
            <div style={{
              fontSize: 11, color: C.blue, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Promedio Calculado
            </div>
            <div style={{
              fontSize: 24, fontWeight: 900,
              color: form.temp_promedio ? C.blue : C.textMuted,
              fontFamily: "'Courier New', monospace",
            }}>
              {form.temp_promedio ? `${form.temp_promedio} °C` : '—'}
            </div>
            <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>
              Se calcula automáticamente con los valores ingresados
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTROL DE ETIQUETAS ── */}
      <div>
        <SeccionTitulo icon="🏷️" title="Control de Etiquetas" color={C.accent} />
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 70px 70px 70px',
          gap: 6, padding: '8px 14px',
          background: C.surfaceHigh, borderRadius: '8px 8px 0 0',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase' }}>Ítem</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.green, textAlign: 'center', textTransform: 'uppercase' }}>SI</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.red, textAlign: 'center', textTransform: 'uppercase' }}>NO</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, textAlign: 'center', textTransform: 'uppercase' }}>N/A</span>
        </div>
        <div style={{ border: `1px solid ${C.border}`, borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
          {itemsEtiquetas.map(item => (
            <SiNoNaItem key={item.key} label={item.label}
              value={form[item.key]} onChange={v => set(item.key, v)} />
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <Textarea label="Observaciones Etiquetas" placeholder="Observaciones..."
            value={form.obs_etiquetas}
            onChange={e => set('obs_etiquetas', e.target.value)} />
        </div>
      </div>

      {/* ── ESTADO DEL TIEMPO ── */}
      <div>
        <SeccionTitulo icon="🌤️" title="Control del Estado del Tiempo" color={C.blue} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Input label="Punto de Rocío" type="number" step="0.1" placeholder="°C"
            value={form.punto_rocio} onChange={e => set('punto_rocio', e.target.value)} />
          <Input label="Temp. Tempering" type="number" step="0.1" placeholder="°C"
            value={form.temp_tempering} onChange={e => set('temp_tempering', e.target.value)} />
          <Input label="Humedad Tempering" type="number" step="0.1" placeholder="%"
            value={form.humedad_tempering} onChange={e => set('humedad_tempering', e.target.value)} />
          <Input label="Temp. Ambiente" type="number" step="0.1" placeholder="°C"
            value={form.temp_ambiente} onChange={e => set('temp_ambiente', e.target.value)} />
          <Input label="Humedad Ambiente" type="number" step="0.1" placeholder="%"
            value={form.humedad_ambiente} onChange={e => set('humedad_ambiente', e.target.value)} />
        </div>
      </div>

      {/* ── FOTOS DEL CONTENEDOR ── */}
      <div>
        <SeccionTitulo icon="📷" title="Fotos del Contenedor Cargado" color={C.green} />
        <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 14 }}>
          Agregá hasta 4 fotos del contenedor ya cargado. Hacé click en cada slot para subir una imagen.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[1, 2, 3, 4].map(n => (
            <FotoSlot
              key={n}
              numero={n}
              url={form[`foto${n}`]}
              filename={form[`foto${n}_filename`]}
              subiendo={subiendo[n]}
              onSubir={handleSubirFoto}
              onEliminar={handleEliminarFoto}
            />
          ))}
        </div>
      </div>

      {/* ── FIRMAS ── */}
      <div>
        <SeccionTitulo icon="✍️" title="Firmas" color={C.purple} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <Input label="Firma del Cargador *" placeholder="Nombre y apellido"
              value={form.firma_cargador}
              onChange={e => set('firma_cargador', e.target.value)} />
            {errores.firma_cargador && <Err>{errores.firma_cargador}</Err>}
          </div>
          <Input label="Firma del Auxiliar de Carga" placeholder="Nombre y apellido"
            value={form.firma_auxiliar}
            onChange={e => set('firma_auxiliar', e.target.value)} />
          <Input label="Firma del Acondicionador" placeholder="Nombre y apellido"
            value={form.firma_acondicionador}
            onChange={e => set('firma_acondicionador', e.target.value)} />
        </div>
      </div>

      {/* ── BOTONES ── */}
      <div style={{
        display: 'flex', gap: 10, justifyContent: 'flex-end',
        paddingTop: 16, borderTop: `1px solid ${C.border}`,
      }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="success" onClick={() => { if (validar()) onSubmit(form) }}>
          {modoEdicion ? '💾 Guardar Cambios' : '✅ Completar Carga'}
        </Button>
      </div>

    </div>
  )
}

function Err({ children }) {
  return <div style={{ fontSize: 12, color: C.red, marginTop: 5 }}>⚠ {children}</div>
}