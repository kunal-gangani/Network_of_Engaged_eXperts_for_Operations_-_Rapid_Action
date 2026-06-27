import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/lib/supabase/server'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY!, apiVersion: 'v1' })

export async function POST(request: NextRequest) {
  try {
    const { issue_id } = await request.json()
    const supabase = await createClient()

    const { data: issue } = await supabase.from('issues').select('*').eq('id', issue_id).single()
    if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 })

    const daysOld = Math.floor((Date.now() - new Date(issue.created_at).getTime()) / 86400000)
    const month = new Date().toLocaleString('en-IN', { month: 'long' })
    const isMonsoon = [6, 7, 8, 9].includes(new Date().getMonth() + 1)
    const { data: voteData } = await supabase.from('votes').select('count').eq('issue_id', issue_id)
    const voteCount = voteData?.[0]?.count ?? 0

    const prompt = `You are a civic urgency analyst for Indian cities.
Issue: category=${issue.category}, severity=${issue.severity}/5, days_unresolved=${daysOld}, verifications=${voteCount}, month=${month}, monsoon=${isMonsoon}
Assign a decay score 0-100 (higher=more urgent). Return ONLY valid JSON:
{"score": 75, "reason": "one sentence"}`

    const result = await ai.models.generateContent({
      model: 'gemini-pro',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.2 },
    })

    const parsed = JSON.parse(result.text ?? '{}')
    const score = Math.min(100, Math.max(0, Number(parsed.score) || 0))
    const reason = parsed.reason ?? 'Issue requires attention'

    await supabase.from('issues').update({ decay_score: score, decay_reason: reason }).eq('id', issue_id)
    return NextResponse.json({ score, reason })
  } catch (err) {
    console.error('Decay agent error:', err)
    return NextResponse.json({ error: 'Decay agent failed' }, { status: 500 })
  }
}