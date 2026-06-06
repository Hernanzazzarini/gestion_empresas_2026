import { colors as C } from './tokens'

export default function Card({ children, style }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: 24,
      ...style,
    }}>
      {children}
    </div>
  )
}