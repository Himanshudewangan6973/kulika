import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  const supabase = createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    // Perform search across multiple tables
    // We use the search_vector tsvector column with plainto_tsquery
    
    // 1. Search Members
    const { data: members, error: membersError } = await supabase
      .from('family_members')
      .select('id, full_name, nickname, generation, status')
      .textSearch('search_vector', query, {
        type: 'plain',
        config: 'english'
      })
      .limit(5);

    // 2. Search Stories
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select('id, title, story_type, event_date')
      .textSearch('search_vector', query, {
        type: 'plain',
        config: 'english'
      })
      .limit(5);

    // 3. Search Media
    const { data: media, error: mediaError } = await supabase
      .from('media')
      .select('id, filename, description, file_type, upload_date')
      .textSearch('search_vector', query, {
        type: 'plain',
        config: 'english'
      })
      .limit(5);

    // Format results for the UI
    const results = [
      ...(members?.map(m => ({
        id: m.id,
        type: 'Member',
        title: m.full_name,
        subtitle: `${m.nickname ? `"${m.nickname}" | ` : ''}Gen ${m.generation} | ${m.status}`,
        link: `/members/${m.id}`
      })) || []),
      ...(stories?.map(s => ({
        id: s.id,
        type: 'Story',
        title: s.title,
        subtitle: `${s.story_type}${s.event_date ? ` | ${new Date(s.event_date).getFullYear()}` : ''}`,
        link: '/stories'
      })) || []),
      ...(media?.map(m => ({
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
        count: results.length
      }
    });
  } catch (err: any) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "Search failed", details: err.message }, { status: 500 });
  }
}
