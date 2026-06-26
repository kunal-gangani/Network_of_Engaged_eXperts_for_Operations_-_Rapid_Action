import { AlertCircle } from 'lucide-react'

interface ErrorCardProps {
  message: string
  retry?: () => void
}

export default function ErrorCard({ message, retry }: ErrorCardProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      background: '#E74C3C11', border: '1px solid #E74C3C33',
      borderRadius: '8px', padding: '12px 16px',
    }}>
      <AlertCircle size={16} style={{ color: '#E74C3C', flexShrink: 0 }} />
      <span style={{ fontSize: '13px', color: '#E74C3C', flex: 1 }}>{message}</span>
      {retry && (
        <button
          onClick={retry}
          style={{ fontSize: '11px', color: '#E74C3C', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Retry
        </button>
      )}
    </div>
  )
}
