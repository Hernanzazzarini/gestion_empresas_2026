import { useState } from 'react'
import { colors as C } from './tokens'

export default function Input({ label, style, ...props }) {
  const [focus, setFocus] = useState(false)

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
      <input
        {...props}
        onFocus={e => { setFocus(true); props.onFocus?.(e) }}
        onBlur={e => { setFocus(false); props.onBlur?.(e) }}
        style={{
          background: C.bg,
          border: `1.5px solid ${focus ? C.accent : C.border}`,
          borderRadius: 8,
          padding: '10px 14px',
          color: C.textPrimary,
          fontSize: 14,
          outline: 'none',
          transition: 'border-color 0.2s',
          fontFamily: 'inherit',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}