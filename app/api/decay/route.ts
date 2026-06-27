import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { issue_id } = await request.json()
    const supabase = await createClient()

    const { data: issue, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', issue_id)
      .single()

    if (error || !issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    const daysOld = Math.floor(
      (Date.now() - new Date(issue.created_at).getTime()) / 86400000
    )
    const month = new Date().toLocaleString('en-IN', { month: 'long' })
    const isMonsoon = [6, 7, 8, 9].includes(new Date().getMonth() + 1)

    const { data: voteData } = await supabase
      .from('votes')
      .select('count')
      .eq('issue_id', issue_id)

    const voteCount = voteData?.[0]?.count ?? 0

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const prompt = `You are a civic urgency analyst for Indian cities.

Given this unresolved civic issue:
- Category: ${issue.category}
- Severity: ${issue.severity}/5
- Days unresolved: ${daysOld}
- Community verifications: ${voteCount}
- Current month: ${month} (monsoon season: ${isMonsoon})
- Status: ${issue.status}

Assign a decay score (0-100) where higher = more urgent.
Consider: infrastructure damage worsening over time, monsoon impact on potholes/drainage, public safety risk.

Return ONLY valid JSON:
{"score": <number 0-100>, "reason": "<one concise sentence explaining urgency>"}`

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
    })

    const parsed = JSON.parse(result.response.text())
    const score = Math.min(100, Math.max(0, Number(parsed.score) || 0))
    const reason = parsed.reason ?? 'Issue requires attention'

    await supabase
      .from('issues')
      .update({ decay_score: score, decay_reason: reason })
      .eq('id', issue_id)

    return NextResponse.json({ score, reason })
  } catch (err) {
    console.error('Decay agent error:', err)
    return NextResponse.json({ error: 'Decay agent failed' }, { status: 500 })
  }
}