import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Issue } from '@/types'
import { CategoryBadge, StatusBadge, DecayBadge } from '@/components/IssueBadges'
import DashboardCharts from '@/components/DashboardCharts'
import { AlertTriangle, CheckCircle2, FileWarning, Zap, ArrowRight, Plus } from 'lucide-react'

export const revalidate = 0

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from('issues')
    .select('*, vote_count:votes(count)')
    .order('decay_score', { ascending: false, nullsFirst: false })

  const issues: Issue[] = (raw ?? []).map((i: any) => ({
    ...i,
    vote_count: i.vote_count?.[0]?.count ?? 0,
  }))

  const total = issues.length
  const resolved = issues.filter(i => i.status === 'resolved').length
  const critical = issues.filter(i => (i.decay_score ?? 0) >= 80).length
  const rtiCount = issues.filter(i => {
    const days = Math.floor((Date.now() - new Date(i.created_at).getTime()) / 86400000)
    return days >= 14 && i.status !== 'resolved'
  }).length

  const topIssues = issues.slice(0, 6)

  const catCounts = issues.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const decayBuckets = {
    low: issues.filter(i => (i.decay_score ?? 0) < 40).length,
    medium: issues.filter(i => (i.decay_score ?? 0) >= 40 && (i.decay_score ?? 0) < 80).length,
    high: issues.filter(i => (i.decay_score ?? 0) >= 80).length,
  }

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0

  return (
    <div>

      {/* Hero */}
      <div style={{
        borderBottom: '1px solid #2E2E2E',
        padding: '32px 0 28px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: '-10px', top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '140px', fontWeight: 700,
          color: '#E8621A', opacity: '0.04',
          letterSpacing: '-4px', pointerEvents: 'none',
          userSelect: 'none',
        }}>
          NEXORA
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <div style={{ width: '24px', height: '1px', background: '#E8621A' }} />
          <span style={{ fontSize: '10px', color: '#E8621A', letterSpacing: '2px', fontWeight: 500 }}>
            AHMEDABAD · LIVE OVERVIEW
          </span>
        </div>
        <h1 style={{
          fontSize: '28px', fontWeight: 600,
          color: '#fff', margin: '0 0 8px',
          lineHeight: 1.2,
        }}>
          Civic Intelligence<br />Platform
        </h1>
        <p style={{ fontSize: '12px', color: '#888', margin: 0, lineHeight: 1.7, maxWidth: '440px' }}>
          AI-powered issue tracking, autonomous risk scoring, and resolution planning
          for urban communities — powered by 5 Gemini agents.
        </p>
      </div>

      {/* Stats strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        borderBottom: '1px solid #2E2E2E',
      }}>
        {[
          {
            label: 'Total issues',
            value: total,
            sub: `${issues.filter(i => {
              const d = Date.now() - new Date(i.created_at).getTime()
              return d < 7 * 86400000
            }).length} this week`,
            accent: '#E8621A',
            pct: Math.min(100, total),
            icon: <AlertTriangle size={18} />,
          },
          {
            label: 'Resolved',
            value: resolved,
            sub: `${resolutionRate}% resolution rate`,
            accent: '#2ECC71',
            pct: resolutionRate,
            icon: <CheckCircle2 size={18} />,
          },
          {
            label: 'Critical decay',
            value: critical,
            sub: 'Score above 80',
            accent: '#E74C3C',
            pct: total > 0 ? Math.round((critical / total) * 100) : 0,
            icon: <Zap size={18} />,
          },
          {
            label: 'RTI triggered',
            value: rtiCount,
            sub: '14+ days unresolved',
            accent: '#8B5CF6',
            pct: total > 0 ? Math.round((rtiCount / total) * 100) : 0,
            icon: <FileWarning size={18} />,
          },
        ].map((stat, i) => (
          <div key={i} style={{
            padding: '20px 24px',
            borderRight: i < 3 ? '1px solid #2E2E2E' : 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <span style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {stat.label}
              </span>
              <span style={{ color: stat.accent, opacity: 0.7 }}>{stat.icon}</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 600, color: stat.accent, lineHeight: 1, marginBottom: '4px' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '10px', color: '#555', marginBottom: '10px' }}>{stat.sub}</div>
            <div style={{ height: '2px', background: '#2E2E2E', borderRadius: '1px' }}>
              <div style={{
                height: '100%', borderRadius: '1px',
                background: stat.accent,
                width: `${stat.pct}%`,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        borderBottom: '1px solid #2E2E2E',
      }}>
        {/* Category chart */}
        <div style={{ borderRight: '1px solid #2E2E2E' }}>
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid #2E2E2E',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 500, color: '#fff' }}>Issues by category</span>
            <span style={{
              fontSize: '9px', background: '#E8621A22',
              color: '#E8621A', border: '1px solid #E8621A44',
              padding: '2px 8px', borderRadius: '4px',
            }}>✦ AI classified</span>
          </div>
          <DashboardCharts type="category" data={catCounts} />
        </div>

        {/* Decay distribution */}
        <div>
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid #2E2E2E',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 500, color: '#fff' }}>Decay risk distribution</span>
            <span style={{
              fontSize: '9px', background: '#E8621A22',
              color: '#E8621A', border: '1px solid #E8621A44',
              padding: '2px 8px', borderRadius: '4px',
            }}>✦ Agent 3</span>
          </div>
          <DashboardCharts type="decay" data={decayBuckets} />
        </div>
      </div>

      {/* Recent issues table */}
      <div>
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid #2E2E2E',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 500, color: '#fff' }}>
            High-priority issues
          </span>
          <Link href="/issues" style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '10px', color: '#E8621A', textDecoration: 'none',
          }}>
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {topIssues.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <AlertTriangle size={28} style={{ color: '#2E2E2E', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ color: '#555', fontSize: '13px', margin: '0 0 16px' }}>No issues reported yet</p>
            <Link href="/report" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#E8621A', color: '#fff',
              padding: '8px 18px', borderRadius: '6px',
              fontSize: '12px', fontWeight: 500, textDecoration: 'none',
            }}>
              <Plus size={13} /> Report the first issue
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1C1C1C' }}>
                {['Title', 'Category', 'Decay score', 'Status', 'Votes', 'Reported', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '8px 20px', textAlign: 'left',
                    fontSize: '9px', color: '#555',
                    letterSpacing: '1px', textTransform: 'uppercase',
                    fontWeight: 500,
                    borderBottom: '1px solid #2E2E2E',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topIssues.map((issue) => (
                <tr key={issue.id} style={{ borderBottom: '1px solid #1E1E1E' }}
                  className="table-row-hover">
                  <td style={{ padding: '12px 20px', maxWidth: '260px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#fff', display: 'block', marginBottom: '2px' }}>
                      {issue.title}
                    </span>
                    <span style={{ fontSize: '10px', color: '#555', display: 'block' }}>
                      {issue.ai_summary
                        ? issue.ai_summary.slice(0, 60) + (issue.ai_summary.length > 60 ? '…' : '')
                        : issue.suggested_authority}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <CategoryBadge category={issue.category} />
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <DecayBar score={issue.decay_score} />
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <StatusBadge status={issue.status} />
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: '11px', color: '#888' }}>
                    {issue.vote_count ?? 0}
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: '10px', color: '#555', whiteSpace: 'nowrap' }}>
                    {timeAgo(issue.created_at)}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <Link href={`/issues/${issue.id}`} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      fontSize: '10px', color: '#E8621A', textDecoration: 'none',
                    }}>
                      View <ArrowRight size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Agent pipeline strip */}
      <div style={{
        marginTop: '0',
        borderTop: '1px solid #2E2E2E',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '0',
        overflowX: 'auto',
      }}>
        <span style={{ fontSize: '9px', color: '#555', letterSpacing: '1px', textTransform: 'uppercase', marginRight: '16px', whiteSpace: 'nowrap' }}>
          Active agents
        </span>
        {[
          { label: 'Vision Analyzer', color: '#E8621A', num: '1' },
          { label: 'Duplicate Detector', color: '#8B5CF6', num: '2' },
          { label: 'Decay & Risk', color: '#F5A623', num: '3' },
          { label: 'Resolution Planner', color: '#2ECC71', num: '4' },
          { label: 'RTI Escalation', color: '#E74C3C', num: '5' },
        ].map((agent, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '6px 14px',
              background: '#1C1C1C',
              border: `1px solid ${agent.color}33`,
              borderRadius: '4px',
              whiteSpace: 'nowrap',
            }}>
              <div style={{
                width: '18px', height: '18px',
                borderRadius: '50%',
                background: agent.color + '20',
                border: `1px solid ${agent.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '8px', fontWeight: 700, color: agent.color,
              }}>
                {agent.num}
              </div>
              <span style={{ fontSize: '10px', color: '#888' }}>{agent.label}</span>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: agent.color, marginLeft: '2px' }} />
            </div>
            {i < 4 && (
              <div style={{ width: '20px', height: '1px', background: '#2E2E2E', flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>

    </div>
  )
}

function DecayBar({ score }: { score: number | null }) {
  if (score === null) return <span style={{ fontSize: '10px', color: '#555' }}>—</span>
  const color = score >= 80 ? '#E74C3C' : score >= 60 ? '#F5A623' : '#2ECC71'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '48px', height: '3px', background: '#2E2E2E', borderRadius: '2px' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: '2px' }} />
      </div>
      <span style={{ fontSize: '11px', fontWeight: 600, color }}>{score}</span>
    </div>
  )
}
