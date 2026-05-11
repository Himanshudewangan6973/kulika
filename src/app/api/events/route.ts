import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (err: any) {
    console.error("Events fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch events", details: err.message }, { status: 500 });
  }
}
