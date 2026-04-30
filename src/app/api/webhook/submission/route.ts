import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    
    // 1. Validate payload structure (Tally format)
    if (!payload.data || !payload.data.fields) {
      // It might be a direct form submission from a local form as well
      // but we expect Tally structure here based on Phase 3 goals.
      console.warn('Received non-Tally or malformed webhook:', payload)
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 })
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
      // Check if it's the submitter name (not the member being added)
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

    // 4. Initialize Supabase Admin Client to bypass RLS
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

    if (error) {
      console.error('Error inserting into inbox:', error)
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 })
    }

    console.log(`Successfully processed ${submissionType} submission from ${submitterName}`)

    return NextResponse.json({ 
      success: true, 
      id: data.id,
      message: 'Submission captured in inbox' 
    })
  } catch (err) {
    console.error('Webhook processing error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
