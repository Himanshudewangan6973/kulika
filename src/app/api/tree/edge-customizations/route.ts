/**
 * @file src/app/api/tree/edge-customizations/route.ts
 * @description API endpoint for persisting and retrieving visual customizations for family tree edges.
 * Requirement: Supports the interactive tree editor by saving bend points and line styles.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withErrorHandler, errorCodes, KulikaError } from '@/lib/error-handler'

export const POST = withErrorHandler(async (req) => {
  const { relationshipId, bendPoints, lineStyle } = await req.json()

  if (!relationshipId) {
    throw new KulikaError(errorCodes.INVALID_REQUEST.code, 'relationshipId is required', 400);
  }

  const supabase = await createClient()
  if (!supabase) {
    throw new KulikaError(errorCodes.SERVICE_UNAVAILABLE.code, 'Database not configured', 503);
  }

  // Check if customization already exists
  const { data: existing } = await supabase
    .from('edge_customizations')
    .select('id')
    .eq('relationship_id', relationshipId)
    .single()

  let result

  if (existing) {
    // Update existing customization
    result = await supabase
      .from('edge_customizations')
      .update({
        bend_points: bendPoints || [],
        line_style: lineStyle || 'bezier',
        updated_at: new Date().toISOString()
      })
      .eq('relationship_id', relationshipId)
      .select()
      .single()
  } else {
    // Create new customization
    result = await supabase
      .from('edge_customizations')
      .insert({
        relationship_id: relationshipId,
        bend_points: bendPoints || [],
        line_style: lineStyle || 'bezier'
      })
      .select()
      .single()
  }

  if (result.error) throw result.error

  return NextResponse.json({
    success: true,
    data: result.data,
    message: 'Edge customization saved'
  })
});

export const GET = withErrorHandler(async (req) => {
  const { searchParams } = new URL(req.url)
  const relationshipId = searchParams.get('relationshipId')

  if (!relationshipId) {
    throw new KulikaError(errorCodes.INVALID_REQUEST.code, 'relationshipId is required', 400);
  }

  const supabase = await createClient()
  if (!supabase) {
    throw new KulikaError(errorCodes.SERVICE_UNAVAILABLE.code, 'Database not configured', 503);
  }

  // Fetch single customization
  const { data, error } = await supabase
    .from('edge_customizations')
    .select('*')
    .eq('relationship_id', relationshipId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return NextResponse.json({ success: true, data })
});
