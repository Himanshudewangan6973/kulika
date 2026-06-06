/**
 * @file src/app/api/stories/route.ts
 * @description API endpoint for fetching oral histories and stories.
 * Requirement: Supports the narratives section by providing formatted story content.
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { withErrorHandler, errorCodes, KulikaError } from '@/lib/error-handler';

export const GET = withErrorHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const communityId = searchParams.get("communityId");

  const supabase = await createClient();
  if (!supabase) {
    throw new KulikaError(errorCodes.SERVICE_UNAVAILABLE.code, 'Database not configured', 503);
  }

  let query = supabase
    .from('stories')
    .select('*')
    .order('event_date', { ascending: false });

  if (communityId) {
    query = query.eq('community_id', communityId);
  }

  if (type && type !== 'All') {
    query = query.eq('story_type', type);
  }

  const { data, error } = await query;

  if (error) throw error;

  return NextResponse.json({
    success: true,
    data: data || []
  });
});
