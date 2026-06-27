'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ThumbsUp, Zap, FileText, Bot, Loader2, CheckCircle2, MessageCircle } from 'lucide-react'
import { IssueStatus } from '@/types'

interface Props {
    issueId: string
    issueUserId: string
    currentUserId: string | null
    hasVoted: boolean
    status: IssueStatus
    decayScore: number | null
    rtiReady: boolean
}

export default function IssueActions({
    issueId, issueUserId, currentUserId, hasVoted, status, decayScore, rtiReady
}: Props) {
    const router = useRouter()
    const supabase = createClient()

    const [voting, setVoting] = useState(false)
    const [voted, setVoted] = useState(hasVoted)
    const [agentBusy, setAgentBusy] = useState<string | null>(null)
    const [comment, setComment] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [toast, setToast] = useState<string | null>(null)
    const [rtiText, setRtiText] = useState<string | null>(null)

    const showToast = (msg: string) => {
        setToast(msg)
        setTimeout(() => setToast(null), 3000)
    }

    const handleVote = async () => {
        if (!currentUserId || voted || voting) return
        setVoting(true)
        const { error } = await supabase.from('votes').insert({ issue_id: issueId, user_id: currentUserId })
        if (!error) { setVoted(true); showToast('Issue verified! +5 points'); router.refresh() }
        setVoting(false)
    }

    const runAgent = async (agent: 'decay' | 'resolution' | 'rti') => {
        setAgentBusy(agent)
        try {
            if (agent === 'rti') {
                const res = await fetch('/api/rti', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ issue_id: issueId }) })
                const data = await res.json()
                if (data.draft) { setRtiText(data.draft); showToast('RTI letter generated') }
                else showToast('RTI generation failed')
            } else {
                const endpoint = agent === 'decay' ? '/api/decay' : '/api/resolution'
                const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ issue_id: issueId }) })
                if (res.ok) { showToast(agent === 'decay' ? 'Decay score updated' : 'Resolution plan generated'); router.refresh() }
                else showToast('Agent failed — check API key')
            }
        } catch { showToast('Network error') }
        setAgentBusy(null)
    }

    const downloadRti = () => {
        if (!rtiText) return
        const blob = new Blob([rtiText], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `RTI_${issueId.slice(0, 8)}.txt`; a.click()
        URL.revokeObjectURL(url)
    }

    const submitComment = async () => {
        if (!comment.trim() || !currentUserId || submitting) return
        setSubmitting(true)
        await supabase.from('comments').insert({ issue_id: issueId, user_id: currentUserId, body: comment.trim() })
        setComment('')
        showToast('Comment added')
        router.refresh()
        setSubmitting(false)
    }

    const updateStatus = async (newStatus: IssueStatus) => {
        if (currentUserId !== issueUserId) return
        await supabase.from('issues').update({ status: newStatus }).eq('id', issueId)
        showToast(`Status updated to ${newStatus.replace('_', ' ')}`)
        router.refresh()
    }

    const btnStyle = (color = '#E8621A', outline = false): React.CSSProperties => ({
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '7px 14px', borderRadius: '5px', fontSize: '11px', fontWeight: 500,
        cursor: 'pointer', border: `1px solid ${outline ? color : 'transparent'}`,
        background: outline ? 'transparent' : color,
        color: outline ? color : '#fff',
        opacity: agentBusy ? 0.6 : 1,
    })

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '220px' }}>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '72px', right: '24px', zIndex: 200,
                    background: '#1C1C1C', border: '1px solid #2E2E2E',
                    borderLeft: '3px solid #E8621A',
                    borderRadius: '6px', padding: '10px 14px',
                    fontSize: '12px', color: '#fff',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                }}>
                    {toast}
                </div>
            )}

            {/* Upvote */}
            <button
                onClick={handleVote}
                disabled={!currentUserId || voted || voting}
                style={btnStyle(voted ? '#2ECC71' : '#E8621A')}
            >
                {voting ? <Loader2 size={12} className="animate-spin" /> : voted ? <CheckCircle2 size={12} /> : <ThumbsUp size={12} />}
                {voted ? 'Verified' : 'Verify issue'}
            </button>

            {/* Run agents */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <p style={{ fontSize: '9px', color: '#555', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>Run AI agents</p>
                <button onClick={() => runAgent('decay')} disabled={!!agentBusy} style={btnStyle('#F5A623', true)}>
                    {agentBusy === 'decay' ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                    Decay & Risk agent
                </button>
                <button onClick={() => runAgent('resolution')} disabled={!!agentBusy} style={btnStyle('#2ECC71', true)}>
                    {agentBusy === 'resolution' ? <Loader2 size={11} className="animate-spin" /> : <Bot size={11} />}
                    Resolution Planner
                </button>
                <button onClick={() => runAgent('rti')} disabled={!!agentBusy} style={btnStyle('#E74C3C', true)}>
                    {agentBusy === 'rti' ? <Loader2 size={11} className="animate-spin" /> : <FileText size={11} />}
                    Generate RTI letter
                </button>
                {rtiText && (
                    <button onClick={downloadRti} style={btnStyle('#E74C3C')}>
                        <FileText size={11} /> Download RTI letter
                    </button>
                )}
            </div>

            {/* Status update (owner only) */}
            {currentUserId === issueUserId && status !== 'resolved' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <p style={{ fontSize: '9px', color: '#555', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>Update status</p>
                    {(['in_progress', 'resolved'] as IssueStatus[]).map(s => (
                        <button key={s} onClick={() => updateStatus(s)} style={btnStyle('#888', true)}>
                            Mark {s.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            )}

            {/* Comment box */}
            {currentUserId && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
                    <p style={{ fontSize: '9px', color: '#555', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>Add update</p>
                    <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Share an update about this issue…"
                        rows={3}
                        style={{
                            width: '100%', background: '#1C1C1C', border: '1px solid #2E2E2E',
                            borderRadius: '5px', padding: '7px 10px', fontSize: '11px', color: '#fff',
                            resize: 'none', outline: 'none',
                        }}
                    />
                    <button onClick={submitComment} disabled={!comment.trim() || submitting} style={btnStyle()}>
                        {submitting ? <Loader2 size={11} className="animate-spin" /> : <MessageCircle size={11} />}
                        Post update
                    </button>
                </div>
            )}
        </div>
    )
}
