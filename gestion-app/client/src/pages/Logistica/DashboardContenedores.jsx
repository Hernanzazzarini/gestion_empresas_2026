import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts'
import { Card } from '../../components/ui'
import { colors as C } from '../../components/ui/tokens'

// ─── TOOLTIP PERSONALIZADO ────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: C.surfaceHigh, border: `1px solid ${C.border}`,
      borderRadius: 8, padding: '10px 14px', fontSize: 13,
    }}>
      {label && <div style={{ color: C.textSecondary, marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || C.accent, fontWeight: 700 }}>
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
            fontSize: 32, fontWeight: 900,
            color: color || C.textPrimary,
            fontFamily: "'Courier New', monospace",
            lineHeight: 1,
          }}>
            {value}
          </div>
          <div style={{
            fontSize: 12, color: C.textSecondary, marginTop: 6,
            textTransform: 'uppercase', letterSpacing: '0.06em',
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
      fontSize: 13, fontWeight: 700, color: C.textSecondary,
      textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16,
    }}>
      {children}
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function DashboardContenedores({ items }) {

  const datos = useMemo(() => {

    // ── Aptos vs No Aptos ──
    const aptos    = items.filter(i => i.apto_para_cargar === 1).length
    const noAptos  = items.filter(i => i.apto_para_cargar === 0).length
    const sinDatos = items.filter(i => i.apto_para_cargar === null || i.apto_para_cargar === undefined).length

    const aptosVsNoAptos = [
      { name: 'Aptos',     value: aptos,    fill: C.green  },
      { name: 'No Aptos',  value: noAptos,  fill: C.red    },
      { name: 'Sin datos', value: sinDatos, fill: C.border },
    ].filter(d => d.value > 0)

    // ── Por mes ──
    const porMes = Object.entries(
      items.reduce((acc, item) => {
        const mes = (item.fecha || '').slice(0, 7)
        if (!mes) return acc
        acc[mes] = (acc[mes] || 0) + 1
        return acc
      }, {})
    )
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([mes, cantidad]) => ({
        name: mes,
        cantidad,
      }))

    // ── Resultado inspección ──
    const resultadoInspeccion = [
      { name: 'Aptos',    cantidad: aptos,   fill: C.green  },
      { name: 'No Aptos', cantidad: noAptos, fill: C.red    },
    ]

    // ── Por empresa ──
    const porEmpresa = Object.entries(
      items.reduce((acc, item) => {
        const empresa = item.empresa_transportista || 'Sin datos'
        acc[empresa] = (acc[empresa] || 0) + 1
        return acc
      }, {})
    )
      .map(([empresa, cantidad]) => ({ name: empresa, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 6)

    // ── Temperatura promedio por mes ──
    const tempPorMes = Object.entries(
      items.reduce((acc, item) => {
        const mes = (item.fecha || '').slice(0, 7)
        if (!mes || !item.temp_promedio) return acc
        if (!acc[mes]) acc[mes] = { suma: 0, count: 0 }
        acc[mes].suma  += parseFloat(item.temp_promedio)
        acc[mes].count += 1
        return acc
      }, {})
    )
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([mes, { suma, count }]) => ({
        name: mes,
        temp: parseFloat((suma / count).toFixed(1)),
      }))

    // ── Stats ──
    const total       = items.length
    const completados = items.filter(i => i.estado === 'completado').length
    const pendientes  = items.filter(i => i.estado === 'pendiente_carga').length
    const tasaAptos   = total > 0 ? Math.round((aptos / (aptos + noAptos || 1)) * 100) : 0

    return {
      aptosVsNoAptos, porMes, resultadoInspeccion,
      porEmpresa, tempPorMes,
      stats: { total, completados, pendientes, aptos, noAptos, tasaAptos },
    }

  }, [items])

  if (items.length === 0) {
    return (
      <Card style={{ textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary }}>
          Sin datos para mostrar
        </div>
        <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 6 }}>
          Registrá contenedores para ver las estadísticas.
        </div>
      </Card>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* STATS GENERALES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard
          icon="🚛" label="Total Registros"
          value={datos.stats.total} color={C.textPrimary}
        />
        <StatCard
          icon="✅" label="Aptos"
          value={datos.stats.aptos} color={C.green}
          sub={`${datos.stats.tasaAptos}% tasa de aprobación`}
        />
        <StatCard
          icon="❌" label="No Aptos"
          value={datos.stats.noAptos} color={C.red}
        />
        <StatCard
          icon="⏳" label="Pendientes Carga"
          value={datos.stats.pendientes} color={C.accent}
        />
      </div>

      {/* FILA 1 — Aptos vs No Aptos + Resultado Inspección */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Aptos vs No Aptos — Torta */}
        <Card>
          <ChartTitle>Aptos vs No Aptos</ChartTitle>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={datos.aptosVsNoAptos}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {datos.aptosVsNoAptos.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (
                  <span style={{ color: C.textSecondary, fontSize: 12 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Resultado inspección — Barras */}
        <Card>
          <ChartTitle>Resultado de Inspección</ChartTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={datos.resultadoInspeccion} barSize={60}>
              <XAxis
                dataKey="name"
                tick={{ fill: C.textSecondary, fontSize: 12 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: C.textSecondary, fontSize: 12 }}
                axisLine={false} tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                {datos.resultadoInspeccion.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

      </div>

      {/* FILA 2 — Por mes */}
      <Card>
        <ChartTitle>Contenedores por Mes</ChartTitle>
        {datos.porMes.length < 2 ? (
          <div style={{
            height: 220, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: C.textMuted,
            fontSize: 13, fontStyle: 'italic',
          }}>
            Necesitás registros de al menos 2 meses para ver la evolución.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={datos.porMes} barSize={36}>
              <CartesianGrid stroke={C.border} strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: C.textSecondary, fontSize: 12 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: C.textSecondary, fontSize: 12 }}
                axisLine={false} tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cantidad" fill={C.accent} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* FILA 3 — Por empresa + Temp promedio por mes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Por empresa — Barras horizontales */}
        <Card>
          <ChartTitle>Contenedores por Empresa</ChartTitle>
          {datos.porEmpresa.length === 0 ? (
            <div style={{
              height: 220, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: C.textMuted,
              fontSize: 13, fontStyle: 'italic',
            }}>
              Sin datos de empresa.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={datos.porEmpresa} layout="vertical" barSize={18}>
                <XAxis
                  type="number"
                  tick={{ fill: C.textSecondary, fontSize: 12 }}
                  axisLine={false} tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: C.textSecondary, fontSize: 10 }}
                  axisLine={false} tickLine={false}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cantidad" fill={C.blue} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Temperatura promedio por mes — Línea */}
        <Card>
          <ChartTitle>Temperatura Promedio por Mes (°C)</ChartTitle>
          {datos.tempPorMes.length < 2 ? (
            <div style={{
              height: 220, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: C.textMuted,
              fontSize: 13, fontStyle: 'italic',
            }}>
              Necesitás datos de temperatura de al menos 2 meses.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={datos.tempPorMes}>
                <CartesianGrid stroke={C.border} strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: C.textSecondary, fontSize: 12 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fill: C.textSecondary, fontSize: 12 }}
                  axisLine={false} tickLine={false}
                  unit="°C"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="temp"
                  name="Temp. Prom."
                  stroke={C.blue}
                  strokeWidth={2}
                  dot={{ fill: C.blue, r: 4 }}
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