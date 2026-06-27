import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { issue_id } = await request.json()
    const supabase = await createClient()

    const { data: issue } = await supabase
      .from('issues')
      .select('*')
      .eq('id', issue_id)
      .single()

    if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 })

    const daysOld = Math.floor(
      (Date.now() - new Date(issue.created_at).getTime()) / 86400000
    )

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `You are a civic resolution strategist for Indian municipal systems.

Issue details:
- Title: ${issue.title}
- Category: ${issue.category}
- Severity: ${issue.severity}/5
- Authority: ${issue.suggested_authority}
- Days unresolved: ${daysOld}
- Decay score: ${issue.decay_score ?? 'not calculated'}
- Status: ${issue.status}

Generate a resolution plan and current next action.

Return ONLY valid JSON:
{
  "steps": [
    {"step": 1, "action": "...", "timeline": "Day 1-2", "responsible": "..."},
    {"step": 2, "action": "...", "timeline": "Day 3-5", "responsible": "..."},
    {"step": 3, "action": "...", "timeline": "Day 5-7", "responsible": "..."},
    {"step": 4, "action": "...", "timeline": "Day 7-10", "responsible": "..."},
    {"step": 5, "action": "...", "timeline": "Day 14+", "responsible": "..."}
  ],
  "next_action": "...",
  "expected_resolution_days": <number>,
  "department": "..."
}`

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
    })

    const parsed = JSON.parse(result.response.text())

    await supabase
      .from('issues')
      .update({ complaint_draft: JSON.stringify(parsed) })
      .eq('id', issue_id)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Resolution agent error:', err)
    return NextResponse.json({ error: 'Resolution agent failed' }, { status: 500 })
  }
}