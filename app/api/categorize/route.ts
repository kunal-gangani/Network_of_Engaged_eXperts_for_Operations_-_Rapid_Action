import { NextRequest, NextResponse } from 'next/server'
import { categorizeIssueImage } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mimeType } = await request.json()

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: 'imageBase64 and mimeType are required' },
        { status: 400 }
      )
    }

    const result = await categorizeIssueImage(imageBase64, mimeType)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Gemini categorize error:', error)

    // Return a graceful fallback instead of 500 — form still works
    if (error?.status === 429) {
      return NextResponse.json({
        category: 'other',
        severity: 3,
        summary: 'Rate limit reached — please fill in details manually',
        suggested_authority: 'Ahmedabad Municipal Corporation',
      })
    }

    return NextResponse.json({
      category: 'other',
      severity: 3,
      summary: 'Could not analyze image — please fill in details manually',
      suggested_authority: 'Ahmedabad Municipal Corporation',
    })
  }
}