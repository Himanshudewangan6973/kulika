/**
 * @file src/app/api/admin/inbox/[id]/approve/route.ts
 * @description Admin API endpoint for approving family member submissions.
 * Requirement: Handles data normalization, database insertion via transaction-safe RPC, and status updates.
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { normalizeToUnified, unifiedToDatabase, validateInboxSubmission } from '@/lib/schemas/memberSchema'
import { withErrorHandler, errorCodes, KulikaError } from '@/lib/error-handler'

export const POST = withErrorHandler(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new KulikaError(errorCodes.INTERNAL_ERROR.code, 'Supabase admin credentials are not configured', 500);
  }

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
    throw new KulikaError(errorCodes.NOT_FOUND.code, 'Submission not found', 404);
  }

  if (inboxEntry.status === 'Approved') {
    throw new KulikaError(errorCodes.ALREADY_EXISTS.code, 'Already approved', 400);
  }

  const { submission_type, raw_data } = inboxEntry

  // 1.5 Validate submission data structure
  const validation = validateInboxSubmission(inboxEntry)
  if (!validation.valid) {
    throw new KulikaError(errorCodes.VALIDATION_ERROR.code, `Invalid submission data: ${validation.errors?.join(', ')}`, 400);
  }

  // 2. Handle approval based on type
  if (submission_type === 'New Member') {
    const normalizedData = normalizeToUnified(raw_data)

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
      throw new KulikaError(
        errorCodes.INTERNAL_ERROR.code, 
        funcError?.message || funcResult?.error || 'Failed to approve submission', 
        500
      );
    }

    revalidatePath('/tree')
    revalidatePath('/admin/inbox')

    return NextResponse.json({ 
      success: true, 
      message: `${submission_type} approved and record created`,
      record: { id: funcResult.member_id, type: 'family_member' }
    })
  } else if (submission_type === 'Story') {
    throw new KulikaError(errorCodes.INVALID_REQUEST.code, 'Story approval not fully implemented yet', 501);
  }

  throw new KulikaError(errorCodes.INVALID_REQUEST.code, `Approval for ${submission_type} not implemented`, 501);
});
