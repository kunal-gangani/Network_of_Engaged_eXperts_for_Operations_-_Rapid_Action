'use client'

import Modal from './Modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmLabel?: string
  danger?: boolean
}

export default function ConfirmDialog({
  open, onClose, onConfirm, title = 'Confirm', message, confirmLabel = 'Confirm', danger = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>{message}</p>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          style={{
            padding: '7px 16px', borderRadius: '6px', fontSize: '12px',
            background: 'transparent', border: '1px solid #2E2E2E', color: '#888', cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => { onConfirm(); onClose() }}
          style={{
            padding: '7px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
            background: danger ? '#E74C3C' : '#E8621A', color: '#fff', border: 'none', cursor: 'pointer',
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
