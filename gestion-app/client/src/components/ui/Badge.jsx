import { estadoConfig } from './tokens'

export default function Badge({ estado }) {
  const cfg = estadoConfig[estado] || estadoConfig.pendiente

  return (
    <span style={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      padding: '3px 10px',
      borderRadius: 20,
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.color}44`,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}