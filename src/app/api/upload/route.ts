import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const fileTypeStr = formData.get("file_type") as string || 'Photo';
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1. Upload to Cloudflare R2
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileId = uuidv4();
    const extension = file.name.split('.').pop() || 'jpg';
    const folder = fileTypeStr.toLowerCase() === 'photo' ? 'photos' : 'media';
    const key = `${folder}/${new Date().getFullYear()}/${fileId}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;

    // 2. Create record in Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Supabase credentials missing, skipping database record creation");
      return NextResponse.json({ 
        success: true, 
        url: publicUrl,
        message: 'Upload successful (Simulated DB record)'
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: mediaRecord, error: dbError } = await supabaseAdmin
      .from('media')
      .insert({
        filename: file.name,
        file_type: fileTypeStr,
        r2_key: key,
        r2_url: publicUrl,
        original_size_mb: file.size / (1024 * 1024),
        upload_date: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error after upload:", dbError);
      // We still return the URL because the file is uploaded
    }

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      record: mediaRecord,
      message: 'Upload successful'
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed", details: err.message }, { status: 500 });
  }
}
