import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    let query = supabase
      .from('stories')
      .select('*')
      .order('event_date', { ascending: false });

    if (type && type !== 'All') {
      query = query.eq('story_type', type);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (err: any) {
    console.error("Stories fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch stories", details: err.message }, { status: 500 });
  }
}
