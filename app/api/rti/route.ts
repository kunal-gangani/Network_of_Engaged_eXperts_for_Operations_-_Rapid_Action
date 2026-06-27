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

    const { data: votes } = await supabase.from('votes').select('count').eq('issue_id', issue_id)
    const daysOld = Math.floor((Date.now() - new Date(issue.created_at).getTime()) / 86400000)
    const voteCount = votes?.[0]?.count ?? 0
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

    const prompt = `Generate a formal RTI application under the Right to Information Act, 2005.

Issue: ${issue.title}
Description: ${issue.description || issue.ai_summary}
Category: ${issue.category}
Location: Ahmedabad, Gujarat (${issue.lat}, ${issue.lng})
Reported: ${daysOld} days ago, Status: ${issue.status}
Community verifications: ${voteCount} citizens
Authority: ${issue.suggested_authority}
Date: ${today}

Write a complete formal RTI letter addressed to the PIO of ${issue.suggested_authority}.
Request: current status, action plan with timeline, officer responsible, budget allocated.
Request reply within 30 days per RTI Act Section 7(1).
Mention ${voteCount} community verifications as evidence.`

    const result = await ai.models.generateContent({
      model: 'gemini-pro',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.3 },
    })

    return NextResponse.json({ draft: result.text })
  } catch (err) {
    console.error('RTI agent error:', err)
    return NextResponse.json({ error: 'RTI generation failed' }, { status: 500 })
  }
}