import { createClient } from './client'

export interface Community {
  id: string
  name: string
  description?: string
  region?: string
  notes?: string
}

/**
 * Fetch all communities from the database
 * Used for populating community dropdowns
 */
export async function fetchCommunities(): Promise<Community[]> {
  const supabase = createClient()

  if (!supabase) {
    console.warn('Supabase client not available')
    return []
  }

  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .order('name')

  if (error) {
    console.error('❌ Error fetching communities:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    return []
  }

  return data || []
}