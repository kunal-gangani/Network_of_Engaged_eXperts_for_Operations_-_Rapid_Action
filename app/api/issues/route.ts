import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, category, severity, lat, lng, image_url, ai_summary, suggested_authority } = body

    // Upsert user first (ignore errors)
    await supabase.from('users').upsert(
      { id: user.id, email: user.email, name: user.email?.split('@')[0] },
      { onConflict: 'id' }
    )

    // Insert issue — without embedding column to avoid schema issues
    const { data, error } = await supabase
      .from('issues')
      .insert({
        user_id: user.id,
        title: title ?? 'Untitled issue',
        description: description ?? '',
        category: category ?? 'other',
        severity: severity ?? 3,
        lat: lat ?? 23.0225,
        lng: lng ?? 72.5714,
        image_url: image_url ?? '',
        ai_summary: ai_summary ?? '',
        suggested_authority: suggested_authority ?? 'Municipal Corporation',
        status: 'reported',
        decay_score: null,
        complaint_draft: null,
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Award points — ignore if RPC doesn't exist
    try {
      await supabase.rpc('increment_user_points', { uid: user.id, pts: 10 })
    } catch { }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Create issue error:', error)
    return NextResponse.json({ error: error?.message ?? 'Failed to create issue' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('issues')
      .select('*, vote_count:votes(count)')
      .order('created_at', { ascending: false })

    if (error) throw error

    const issues = data.map((issue: any) => ({
      ...issue,
      vote_count: issue.vote_count?.[0]?.count ?? 0,
    }))

    return NextResponse.json(issues)
  } catch (error: any) {
    console.error('Get issues error:', error)
    return NextResponse.json({ error: error?.message ?? 'Failed to fetch issues' }, { status: 500 })
  }
}