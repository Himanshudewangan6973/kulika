/**
 * @file src/app/api/upload/route.ts
 * @description API endpoint for handling file uploads to Cloudflare R2 and Supabase metadata tracking.
 * Requirement: Ensures secure and reliable media ingestion for the heritage OS.
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';
import { withErrorHandler, errorCodes, KulikaError } from '@/lib/error-handler';

const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!r2AccountId || r2AccountId.length < 10) {
  console.error('CRITICAL: R2_ACCOUNT_ID is missing or too short');
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2AccessKeyId!,
    secretAccessKey: r2SecretAccessKey!,
  },
});

export const POST = withErrorHandler(async (req) => {
  const requiredR2Env = [
    r2AccountId,
    r2AccessKeyId,
    r2SecretAccessKey,
    process.env.R2_BUCKET_NAME,
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
  ];

  if (requiredR2Env.some((value) => !value)) {
    throw new KulikaError(errorCodes.INTERNAL_ERROR.code, 'Upload storage is not configured', 500);
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const fileTypeStr = formData.get("file_type") as string || 'Photo';
  
  if (!file) {
    throw new KulikaError(errorCodes.INVALID_REQUEST.code, 'No file provided', 400);
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
    throw new KulikaError(errorCodes.INTERNAL_ERROR.code, 'Upload metadata database is not configured', 500);
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

  if (dbError) throw dbError;

  return NextResponse.json({ 
    success: true, 
    url: publicUrl,
    record: mediaRecord,
    message: 'Upload successful'
  });
});
