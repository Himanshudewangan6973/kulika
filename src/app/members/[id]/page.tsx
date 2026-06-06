import { createClient } from '@/lib/supabase/server'
import MemberProfile from '@/components/tree/MemberProfile'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MOCK_FAMILY_MEMBERS } from '@/lib/mock-data'

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  // Check if it's a mock ID
  const mockMember = MOCK_FAMILY_MEMBERS.find(m => m.id === id);

  if (!supabase || mockMember) {
    if (mockMember) {
      return (
        <main className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <header className="mb-8 flex items-center gap-4">
              <Link href="/tree" className="text-primary hover:underline font-medium flex items-center gap-2 transition-all hover:-translate-x-1">
                <span className="text-xl">←</span> Back to Family Tree
              </Link>
            </header>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-700 text-sm mb-6">
              <strong>Preview Mode:</strong> Viewing mock data for this family member.
            </div>
            <MemberProfile 
              member={mockMember as any} 
              media={[]} 
              stories={[]} 
              events={[]}
              marriages={[]}
            />
          </div>
        </main>
      )
    }

    return (
      <main className="min-h-screen bg-surface py-12 px-4 flex items-center justify-center">
        <div className="p-8 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl max-w-md text-center shadow-sm">
          <h2 className="text-xl font-bold mb-2">Configuration Required</h2>
          <p>Please set up your Supabase environment variables to view family profiles.</p>
        </div>
      </main>
    )
  }

  try {
    // 1. Fetch all member data concurrently
    const [
      { data: member, error: memberError },
      { data: media },
      { data: stories },
      { data: events },
      { data: marriages }
    ] = await Promise.all([
      supabase
        .from('view_members_complete')
        .select('*')
        .eq('id', id)
        .single(),
      supabase
        .from('media')
        .select('*, media_members!inner(member_id)')
        .eq('media_members.member_id', id)
        .order('date_taken', { ascending: false }),
      supabase
        .from('stories')
        .select('*, story_members!inner(member_id, role)')
        .eq('story_members.member_id', id)
        .order('event_date', { ascending: false }),
      supabase
        .from('events')
        .select('*, event_attendees!inner(member_id, role)')
        .eq('event_attendees.member_id', id)
        .order('event_date', { ascending: false }),
      supabase
        .from('marriages')
        .select('*, spouse1:spouse1_id(full_name), spouse2:spouse2_id(full_name)')
        .or(`spouse1_id.eq.${id},spouse2_id.eq.${id}`)
        .order('marriage_date', { ascending: false })
    ])
    
    if (memberError || !member) {
      notFound()
    }

    return (
      <main className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 flex items-center gap-4">
            <Link href="/tree" className="text-primary hover:underline font-medium flex items-center gap-2 transition-all hover:-translate-x-1">
              <span className="text-xl">←</span> Back to Family Tree
            </Link>
          </header>

          <MemberProfile 
            member={member} 
            media={media || []} 
            stories={stories || []} 
            events={events || []}
            marriages={marriages || []}
          />
        </div>
      </main>
    )
  } catch (error) {
    console.error('Failed to load member profile:', error)
    notFound()
  }
}
