import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id

  try {
    const { reason } = await req.json()
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabaseAdmin
      .from('inbox')
      .update({
        status: 'Rejected',
        reviewed_by: 'Admin',
        review_date: new Date().toISOString(),
        review_notes: reason || 'Rejected by admin'
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Submission rejected' })
  } catch (err: any) {
    console.error('Rejection error:', err)
    return NextResponse.json({ error: 'Failed to reject submission', details: err.message }, { status: 500 })
  }
}
