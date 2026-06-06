/**
 * @file src/app/api/webhook/submission/route.ts
 * @description API endpoint for receiving external form submissions (e.g. from Tally).
 * Requirement: Acts as a bridge between high-accessibility external forms and the internal moderation inbox.
 */

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { withErrorHandler, errorCodes, KulikaError } from '@/lib/error-handler'
import logger from '@/lib/logger'

export const POST = withErrorHandler(async (req) => {
  const payload = await req.json()
  
  // 1. Validate payload structure (Tally format)
  if (!payload.data || !payload.data.fields) {
    logger.warn('Received non-Tally or malformed webhook', { payload })
    throw new KulikaError(errorCodes.INVALID_REQUEST.code, 'Invalid payload structure', 400);
  }

  const { formName, fields } = payload.data
  
  // 2. Map submission type based on form name or hidden fields
  let submissionType = 'Other'
  const name = formName?.toLowerCase() || ''
  
  if (name.includes('member')) submissionType = 'New Member'
  else if (name.includes('story')) submissionType = 'Story'
  else if (name.includes('photo') || name.includes('media')) submissionType = 'Media'
  else if (name.includes('event')) submissionType = 'Event'
  else if (name.includes('tradition')) submissionType = 'Tradition'
  else if (name.includes('update')) submissionType = 'Update Member'

  // 3. Extract common fields (Search for labels like "Name", "Email", "Phone")
  let submitterName = 'Anonymous'
  let submitterEmail = ''
  let submitterPhone = ''
  const tempFileUrls: string[] = []

  fields.forEach((field: any) => {
    const label = field.label?.toLowerCase() || ''
    const value = field.value

    if (!value) return

    // Attempt to identify the submitter info
    if (label.includes('your name') || (label.includes('name') && !label.includes('family') && !label.includes('member'))) {
      submitterName = value
    }
    if (label.includes('email')) {
      submitterEmail = value
    }
    if (label.includes('phone') || label.includes('contact')) {
      submitterPhone = value
    }

    // Collect file URLs (Tally provides them as arrays of objects)
    if (field.type === 'FILE_UPLOAD' && Array.isArray(value)) {
      value.forEach((file: any) => {
        if (file.url) tempFileUrls.push(file.url)
      })
    }
  })

  // 4. Initialize Supabase Admin Client
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new KulikaError(errorCodes.INTERNAL_ERROR.code, 'Supabase admin credentials are not configured', 500);
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 5. Insert into inbox table
  const { data, error } = await supabaseAdmin
    .from('inbox')
    .insert({
      submission_type: submissionType,
      raw_data: payload.data,
      submitter_name: submitterName,
      submitter_email: submitterEmail,
      submitter_phone: submitterPhone,
      temp_file_urls: tempFileUrls,
      status: 'Pending',
      submission_date: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error;

  logger.info(`Successfully processed ${submissionType} submission`, { submitterName, submissionId: data.id })

  return NextResponse.json({ 
    success: true, 
    id: data.id,
    message: 'Submission captured in inbox' 
  })
});
