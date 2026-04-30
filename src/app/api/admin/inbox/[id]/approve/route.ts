import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Fetch the inbox entry
    const { data: inboxEntry, error: fetchError } = await supabaseAdmin
      .from('inbox')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !inboxEntry) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (inboxEntry.status === 'Approved') {
      return NextResponse.json({ error: 'Already approved' }, { status: 400 })
    }

    const { submission_type, raw_data } = inboxEntry
    let result: any = null

    // 2. Handle approval based on type
    if (submission_type === 'New Member') {
      // Extract member data (handle both Tally and local form formats)
      let memberData: any = {}
      
      if (raw_data.fields) {
        // Tally format
        raw_data.fields.forEach((f: any) => {
          const label = f.label.toLowerCase()
          if (label.includes('full name')) memberData.full_name = f.value
          if (label.includes('nickname')) memberData.nickname = f.value
          if (label.includes('gender')) memberData.gender = f.value
          if (label.includes('birth') && label.includes('date')) memberData.date_of_birth = f.value
          if (label.includes('birth') && label.includes('place')) memberData.birth_place = f.value
          if (label.includes('lineage')) memberData.lineage = f.value
        })
      } else {
        // Local form format (already flattened)
        memberData = {
          full_name: raw_data.full_name,
          nickname: raw_data.nickname,
          gender: raw_data.gender,
          date_of_birth: raw_data.date_of_birth,
          birth_place: raw_data.birth_place,
          lineage: raw_data.lineage,
        }
      }

      // Insert into family_members
      const { data: newMember, error: insertError } = await supabaseAdmin
        .from('family_members')
        .insert({
          ...memberData,
          added_by: inboxEntry.submitter_email || 'Admin Approved'
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating member:', insertError)
        return NextResponse.json({ error: 'Failed to create member', details: insertError.message }, { status: 500 })
      }
      
      result = { id: newMember.id, type: 'family_member' }
    } else if (submission_type === 'Story') {
      // Handle story approval... (implement as needed)
      // For now, let's focus on members as requested in Phase 3
      return NextResponse.json({ error: 'Story approval not fully implemented yet' }, { status: 501 })
    } else {
      return NextResponse.json({ error: `Approval for ${submission_type} not implemented` }, { status: 501 })
    }

    // 3. Update inbox status
    const { error: updateError } = await supabaseAdmin
      .from('inbox')
      .update({
        status: 'Approved',
        reviewed_by: 'Admin', // In real app, get from auth session
        review_date: new Date().toISOString(),
        linked_record_id: result.id,
        linked_record_type: result.type
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating inbox status:', updateError)
      // We don't return error here because the record was already created
    }

    return NextResponse.json({ 
      success: true, 
      message: `${submission_type} approved and record created`,
      record: result
    })
  } catch (err) {
    console.error('Approval process error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
