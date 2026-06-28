import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DEMO MODE: Hardcoded resolution plans per category
const PLANS: Record<string, any> = {
  pothole: {
    steps: [
      { step: 1, action: 'File complaint to AMC Ward Office with photo evidence', timeline: 'Day 1', responsible: 'Citizen via NEXORA' },
      { step: 2, action: 'AMC Roads dept receives and assigns to field inspector', timeline: 'Day 2-3', responsible: 'AMC Ward Office' },
      { step: 3, action: 'Site inspection and damage assessment conducted', timeline: 'Day 3-5', responsible: 'AMC Field Inspector' },
      { step: 4, action: 'Repair work order issued and contractor mobilised', timeline: 'Day 5-10', responsible: 'AMC Roads Department' },
      { step: 5, action: 'Pothole patched and road surface restored', timeline: 'Day 10-14', responsible: 'AMC Contractor' },
    ],
    next_action: 'Follow up with AMC Roads Department if no inspector visit within 5 days',
    expected_resolution_days: 14,
    department: 'Roads & Infrastructure',
  },
  water_leakage: {
    steps: [
      { step: 1, action: 'Report to AUDA Water Board with exact location', timeline: 'Day 1', responsible: 'Citizen via NEXORA' },
      { step: 2, action: 'Water Board emergency team dispatched for assessment', timeline: 'Day 1-2', responsible: 'AUDA Water Board' },
      { step: 3, action: 'Leak isolated and temporary repair applied', timeline: 'Day 2-3', responsible: 'Water Board Field Team' },
      { step: 4, action: 'Permanent pipe replacement or repair conducted', timeline: 'Day 3-7', responsible: 'Water Board Engineers' },
      { step: 5, action: 'Road surface restored after pipe work completed', timeline: 'Day 7-10', responsible: 'AMC Roads Dept' },
    ],
    next_action: 'Contact Water Board emergency line if leak is causing road flooding',
    expected_resolution_days: 10,
    department: 'Water Supply & Infrastructure',
  },
  streetlight: {
    steps: [
      { step: 1, action: 'Report to DGVCL / Electricity Board with pole number', timeline: 'Day 1', responsible: 'Citizen via NEXORA' },
      { step: 2, action: 'Complaint registered in Electricity Board system', timeline: 'Day 1-2', responsible: 'Electricity Board' },
      { step: 3, action: 'Lineman dispatched for fault inspection', timeline: 'Day 2-4', responsible: 'EB Field Lineman' },
      { step: 4, action: 'Faulty bulb or wiring replaced', timeline: 'Day 4-6', responsible: 'EB Maintenance Team' },
      { step: 5, action: 'Streetlight restored and tested', timeline: 'Day 6-7', responsible: 'EB Quality Check' },
    ],
    next_action: 'Note the pole number on the streetlight and include in follow-up complaint',
    expected_resolution_days: 7,
    department: 'Electrical Infrastructure',
  },
  garbage: {
    steps: [
      { step: 1, action: 'Report to AMC Solid Waste Management with location pin', timeline: 'Day 1', responsible: 'Citizen via NEXORA' },
      { step: 2, action: 'AMC sanitation supervisor notified', timeline: 'Day 1-2', responsible: 'AMC Sanitation Dept' },
      { step: 3, action: 'Garbage collection vehicle dispatched', timeline: 'Day 2-3', responsible: 'AMC Garbage Collection' },
      { step: 4, action: 'Site cleared and disinfected', timeline: 'Day 3-4', responsible: 'AMC Sanitation Workers' },
      { step: 5, action: 'No-dumping notice posted, area monitored for recurrence', timeline: 'Day 4-7', responsible: 'AMC Ward Inspector' },
    ],
    next_action: 'Request AMC to install a proper waste bin at this location to prevent recurrence',
    expected_resolution_days: 7,
    department: 'Solid Waste Management',
  },
  stray_animals: {
    steps: [
      { step: 1, action: 'Report to AMC Animal Control with photos', timeline: 'Day 1', responsible: 'Citizen via NEXORA' },
      { step: 2, action: 'Animal Control team assesses the situation', timeline: 'Day 2-3', responsible: 'AMC Animal Control' },
      { step: 3, action: 'Animals captured humanely and taken to shelter', timeline: 'Day 3-5', responsible: 'AMC Animal Control Team' },
      { step: 4, action: 'Animals vaccinated and sterilised at shelter', timeline: 'Day 5-14', responsible: 'AMC Veterinary Dept' },
      { step: 5, action: 'Animals returned or rehomed as appropriate', timeline: 'Day 14+', responsible: 'AMC Animal Welfare' },
    ],
    next_action: 'Contact AMC Animal Control emergency line if animals are injured or aggressive',
    expected_resolution_days: 14,
    department: 'Animal Control & Welfare',
  },
  other: {
    steps: [
      { step: 1, action: 'Report filed and acknowledged by AMC', timeline: 'Day 1', responsible: 'Citizen via NEXORA' },
      { step: 2, action: 'Issue assessed and routed to relevant department', timeline: 'Day 2-3', responsible: 'AMC Ward Office' },
      { step: 3, action: 'Department supervisor reviews and assigns field team', timeline: 'Day 3-5', responsible: 'Dept Supervisor' },
      { step: 4, action: 'Field team visits site and initiates resolution', timeline: 'Day 5-10', responsible: 'Field Team' },
      { step: 5, action: 'Issue resolved and closure report submitted', timeline: 'Day 10-14', responsible: 'AMC Officer' },
    ],
    next_action: 'Follow up at AMC Ward Office if no response within 5 working days',
    expected_resolution_days: 14,
    department: 'General Administration',
  },
}

export async function POST(request: NextRequest) {
  await new Promise(r => setTimeout(r, 1500))

  const { issue_id } = await request.json()
  const supabase = await createClient()

  const { data: issue } = await supabase.from('issues').select('*').eq('id', issue_id).single()
  if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 })

  const plan = PLANS[issue.category] ?? PLANS.other

  await supabase.from('issues').update({ complaint_draft: JSON.stringify(plan) }).eq('id', issue_id)
  return NextResponse.json(plan)
}