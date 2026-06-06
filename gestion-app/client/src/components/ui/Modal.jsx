import { useEffect } from 'react'
import { colors as C } from './tokens'

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 28,
          width: '100%',
          maxWidth: 580,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}>
          <h2 style={{
            margin: 0,
            color: C.textPrimary,
            fontSize: 18,
            fontWeight: 800,
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: C.textSecondary,
              fontSize: 20,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}