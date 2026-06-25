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
  } catch (error) {
    console.error('Gemini categorize error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    )
  }
}
