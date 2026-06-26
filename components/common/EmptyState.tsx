import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      {icon && <div style={{ marginBottom: '12px', color: '#2E2E2E' }}>{icon}</div>}
      <p style={{ fontSize: '14px', fontWeight: 500, color: '#888', marginBottom: '4px' }}>{title}</p>
      {description && <p style={{ fontSize: '12px', color: '#555', marginBottom: '16px' }}>{description}</p>}
      {action}
    </div>
  )
}
