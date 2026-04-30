import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // 1. Prepare for Cloudflare AI Workers (Whisper)
    const buffer = await file.arrayBuffer();
    
    // Note: In production, we would use the Cloudflare AI Workers SDK or Fetch API
    // targeting the @cf/openai/whisper model.
    
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/openai/whisper`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_AI_TOKEN}`,
          "Content-Type": "application/octet-stream",
        },
        body: buffer,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Cloudflare AI error:", error);
      return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
    }

    const result = await response.json();
    
    return NextResponse.json({ 
      success: true, 
      text: result.result.text,
      language: result.result.language || 'en'
    });
  } catch (err: any) {
    console.error("Transcription error:", err);
    return NextResponse.json({ error: "Internal server error", details: err.message }, { status: 500 });
  }
}
