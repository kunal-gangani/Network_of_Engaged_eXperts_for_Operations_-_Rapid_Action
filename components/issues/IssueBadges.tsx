import { IssueCategory, IssueStatus } from '@/types'

const CAT: Record<IssueCategory, { label: string; bg: string; color: string }> = {
  pothole:       { label: 'Pothole',       bg: '#E8621A22', color: '#E8621A' },
  water_leakage: { label: 'Water Leakage', bg: '#3B82F622', color: '#3B82F6' },
  streetlight:   { label: 'Streetlight',   bg: '#F5A62322', color: '#F5A623' },
  garbage:       { label: 'Garbage',       bg: '#E74C3C22', color: '#E74C3C' },
  stray_animals: { label: 'Stray Animals', bg: '#8B5CF622', color: '#8B5CF6' },
  other:         { label: 'Other',         bg: '#55555522', color: '#888888' },
}

const STAT: Record<IssueStatus, { label: string; bg: string; color: string; dot: string }> = {
  reported:    { label: 'Reported',    bg: '#88888815', color: '#888888', dot: '#555' },
  verified:    { label: 'Verified',    bg: '#3B82F622', color: '#3B82F6', dot: '#3B82F6' },
  in_progress: { label: 'In Progress', bg: '#F5A62322', color: '#F5A623', dot: '#F5A623' },
  resolved:    { label: 'Resolved',    bg: '#2ECC7122', color: '#2ECC71', dot: '#2ECC71' },
}

const badgeBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '10px',
  fontWeight: 500,
  whiteSpace: 'nowrap',
}

export function CategoryBadge({ category }: { category: IssueCategory }) {
  const c = CAT[category] ?? CAT.other
  return <span style={{ ...badgeBase, background: c.bg, color: c.color }}>{c.label}</span>
}

export function StatusBadge({ status }: { status: IssueStatus }) {
  const s = STAT[status] ?? STAT.reported
  return (
    <span style={{ ...badgeBase, background: s.bg, color: s.color }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

export function DecayBadge({ score }: { score: number | null }) {
  if (score === null) return <span style={{ fontSize: '10px', color: '#555' }}>—</span>
  const color = score >= 80 ? '#E74C3C' : score >= 60 ? '#F5A623' : '#2ECC71'
  return (
    <span style={{ ...badgeBase, background: color + '22', color, fontWeight: 700 }}>{score}</span>
  )
}

export function SeverityBar({ severity }: { severity: number }) {
  const color = severity >= 4 ? '#E74C3C' : severity >= 3 ? '#F5A623' : '#2ECC71'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ width: '40px', height: '3px', background: '#2E2E2E', borderRadius: '2px' }}>
        <div style={{ width: `${(severity / 5) * 100}%`, height: '100%', background: color, borderRadius: '2px' }} />
      </div>
      <span style={{ fontSize: '10px', color, fontWeight: 600 }}>{severity}/5</span>
    </div>
  )
}

export function SeverityDots({ severity }: { severity: number }) {
  const color = severity >= 4 ? '#E74C3C' : severity >= 3 ? '#F5A623' : '#2ECC71'
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: i < severity ? color : '#2E2E2E',
          }}
        />
      ))}
    </div>
  )
}
