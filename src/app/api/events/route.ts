/**
 * @file src/app/api/events/route.ts
 * @description API endpoint for fetching family events.
 * Requirement: Supports the timeline and anniversary features by providing chronological event data.
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { withErrorHandler, errorCodes, KulikaError } from '@/lib/error-handler';

export const GET = withErrorHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const communityId = searchParams.get("communityId");

  const supabase = await createClient();
  if (!supabase) {
    throw new KulikaError(errorCodes.SERVICE_UNAVAILABLE.code, 'Database not configured', 503);
  }

  let query = supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  if (communityId) {
    query = query.eq('community_id', communityId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return NextResponse.json({
    success: true,
    data: data || []
  });
});
