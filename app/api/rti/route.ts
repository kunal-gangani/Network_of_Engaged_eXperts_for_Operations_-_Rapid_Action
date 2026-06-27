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

    const { data: votes } = await supabase
      .from('votes')
      .select('count')
      .eq('issue_id', issue_id)

    const daysOld = Math.floor((Date.now() - new Date(issue.created_at).getTime()) / 86400000)
    const voteCount = votes?.[0]?.count ?? 0
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `Generate a formal Right to Information (RTI) application under the Right to Information Act, 2005.

Issue details:
- Title: ${issue.title}
- Description: ${issue.description || issue.ai_summary}
- Category: ${issue.category}
- Location coordinates: ${issue.lat}, ${issue.lng} (Ahmedabad, Gujarat)
- Reported: ${daysOld} days ago
- Community verifications: ${voteCount} citizens confirmed this issue
- Current status: ${issue.status}
- Responsible authority: ${issue.suggested_authority}

Write a complete, formal RTI letter:
1. Addressed to the Public Information Officer (PIO) of ${issue.suggested_authority}
2. Date: ${today}
3. Subject line referencing the specific issue
4. Body requesting:
   a) Current status of this civic issue
   b) Action plan with timeline for resolution
   c) Name and designation of officer responsible
   d) Budget allocated (if any) for this repair
5. Request written reply within 30 days as per Section 7(1) of RTI Act
6. Include that the community has independently verified this issue (${voteCount} verifications)
7. Professional closing

Format as a proper formal letter. Use Indian RTI Act language.`

    const result = await model.generateContent(prompt)
    const draft = result.response.text()

    return NextResponse.json({ draft })
  } catch (err) {
    console.error('RTI agent error:', err)
    return NextResponse.json({ error: 'RTI generation failed' }, { status: 500 })
  }
}