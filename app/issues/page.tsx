import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Issue } from '@/types'
import { CategoryBadge, StatusBadge, DecayBadge } from '@/components/IssueBadges'
import { ArrowRight, AlertTriangle, Plus } from 'lucide-react'

export const revalidate = 0

function timeAgo(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return '1d ago'
  return `${days}d ago`
}

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; sort?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('issues')
    .select('*, vote_count:votes(count)')

  if (params.status) query = query.eq('status', params.status)
  if (params.category) query = query.eq('category', params.category)

  const sortBy = params.sort ?? 'decay'
  if (sortBy === 'decay') query = query.order('decay_score', { ascending: false, nullsFirst: false })
  else if (sortBy === 'newest') query = query.order('created_at', { ascending: false })
  else if (sortBy === 'severity') query = query.order('severity', { ascending: false })

  const { data: raw } = await query

  const issues: Issue[] = (raw ?? []).map((i: any) => ({
    ...i,
    vote_count: i.vote_count?.[0]?.count ?? 0,
  }))

  const STATUSES = ['reported', 'verified', 'in_progress', 'resolved']
  const CATEGORIES = ['pothole', 'water_leakage', 'streetlight', 'garbage', 'stray_animals', 'other']

  return (
    <div>
      {/* Hero */}
      <div style={{ borderBottom: '1px solid #2E2E2E', padding: '28px 0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: '20px', height: '1px', background: '#E8621A' }} />
            <span style={{ fontSize: '10px', color: '#E8621A', letterSpacing: '2px', fontWeight: 500 }}>ALL ISSUES</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#fff', margin: 0 }}>Issue tracker</h1>
          <p style={{ fontSize: '11px', color: '#555', margin: '4px 0 0' }}>{issues.length} total · sorted by {sortBy}</p>
        </div>
        <Link href="/report" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: '#E8621A', color: '#fff',
          padding: '8px 18px', borderRadius: '6px',
          fontSize: '12px', fontWeight: 500, textDecoration: 'none',
        }}>
          <Plus size={13} /> Report issue
        </Link>
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex', gap: '8px', padding: '12px 0',
        borderBottom: '1px solid #2E2E2E', flexWrap: 'wrap',
      }}>
        {/* Sort */}
        {[
          { label: 'Decay ↓', val: 'decay' },
          { label: 'Newest', val: 'newest' },
          { label: 'Severity', val: 'severity' },
        ].map(s => (
          <Link key={s.val} href={`/issues?sort=${s.val}${params.status ? `&status=${params.status}` : ''}${params.category ? `&category=${params.category}` : ''}`}
            style={{
              padding: '4px 12px', borderRadius: '4px', fontSize: '11px', textDecoration: 'none',
              background: sortBy === s.val ? '#E8621A' : '#1C1C1C',
              color: sortBy === s.val ? '#fff' : '#888',
              border: `1px solid ${sortBy === s.val ? '#E8621A' : '#2E2E2E'}`,
            }}>{s.label}</Link>
        ))}

        <div style={{ width: '1px', background: '#2E2E2E', margin: '0 4px' }} />

        {/* Status filters */}
        <Link href={`/issues?sort=${sortBy}`} style={{
          padding: '4px 12px', borderRadius: '4px', fontSize: '11px', textDecoration: 'none',
          background: !params.status ? '#252525' : '#1C1C1C',
          color: !params.status ? '#fff' : '#888',
          border: `1px solid ${!params.status ? '#444' : '#2E2E2E'}`,
        }}>All</Link>
        {STATUSES.map(s => (
          <Link key={s} href={`/issues?sort=${sortBy}&status=${s}`}
            style={{
              padding: '4px 12px', borderRadius: '4px', fontSize: '11px', textDecoration: 'none', textTransform: 'capitalize',
              background: params.status === s ? '#252525' : '#1C1C1C',
              color: params.status === s ? '#fff' : '#888',
              border: `1px solid ${params.status === s ? '#444' : '#2E2E2E'}`,
            }}>{s.replace('_', ' ')}</Link>
        ))}
      </div>

      {/* Table */}
      {issues.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <AlertTriangle size={32} style={{ color: '#2E2E2E', margin: '0 auto 12px', display: 'block' }} />
          <p style={{ color: '#555', fontSize: '13px' }}>No issues found</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#1C1C1C' }}>
              {['Title', 'Category', 'Decay', 'Status', 'Severity', 'Votes', 'Age', ''].map((h, i) => (
                <th key={i} style={{
                  padding: '10px 20px', textAlign: 'left',
                  fontSize: '9px', color: '#555',
                  letterSpacing: '1px', textTransform: 'uppercase',
                  fontWeight: 500, borderBottom: '1px solid #2E2E2E',
                  whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => {
              const daysOld = Math.floor((Date.now() - new Date(issue.created_at).getTime()) / 86400000)
              const rtiTriggered = daysOld >= 14 && issue.status !== 'resolved'
              return (
                <tr key={issue.id} style={{ borderBottom: '1px solid #1C1C1C', transition: 'background .1s' }}
                >
                  <td style={{ padding: '12px 20px', maxWidth: '280px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#fff', display: 'block', marginBottom: '2px' }}>
                      {issue.title}
                    </span>
                    <span style={{ fontSize: '10px', color: '#555' }}>
                      {issue.suggested_authority}
                      {rtiTriggered && (
                        <span style={{ marginLeft: '6px', color: '#E74C3C', fontSize: '9px', fontWeight: 500 }}>· RTI triggered</span>
                      )}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px', whiteSpace: 'nowrap' }}>
                    <CategoryBadge category={issue.category} />
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '40px', height: '3px', background: '#2E2E2E', borderRadius: '2px' }}>
                        {issue.decay_score !== null && (
                          <div style={{
                            width: `${issue.decay_score}%`, height: '100%', borderRadius: '2px',
                            background: (issue.decay_score ?? 0) >= 80 ? '#E74C3C' : (issue.decay_score ?? 0) >= 60 ? '#F5A623' : '#2ECC71',
                          }} />
                        )}
                      </div>
                      <DecayBadge score={issue.decay_score} />
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px', whiteSpace: 'nowrap' }}>
                    <StatusBadge status={issue.status} />
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} style={{
                          width: '5px', height: '5px', borderRadius: '50%',
                          background: i < issue.severity
                            ? issue.severity >= 4 ? '#E74C3C' : issue.severity >= 3 ? '#F5A623' : '#2ECC71'
                            : '#2E2E2E',
                        }} />
                      ))}
                    </div>
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
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}