'use client'

import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1C1C1C', border: '1px solid #2E2E2E',
          borderRadius: '12px', padding: '24px', minWidth: '320px', maxWidth: '520px', width: '100%',
        }}
      >
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{title}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
              <X size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
