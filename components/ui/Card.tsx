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

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: string
  icon?: ReactNode
}

export function StatCard({ label, value, sub, accent = '#3B7EF6', icon }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#8A9DC0', fontSize: '10px' }}>
            {label}
          </p>
          <p className="text-2xl font-bold" style={{ color: '#0F1729' }}>{value}</p>
          {sub && <p className="text-xs mt-1" style={{ color: '#8A9DC0' }}>{sub}</p>}
        </div>
        {icon && (
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: accent + '18' }}>
            <div style={{ color: accent }}>{icon}</div>
          </div>
        )}
      </div>
      <div className="mt-3 h-0.5 rounded-full" style={{ background: accent + '30' }}>
        <div className="h-full rounded-full w-2/3" style={{ background: accent }} />
      </div>
    </Card>
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
