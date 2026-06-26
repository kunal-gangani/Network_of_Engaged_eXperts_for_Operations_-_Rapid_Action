import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: string
}

export function Card({ children, className = '', padding = 'p-5' }: CardProps) {
  return (
    <div
      className={`rounded-xl border ${padding} ${className}`}
      style={{ background: '#FFFFFF', borderColor: '#E4E9F2' }}
    >
      {children}
    </div>
  )
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-lg font-bold tracking-tight" style={{ color: '#0F1729' }}>{title}</h1>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: '#8A9DC0' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#8A9DC0', fontSize: '10px' }}>
      {children}
    </p>
  )
}

export function Divider() {
  return <div className="my-4 border-t" style={{ borderColor: '#E4E9F2' }} />
}
