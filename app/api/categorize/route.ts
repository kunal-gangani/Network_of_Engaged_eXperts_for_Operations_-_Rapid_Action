import { NextRequest, NextResponse } from 'next/server'

// DEMO MODE: Hardcoded Vision responses for hackathon demo
const MOCK_RESPONSES = [
  { category: 'pothole', severity: 4, summary: 'Large pothole on main road causing vehicle damage', suggested_authority: 'Ahmedabad Municipal Corporation' },
  { category: 'water_leakage', severity: 3, summary: 'Water pipe leakage causing road flooding', suggested_authority: 'Water Board' },
  { category: 'streetlight', severity: 3, summary: 'Broken streetlight creating safety hazard at night', suggested_authority: 'Electricity Board' },
  { category: 'garbage', severity: 4, summary: 'Overflowing garbage dump near residential area', suggested_authority: 'Ahmedabad Municipal Corporation' },
]

export async function POST(request: NextRequest) {
  // Simulate analysis delay for realism
  await new Promise(r => setTimeout(r, 1200))
  const mock = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]
  return NextResponse.json(mock)
}