import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Issue } from '@/types'
import { CategoryBadge, StatusBadge, DecayBadge } from '@/components/issues/IssueBadges'
import DashboardCharts from '@/components/dashboard/DashboardCharts'
import AIDailyBriefing from '@/components/dashboard/AIDailyBriefing'
import AIAgentStatus from '@/components/dashboard/AIAgentStatus'
import AISeverityHeatmap from '@/components/dashboard/AISeverityHeatmap'
import PredictiveSimulator from '@/components/dashboard/PredictiveSimulator'
import DecayCard from '@/components/dashboard/DecayCard'
import {
  AlertTriangle, CheckCircle2, Zap,
  ArrowRight, Plus, Bot,
} from 'lucide-react'

export const revalidate = 0

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function todayStr() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const CAT_META: Record<string, { label: string; color: string; icon: string }> = {
  pothole:       { label: 'Pothole',       color: '#E8621A', icon: '🕳️' },
  water_leakage: { label: 'Water Leakage', color: '#3B82F6', icon: '💧' },
  streetlight:   { label: 'Streetlight',   color: '#F5A623', icon: '💡' },
  garbage:       { label: 'Garbage',       color: '#E74C3C', icon: '🗑️' },
  stray_animals: { label: 'Stray Animals', color: '#8B5CF6', icon: '🐕' },
  other:         { label: 'Other',         color: '#555555', icon: '📌' },
}

const AGENTS = [
  { num: '01', label: 'Vision Analyzer',    color: '#E8621A', desc: 'Photo → category, severity' },
  { num: '02', label: 'Duplicate Detector', color: '#8B5CF6', desc: 'pgvector similarity search' },
  { num: '03', label: 'Decay & Risk',       color: '#F5A623', desc: '0–100 urgency scoring' },
  { num: '04', label: 'Resolution Planner', color: '#2ECC71', desc: '5-step action plan' },
  { num: '05', label: 'RTI Escalation',     color: '#E74C3C', desc: 'Legal notice generation' },
]

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

  const total      = issues.length
  const open       = issues.filter(i => i.status !== 'resolved').length
  const resolved   = issues.filter(i => i.status === 'resolved').length
  const critical   = issues.filter(i => (i.decay_score ?? 0) >= 80).length
  const rtiCount   = issues.filter(i => {
    const days = Math.floor((Date.now() - new Date(i.created_at).getTime()) / 86400000)
    return days >= 14 && i.status !== 'resolved'
  }).length
  const withDecay  = issues.filter(i => i.decay_score !== null).length
  const resolutionRate  = total > 0 ? Math.round((resolved / total) * 100) : 0
  const aiConfidence    = total > 0 ? Math.round((withDecay / total) * 100) : 0
  const thisWeek        = issues.filter(i => Date.now() - new Date(i.created_at).getTime() < 7 * 86400000).length

  const catCounts = issues.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const decayBuckets = {
    low:    issues.filter(i => (i.decay_score ?? 0) < 40).length,
    medium: issues.filter(i => (i.decay_score ?? 0) >= 40 && (i.decay_score ?? 0) < 80).length,
    high:   issues.filter(i => (i.decay_score ?? 0) >= 80).length,
  }

  const topDecay   = issues.filter(i => i.decay_score !== null).slice(0, 3)
  const topIssues  = issues.slice(0, 6)

  // Recent activity: last 5 issues sorted by created_at desc
  const recentActivity = [...issues]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="divide-y divide-[#2E2E2E]">

      {/* ── 1. Hero / AI Briefing ───────────────────────────── */}
      <div className="relative overflow-hidden py-8">
        {/* Background watermark */}
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[120px] sm:text-[160px] font-bold text-[#E8621A] opacity-[0.03] pointer-events-none select-none leading-none tracking-tighter">
          NEXORA
        </span>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-px bg-[#E8621A]" />
          <span className="text-[10px] text-[#E8621A] tracking-[2px] font-medium uppercase">AI Command Center</span>
          {/* Live pulse */}
          <span className="flex items-center gap-1.5 ml-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2ECC71] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2ECC71]" />
            </span>
            <span className="text-[10px] text-[#2ECC71]">5 agents live</span>
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2 leading-tight">
          Civic Intelligence<br className="sm:hidden" /> Platform
        </h1>
        <p className="text-xs text-[#888] leading-relaxed max-w-md mb-4">
          AI-powered issue tracking, autonomous risk scoring, and resolution planning — powered by 5 Gemini agents.
        </p>

        {/* Briefing strip */}
        <div className="inline-flex flex-wrap gap-3 text-[10px] text-[#555]">
          <span>📅 {todayStr()}</span>
          <span className="text-[#2E2E2E]">·</span>
          <span>{thisWeek} issues this week</span>
          <span className="text-[#2E2E2E]">·</span>
          <span className="text-[#E8621A]">{critical} critical</span>
          {rtiCount > 0 && <>
            <span className="text-[#2E2E2E]">·</span>
            <span className="text-[#8B5CF6]">{rtiCount} RTI eligible</span>
          </>}
        </div>
      </div>

      {/* ── 2. AI Daily Briefing ───────────────────────────────── */}
      <AIDailyBriefing critical={critical} rtiCount={rtiCount} />

      {/* ── 3. KPI Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 py-0">
        {[
          {
            label: 'Open Issues',
            value: open,
            sub: `${thisWeek} new this week`,
            accent: '#E8621A',
            pct: total > 0 ? Math.round((open / total) * 100) : 0,
            icon: <AlertTriangle size={16} />,
          },
          {
            label: 'Critical Decay',
            value: critical,
            sub: 'Score ≥ 80',
            accent: '#E74C3C',
            pct: total > 0 ? Math.round((critical / total) * 100) : 0,
            icon: <Zap size={16} />,
          },
          {
            label: 'Resolution Rate',
            value: `${resolutionRate}%`,
            sub: `${resolved} of ${total} resolved`,
            accent: '#2ECC71',
            pct: resolutionRate,
            icon: <CheckCircle2 size={16} />,
          },
          {
            label: 'AI Coverage',
            value: `${aiConfidence}%`,
            sub: `${withDecay} issues scored`,
            accent: '#8B5CF6',
            pct: aiConfidence,
            icon: <Bot size={16} />,
          },
        ].map((stat, i) => (
          <div key={i} className="kpi-card p-5 border-b lg:border-b-0 border-r-0 sm:border-r border-[#2E2E2E] last:border-r-0">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[9px] text-[#888] tracking-widest uppercase">{stat.label}</span>
              <span style={{ color: stat.accent }} className="opacity-70">{stat.icon}</span>
            </div>
            <div className="text-3xl font-semibold mb-1 leading-none" style={{ color: stat.accent }}>
              {stat.value}
            </div>
            <div className="text-[10px] text-[#555] mb-3">{stat.sub}</div>
            <div className="h-0.5 bg-[#2E2E2E] rounded-full">
              <div className="h-full rounded-full transition-all duration-700" style={{ background: stat.accent, width: `${stat.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── 4. AI Agent Status ─────────────────────────────────── */}
      <AIAgentStatus />

      {/* ── 5. Gemini Area Assessment ──────────────────────────── */}
      <div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#2E2E2E]">
          <span className="text-[11px] font-medium text-white">Gemini Area Assessment</span>
          <span className="text-[9px] bg-[#E8621A22] text-[#E8621A] border border-[#E8621A44] px-2 py-0.5 rounded">✦ AI classified</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y divide-[#2E2E2E]">
          {Object.entries(CAT_META).map(([key, meta]) => {
            const count   = catCounts[key] ?? 0
            const pct     = total > 0 ? Math.round((count / total) * 100) : 0
            const maxCat  = Math.max(...Object.values(catCounts), 1)
            const barPct  = Math.round((count / maxCat) * 100)
            return (
              <div key={key} className="p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{meta.icon}</span>
                  <span className="text-[10px] text-[#888]">{meta.label}</span>
                </div>
                <div className="text-2xl font-bold text-white">{count}</div>
                <div className="h-0.5 bg-[#2E2E2E] rounded-full">
                  <div className="h-full rounded-full" style={{ background: meta.color, width: `${barPct}%` }} />
                </div>
                <span className="text-[9px]" style={{ color: meta.color }}>{pct}% of total</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── AI Severity Heatmap ─────────────────────────────────── */}
      <AISeverityHeatmap />

      {/* ── 4. Charts row (Heatmap + Decay distribution) ───────── */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="border-b md:border-b-0 md:border-r border-[#2E2E2E]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#2E2E2E]">
            <span className="text-[11px] font-medium text-white">Issues by category</span>
            <span className="text-[9px] bg-[#E8621A22] text-[#E8621A] border border-[#E8621A44] px-2 py-0.5 rounded">✦ AI classified</span>
          </div>
          <DashboardCharts type="category" data={catCounts} />
        </div>
        <div>
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#2E2E2E]">
            <span className="text-[11px] font-medium text-white">Decay risk distribution</span>
            <span className="text-[9px] bg-[#E8621A22] text-[#E8621A] border border-[#E8621A44] px-2 py-0.5 rounded">✦ Agent 03</span>
          </div>
          <DashboardCharts type="decay" data={decayBuckets} />
        </div>
      </div>

      {/* ── 5. Highest Decay Score panel ──────────────────────── */}
      {topDecay.length > 0 && (
        <div>
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#2E2E2E]">
            <span className="text-[11px] font-medium text-white">Highest decay scores</span>
            <span className="text-[9px] bg-[#E74C3C22] text-[#E74C3C] border border-[#E74C3C44] px-2 py-0.5 rounded">✦ Agent 03 · critical</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#2E2E2E]">
            {topDecay.map((issue, i) => {
              const score = issue.decay_score ?? 0
              return (
                <DecayCard
                  key={issue.id}
                  id={issue.id}
                  title={issue.title}
                  category={issue.category}
                  score={score}
                  timeAgo={timeAgo(issue.created_at)}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* ── Predictive Impact Simulator ─────────────────────────── */}
      <PredictiveSimulator />

      {/* ── 6. Multi-Agent Pipeline ────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#2E2E2E]">
          <span className="text-[11px] font-medium text-white">Multi-Agent Pipeline</span>
          <Link href="/agents" className="flex items-center gap-1 text-[10px] text-[#E8621A] no-underline">
            View all <ArrowRight size={11} />
          </Link>
        </div>

        {/* Desktop: horizontal scrollable pipeline */}
        <div className="hidden sm:flex items-center scroll-x px-5 py-4 gap-0">
          <span className="text-[9px] text-[#555] tracking-widest uppercase mr-4 shrink-0">Active agents</span>
          {AGENTS.map((agent, i) => (
            <div key={i} className="flex items-center">
              <div className="flex items-center gap-2 px-3 py-2 bg-[#1C1C1C] rounded shrink-0 border"
                style={{ borderColor: agent.color + '33' }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border shrink-0"
                  style={{ background: agent.color + '20', borderColor: agent.color + '44', color: agent.color }}>
                  {agent.num}
                </div>
                <div>
                  <p className="text-[10px] text-[#888] m-0 whitespace-nowrap">{agent.label}</p>
                  <p className="text-[9px] text-[#555] m-0 whitespace-nowrap">{agent.desc}</p>
                </div>
                <div className="w-1.5 h-1.5 rounded-full ml-1 shrink-0" style={{ background: agent.color }} />
              </div>
              {i < AGENTS.length - 1 && (
                <div className="flex items-center shrink-0">
                  <div className="w-5 h-px bg-[#2E2E2E]" />
                  <div className="border-t-4 border-b-4 border-l-[6px] border-t-transparent border-b-transparent"
                    style={{ borderLeftColor: '#2E2E2E' }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: vertical timeline */}
        <div className="sm:hidden px-5 py-4 flex flex-col gap-0">
          {AGENTS.map((agent, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0"
                  style={{ background: agent.color + '20', borderColor: agent.color + '44', color: agent.color }}>
                  {agent.num}
                </div>
                {i < AGENTS.length - 1 && <div className="w-px flex-1 my-1 bg-[#2E2E2E]" />}
              </div>
              <div className="pb-4 pt-1 min-w-0">
                <p className="text-xs font-medium text-white m-0">{agent.label}</p>
                <p className="text-[10px] text-[#555] m-0 mt-0.5">{agent.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 7. High-priority issues ────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#2E2E2E]">
          <span className="text-[11px] font-medium text-white">High-priority issues</span>
          <Link href="/issues" className="flex items-center gap-1 text-[10px] text-[#E8621A] no-underline">
            View all <ArrowRight size={11} />
          </Link>
        </div>

        {topIssues.length === 0 ? (
          <div className="py-12 text-center">
            <AlertTriangle size={28} className="text-[#2E2E2E] mx-auto mb-3" />
            <p className="text-[#555] text-sm mb-4">No issues reported yet</p>
            <Link href="/report" className="inline-flex items-center gap-1.5 bg-[#E8621A] text-white px-4 py-2 rounded-md text-xs font-medium no-underline">
              <Plus size={13} /> Report the first issue
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#1C1C1C]">
                    {['Title', 'Category', 'Decay', 'Status', 'Votes', 'Reported', ''].map((h, i) => (
                      <th key={i} className="px-5 py-2 text-left text-[9px] text-[#555] tracking-widest uppercase font-medium border-b border-[#2E2E2E] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topIssues.map(issue => (
                    <tr key={issue.id} className="border-b border-[#1E1E1E] hover:bg-[#1C1C1C] transition-colors">
                      <td className="px-5 py-3 max-w-[260px]">
                        <span className="text-xs font-medium text-white block mb-0.5 truncate">{issue.title}</span>
                        <span className="text-[10px] text-[#555] block truncate">
                          {issue.ai_summary ? issue.ai_summary.slice(0, 60) + (issue.ai_summary.length > 60 ? '…' : '') : issue.suggested_authority}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap"><CategoryBadge category={issue.category} /></td>
                      <td className="px-5 py-3"><DecayBar score={issue.decay_score} /></td>
                      <td className="px-5 py-3 whitespace-nowrap"><StatusBadge status={issue.status} /></td>
                      <td className="px-5 py-3 text-xs text-[#888]">{issue.vote_count ?? 0}</td>
                      <td className="px-5 py-3 text-[10px] text-[#555] whitespace-nowrap">{timeAgo(issue.created_at)}</td>
                      <td className="px-5 py-3">
                        <Link href={`/issues/${issue.id}`} className="inline-flex items-center gap-1 text-[10px] text-[#E8621A] no-underline">
                          View <ArrowRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden flex flex-col divide-y divide-[#2E2E2E]">
              {topIssues.map(issue => (
                <Link key={issue.id} href={`/issues/${issue.id}`} className="flex items-start gap-3 p-4 no-underline hover:bg-[#1C1C1C] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white mb-1 truncate">{issue.title}</p>
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      <CategoryBadge category={issue.category} />
                      <StatusBadge status={issue.status} />
                    </div>
                    <span className="text-[10px] text-[#555]">{timeAgo(issue.created_at)} · {issue.vote_count ?? 0} votes</span>
                  </div>
                  <DecayBar score={issue.decay_score} />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── 8. Recent Activity Timeline ──────────────────────── */}
      {recentActivity.length > 0 && (
        <div>
          <div className="px-5 py-3 border-b border-[#2E2E2E]">
            <span className="text-[11px] font-medium text-white">Recent activity</span>
          </div>
          <div className="px-5 py-4 flex flex-col gap-0">
            {recentActivity.map((issue, i) => (
              <div key={issue.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-[#E8621A]" />
                  {i < recentActivity.length - 1 && <div className="w-px flex-1 my-1 bg-[#2E2E2E]" />}
                </div>
                <div className="pb-3 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <Link href={`/issues/${issue.id}`} className="text-xs text-white no-underline hover:text-[#E8621A] transition-colors truncate">
                      {issue.title}
                    </Link>
                    <span className="text-[9px] text-[#555] shrink-0">{timeAgo(issue.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={issue.status} />
                    <span className="text-[9px] text-[#555]">{issue.suggested_authority}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

function DecayBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-[10px] text-[#555]">—</span>
  const color = score >= 80 ? '#E74C3C' : score >= 60 ? '#F5A623' : '#2ECC71'
  return (
    <div className="flex items-center gap-2">
      <div className="w-12 h-0.5 bg-[#2E2E2E] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ background: color, width: `${score}%` }} />
      </div>
      <span className="text-[11px] font-semibold" style={{ color }}>{score}</span>
    </div>
  )
}
