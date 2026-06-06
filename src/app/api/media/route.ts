/**
 * @file src/app/api/media/route.ts
 * @description API endpoint for retrieving family media assets (photos, videos, docs).
 * Requirement: Supports the media gallery with filtering and pagination.
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
    .from('media')
    .select('*')
    .order('upload_date', { ascending: false });

  if (communityId) {
    query = query.eq('community_id', communityId);
  }

  if (type && type !== 'All') {
    const dbType = type.endsWith('s') ? type.slice(0, -1) : type;
    query = query.eq('file_type', dbType);
  }

  const { data, error } = await query;

  if (error) throw error;

  return NextResponse.json({
    success: true,
    data: data || []
  });
});
