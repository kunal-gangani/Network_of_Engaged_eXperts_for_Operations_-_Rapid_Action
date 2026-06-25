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
    const {
      title, description, category, severity,
      lat, lng, image_url, ai_summary, suggested_authority,
    } = body

    const { data, error } = await supabase
      .from('issues')
      .insert({
        user_id: user.id,
        title,
        description,
        category,
        severity,
        lat,
        lng,
        image_url,
        ai_summary,
        suggested_authority,
        status: 'reported',
        decay_score: null,
        complaint_draft: null,
        embedding: null,
      })
      .select()
      .single()

    if (error) throw error

    await supabase
      .from('users')
      .upsert({ id: user.id, email: user.email }, { onConflict: 'id' })

    await supabase.rpc('increment_user_points', {
      uid: user.id,
      pts: 10,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Create issue error:', error)
    return NextResponse.json(
      { error: 'Failed to create issue' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        vote_count:votes(count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const issues = data.map(issue => ({
      ...issue,
      vote_count: issue.vote_count?.[0]?.count ?? 0,
    }))

    return NextResponse.json(issues)
  } catch (error) {
    console.error('Get issues error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    )
  }
}
