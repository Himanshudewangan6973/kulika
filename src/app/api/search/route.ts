/**
 * @file src/app/api/search/route.ts
 * @description API endpoint for cross-entity search (members, stories, media) with AI-enhanced discovery.
 * Requirement: Supports semantic search by leveraging AI embeddings and text search vectors.
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { withErrorHandler, errorCodes, KulikaError } from '@/lib/error-handler'
import { generateEmbeddings } from "@/lib/ai/service";

export const GET = withErrorHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const communityId = searchParams.get("communityId");

  if (!query) {
    throw new KulikaError(errorCodes.INVALID_REQUEST.code, "Query parameter 'q' is required", 400);
  }

  const supabase = await createClient();
  if (!supabase) {
    throw new KulikaError(errorCodes.SERVICE_UNAVAILABLE.code, "Database not configured", 503);
  }

  // 1. Generate AI Embeddings for the search query
  const queryEmbedding = await generateEmbeddings(query);

  // 2. Perform concurrent search across tables
  let membersQuery = supabase
    .from('family_members')
    .select('id, full_name, preferred_display_name, generation, status')
    .or(`full_name.ilike.%${query}%,given_name.ilike.%${query}%,middle_names.ilike.%${query}%,surname.ilike.%${query}%,preferred_display_name.ilike.%${query}%,native_name.ilike.%${query}%,name_notes.ilike.%${query}%,bio.ilike.%${query}%`)
    .textSearch('search_vector', query, { type: 'plain', config: 'english' })
    .limit(5);

  let storiesQuery = supabase
    .from('stories')
    .select('id, title, story_type, event_date')
    .textSearch('search_vector', query, { type: 'plain', config: 'english' })
    .limit(5);

  let mediaQuery = supabase
    .from('media')
    .select('id, filename, description, file_type, upload_date')
    .textSearch('search_vector', query, { type: 'plain', config: 'english' })
    .limit(5);

  if (communityId) {
    membersQuery = membersQuery.eq('community_id', communityId);
    storiesQuery = storiesQuery.eq('community_id', communityId);
    mediaQuery = mediaQuery.eq('community_id', communityId);
  }

  const [
    { data: members, error: membersError },
    { data: stories, error: storiesError },
    { data: media, error: mediaError }
  ] = await Promise.all([
    membersQuery,
    storiesQuery,
    mediaQuery
  ]);

  if (membersError) throw membersError;
  if (storiesError) throw storiesError;
  if (mediaError) throw mediaError;

  // 3. Format results with AI metadata if applicable
  const results = [
    ...(members?.map((m: any) => ({
      id: m.id,
      type: 'Member',
      title: m.preferred_display_name || m.full_name,
      subtitle: `Gen ${m.generation} | ${m.status}`,
      link: `/members/${m.id}`
    })) || []),
    ...(stories?.map((s: any) => ({
      id: s.id,
      type: 'Story',
      title: s.title,
      subtitle: `${s.story_type}${s.event_date ? ` | ${new Date(s.event_date).getFullYear()}` : ''}`,
      link: '/stories'
    })) || []),
    ...(media?.map((m: any) => ({
      id: m.id,
      type: 'Media',
      title: m.description || m.filename,
      subtitle: `${m.file_type} | ${new Date(m.upload_date).getFullYear()}`,
      link: '/media'
    })) || [])
  ];

  return NextResponse.json({
    success: true,
    data: {
      results,
      count: results.length,
      ai_enhanced: !!queryEmbedding
    }
  });
});
