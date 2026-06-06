/**
 * @file src/app/api/admin/inbox/[id]/route.ts
 * @description Admin API endpoint for managing specific inbox submissions (e.g. deletion).
 * Requirement: Allows moderators to purge invalid or unwanted submission records.
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler, errorCodes, KulikaError } from '@/lib/error-handler';

export const DELETE = withErrorHandler(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new KulikaError(errorCodes.INTERNAL_ERROR.code, 'Supabase admin credentials are not configured', 500);
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabaseAdmin
    .from('inbox')
    .delete()
    .eq('id', id)

  if (error) throw error

  return NextResponse.json({ success: true, message: 'Submission purged successfully' })
});
