import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
} from 'recharts'
import { Card } from '../../components/ui'
import { colors as C } from '../../components/ui/tokens'
import { fetchOTs } from '../../services/ots'

// ─── COLORES PARA GRÁFICOS ────────────────────────────────────────────────────
const COLORES_ESTADO = {
  pendiente:          '#f59e0b',
  en_proceso:         '#3b82f6',
  completado:         '#a855f7',
  aprobado_inocuidad: '#10b981',
  cerrado:            '#64748b',
}

const COLORES_PRIORIDAD = {
  critica: '#ef4444',
  alta:    '#f97316',
  media:   '#f59e0b',
  baja:    '#10b981',
}

// ─── TOOLTIP PERSONALIZADO ────────────────────────────────────────────────────
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

// ─── STAT CARD ────────────────────────────────────────────────────────────────
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

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function ReportesOTs() {
  const [ots, setOts]         = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetchOTs()
      .then(data => setOts(data))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) {
    return (
      <div style={{ color: C.textSecondary, fontSize: 14, padding: 40, textAlign: 'center' }}>
        Cargando reportes...
      </div>
    )
  }

  // ─── Calcular datos para gráficos ─────────────────────────────────────────

  // Por estado
  const porEstado = Object.entries(
    ots.reduce((acc, ot) => {
      acc[ot.estado] = (acc[ot.estado] || 0) + 1
      return acc
    }, {})
  ).map(([estado, cantidad]) => ({
    name: estado.replace('_', ' '),
    cantidad,
    fill: COLORES_ESTADO[estado] || C.accent,
  }))

  // Por prioridad
  const porPrioridad = ['critica', 'alta', 'media', 'baja'].map(p => ({
    name: p.charAt(0).toUpperCase() + p.slice(1),
    cantidad: ots.filter(o => o.prioridad === p).length,
    fill: COLORES_PRIORIDAD[p],
  }))

  // Por área
  const porArea = Object.entries(
    ots.reduce((acc, ot) => {
      acc[ot.area] = (acc[ot.area] || 0) + 1
      return acc
    }, {})
  )
    .map(([area, cantidad]) => ({ name: area, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 6)

  // Por mes
  const porMes = Object.entries(
    ots.reduce((acc, ot) => {
      const mes = ot.fecha?.slice(0, 7) || 'Sin fecha'
      acc[mes] = (acc[mes] || 0) + 1
      return acc
    }, {})
  )
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([mes, cantidad]) => ({ name: mes, cantidad }))

  // Stats generales
  const total      = ots.length
  const pendientes = ots.filter(o => o.estado === 'pendiente').length
  const cerradas   = ots.filter(o => o.estado === 'cerrado').length
  const tasaCierre = total > 0 ? Math.round((cerradas / total) * 100) : 0
  const criticas   = ots.filter(o => o.prioridad === 'critica' && o.estado !== 'cerrado').length

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
          Mantenimiento
        </div>
        <h1 style={{
          fontSize: 28,
          fontWeight: 900,
          color: C.textPrimary,
          margin: 0,
          letterSpacing: '-0.02em',
        }}>
          Reportes y Estadísticas
        </h1>
      </div>

      {/* STATS GENERALES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14,
        marginBottom: 28,
      }}>
        <StatCard icon="📋" label="Total OTs"       value={total}       color={C.textPrimary} />
        <StatCard icon="⏳" label="Pendientes"       value={pendientes}  color={C.accent}      />
        <StatCard icon="✅" label="Cerradas"         value={cerradas}    color={C.green}       />
        <StatCard icon="🚨" label="Críticas Abiertas" value={criticas}  color={C.red}
          sub={`${tasaCierre}% tasa de cierre`}
        />
      </div>

      {/* FILA 1 — Estado + Prioridad */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Por Estado */}
        <Card>
          <ChartTitle>OTs por Estado</ChartTitle>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={porEstado}
                dataKey="cantidad"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
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

        {/* Por Prioridad */}
        <Card>
          <ChartTitle>OTs por Prioridad</ChartTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={porPrioridad} barSize={36}>
              <XAxis dataKey="name" tick={{ fill: C.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                {porPrioridad.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

      </div>

      {/* FILA 2 — Por Área + Por Mes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Por Área */}
        <Card>
          <ChartTitle>OTs por Área</ChartTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={porArea} layout="vertical" barSize={18}>
              <XAxis type="number" tick={{ fill: C.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: C.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cantidad" fill={C.accent} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Por Mes */}
        <Card>
          <ChartTitle>OTs por Mes</ChartTitle>
          {porMes.length < 2 ? (
            <div style={{
              height: 220,
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
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={porMes}>
                <CartesianGrid stroke={C.border} strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: C.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="cantidad"
                  stroke={C.accent}
                  strokeWidth={2}
                  dot={{ fill: C.accent, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

      </div>

    </div>
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