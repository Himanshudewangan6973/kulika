/**
 * @file src/app/api/tree/members/route.ts
 * @description API endpoint for fetching family members with optional generation filtering.
 * Requirement: Supports interactive family tree visualization by providing member data.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withErrorHandler, errorCodes, KulikaError } from '@/lib/error-handler'
import { visibilityManager } from '@/lib/visibility-manager'
import { calculateAncestorClosure } from '@/components/tree/engine/pathfinder'

export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async (req) => {
  const { searchParams } = new URL(req.url)
  const minGen = searchParams.get('minGen')
  const maxGen = searchParams.get('maxGen')
  const familyId = searchParams.get('familyId')
  const communityId = searchParams.get('communityId')

  const supabase = await createClient()
  if (!supabase) {
    throw new KulikaError(errorCodes.SERVICE_UNAVAILABLE.code, 'Database not configured', 503);
  }

  let query = supabase.from('family_members').select('*')

  if (communityId) {
    query = query.eq('community_id', communityId)
  } else if (familyId) {
    query = query.eq('family_id', familyId)
  }

  if (minGen) query = query.gte('generation', minGen)
  if (maxGen) query = query.lte('generation', maxGen)

  const { data, error } = await query.order('generation', { ascending: true })

  if (error) throw error

  // 1. Calculate Ancestor Closure for all fetched members
  const closureMap = calculateAncestorClosure(data.map((d: any) => ({ id: d.id, data: d } as any)));

  // 2. Apply Visibility & Redaction
  const processedData = data.map((member: any) => {
    const memberWithClosure = {
      ...member,
      ancestor_ids: closureMap[member.id] || []
    };

    // Redact details of living members for general API access (Assume > 2 degrees)
    return visibilityManager.redactSensitiveData(memberWithClosure, 5);
  });

  return NextResponse.json({ success: true, data: processedData })
});
