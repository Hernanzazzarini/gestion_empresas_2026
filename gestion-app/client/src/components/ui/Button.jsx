import { useState } from 'react'
import { colors as C } from './tokens'

const variants = {
  primary: {
    base:  { background: C.accent,   color: '#0f1117', border: 'none' },
    hover: { background: '#d97706',  color: '#0f1117', border: 'none' },
  },
  secondary: {
    base:  { background: C.surface,     color: C.textPrimary, border: `1.5px solid ${C.border}` },
    hover: { background: C.surfaceHigh, color: C.textPrimary, border: `1.5px solid ${C.border}` },
  },
  success: {
    base:  { background: C.green,   color: '#fff', border: 'none' },
    hover: { background: '#059669', color: '#fff', border: 'none' },
  },
  danger: {
    base:  { background: C.red,    color: '#fff', border: 'none' },
    hover: { background: '#dc2626', color: '#fff', border: 'none' },
  },
  ghost: {
    base:  { background: 'transparent', color: C.textSecondary, border: `1.5px solid ${C.border}` },
    hover: { background: C.surfaceHigh, color: C.textPrimary,   border: `1.5px solid ${C.border}` },
  },
}

export default function Button({ variant = 'primary', children, style, ...props }) {
  const [hover, setHover] = useState(false)
  const v = variants[variant] || variants.primary
  const current = hover ? v.hover : v.base

  return (
    <button
      {...props}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...current,
        borderRadius: 8,
        padding: '9px 18px',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        letterSpacing: '0.04em',
        transition: 'all 0.15s',
        fontFamily: 'inherit',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        ...style,
      }}
    >
      {children}
    </button>
  )
}