'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GeminiVisionResult, IssueCategory } from '@/types'
import { CategoryBadge, SeverityBar } from '@/components/IssueBadges'
import {
  Camera, MapPin, Loader2, CheckCircle2,
  AlertCircle, Send, Bot, ArrowRight, Sparkles, RotateCcw
} from 'lucide-react'

const CATEGORIES: { value: IssueCategory; label: string }[] = [
  { value: 'pothole', label: 'Pothole' },
  { value: 'water_leakage', label: 'Water Leakage' },
  { value: 'streetlight', label: 'Streetlight' },
  { value: 'garbage', label: 'Garbage' },
  { value: 'stray_animals', label: 'Stray Animals' },
  { value: 'other', label: 'Other' },
]

interface ChatMessage {
  role: 'user' | 'agent'
  text: string
}

interface GeminiHistory {
  role: 'user' | 'model'
  parts: [{ text: string }]
}

// ── Shared style helpers ─────────────────────────────────────
const S = {
  panelHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid #2E2E2E',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  panelTitle: { fontSize: '11px', fontWeight: 500, color: '#fff' } as React.CSSProperties,
  chip: {
    fontSize: '9px', background: '#E8621A22',
    color: '#E8621A', border: '1px solid #E8621A44',
    padding: '2px 7px', borderRadius: '4px',
  } as React.CSSProperties,
  input: {
    width: '100%', background: '#1C1C1C',
    border: '1px solid #2E2E2E', borderRadius: '6px',
    padding: '8px 11px', fontSize: '12px', color: '#fff',
    outline: 'none',
  } as React.CSSProperties,
  label: {
    fontSize: '9px', color: '#555',
    letterSpacing: '1px', textTransform: 'uppercase' as const,
    display: 'block', marginBottom: '5px',
  },
  btn: (bg = '#E8621A', outline = false): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '8px 16px', borderRadius: '6px',
    fontSize: '12px', fontWeight: 500, cursor: 'pointer',
    border: `1px solid ${outline ? bg : 'transparent'}`,
    background: outline ? 'transparent' : bg,
    color: outline ? bg : '#fff',
  }),
}

export default function ReportPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const chatEnd = useRef<HTMLDivElement>(null)

  // ── Photo + Vision state ─────────────────────────────────
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [visionResult, setVisionResult] = useState<GeminiVisionResult | null>(null)

  // ── Form state (shared between agent + manual) ───────────
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<IssueCategory>('other')
  const [severity, setSeverity] = useState(3)
  const [authority, setAuthority] = useState('Ahmedabad Municipal Corporation')

  // ── Location state ───────────────────────────────────────
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')

  // ── Agent chat state ─────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [history, setHistory] = useState<GeminiHistory[]>([])
  const [input, setInput] = useState('')
  const [agentBusy, setAgentBusy] = useState(false)
  const [formFilled, setFormFilled] = useState(false)
  const [duplicate, setDuplicate] = useState<{ id: string; title: string } | null>(null)
  const [agentMode, setAgentMode] = useState(true) // toggle between agent and manual

  // ── Submit state ─────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // ── Auto-scroll chat ─────────────────────────────────────
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Start agent with greeting ─────────────────────────────
  useEffect(() => {
    if (agentMode && messages.length === 0) {
      setMessages([{
        role: 'agent',
        text: "Hi! I'm NEXORA's Civic AI Agent. Describe the issue you've spotted and I'll help you file a report — just tell me what you saw and where.",
      }])
    }
  }, [agentMode])

  // ── Photo upload + Vision ─────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setAnalyzing(true)
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onload = () => res((r.result as string).split(',')[1])
        r.onerror = rej
        r.readAsDataURL(file)
      })
      const resp = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: b64, mimeType: file.type }),
      })
      const result = await resp.json() as GeminiVisionResult
      setVisionResult(result)
      setCategory(result.category)
      setSeverity(result.severity)
      setAuthority(result.suggested_authority)
      if (!title) setTitle(result.summary)

      // Tell the agent what we see
      if (agentMode) {
        const agentMsg = `I can see from the photo: ${result.summary} (Category: ${result.category}, Severity: ${result.severity}/5, Authority: ${result.suggested_authority}). Can you tell me the exact location so I can complete the report?`
        setMessages(prev => [...prev, { role: 'agent', text: agentMsg }])
        setHistory(prev => [...prev,
        { role: 'user', parts: [{ text: '[User uploaded a photo]' }] },
        { role: 'model', parts: [{ text: agentMsg }] },
        ])
      }
    } catch {
      // Vision failed silently
    } finally {
      setAnalyzing(false)
    }
  }, [title, agentMode])

  // ── Send chat message to agent ────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || agentBusy) return
    const userText = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userText }])
    setAgentBusy(true)

    try {
      const resp = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, message: userText }),
      })
      const data = await resp.json()

      // Update chat
      setMessages(prev => [...prev, { role: 'agent', text: data.text }])

      // Update history
      setHistory(prev => [
        ...prev,
        { role: 'user', parts: [{ text: userText }] },
        { role: 'model', parts: [{ text: data.text + (data.formData ? '\nFORM_DATA: ' + JSON.stringify(data.formData) : '') }] },
      ])

      // Auto-fill form if agent extracted data
      if (data.formData && !formFilled) {
        const f = data.formData
        if (f.title) setTitle(f.title)
        if (f.description) setDescription(f.description)
        if (f.category) setCategory(f.category)
        if (f.severity) setSeverity(Number(f.severity))
        if (f.suggested_authority) setAuthority(f.suggested_authority)
        setFormFilled(true)
        setMessages(prev => [...prev, {
          role: 'agent',
          text: '✓ I\'ve filled in the form on the right based on what you told me. Review it, add your location, and submit when ready.',
        }])
      }

      // Show duplicate warning
      if (data.duplicate) setDuplicate(data.duplicate)

    } catch {
      setMessages(prev => [...prev, { role: 'agent', text: 'Sorry, I had trouble connecting. Try again.' }])
    }
    setAgentBusy(false)
  }

  // ── Get location ──────────────────────────────────────────
  const getLocation = () => {
    setLocating(true)
    setLocError('')
    navigator.geolocation.getCurrentPosition(
      pos => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setLocating(false) },
      () => { setLocError('Could not get location. Please enable location access.'); setLocating(false) }
    )
  }

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!imageFile || !lat || !lng || !title) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('issue-photos').upload(path, imageFile)
      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage.from('issue-photos').getPublicUrl(path)

      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, category, severity, lat, lng,
          image_url: publicUrl,
          ai_summary: visionResult?.summary ?? description.slice(0, 100),
          suggested_authority: authority,
        }),
      })
      const issue = await res.json()
      router.push(`/issues/${issue.id}`)
    } catch {
      setSubmitError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const canSubmit = !!imageFile && !!lat && !!lng && !!title

  return (
    <div>
      {/* Hero */}
      <div style={{ borderBottom: '1px solid #2E2E2E', padding: '24px 0 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div style={{ width: '20px', height: '1px', background: '#E8621A' }} />
          <span style={{ fontSize: '10px', color: '#E8621A', letterSpacing: '2px', fontWeight: 500 }}>POWERED BY GEMINI</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', margin: '0 0 4px' }}>Report a civic issue</h1>
            <p style={{ fontSize: '11px', color: '#555', margin: 0 }}>
              Use the AI Agent to describe your issue in plain language, or fill the form directly.
            </p>
          </div>
          {/* Toggle */}
          <div style={{ display: 'flex', background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '6px', overflow: 'hidden' }}>
            {[{ label: 'AI Agent', val: true }, { label: 'Manual', val: false }].map(({ label, val }) => (
              <button key={label} onClick={() => setAgentMode(val)} style={{
                padding: '6px 14px', fontSize: '11px', border: 'none', cursor: 'pointer',
                background: agentMode === val ? '#E8621A' : 'transparent',
                color: agentMode === val ? '#fff' : '#888',
              }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Duplicate warning */}
      {duplicate && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#8B5CF60F', border: '1px solid #8B5CF633',
          borderLeft: '3px solid #8B5CF6',
          padding: '10px 16px', gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={14} style={{ color: '#8B5CF6', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#A78BFA' }}>
              Similar issue already reported: <strong>{duplicate.title}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href={`/issues/${duplicate.id}`} style={{ ...S.btn('#8B5CF6', true), padding: '5px 12px', fontSize: '11px' }}>
              View it <ArrowRight size={11} />
            </Link>
            <button onClick={() => setDuplicate(null)} style={{ ...S.btn('#555', true), padding: '5px 12px', fontSize: '11px' }}>
              Report anyway
            </button>
          </div>
        </div>
      )}

      {/* Main two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '520px' }}>

        {/* ── LEFT: Agent chat ───────────────────────────── */}
        <div style={{ borderRight: '1px solid #2E2E2E', display: 'flex', flexDirection: 'column' }}>
          <div style={S.panelHeader}>
            <span style={S.panelTitle}>
              {agentMode ? 'Civic AI Agent' : 'Photo upload'}
            </span>
            <span style={S.chip}>✦ {agentMode ? 'Multi-turn Gemini' : 'Vision Analyzer'}</span>
          </div>

          {agentMode ? (
            <>
              {/* Chat messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '360px', maxHeight: '420px' }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}>
                    {msg.role === 'agent' && (
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: '#E8621A22', border: '1px solid #E8621A44',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginRight: '7px', marginTop: '2px',
                      }}>
                        <Bot size={12} style={{ color: '#E8621A' }} />
                      </div>
                    )}
                    <div style={{
                      maxWidth: '78%',
                      background: msg.role === 'agent' ? '#1C1C1C' : '#E8621A',
                      border: msg.role === 'agent' ? '1px solid #2E2E2E' : 'none',
                      borderRadius: msg.role === 'agent' ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                      padding: '9px 12px',
                      fontSize: '12px',
                      color: msg.role === 'agent' ? '#888' : '#fff',
                      lineHeight: 1.6,
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {agentBusy && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: '#E8621A22', border: '1px solid #E8621A44',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Bot size={12} style={{ color: '#E8621A' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center', padding: '8px 12px', background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '4px 12px 12px 12px' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: '5px', height: '5px', borderRadius: '50%', background: '#E8621A',
                          animation: `bounce 1s ease-in-out ${i * 0.2}s infinite`,
                          opacity: 0.7,
                        }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEnd} />
              </div>

              {/* Photo upload inside chat */}
              {imagePreview ? (
                <div style={{ padding: '8px 16px', borderTop: '1px solid #2E2E2E' }}>
                  <div style={{ position: 'relative', height: '80px', borderRadius: '6px', overflow: 'hidden', marginBottom: '6px' }}>
                    <Image src={imagePreview} alt="Uploaded" fill style={{ objectFit: 'cover' }} />
                    {analyzing && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Loader2 size={14} style={{ color: '#E8621A', animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: '10px', color: '#E8621A' }}>Analyzing…</span>
                      </div>
                    )}
                    {visionResult && !analyzing && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={10} style={{ color: '#E8621A' }} />
                        <span style={{ fontSize: '9px', color: '#E8621A' }}>Vision: {visionResult.category} · {visionResult.severity}/5</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => { setImageFile(null); setImagePreview(null); setVisionResult(null) }}
                    style={{ fontSize: '10px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <RotateCcw size={10} /> Change photo
                  </button>
                </div>
              ) : (
                <div style={{ padding: '8px 16px', borderTop: '1px solid #2E2E2E' }}>
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                    onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  <button onClick={() => fileRef.current?.click()} style={{
                    width: '100%', border: '1px dashed #2E2E2E', borderRadius: '6px',
                    padding: '10px', background: 'transparent', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    color: '#555', fontSize: '11px',
                  }}>
                    <Camera size={13} /> Add photo (optional — Gemini will analyze it)
                  </button>
                </div>
              )}

              {/* Chat input */}
              <div style={{ padding: '10px 16px', borderTop: '1px solid #2E2E2E', display: 'flex', gap: '8px' }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Describe your issue in plain language…"
                  disabled={agentBusy}
                  style={{ ...S.input, flex: 1 }}
                />
                <button onClick={sendMessage} disabled={agentBusy || !input.trim()} style={{
                  width: '36px', height: '36px', borderRadius: '6px', border: 'none',
                  background: input.trim() ? '#E8621A' : '#2E2E2E', cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Send size={14} style={{ color: '#fff' }} />
                </button>
              </div>
            </>
          ) : (
            /* Manual photo upload */
            <div style={{ padding: '16px', flex: 1 }}>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              {imagePreview ? (
                <div>
                  <div style={{ position: 'relative', height: '220px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                    <Image src={imagePreview} alt="Preview" fill style={{ objectFit: 'cover' }} />
                    {analyzing && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Loader2 size={16} style={{ color: '#E8621A', animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: '12px', color: '#E8621A' }}>Gemini is analyzing…</span>
                      </div>
                    )}
                  </div>
                  {visionResult && !analyzing && (
                    <div style={{ background: '#E8621A0F', border: '1px solid #E8621A33', borderRadius: '6px', padding: '10px 12px', marginBottom: '10px' }}>
                      <p style={{ fontSize: '9px', color: '#E8621A', fontWeight: 500, letterSpacing: '0.5px', margin: '0 0 6px' }}>✦ GEMINI VISION DETECTED</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '10px', color: '#888' }}>
                        <span>Category: <strong style={{ color: '#E8621A' }}>{visionResult.category}</strong></span>
                        <span>Severity: <strong style={{ color: '#E8621A' }}>{visionResult.severity}/5</strong></span>
                        <span style={{ gridColumn: '1/-1' }}>Authority: <strong style={{ color: '#fff' }}>{visionResult.suggested_authority}</strong></span>
                      </div>
                    </div>
                  )}
                  <button onClick={() => fileRef.current?.click()} style={{ ...S.btn('#555', true), fontSize: '11px', padding: '5px 12px' }}>
                    <Camera size={11} /> Change photo
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} style={{
                  width: '100%', height: '200px', border: '1px dashed #2E2E2E', borderRadius: '8px',
                  background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                  <Camera size={28} style={{ color: '#2E2E2E' }} />
                  <span style={{ fontSize: '12px', color: '#555' }}>Upload or take a photo</span>
                  <span style={{ fontSize: '10px', color: '#333' }}>Gemini Vision will auto-detect the issue</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: Form ───────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={S.panelHeader}>
            <span style={S.panelTitle}>Issue details</span>
            {formFilled && <span style={{ ...S.chip, background: '#2ECC7122', color: '#2ECC71', border: '1px solid #2ECC7144' }}>✓ Agent pre-filled</span>}
          </div>

          <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Title */}
            <div>
              <label style={S.label}>Title *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Brief description of the issue"
                style={{ ...S.input, borderColor: formFilled ? '#2ECC7133' : '#2E2E2E' }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={S.label}>Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="More details — how long has it been there, safety risk, etc."
                rows={3}
                style={{ ...S.input, resize: 'none', lineHeight: 1.5 }}
              />
            </div>

            {/* Category + Severity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={S.label}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value as IssueCategory)}
                  style={{ ...S.input, borderColor: formFilled ? '#2ECC7133' : '#2E2E2E' }}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Severity — {severity}/5</label>
                <input type="range" min={1} max={5} step={1} value={severity}
                  onChange={e => setSeverity(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#E8621A', marginTop: '8px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#555', marginTop: '2px' }}>
                  <span>Minor</span><span>Critical</span>
                </div>
              </div>
            </div>

            {/* Severity visual */}
            <SeverityBar severity={severity} />

            {/* Authority */}
            <div>
              <label style={S.label}>Responsible authority</label>
              <input value={authority} onChange={e => setAuthority(e.target.value)}
                style={{ ...S.input, borderColor: formFilled ? '#2ECC7133' : '#2E2E2E' }} />
            </div>

            {/* Location */}
            <div>
              <label style={S.label}>Location *</label>
              {lat && lng ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: '#2ECC7110', border: '1px solid #2ECC7133',
                  borderRadius: '6px', padding: '8px 12px',
                }}>
                  <CheckCircle2 size={14} style={{ color: '#2ECC71', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 500, color: '#2ECC71', margin: 0 }}>Location captured</p>
                    <p style={{ fontSize: '10px', color: '#555', margin: '1px 0 0' }}>{lat.toFixed(5)}, {lng.toFixed(5)}</p>
                  </div>
                  <button onClick={() => { setLat(null); setLng(null) }}
                    style={{ marginLeft: 'auto', fontSize: '10px', color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Reset
                  </button>
                </div>
              ) : (
                <button onClick={getLocation} disabled={locating} style={{
                  width: '100%', border: '1px dashed #2E2E2E', borderRadius: '6px',
                  padding: '12px', background: 'transparent', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  color: '#555', fontSize: '12px',
                  opacity: locating ? 0.6 : 1,
                }}>
                  {locating
                    ? <><Loader2 size={14} style={{ color: '#E8621A', animation: 'spin 1s linear infinite' }} /> Getting location…</>
                    : <><MapPin size={14} /> Use current location</>
                  }
                </button>
              )}
              {locError && (
                <p style={{ fontSize: '10px', color: '#E74C3C', margin: '5px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={11} /> {locError}
                </p>
              )}
            </div>

            {/* Submit error */}
            {submitError && (
              <div style={{ background: '#E74C3C11', border: '1px solid #E74C3C33', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', color: '#E74C3C' }}>
                {submitError}
              </div>
            )}

            {/* Submit */}
            <button onClick={handleSubmit} disabled={!canSubmit || submitting} style={{
              ...S.btn(),
              width: '100%', justifyContent: 'center', padding: '11px',
              marginTop: 'auto',
              opacity: canSubmit && !submitting ? 1 : 0.4,
              cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
            }}>
              {submitting
                ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</>
                : <>Submit report <ArrowRight size={13} /></>
              }
            </button>

            {!canSubmit && (
              <p style={{ fontSize: '10px', color: '#333', textAlign: 'center', margin: '-6px 0 0' }}>
                {!imageFile ? '📷 Photo required' : !lat ? '📍 Location required' : !title ? '✏️ Title required' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
