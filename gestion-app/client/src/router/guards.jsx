import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Pantalla de "sin permiso" reutilizable
function SinPermiso({ mensaje }) {
  const navigate = useNavigate()
  return (
    <div style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
      <h2 style={{ color: '#f1f5f9', fontSize: 20, margin: 0 }}>Acceso restringido</h2>
      <p style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>
        {mensaje || 'No tenés permisos para ver esta sección. Consultá con el administrador.'}
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: 20, padding: '9px 20px', background: '#f59e0b', border: 'none',
          borderRadius: 8, color: '#0f1117', fontWeight: 700, cursor: 'pointer', fontSize: 14,
        }}
      >
        Volver al inicio
      </button>
    </div>
  )
}

// Requiere permiso de lectura sobre un módulo
export function RutaModulo({ modulo, children }) {
  const { puede } = useAuth()
  if (!puede(modulo, 'leer')) return <SinPermiso />
  return children
}

// Requiere rol administrador
export function RutaAdmin({ children }) {
  const { esAdmin } = useAuth()
  if (!esAdmin) return <SinPermiso mensaje="Esta sección es exclusiva del administrador." />
  return children
}