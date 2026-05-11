import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { unifiedMemberSchema, normalizeToUnified, unifiedToDatabase } from '@/lib/schemas/memberSchema'
import { validateInboxSubmission, formatValidationErrors } from '@/lib/schemas/validation'
import { ZodError } from 'zod'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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

    // 1.5 Validate submission data structure
    const validation = validateInboxSubmission(inboxEntry)
    if (!validation.valid) {
      return NextResponse.json({
        error: 'Invalid submission data',
        details: validation.errors?.join(', ')
      }, { status: 400 })
    }

    // 2. Handle approval based on type
    if (submission_type === 'New Member') {
      let normalizedData: any
      
      try {
        // Normalize raw_data to unified schema using helper
        normalizedData = normalizeToUnified(raw_data)
      } catch (normalizeError) {
        if (normalizeError instanceof ZodError) {
          const fieldErrors = normalizeError.errors.map(e => 
            `${e.path.join('.')}: ${e.message}`
          )
          return NextResponse.json({ 
            error: 'Invalid member data format',
            details: fieldErrors
          }, { status: 400 })
        }
        throw normalizeError
      }

      // Map tree-relative submissions to parent/child fields when possible
      if (raw_data?.relationship_to_base && raw_data?.base_member_id) {
        const relation = raw_data.relationship_to_base
        const baseMemberId = raw_data.base_member_id

        if (relation === 'child') {
          if (!normalizedData.parent1Id) {
            normalizedData.parent1Id = baseMemberId
          } else if (!normalizedData.parent2Id) {
            normalizedData.parent2Id = baseMemberId
          }
        }
      }

      // Convert normalized data to database format (snake_case)
      const dbData = unifiedToDatabase(normalizedData)
      
      // Use transaction-safe approval function
      const { data: funcResult, error: funcError } = await supabaseAdmin.rpc(
        'approve_member_submission',
        {
          p_inbox_id: id,
          p_member_data: {
            ...dbData,
            added_by: inboxEntry.submitter_email || 'Admin Approved',
            relationship_to_base: raw_data?.relationship_to_base,
            base_member_id: raw_data?.base_member_id
          }
        }
      )

      if (funcError || !funcResult?.success) {
        console.error('Approval function error:', funcError || funcResult?.error)
        return NextResponse.json({ 
          error: 'Failed to approve submission',
          details: funcError?.message || funcResult?.error
        }, { status: 500 })
      }

      result = { id: funcResult.member_id, type: 'family_member' }
    } else if (submission_type === 'Story') {
      // Handle story approval... (implement as needed)
      return NextResponse.json({ error: 'Story approval not fully implemented yet' }, { status: 501 })
    } else {
      return NextResponse.json({ error: `Approval for ${submission_type} not implemented` }, { status: 501 })
    }

    // 3. Revalidate tree page cache so approved members appear immediately
    revalidatePath('/tree')
    revalidatePath('/admin/inbox')

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
