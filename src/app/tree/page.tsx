import TreePageClient from '@/components/tree/TreePageClient'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MOCK_FAMILY_MEMBERS, MOCK_INBOX } from '@/lib/mock-data'

function getTreeLoadMessage(err: unknown) {
  if (err instanceof Error) {
    if (err.message.includes('fetch failed')) {
      return 'Unable to reach Supabase right now. Showing preview data until the connection is restored.'
    }
    return err.message
  }

  return 'Unable to load live tree data. Showing preview data.'
}

export default async function TreePage({ searchParams }: { searchParams: Promise<{ communityId?: string, familyId?: string }> }) {
  const params = await searchParams
  const activeCommunityId = params.communityId || params.familyId
  
  const supabase = await createClient()
  let members: any[] = []
  let error: string | null = null

  if (supabase) {
    try {
      let memberQuery = supabase.from('family_members').select('*')
      let inboxQuery = supabase.from('inbox').select('*').eq('status', 'Pending')

      if (activeCommunityId) {
        memberQuery = memberQuery.eq('community_id', activeCommunityId)
        // For inbox, the community ID might be inside raw_data or a separate column if we add it
        // For now, let's assume we filter by it if possible, otherwise we show all pending for simplicity
        // or filter by checking if raw_data contains the community_id
        // Since it's JSONB, we can do:
        inboxQuery = inboxQuery.contains('raw_data', { community_id: activeCommunityId })
      }

      const [
        { data: approvedMembers, error: approvedError },
        { data: allPending }
      ] = await Promise.all([
        memberQuery.lte('generation', 3).order('generation', { ascending: true }),
        inboxQuery.order('submission_date', { ascending: false })
      ])
      
      if (approvedError) {
        console.warn('Supabase fetch failed, falling back to mock data.', approvedError)
        error = getTreeLoadMessage(approvedError)
        // Fallback to mock data on error
        const mockApproved = MOCK_FAMILY_MEMBERS;
        
        let mergedMembers = [...mockApproved]
        const mockPending = MOCK_INBOX;
        
        const newMembers = mockPending
          .filter((item: any) => item.submission_type === 'New Member')
          .map((item: any) => ({
            ...item.raw_data,
            id: `pending-${item.id}`,
            inboxId: item.id,
            status: 'Pending',
            isTemporary: true
          }))
          
        members = [...mergedMembers, ...newMembers]
      } else if (approvedMembers) {
        let mergedMembers = [...approvedMembers]
        
        if (allPending && allPending.length > 0) {
          console.log(`📥 Found ${allPending.length} pending submissions`)
          
          // 1. Process New Member submissions
          const newMembers = allPending
            .filter((item: any) => item.submission_type === 'New Member')
            .map((item: any) => {
              console.log(`✨ Processing pending member from inbox ${item.id}:`, item.raw_data)
              return {
                ...item.raw_data,
                id: `pending-${item.id}`,
                inboxId: item.id,
                status: 'Pending',
                isTemporary: true
              }
            })
          
          // 2. Process Update Member submissions
          const updates = allPending.filter((item: any) => item.submission_type === 'Update Member' && item.linked_record_id)
          
          mergedMembers = mergedMembers.map(member => {
            const pendingUpdate = updates.find((u: any) => u.linked_record_id === member.id)
            if (pendingUpdate) {
              return {
                ...member,
                ...pendingUpdate.raw_data,
                status: 'Pending'
              }
            }
            return member
          })

          members = [...mergedMembers, ...newMembers]
          console.log(`📊 Total members to display: ${members.length} (${approvedMembers.length} approved + ${newMembers.length} pending)`)
        } else {
          members = approvedMembers
          console.log(`📊 Loaded ${approvedMembers.length} approved members`)
        }
      }
    } catch (err) {
      console.warn('Unexpected error in TreePage, using mock data bypass.', err)
      error = getTreeLoadMessage(err)
      // Final fallback to mock data
      const mockApproved = MOCK_FAMILY_MEMBERS;
      const mockPending = MOCK_INBOX;
      
      const newMembers = mockPending
        .filter((item: any) => item.submission_type === 'New Member')
        .map((item: any) => ({
          ...item.raw_data,
          id: `pending-${item.id}`,
          inboxId: item.id,
          status: 'Pending',
          isTemporary: true
        }))
        
      members = [...mockApproved, ...newMembers]
    }
  } else {
    console.warn('⚠️ Supabase not initialized (Using Mock Data)')
    error = 'Supabase credentials are missing. Showing preview data.'
    // Fallback to mock data if no supabase client
    const mockApproved = MOCK_FAMILY_MEMBERS;
    const mockPending = MOCK_INBOX;
    
    const newMembers = mockPending
      .filter((item: any) => item.submission_type === 'New Member')
      .map((item: any) => ({
        ...item.raw_data,
        id: `pending-${item.id}`,
        inboxId: item.id,
        status: 'Pending',
        isTemporary: true
      }))
      
    members = [...mockApproved, ...newMembers]
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="p-6 max-w-7xl mx-auto">
        {!supabase && (
          <div className="p-4 mb-6 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm">
            <strong>Configuration Required:</strong> Supabase credentials are missing. Please set up your environment variables.
          </div>
        )}

        {error && (
          <div className="p-4 mb-6 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-sm">
            <strong>Preview Data Active:</strong> {error}
          </div>
        )}

        {members.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-5xl mb-6">🌳</p>
            <h2 className="text-2xl font-bold text-gray-800">The tree is ready to grow</h2>
            <p className="text-gray-500 mt-2 mb-8 max-w-md mx-auto">Start documenting the Roots of Heritage by adding the first family member.</p>
            <Link href="/submit" className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg">
              Add First Member
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Explore the multi-generational lineage of the Heritage family. Use your mouse to zoom and pan.
              </p>
            </div>
            
            <TreePageClient initialMembers={members} />

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-2">Navigation Guide</h3>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li>• <strong>Drag:</strong> Pan the tree view</li>
                  <li>• <strong>Scroll:</strong> Zoom in and out</li>
                  <li>• <strong>Mini Map:</strong> Quick navigation across generations</li>
                  <li>• <strong>Nodes:</strong> Represent family members and their status</li>
                </ul>
              </div>
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                <h3 className="font-bold text-primary mb-2">Lineage Analysis</h3>
                <p className="text-sm text-blue-700">
                  This interactive graph automatically calculates generation levels and maps parent-child relationships in real-time.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
