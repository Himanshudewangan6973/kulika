import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const minGen = searchParams.get('minGen')
    const maxGen = searchParams.get('maxGen')

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    let query = supabase.from('family_members').select('*')

    if (minGen) query = query.gte('generation', minGen)
    if (maxGen) query = query.lte('generation', maxGen)

    const { data, error } = await query.order('generation', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Fetch members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
