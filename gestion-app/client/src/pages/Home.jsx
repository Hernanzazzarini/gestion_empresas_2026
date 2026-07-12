import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const modules = [
  {
    icon: '🔧',
    title: 'Mantenimiento',
    description: 'Gestión de órdenes de trabajo, intervenciones y seguimiento de estado.',
    color: '#f59e0b',
    available: true,
    links: [
      { label: 'Órdenes de Trabajo', to: '/mantenimiento/ots' },
      { label: 'Reportes OTs',       to: '/mantenimiento/reportes' },
    ],
  },
  {
    icon: '🛡️',
    title: 'Inocuidad',
    description: 'Tratamiento de No conformidades, Reclamos, Capacitaciones, Mapeo de documentos.',
    color: '#10b981',
    available: true,
    links: [
      { label: 'Mapeo de Documentos',     to: '/inocuidad/mapeo-documentos' },
    ],
  },
  
  {
    icon: '🚛',
    title: 'Logística',
    description: 'Control de contenedores, transportes y carga de exportación,control de stock.',
    color: '#ef4444',
    available: true,
    links: [
      { label: 'Control Contenedores', to: '/logistica/contenedores' },
      { label: 'Control de stock', to: '/logistica/stock' },
      { label: 'Reporte de stock', to: '/logistica/reporte-stock' },

    ],
  },
  {
    icon: '🤝',
    title: 'Proveedores',
    description: 'Registro de proveedores, gestión de documentación adjunta y alertas de vencimientos.',
    color: '#3b82f6',
    available: true,
    links: [
      { label: 'Seguimiento de Proveedores', to: '/proveedores' },
    ],
  },
  {
    icon: '⚠️',
    title: 'Tratamientos de Desvios y Reclamos de clientes',
    description: 'Seguimiento de desvíos-Reclamos, acciones correctivas y preventivas, análisis de causa raíz y evidencias.',
    color: '#a855f7',
    available: true,
    links: [
      { label: 'Seguimiento de Desvíos', to: '/inocuidad/desvios' },
      { label: 'Estadísticas y KPIs Desvios',    to: '/inocuidad/desvios/reportes' },
      { label: 'Seguimiento de Reclamos',    to: '/inocuidad/reclamos' },
      { label: 'Estadísticas y KPIs Reclamos', to: '/inocuidad/reclamos/reportes' },
    ],
  },
]

const stats = [
  { label: 'Módulos activos',  value: '5', icon: '✅' },
  { label: 'En desarrollo',    value: '0', icon: '🚧' },
  { label: 'Usuarios',         value: '—', icon: '👤' },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ marginBottom: 36 }}>
        <div style={{
          fontSize: 13, color: '#f59e0b', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8,
        }}>
          Panel Principal
        </div>
        <h1 style={{
          fontSize: 32, fontWeight: 900, color: '#f1f5f9',
          margin: 0, letterSpacing: '-0.02em',
        }}>
          Bienvenido a GestiónPro
        </h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
          Sistema integral de gestión empresarial. Seleccioná un módulo para comenzar.
        </p>
      </div>

      {/* STATS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14,
        marginBottom: 36,
      }}>
        {stats.map(stat => (
          <div key={stat.label} style={{
            background: '#181c27',
            border: '1px solid #2a3045',
            borderRadius: 12,
            padding: '18px 20px',
          }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{stat.icon}</div>
            <div style={{
              fontSize: 28, fontWeight: 900, color: '#f1f5f9',
              fontFamily: "'Courier New', monospace", lineHeight: 1,
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: 12, color: '#64748b', marginTop: 4,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* MÓDULOS */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{
          fontSize: 16, fontWeight: 800, color: '#94a3b8',
          textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0,
        }}>
          Módulos del sistema
        </h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
      }}>
        {modules.map(mod => (
          <ModuleCard key={mod.title} mod={mod} onNavigate={navigate} />
        ))}
      </div>

    </div>
  )
}

function ModuleCard({ mod, onNavigate }) {
  const [hover, setHover] = useState(false)

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover && mod.available ? '#1e2435' : '#181c27',
        border: `1px solid ${hover && mod.available ? mod.color + '55' : '#2a3045'}`,
        borderTop: `3px solid ${mod.available ? mod.color : '#2a3045'}`,
        borderRadius: 12,
        padding: 22,
        transition: 'all 0.18s',
        opacity: mod.available ? 1 : 0.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Icono + título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 24 }}>{mod.icon}</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#f1f5f9' }}>
            {mod.title}
          </div>
          {!mod.available && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#64748b',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Próximamente
            </span>
          )}
        </div>
      </div>

      {/* Descripción */}
      <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
        {mod.description}
      </p>

      {/* Links */}
      {mod.available && mod.links.map(link => (
        <button
          key={link.to}
          onClick={() => onNavigate(link.to)}
          style={{
            background: mod.color + '18',
            border: `1px solid ${mod.color}44`,
            borderRadius: 8,
            padding: '9px 14px',
            color: mod.color,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {link.label}
          <span>→</span>
        </button>
      ))}
    </div>
  )
}