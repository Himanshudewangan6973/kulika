/**
 * @file src/app/api/admin/inbox/[id]/request-info/route.ts
 * @description Admin API endpoint for requesting more information on a submission.
 * Requirement: Updates submission status and records the moderator's comments.
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler, errorCodes, KulikaError } from '@/lib/error-handler';

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { reason } = await req.json()

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new KulikaError(errorCodes.INTERNAL_ERROR.code, 'Supabase admin credentials are not configured', 500);
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabaseAdmin
    .from('inbox')
    .update({
      status: 'Needs Info',
      reviewed_by: 'Admin',
      review_date: new Date().toISOString(),
      review_notes: reason || 'More information requested by admin'
    })
    .eq('id', id)

  if (error) throw error

  return NextResponse.json({ success: true, message: 'Information request sent back to user' })
});
