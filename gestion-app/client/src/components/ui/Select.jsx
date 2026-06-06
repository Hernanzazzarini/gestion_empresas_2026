import { colors as C } from './tokens'

export default function Select({ label, children, style, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <label style={{
          fontSize: 12,
          fontWeight: 600,
          color: C.textSecondary,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          {label}
        </label>
      )}
      <select
        {...props}
        style={{
          background: C.bg,
          border: `1.5px solid ${C.border}`,
          borderRadius: 8,
          padding: '10px 14px',
          color: C.textPrimary,
          fontSize: 14,
          outline: 'none',
          fontFamily: 'inherit',
          width: '100%',
          boxSizing: 'border-box',
          cursor: 'pointer',
        }}
      >
        {children}
      </select>
    </div>
  )
}