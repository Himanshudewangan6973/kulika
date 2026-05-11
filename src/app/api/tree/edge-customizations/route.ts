import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { relationshipId, bendPoints, lineStyle } = await req.json()

    if (!relationshipId) {
      return NextResponse.json({ error: 'relationshipId is required' }, { status: 400 })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Check if customization already exists
    const { data: existing } = await supabase
      .from('edge_customizations')
      .select('id')
      .eq('relationship_id', relationshipId)
      .single()

    let result

    if (existing) {
      // Update existing customization
      result = await supabase
        .from('edge_customizations')
        .update({
          bend_points: bendPoints || [],
          line_style: lineStyle || 'bezier',
          updated_at: new Date().toISOString()
        })
        .eq('relationship_id', relationshipId)
        .select()
        .single()
    } else {
      // Create new customization
      result = await supabase
        .from('edge_customizations')
        .insert({
          relationship_id: relationshipId,
          bend_points: bendPoints || [],
          line_style: lineStyle || 'bezier'
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error saving edge customization:', result.error)
      return NextResponse.json(
        { error: 'Failed to save customization', details: result.error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Edge customization saved'
    })
  } catch (error: any) {
    console.error('Edge customization error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to fetch edge customizations for a tree
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const relationshipId = searchParams.get('relationshipId')

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    if (relationshipId) {
      // Fetch single customization
      const { data, error } = await supabase
        .from('edge_customizations')
        .select('*')
        .eq('relationship_id', relationshipId)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found (not an error)
        throw error
      }

      return NextResponse.json({ data })
    } else {
      // This endpoint doesn't support fetching all customizations for security
      return NextResponse.json({ error: 'relationshipId is required' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Fetch customization error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
