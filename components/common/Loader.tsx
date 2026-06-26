import { Loader2 } from 'lucide-react'

interface LoaderProps {
  size?: number
  text?: string
}

export default function Loader({ size = 20, text }: LoaderProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '32px' }}>
      <Loader2 size={size} style={{ color: '#E8621A', animation: 'spin 1s linear infinite' }} />
      {text && <span style={{ fontSize: '12px', color: '#888' }}>{text}</span>}
    </div>
  )
}
