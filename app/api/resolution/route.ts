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

    const prompt = `You are a civic resolution strategist for Indian municipal systems.
Issue: title="${issue.title}", category=${issue.category}, severity=${issue.severity}/5, authority=${issue.suggested_authority}, days_old=${daysOld}, decay=${issue.decay_score ?? 'N/A'}

Generate a 5-step resolution plan. Return ONLY valid JSON:
{
  "steps": [
    {"step":1,"action":"...","timeline":"Day 1-2","responsible":"..."},
    {"step":2,"action":"...","timeline":"Day 3-5","responsible":"..."},
    {"step":3,"action":"...","timeline":"Day 5-7","responsible":"..."},
    {"step":4,"action":"...","timeline":"Day 7-14","responsible":"..."},
    {"step":5,"action":"...","timeline":"Day 14+","responsible":"..."}
  ],
  "next_action": "...",
  "expected_resolution_days": 10,
  "department": "Roads & Infrastructure"
}`

    const result = await ai.models.generateContent({
      model: 'gemini-pro',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.3 },
    })

    const parsed = JSON.parse(result.text ?? '{}')
    await supabase.from('issues').update({ complaint_draft: JSON.stringify(parsed) }).eq('id', issue_id)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Resolution agent error:', err)
    return NextResponse.json({ error: 'Resolution agent failed' }, { status: 500 })
  }
}