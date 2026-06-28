import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DEMO MODE: Realistic decay scores based on issue attributes
export async function POST(request: NextRequest) {
  await new Promise(r => setTimeout(r, 1000))

  const { issue_id } = await request.json()
  const supabase = await createClient()

  const { data: issue } = await supabase.from('issues').select('*').eq('id', issue_id).single()
  if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 })

  const daysOld = Math.floor((Date.now() - new Date(issue.created_at).getTime()) / 86400000)
  const isMonsoon = [6, 7, 8, 9].includes(new Date().getMonth() + 1)

  // Realistic scoring logic
  let score = 20
  score += Math.min(daysOld * 3, 40)           // Age factor
  score += (issue.severity - 1) * 8             // Severity factor
  score += isMonsoon && issue.category === 'pothole' ? 15 : 0  // Monsoon bump
  score += issue.category === 'water_leakage' ? 10 : 0         // Water urgency
  score = Math.min(100, Math.max(0, score + Math.floor(Math.random() * 10)))

  const reasons: Record<string, string> = {
    pothole: isMonsoon ? 'Monsoon season significantly worsens road damage — risk of vehicle accidents increasing daily.' : 'Road damage worsening with traffic — repair cost increases exponentially if delayed.',
    water_leakage: 'Continuous water wastage and road undermining — structural damage risk escalating.',
    streetlight: 'Safety risk for pedestrians and motorists — accident probability increases nightly.',
    garbage: 'Health hazard worsening — risk of disease spread and pest infestation increasing.',
    stray_animals: 'Public safety concern — risk of animal-vehicle collision increasing.',
    other: 'Civic issue requires attention — community impact growing over time.',
  }

  const reason = reasons[issue.category] ?? reasons.other

  await supabase.from('issues').update({ decay_score: score, decay_reason: reason }).eq('id', issue_id)
  return NextResponse.json({ score, reason })
}