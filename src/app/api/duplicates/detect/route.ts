/**
 * @file src/app/api/duplicates/detect/route.ts
 * @description API endpoint for running heuristic duplicate detection for a member.
 * Requirement: Ensures data integrity by identifying potential existing records before new ones are added.
 */

import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { duplicateDetector } from '@/lib/duplicate-detector';
import { NextResponse } from 'next/server';
import { withErrorHandler, errorCodes, KulikaError } from '@/lib/error-handler';

export const POST = withErrorHandler(async (request) => {
  const body = await request.json();
  const { familyId, newMember } = body;

  if (!familyId) {
    throw new KulikaError(errorCodes.VALIDATION_ERROR.code, 'familyId is required', 400);
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new KulikaError(errorCodes.SERVICE_UNAVAILABLE.code, 'Database not configured', 503);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new KulikaError(errorCodes.UNAUTHORIZED.code, 'Not authenticated', 401);
  }

  // Run detection
  await duplicateDetector.detectDuplicates(familyId, newMember);

  const { data: potentialDuplicates } = await supabase
    .from('potential_duplicates')
    .select('*')
    .eq('family_id', familyId)
    .eq('status', 'detected')
    .order('similarity_score', { ascending: false })
    .limit(5);

  return NextResponse.json({
    success: true,
    data: {
      duplicatesFound: potentialDuplicates?.length || 0,
      potentialDuplicates: potentialDuplicates || [],
    }
  });
});
