import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const supabase = createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    let query = supabase
      .from('media')
      .select('*')
      .order('upload_date', { ascending: false });

    if (type && type !== 'All') {
      // type can be 'Photos', 'Videos', 'Documents'
      // DB uses 'Photo', 'Video', 'Document'
      const dbType = type.endsWith('s') ? type.slice(0, -1) : type;
      query = query.eq('file_type', dbType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (err: any) {
    console.error("Media fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch media", details: err.message }, { status: 500 });
  }
}
