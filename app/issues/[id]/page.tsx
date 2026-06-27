import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Issue } from '@/types'
import { CategoryBadge, StatusBadge, SeverityBar } from '@/components/IssueBadges'
import IssueActions from '@/components/IssueActions'
import {
    ArrowLeft, Zap, MapPin, Calendar, ThumbsUp,
    CheckCircle2, Clock, AlertTriangle, FileText, Bot
} from 'lucide-react'

export const revalidate = 0

function timeAgo(d: string) {
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
    if (days === 0) return 'today'
    if (days === 1) return '1 day ago'
    return `${days} days ago`
}

function daysOld(d: string) {
    return Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
}

export default async function IssueDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const { data: issue } = await supabase
        .from('issues')
        .select('*')
        .eq('id', id)
        .single()

    if (!issue) notFound()

    const { data: votes } = await supabase
        .from('votes')
        .select('id, user_id')
        .eq('issue_id', id)

    const { data: comments } = await supabase
        .from('comments')
        .select('*, users(name, email)')
        .eq('issue_id', id)
        .order('created_at', { ascending: true })

    const { data: sessionData } = await supabase.auth.getUser()
    const currentUser = sessionData?.user ?? null

    const voteCount = votes?.length ?? 0
    const hasVoted = votes?.some(v => v.user_id === currentUser?.id) ?? false
    const age = daysOld(issue.created_at)
    const rtiReady = age >= 14 && issue.status !== 'resolved'
    const decayScore = issue.decay_score as number | null

    // Parse resolution plan if stored
    let resolutionPlan: any = null
    try {
        if (issue.complaint_draft) resolutionPlan = JSON.parse(issue.complaint_draft)
    } catch { }

    const decayColor = (decayScore ?? 0) >= 80 ? '#E74C3C' : (decayScore ?? 0) >= 60 ? '#F5A623' : '#2ECC71'

    return (
        <div>
            {/* Back + header */}
            <div style={{ borderBottom: '1px solid #2E2E2E', padding: '20px 0 16px' }}>
                <Link href="/issues" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    fontSize: '11px', color: '#888', textDecoration: 'none', marginBottom: '12px',
                }}>
                    <ArrowLeft size={12} /> Back to issues
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', margin: '0 0 8px' }}>
                            {issue.title}
                        </h1>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                            <CategoryBadge category={issue.category} />
                            <StatusBadge status={issue.status} />
                            <span style={{ fontSize: '10px', color: '#555', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={11} /> Reported {timeAgo(issue.created_at)}
                            </span>
                            <span style={{ fontSize: '10px', color: '#555', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MapPin size={11} /> {issue.lat.toFixed(4)}, {issue.lng.toFixed(4)}
                            </span>
                            <span style={{ fontSize: '10px', color: '#555', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ThumbsUp size={11} /> {voteCount} verifications
                            </span>
                            {decayScore !== null && (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    background: decayColor + '20', color: decayColor,
                                    padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                                }}>
                                    <Zap size={10} /> Decay {decayScore}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Actions — upvote, status update, run agents */}
                    <IssueActions
                        issueId={issue.id}
                        issueUserId={issue.user_id}
                        currentUserId={currentUser?.id ?? null}
                        hasVoted={hasVoted}
                        status={issue.status}
                        decayScore={decayScore}
                        rtiReady={rtiReady}
                    />
                </div>
            </div>

            {/* Next recommended action banner */}
            {decayScore !== null && decayScore >= 60 && issue.status !== 'resolved' && (
                <div style={{
                    background: '#E8621A0F', border: '1px solid #E8621A33',
                    borderRadius: '0', padding: '12px 20px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    borderLeft: '3px solid #E8621A',
                }}>
                    <Zap size={14} style={{ color: '#E8621A', flexShrink: 0 }} />
                    <div>
                        <span style={{ fontSize: '9px', color: '#E8621A', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>
                            Next recommended action
                        </span>
                        <p style={{ fontSize: '12px', color: '#F07340', margin: '2px 0 0', fontWeight: 500 }}>
                            {decayScore >= 80
                                ? rtiReady
                                    ? `Generate RTI application — issue unresolved ${age} days, decay critical at ${decayScore}`
                                    : `Escalate to ${issue.suggested_authority} — decay score critical at ${decayScore}`
                                : `Follow up with ${issue.suggested_authority} — decay score elevated at ${decayScore}`}
                        </p>
                    </div>
                </div>
            )}

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #2E2E2E' }}>

                {/* LEFT: photo + AI summary + authority */}
                <div style={{ borderRight: '1px solid #2E2E2E' }}>

                    {/* Photo */}
                    <div style={{ position: 'relative', height: '220px', background: '#1C1C1C', borderBottom: '1px solid #2E2E2E' }}>
                        {issue.image_url ? (
                            <Image src={issue.image_url} alt={issue.title} fill style={{ objectFit: 'cover' }} />
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E2E2E', fontSize: '40px' }}>
                                📷
                            </div>
                        )}
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                            padding: '20px 16px 12px',
                        }}>
                            <SeverityBar severity={issue.severity} />
                        </div>
                    </div>

                    {/* AI Summary */}
                    <div style={{ padding: '16px', borderBottom: '1px solid #2E2E2E' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 500, color: '#fff' }}>AI summary</span>
                            <span style={{ fontSize: '9px', background: '#E8621A22', color: '#E8621A', border: '1px solid #E8621A44', padding: '2px 7px', borderRadius: '4px' }}>
                                ✦ Vision Analyzer
                            </span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.6, margin: 0 }}>
                            {issue.ai_summary || issue.description || 'No AI summary available.'}
                        </p>
                        {issue.description && issue.ai_summary && (
                            <p style={{ fontSize: '11px', color: '#555', lineHeight: 1.5, margin: '8px 0 0', borderTop: '1px solid #1C1C1C', paddingTop: '8px' }}>
                                {issue.description}
                            </p>
                        )}
                    </div>

                    {/* Authority Finder */}
                    <div style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 500, color: '#fff' }}>Authority finder</span>
                            <span style={{ fontSize: '9px', background: '#E8621A22', color: '#E8621A', border: '1px solid #E8621A44', padding: '2px 7px', borderRadius: '4px' }}>
                                ✦ Agent output
                            </span>
                        </div>
                        {[
                            { label: 'Responsible authority', value: issue.suggested_authority },
                            { label: 'Expected resolution', value: `${Math.round(age * 1.5) + 7}–${Math.round(age * 1.5) + 14} days` },
                            { label: 'Community verifications', value: `${voteCount} citizens` },
                            { label: 'Issue age', value: `${age} days` },
                        ].map(({ label, value }) => (
                            <div key={label} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '7px 0', borderBottom: '1px solid #1C1C1C', fontSize: '11px',
                            }}>
                                <span style={{ color: '#555' }}>{label}</span>
                                <span style={{ color: '#fff', fontWeight: 500 }}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Resolution plan + RTI */}
                <div>

                    {/* Decay gauge */}
                    {decayScore !== null && (
                        <div style={{ padding: '16px', borderBottom: '1px solid #2E2E2E' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '10px', fontWeight: 500, color: '#fff' }}>Decay & risk score</span>
                                <span style={{ fontSize: '9px', background: '#E8621A22', color: '#E8621A', border: '1px solid #E8621A44', padding: '2px 7px', borderRadius: '4px' }}>
                                    ✦ Agent 3
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '50%',
                                    background: `conic-gradient(${decayColor} ${decayScore * 3.6}deg, #2E2E2E 0deg)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <div style={{
                                        width: '42px', height: '42px', borderRadius: '50%',
                                        background: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '14px', fontWeight: 700, color: decayColor,
                                    }}>
                                        {decayScore}
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '11px', color: '#888', margin: 0, lineHeight: 1.5 }}>
                                        {(issue as any).decay_reason ?? 'Run the Decay agent to generate a risk assessment.'}
                                    </p>
                                    <p style={{ fontSize: '10px', color: decayColor, margin: '4px 0 0', fontWeight: 500 }}>
                                        {decayScore >= 80 ? 'Critical — immediate action required' : decayScore >= 60 ? 'Elevated — follow up needed' : 'Low risk'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Resolution plan */}
                    <div style={{ padding: '16px', borderBottom: '1px solid #2E2E2E' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 500, color: '#fff' }}>Resolution plan</span>
                            <span style={{ fontSize: '9px', background: '#E8621A22', color: '#E8621A', border: '1px solid #E8621A44', padding: '2px 7px', borderRadius: '4px' }}>
                                ✦ Agent 4
                            </span>
                        </div>
                        {resolutionPlan?.steps ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                {resolutionPlan.steps.map((step: any, i: number) => {
                                    const done = issue.status === 'resolved' || (issue.status === 'in_progress' && i < 2) || (issue.status === 'verified' && i < 1)
                                    const active = !done && i === (issue.status === 'verified' ? 1 : issue.status === 'in_progress' ? 2 : 0)
                                    return (
                                        <div key={i} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: '1px solid #1C1C1C' }}>
                                            <div style={{
                                                width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
                                                background: done ? '#2ECC71' : active ? '#E8621A' : '#2E2E2E',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '9px', fontWeight: 700,
                                                color: done || active ? '#fff' : '#555',
                                            }}>
                                                {done ? '✓' : i + 1}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: '11px', color: done ? '#555' : '#fff', margin: 0 }}>{step.action}</p>
                                                <p style={{ fontSize: '9px', color: '#555', margin: '2px 0 0' }}>{step.timeline} · {step.responsible}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                                {resolutionPlan.next_action && (
                                    <div style={{ marginTop: '8px', padding: '8px 10px', background: '#E8621A0F', border: '1px solid #E8621A33', borderRadius: '5px' }}>
                                        <p style={{ fontSize: '9px', color: '#E8621A', fontWeight: 500, margin: '0 0 2px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Next action</p>
                                        <p style={{ fontSize: '11px', color: '#F07340', margin: 0 }}>{resolutionPlan.next_action}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ padding: '16px', background: '#1C1C1C', borderRadius: '6px', textAlign: 'center' }}>
                                <Bot size={20} style={{ color: '#2E2E2E', margin: '0 auto 6px', display: 'block' }} />
                                <p style={{ fontSize: '11px', color: '#555', margin: '0 0 8px' }}>Resolution plan not generated yet</p>
                                <p style={{ fontSize: '10px', color: '#444', margin: 0 }}>Click "Run Resolution Agent" to generate a step-by-step plan</p>
                            </div>
                        )}
                    </div>

                    {/* RTI Section */}
                    <div style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 500, color: '#fff' }}>RTI escalation agent</span>
                            <span style={{ fontSize: '9px', background: '#E8621A22', color: '#E8621A', border: '1px solid #E8621A44', padding: '2px 7px', borderRadius: '4px' }}>
                                ✦ Agent 5
                            </span>
                        </div>
                        <div style={{
                            background: rtiReady ? '#E74C3C0A' : '#1C1C1C',
                            border: `1px solid ${rtiReady ? '#E74C3C33' : '#2E2E2E'}`,
                            borderRadius: '6px', padding: '12px',
                        }}>
                            {rtiReady ? (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                        <AlertTriangle size={12} style={{ color: '#E74C3C' }} />
                                        <span style={{ fontSize: '9px', fontWeight: 500, color: '#E74C3C', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                            RTI triggered — {age} days unresolved
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '11px', color: '#E74C3C99', lineHeight: 1.5, margin: '0 0 10px' }}>
                                        Formal RTI application auto-drafted under Right to Information Act, 2005. Addressed to PIO, {issue.suggested_authority}. Requests action plan within 30 days per Section 7(1).
                                    </p>
                                </>
                            ) : (
                                <p style={{ fontSize: '11px', color: '#555', margin: 0, lineHeight: 1.5 }}>
                                    RTI escalation triggers automatically at 14 days unresolved. This issue is {age < 14 ? `${14 - age} days away from RTI threshold` : 'eligible — generate below'}.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments section */}
            <div style={{ padding: '20px 0' }}>
                <h2 style={{ fontSize: '13px', fontWeight: 500, color: '#fff', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Community updates
                    <span style={{ fontSize: '10px', color: '#555', fontWeight: 400 }}>({comments?.length ?? 0})</span>
                </h2>
                {comments && comments.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                        {comments.map((c: any) => (
                            <div key={c.id} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '12px 14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 500, color: '#E8621A' }}>
                                        {c.users?.name ?? c.users?.email?.split('@')[0] ?? 'Citizen'}
                                    </span>
                                    <span style={{ fontSize: '9px', color: '#555' }}>
                                        {timeAgo(c.created_at)}
                                    </span>
                                </div>
                                <p style={{ fontSize: '12px', color: '#888', margin: 0, lineHeight: 1.5 }}>{c.body}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: '12px', color: '#555', marginBottom: '16px' }}>No updates yet. Be the first to comment.</p>
                )}
            </div>
        </div>
    )
}
