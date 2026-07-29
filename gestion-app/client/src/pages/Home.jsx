import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listarUsuarios } from '../services/auth'

const modules = [
  {
    icon: '🔧',
    title: 'Mantenimiento',
    description: 'Gestión de órdenes de trabajo, intervenciones y seguimiento de estado.',
    color: '#f59e0b',
    available: true,
    links: [
      { label: 'Órdenes de Trabajo', to: '/mantenimiento/ots', modulo: 'mantenimiento' },
      { label: 'Reportes OTs',       to: '/mantenimiento/reportes', modulo: 'mantenimiento' },
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

// Deriva la clave de módulo (para permisos) desde la ruta del link.
const moduloDeRuta = (to) => {
  if (to.startsWith('/mantenimiento')) return 'mantenimiento'
  if (to.startsWith('/logistica/contenedores')) return 'contenedores'
  if (to.startsWith('/logistica/stock') || to.startsWith('/logistica/reporte-stock')) return 'stock'
  if (to.startsWith('/inocuidad/desvios')) return 'desvios'
  if (to.startsWith('/inocuidad/reclamos')) return 'reclamos'
  if (to.startsWith('/inocuidad')) return 'inocuidad'
  if (to.startsWith('/proveedores')) return 'proveedores'
  return null
}

// Saludo según la hora del día.
const saludoHorario = () => {
  const h = new Date().getHours()
  if (h < 6)  return 'Buenas noches'
  if (h < 13) return 'Buenos días'
  if (h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

const rolLabel = {
  administrador: 'Administrador',
  mandos_medios: 'Mandos medios',
  operarios: 'Operario',
}

export default function Home() {
  const navigate = useNavigate()
  const { puede, esAdmin, usuario } = useAuth()
  // null = todavía cargando; sólo el admin puede consultar /api/auth/usuarios.
  const [usuariosActivos, setUsuariosActivos] = useState(null)

  useEffect(() => {
    if (!esAdmin) return
    let vivo = true
    listarUsuarios()
      .then(us => { if (vivo) setUsuariosActivos(us.filter(u => u.activo).length) })
      .catch(() => { /* si falla, la tarjeta queda en "—" */ })
    return () => { vivo = false }
  }, [esAdmin])

  const nombre = usuario?.nombre || usuario?.usuario || ''

  // Ocultar links sin permiso de lectura y tarjetas que quedan sin links.
  const modulosVisibles = modules
    .map(mod => ({
      ...mod,
      links: mod.links.filter(l => {
        const m = moduloDeRuta(l.to)
        return !m || puede(m, 'leer')
      }),
    }))
    .filter(mod => mod.links.length > 0)

  const stats = [
    { label: 'Módulos activos', value: String(modulosVisibles.length), icon: '✅', cargando: false },
    { label: 'En desarrollo',   value: '0', icon: '🚧', cargando: false },
    // El conteo de usuarios es información de administración: sólo se muestra al admin.
    ...(esAdmin
      ? [{ label: 'Usuarios activos', value: usuariosActivos, icon: '👤', cargando: usuariosActivos === null }]
      : []),
  ]

  return (
    <div className="gp-home">
      <style>{`
        @keyframes gpFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gpPulse  { 0%,100% { opacity: 0.35; } 50% { opacity: 0.7; } }

        /* Layout base: sin scroll interno — el contenido fluye y la página scrollea
           naturalmente. El min-height + margin-top:auto del footer lo mantienen
           al pie de la pantalla cuando sobra espacio, y al final del contenido
           cuando las tarjetas no entran (nunca se cortan). */
        .gp-home {
          max-width: 1000px;
          margin: 0 auto;
          min-height: calc(100vh - 116px);
          display: flex;
          flex-direction: column;
        }
        .gp-modules-area { flex: 1; padding-bottom: 24px; }

        /* MÓVIL / TABLET (≤820px): la app usa el ancho completo y los stats se
           compactan para que las tarjetas de módulos se vean enseguida. */
        @media (max-width: 820px) {
          .gp-stats { grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; }
          .gp-stat { padding: 12px 10px !important; }
          .gp-stat-icon { font-size: 18px !important; margin-bottom: 2px !important; }
          .gp-stat-value { font-size: 20px !important; }
          .gp-stat-label { font-size: 10px !important; }
          .gp-hgreeting { font-size: 26px !important; }
          .gp-modules-grid { grid-template-columns: 1fr !important; }
          .gp-footer-top { flex-direction: column; align-items: flex-start !important; gap: 12px !important; }
        }

        /* MÓVIL chico (≤400px): stats en 2 columnas para que no queden apretados. */
        @media (max-width: 400px) {
          .gp-stats { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <div style={{
          fontSize: 13, color: '#f59e0b', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8,
        }}>
          Panel Principal
        </div>
        <h1 className="gp-hgreeting" style={{
          fontSize: 32, fontWeight: 900, color: '#f1f5f9',
          margin: 0, letterSpacing: '-0.02em',
        }}>
          {saludoHorario()}{nombre ? `, ${nombre}` : ''} 👋
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <p style={{ color: '#64748b', margin: 0, fontSize: 15 }}>
            Sistema integral de gestión empresarial. Seleccioná un módulo para comenzar.
          </p>
          {usuario?.rol && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#f59e0b',
              background: '#f59e0b18', border: '1px solid #f59e0b44',
              borderRadius: 20, padding: '2px 10px', textTransform: 'uppercase',
              letterSpacing: '0.06em', whiteSpace: 'nowrap',
            }}>
              {rolLabel[usuario.rol] || usuario.rol}
            </span>
          )}
        </div>
      </div>

      {/* STATS */}
      <div className="gp-stats" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 14,
        marginBottom: 20,
        flexShrink: 0,
      }}>
        {stats.map(stat => (
          <div key={stat.label} className="gp-stat" style={{
            background: '#181c27',
            border: '1px solid #2a3045',
            borderRadius: 12,
            padding: '18px 20px',
          }}>
            <div className="gp-stat-icon" style={{ fontSize: 22, marginBottom: 6 }}>{stat.icon}</div>
            {stat.cargando ? (
              <div style={{
                width: 40, height: 28, borderRadius: 6, background: '#2a3045',
                animation: 'gpPulse 1.2s ease-in-out infinite',
              }} />
            ) : (
              <div className="gp-stat-value" style={{
                fontSize: 28, fontWeight: 900, color: '#f1f5f9',
                fontFamily: "'Courier New', monospace", lineHeight: 1,
              }}>
                {stat.value ?? '—'}
              </div>
            )}
            <div className="gp-stat-label" style={{
              fontSize: 12, color: '#64748b', marginTop: 4,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* MÓDULOS */}
      <div style={{ marginBottom: 12, flexShrink: 0 }}>
        <h2 style={{
          fontSize: 16, fontWeight: 800, color: '#94a3b8',
          textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0,
        }}>
          Módulos del sistema
        </h2>
      </div>

      {/* Área de módulos: crece para ocupar el espacio libre y empuja el footer
          al pie. Sin scroll propio — las tarjetas nunca se cortan. */}
      <div className="gp-modules-area">
        {modulosVisibles.length === 0 ? (
          <div style={{
            background: '#181c27', border: '1px dashed #2a3045', borderRadius: 12,
            padding: '40px 24px', textAlign: 'center', color: '#64748b',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
            <div style={{ fontSize: 14 }}>
              No tenés módulos habilitados. Pedile acceso al administrador del sistema.
            </div>
          </div>
        ) : (
          <div className="gp-modules-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {modulosVisibles.map((mod, i) => (
              <ModuleCard key={mod.title} mod={mod} onNavigate={navigate} indice={i} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

function Footer() {
  const año = new Date().getFullYear()

  return (
    <footer style={{
      marginTop: 'auto',   // lo empuja al pie cuando sobra espacio vertical
      paddingTop: 20,
      borderTop: '1px solid #2a3045',
      flexShrink: 0,
    }}>
      <div className="gp-footer-top" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        {/* Marca */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚙️</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
              GestiónPro
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Sistema integral de gestión empresarial
            </div>
          </div>
        </div>

        {/* Estado + versión */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#10b981',
              boxShadow: '0 0 8px #10b981', display: 'inline-block',
            }} />
            Operativo
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: '#64748b',
            background: '#181c27', border: '1px solid #2a3045',
            borderRadius: 20, padding: '3px 10px',
            fontFamily: "'Courier New', monospace",
          }}>
            v1.0.0
          </span>
        </div>
      </div>

      {/* Línea legal */}
      <div style={{
        marginTop: 20,
        textAlign: 'center',
        fontSize: 12,
        color: '#334155',
      }}>
        © {año} GestiónPro · Todos los derechos reservados
        <span style={{ margin: '0 8px', color: '#2a3045' }}>·</span>
        Desarrollado por <span style={{ color: '#f59e0b', fontWeight: 700 }}>DevZazzariniH</span>
      </div>
    </footer>
  )
}

function ModuleCard({ mod, onNavigate, indice = 0 }) {
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
        transition: 'transform 0.18s, background 0.18s, border-color 0.18s, box-shadow 0.18s',
        transform: hover && mod.available ? 'translateY(-3px)' : 'none',
        boxShadow: hover && mod.available ? `0 12px 28px -12px ${mod.color}66` : 'none',
        opacity: mod.available ? 1 : 0.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        animation: `gpFadeUp 0.35s ease-out both`,
        animationDelay: `${indice * 60}ms`,
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