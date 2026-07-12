import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid,
} from 'recharts'
import { Card } from '../../components/ui'
import { colors as C } from '../../components/ui/tokens'
import { listarReclamos } from '../../services/reclamos'

// ─── Colores del módulo (alineados con Reclamos.jsx) ──────────────────────────
const gravedadColor = { Menor: '#16a34a', Mayor: '#d97706', Critico: '#dc2626' }
const estadoColor   = { 'Abierto': '#3b82f6', 'En tratamiento': '#eab308', 'Cerrado': '#16a34a' }
const tipoColor     = { 'Formal': '#0891b2', 'No Formal': '#a855f7' }

// ─── Tooltip personalizado ────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: C.surfaceHigh,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 13,
    }}>
      <div style={{ color: C.textSecondary, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 700 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, sub }) {
  return (
    <Card style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{
            fontSize: 32,
            fontWeight: 900,
            color: color || C.textPrimary,
            fontFamily: "'Courier New', monospace",
            lineHeight: 1,
          }}>
            {value}
          </div>
          <div style={{
            fontSize: 12,
            color: C.textSecondary,
            marginTop: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            {label}
          </div>
          {sub && (
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
              {sub}
            </div>
          )}
        </div>
        <span style={{ fontSize: 28 }}>{icon}</span>
      </div>
    </Card>
  )
}

function ChartTitle({ children }) {
  return (
    <div style={{
      fontSize: 13,
      fontWeight: 700,
      color: C.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: 16,
    }}>
      {children}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ReportesReclamos() {
  const [reclamos, setReclamos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    listarReclamos()
      .then(data => setReclamos(data))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) {
    return (
      <div style={{ color: C.textSecondary, fontSize: 14, padding: 40, textAlign: 'center' }}>
        Cargando estadísticas...
      </div>
    )
  }

  // ─── Datos para gráficos ────────────────────────────────────────────────────

  // Por estado
  const porEstado = ['Abierto', 'En tratamiento', 'Cerrado'].map(estado => ({
    name: estado,
    cantidad: reclamos.filter(r => r.estado === estado).length,
    fill: estadoColor[estado],
  })).filter(e => e.cantidad > 0)

  // Por gravedad
  const porGravedad = ['Menor', 'Mayor', 'Critico'].map(g => ({
    name: g,
    cantidad: reclamos.filter(r => r.gravedad === g).length,
    fill: gravedadColor[g],
  }))

  // Por tipo
  const porTipo = ['Formal', 'No Formal'].map(t => ({
    name: t,
    cantidad: reclamos.filter(r => r.tipo === t).length,
    fill: tipoColor[t],
  })).filter(t => t.cantidad > 0)

  // Por motivo
  const porMotivo = Object.entries(
    reclamos.reduce((acc, r) => {
      acc[r.motivo] = (acc[r.motivo] || 0) + 1
      return acc
    }, {})
  )
    .map(([motivo, cantidad]) => ({ name: motivo, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)

  // Por destinatario
  const porDestinatario = Object.entries(
    reclamos.reduce((acc, r) => {
      acc[r.destinatario] = (acc[r.destinatario] || 0) + 1
      return acc
    }, {})
  )
    .map(([destinatario, cantidad]) => ({ name: destinatario, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)

  // Por mes (según fecha del reclamo)
  const porMes = Object.entries(
    reclamos.reduce((acc, r) => {
      const mes = r.fechaReclamo?.slice(0, 7) || 'Sin fecha'
      acc[mes] = (acc[mes] || 0) + 1
      return acc
    }, {})
  )
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([mes, cantidad]) => ({ name: mes, cantidad }))

  // ─── KPIs ───────────────────────────────────────────────────────────────────
  const total            = reclamos.length
  const abiertos         = reclamos.filter(r => r.estado === 'Abierto').length
  const enTratamiento    = reclamos.filter(r => r.estado === 'En tratamiento').length
  const cerrados         = reclamos.filter(r => r.estado === 'Cerrado').length
  const sinCerrar        = abiertos + enTratamiento
  const criticosSinCerrar = reclamos.filter(r => r.gravedad === 'Critico' && r.estado !== 'Cerrado').length
  const tasaCierre       = total > 0 ? Math.round((cerrados / total) * 100) : 0

  // Tiempo promedio de cierre (días entre fecha del reclamo y fecha de cierre, sólo cerrados)
  const diasCierre = reclamos
    .filter(r => r.estado === 'Cerrado' && r.fechaReclamo && r.fechaCierre)
    .map(r => Math.max(0, Math.round((new Date(r.fechaCierre) - new Date(r.fechaReclamo)) / 86400000)))
  const promedioCierre = diasCierre.length > 0
    ? Math.round(diasCierre.reduce((a, b) => a + b, 0) / diasCierre.length)
    : null

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 13,
          color: C.accent,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}>
          Seguimiento de Reclamos
        </div>
        <h1 style={{
          fontSize: 28,
          fontWeight: 900,
          color: C.textPrimary,
          margin: 0,
          letterSpacing: '-0.02em',
        }}>
          Estadísticas y KPIs
        </h1>
      </div>

      {total === 0 ? (
        <Card style={{ padding: 40, textAlign: 'center', color: C.textMuted, fontStyle: 'italic' }}>
          Todavía no hay reclamos registrados para mostrar estadísticas.
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 14,
            marginBottom: 28,
          }}>
            <StatCard icon="📣" label="Total Reclamos"    value={total}     color={C.textPrimary} />
            <StatCard icon="📂" label="Sin Cerrar"        value={sinCerrar} color={C.accent}
              sub={`${abiertos} abiertos · ${enTratamiento} en tratam.`}
            />
            <StatCard icon="🚨" label="Críticos sin cerrar" value={criticosSinCerrar} color={C.red} />
            <StatCard icon="✅" label="Cerrados"          value={cerrados}  color={C.green}
              sub={`${tasaCierre}% tasa de cierre${promedioCierre != null ? ` · Ø ${promedioCierre} días` : ''}`}
            />
          </div>

          {/* FILA 1 — Estado + Gravedad */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

            <Card>
              <ChartTitle>Reclamos por Estado</ChartTitle>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={porEstado}
                    dataKey="cantidad"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {porEstado.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <ChartTitle>Reclamos por Gravedad</ChartTitle>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={porGravedad} barSize={48}>
                  <XAxis dataKey="name" tick={{ fill: C.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                    {porGravedad.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

          </div>

          {/* FILA 2 — Motivo + Destinatario */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

            <Card>
              <ChartTitle>Reclamos por Motivo</ChartTitle>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={porMotivo} layout="vertical" barSize={18}>
                  <XAxis type="number" tick={{ fill: C.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: C.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cantidad" fill={C.purple} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <ChartTitle>Reclamos por Destinatario</ChartTitle>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={porDestinatario} layout="vertical" barSize={18}>
                  <XAxis type="number" tick={{ fill: C.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: C.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cantidad" fill={C.blue} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

          </div>

          {/* FILA 3 — Tipo + Evolución mensual */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>

            <Card>
              <ChartTitle>Reclamos por Tipo</ChartTitle>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={porTipo}
                    dataKey="cantidad"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {porTipo.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <ChartTitle>Evolución mensual</ChartTitle>
              {porMes.length < 2 ? (
                <div style={{
                  height: 240,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: C.textMuted,
                  fontSize: 13,
                  fontStyle: 'italic',
                }}>
                  Necesitás más datos para ver la evolución mensual.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={porMes}>
                    <CartesianGrid stroke={C.border} strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: C.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: C.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="cantidad"
                      stroke={C.purple}
                      strokeWidth={2}
                      dot={{ fill: C.purple, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>

          </div>
        </>
      )}

    </div>
  )
}
