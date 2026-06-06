/**
 * @file src/app/api/claims/route.ts
 * @description API endpoint for managing family member claims (attributes like birth date, location).
 * Requirement: Supports the claims engine by allowing users to submit evidence-backed data points.
 */

import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { claimsEngine } from '@/lib/claims-engine';
import { auditLogger } from '@/lib/audit-logger';
import { NextResponse } from 'next/server';
import { withErrorHandler, errorCodes, KulikaError } from '@/lib/error-handler';

// GET /api/claims?memberId=xxx&familyId=xxx
export const GET = withErrorHandler(async (request) => {
  const searchParams = request.nextUrl.searchParams;
  const memberId = searchParams.get('memberId');
  const familyId = searchParams.get('familyId');

  if (!memberId || !familyId) {
    throw new KulikaError(errorCodes.INVALID_REQUEST.code, 'memberId and familyId are required', 400);
  }

  const claims = await claimsEngine.getClaimsForMember(familyId, memberId);

  return NextResponse.json({
    success: true,
    data: claims,
  });
});

// POST /api/claims
export const POST = withErrorHandler(async (request) => {
  const body = await request.json();
  const {
    familyId,
    memberId,
    claimType,
    claimValue,
    sourceType,
    confidence,
  } = body;

  // Validation
  if (!familyId || !memberId || !claimType || !claimValue || !sourceType) {
    throw new KulikaError(errorCodes.VALIDATION_ERROR.code, 'Missing required fields', 400);
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new KulikaError(errorCodes.UNAUTHORIZED.code, 'Not authenticated', 401);
  }

  // Check permissions
  const { data: role } = await supabase
    .from('family_members_roles')
    .select('role')
    .eq('family_id', familyId)
    .eq('member_id', user.id)
    .single();

  if (!role || role.role === 'visitor') {
    throw new KulikaError(errorCodes.FORBIDDEN.code, 'No permission to add claims', 403);
  }

  const claim = await claimsEngine.createClaim(
    familyId,
    memberId,
    claimType,
    claimValue,
    sourceType,
    confidence || 0.5
  );

  // Log to audit trail
  await auditLogger.logChange(
    familyId,
    'claim',
    claim.id,
    claimType,
    null,
    claimValue,
    'New claim created'
  );

  return NextResponse.json({
    success: true,
    data: claim,
  });
});
