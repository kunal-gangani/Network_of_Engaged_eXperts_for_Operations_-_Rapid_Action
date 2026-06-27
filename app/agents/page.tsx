import { createClient } from '@/lib/supabase/server'

export const revalidate = 0

const AGENTS = [
    {
        num: '01', name: 'Vision Analyzer', color: '#E8621A',
        description: 'Analyzes uploaded photos using Gemini Vision to auto-detect issue category, severity (1–5), one-line summary, and responsible authority. Fires on every new issue submission.',
        input: 'Issue photo (JPEG/PNG)', output: 'category, severity, summary, suggested_authority',
        model: 'gemini-1.5-flash (Vision)', trigger: 'On photo upload',
    },
    {
        num: '02', name: 'Duplicate Detector', color: '#8B5CF6',
        description: 'Generates semantic embeddings for issue title + description using Gemini text-embedding-004, then runs a pgvector cosine similarity search to find existing issues within 500m. Warns user before creating a duplicate.',
        input: 'Issue title + description + coordinates', output: 'Nearest duplicate issue (if found)',
        model: 'gemini text-embedding-004 + pgvector', trigger: 'On issue creation',
    },
    {
        num: '03', name: 'Decay & Risk Agent', color: '#F5A623',
        description: 'Reasons over issue age, category, severity, monsoon season, and community verification count to produce a 0–100 decay score with a one-sentence explanation. Higher = more urgent. Drives the urgency heatmap and auto-escalation thresholds.',
        input: 'issue metadata + age + season + vote count', output: 'score (0–100) + reason',
        model: 'gemini-1.5-flash (reasoning)', trigger: 'On demand / scheduled',
    },
    {
        num: '04', name: 'Resolution Planner', color: '#2ECC71',
        description: 'Generates a 5-step resolution plan with timelines and responsible parties, a "next recommended action", expected resolution days, and department name. Stored per-issue and displayed on the detail page.',
        input: 'issue title, category, severity, authority, age, decay score', output: '5-step plan + next_action + department',
        model: 'gemini-1.5-flash', trigger: 'On demand',
    },
    {
        num: '05', name: 'RTI Escalation Agent', color: '#E74C3C',
        description: 'Auto-generates a formal Right to Information application under RTI Act, 2005 when an issue is unresolved for 14+ days. Addressed to the PIO of the responsible authority. Downloadable as plain text. India-specific, legally formatted.',
        input: 'issue details + vote count + days unresolved', output: 'Full RTI letter (plain text, downloadable)',
        model: 'gemini-1.5-flash', trigger: '14+ days unresolved OR on demand',
    },
]

export default async function AgentsPage() {
    const supabase = await createClient()
    const { data: issues } = await supabase.from('issues').select('decay_score, complaint_draft, created_at, status')

    const totalIssues = issues?.length ?? 0
    const withDecay = issues?.filter(i => i.decay_score !== null).length ?? 0
    const withPlan = issues?.filter(i => i.complaint_draft !== null).length ?? 0
    const rtiEligible = issues?.filter(i => {
        const days = Math.floor((Date.now() - new Date(i.created_at).getTime()) / 86400000)
        return days >= 14 && i.status !== 'resolved'
    }).length ?? 0

    const agentStats = [
        { num: '01', runs: totalIssues, label: 'photo analyses' },
        { num: '02', runs: totalIssues, label: 'duplicate checks' },
        { num: '03', runs: withDecay, label: 'scores generated' },
        { num: '04', runs: withPlan, label: 'plans generated' },
        { num: '05', runs: rtiEligible, label: 'RTI eligible' },
    ]

    return (
        <div>
            {/* Hero */}
            <div style={{ borderBottom: '1px solid #2E2E2E', padding: '28px 0 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '20px', height: '1px', background: '#E8621A' }} />
                    <span style={{ fontSize: '10px', color: '#E8621A', letterSpacing: '2px', fontWeight: 500 }}>AI PIPELINE</span>
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#fff', margin: '0 0 6px' }}>5-Agent system</h1>
                <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>
                    NEXORA runs five specialised Gemini agents — each handling a distinct step in the civic resolution pipeline.
                </p>
            </div>

            {/* Pipeline flow */}
            <div style={{
                display: 'flex', alignItems: 'center', padding: '16px 0',
                borderBottom: '1px solid #2E2E2E', overflowX: 'auto', gap: '0',
            }}>
                {AGENTS.map((agent, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0', flexShrink: 0 }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '7px 14px',
                            background: '#1C1C1C',
                            border: `1px solid ${agent.color}44`,
                            borderRadius: '5px',
                        }}>
                            <div style={{
                                width: '22px', height: '22px', borderRadius: '50%',
                                background: agent.color + '20', border: `1px solid ${agent.color}55`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '9px', fontWeight: 700, color: agent.color,
                            }}>{agent.num}</div>
                            <span style={{ fontSize: '11px', color: '#888' }}>{agent.name}</span>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: agent.color }} />
                        </div>
                        {i < AGENTS.length - 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                                <div style={{ width: '24px', height: '1px', background: '#2E2E2E' }} />
                                <div style={{ width: '0', height: '0', borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '6px solid #2E2E2E' }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Agent cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                {AGENTS.map((agent, i) => {
                    const stat = agentStats.find(s => s.num === agent.num)
                    return (
                        <div key={i} style={{
                            borderBottom: '1px solid #2E2E2E',
                            borderRight: i % 2 === 0 ? '1px solid #2E2E2E' : 'none',
                            padding: '20px',
                        }}>
                            {/* Card header */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                                        background: agent.color + '18', border: `1px solid ${agent.color}33`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '11px', fontWeight: 700, color: agent.color,
                                    }}>{agent.num}</div>
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0 }}>{agent.name}</p>
                                        <p style={{ fontSize: '9px', color: '#555', margin: '2px 0 0', letterSpacing: '0.5px' }}>Agent {agent.num} of 05</p>
                                    </div>
                                </div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    background: '#1C1C1C', border: '1px solid #2E2E2E',
                                    padding: '3px 8px', borderRadius: '4px',
                                }}>
                                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: agent.color }} />
                                    <span style={{ fontSize: '9px', color: '#555' }}>Active</span>
                                </div>
                            </div>

                            {/* Description */}
                            <p style={{ fontSize: '11px', color: '#888', lineHeight: 1.7, margin: '0 0 14px' }}>
                                {agent.description}
                            </p>

                            {/* Meta grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
                                {[
                                    { label: 'Model', value: agent.model },
                                    { label: 'Trigger', value: agent.trigger },
                                    { label: 'Input', value: agent.input },
                                    { label: 'Output', value: agent.output },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{ background: '#1C1C1C', borderRadius: '5px', padding: '7px 9px' }}>
                                        <p style={{ fontSize: '8px', color: '#555', letterSpacing: '0.5px', textTransform: 'uppercase', margin: '0 0 2px' }}>{label}</p>
                                        <p style={{ fontSize: '10px', color: '#888', margin: 0, lineHeight: 1.4 }}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Run count */}
                            {stat && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    borderTop: '1px solid #1C1C1C', paddingTop: '10px',
                                }}>
                                    <span style={{ fontSize: '18px', fontWeight: 700, color: agent.color }}>{stat.runs}</span>
                                    <span style={{ fontSize: '10px', color: '#555' }}>{stat.label}</span>
                                </div>
                            )}
                        </div>
                    )
                })}
                {/* 5th card spans full width */}
            </div>
        </div>
    )
}
