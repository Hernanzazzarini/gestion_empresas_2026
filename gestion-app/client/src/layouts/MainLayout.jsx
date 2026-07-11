import { Outlet, NavLink } from 'react-router-dom'
import { useState } from 'react'

const navItems = [
  { to: '/', label: 'Home', icon: '🏠', exact: true },
  { to: '/mantenimiento/ots', label: 'Órdenes de Trabajo', icon: '🔧' },
  { to: '/mantenimiento/reportes', label: 'Reportes OTs', icon: '📊' },
  { to: '/logistica/contenedores',   label: 'Control Contenedores', icon: '🚛' },
  { to: '/logistica/stock',          label: 'Control de Stock',     icon: '📦' },
  { to: '/logistica/reporte-stock',  label: 'Reporte de Stock',     icon: '📋' },
  { to: '/inocuidad/mapeo-documentos', label: 'Mapeo de Documentos', icon: '🛡️' },
  { to: '/inocuidad/desvios',          label: 'Desvíos',             icon: '⚠️' },
  { to: '/inocuidad/desvios/reportes', label: 'KPIs Desvíos',        icon: '📈' },
  { to: '/proveedores',                label: 'Proveedores',          icon: '🤝' },
]

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f1117' }}>

      {/* SIDEBAR */}
      <aside style={{
        width: sidebarOpen ? 240 : 64,
        background: '#181c27',
        borderRight: '1px solid #2a3045',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        overflow: 'hidden',
        flexShrink: 0,
      }}>

        {/* Logo */}
        <div style={{
          height: 60,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          borderBottom: '1px solid #2a3045',
          flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#f59e0b', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 900, color: '#0f1117',
            flexShrink: 0,
          }}>⚙</div>
          {sidebarOpen && (
            <span style={{ fontWeight: 800, fontSize: 15, color: '#f1f5f9', whiteSpace: 'nowrap' }}>
              SGD
            </span>
          )}
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                marginBottom: 4,
                textDecoration: 'none',
                background: isActive ? '#f59e0b22' : 'transparent',
                color: isActive ? '#f59e0b' : '#64748b',
                fontWeight: isActive ? 700 : 500,
                fontSize: 14,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              })}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && item.label}
            </NavLink>
          ))}
        </nav>

        {/* Toggle */}
        <button
          onClick={() => setSidebarOpen(p => !p)}
          style={{
            margin: '12px 8px',
            padding: '10px',
            background: 'transparent',
            border: '1px solid #2a3045',
            borderRadius: 8,
            color: '#64748b',
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {sidebarOpen ? '◀ Cerrar' : '▶'}
        </button>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>

        {/* Topbar */}
        <div style={{
          height: 60,
          borderBottom: '1px solid #2a3045',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          background: '#181c27',
          flexShrink: 0,
        }}>
          <span style={{ color: '#64748b', fontSize: 14 }}>
            Sistema de Gestión Empresarial
          </span>
        </div>

        {/* Página activa */}
        <div style={{ flex: 1, padding: 28 }}>
          <Outlet />
        </div>

      </main>
    </div>
  )
}