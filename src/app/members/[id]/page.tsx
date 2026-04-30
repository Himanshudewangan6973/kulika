import { createClient } from '@/lib/supabase/server'
import MemberProfile from '@/components/tree/MemberProfile'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function MemberPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  if (!supabase) {
    return (
      <main className="min-h-screen bg-surface py-12 px-4 flex items-center justify-center">
        <div className="p-8 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl max-w-md text-center shadow-sm">
          <h2 className="text-xl font-bold mb-2">Configuration Required</h2>
          <p>Please set up your Supabase environment variables to view family profiles.</p>
        </div>
      </main>
    )
  }

  // 1. Fetch complete member info
  const { data: member, error: memberError } = await supabase
    .from('view_members_complete')
    .select('*')
    .eq('id', params.id)
    .single()
  
  if (memberError || !member) {
    notFound()
  }

  // 2. Fetch tagged media
  const { data: media } = await supabase
    .from('media')
    .select('*, media_members!inner(member_id)')
    .eq('media_members.member_id', params.id)
    .order('date_taken', { ascending: false })

  // 3. Fetch linked stories
  const { data: stories } = await supabase
    .from('stories')
    .select('*, story_members!inner(member_id, role)')
    .eq('story_members.member_id', params.id)
    .order('event_date', { ascending: false })

  // 4. Fetch attended events
  const { data: events } = await supabase
    .from('events')
    .select('*, event_attendees!inner(member_id, role)')
    .eq('event_attendees.member_id', params.id)
    .order('event_date', { ascending: false })

  // 5. Fetch marriages
  const { data: marriages } = await supabase
    .from('marriages')
    .select('*, spouse1:spouse1_id(full_name), spouse2:spouse2_id(full_name)')
    .or(`spouse1_id.eq.${params.id},spouse2_id.eq.${params.id}`)
    .order('marriage_date', { ascending: false })

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
}
