import { prioridades } from './tokens'

export default function PrioridadDot({ id }) {
  const p = prioridades.find(x => x.id === id) || prioridades[2]

  return (
    <span style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 13,
      fontWeight: 600,
      color: p.color,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: p.color,
        boxShadow: `0 0 6px ${p.color}`,
        flexShrink: 0,
      }} />
      {p.label}
    </span>
  )
}