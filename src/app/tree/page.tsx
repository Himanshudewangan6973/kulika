import TreePageClient from '@/components/tree/TreePageClient'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function TreePage() {
  const supabase = await createClient()
  let members: any[] = []
  let error: string | null = null

  if (supabase) {
    try {
      const [
        { data: approvedMembers, error: approvedError },
        { data: allPending, error: pendingError }
      ] = await Promise.all([
        // Only load first 3 generations initially for performance
        // Users can "Expand Lineage" to see more
        supabase.from('family_members').select('*').lte('generation', 3).order('generation', { ascending: true }),
        supabase.from('inbox').select('*').eq('status', 'Pending').order('created_at', { ascending: false })
      ])
      
      if (approvedError) {
        console.error('❌ Error fetching approved members:', approvedError)
        error = 'Failed to load family members'
      }
      
      if (pendingError) {
        console.error('❌ Error fetching pending submissions:', pendingError)
        error = 'Failed to load pending submissions'
      }

      if (approvedMembers) {
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
      console.error('❌ Unexpected error loading tree data:', err)
      error = 'An unexpected error occurred'
    }
  } else {
    console.warn('⚠️ Supabase not initialized')
  }

  return (
    <main className="min-h-screen bg-surface">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-primary hover:text-primary-dark font-medium flex items-center gap-2 transition-all hover:-translate-x-1">
            <span className="text-xl">←</span> Back Home
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Family Tree Visualization</h1>
        </div>
        <div className="flex gap-4">
          <Link href="/submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-all">
            + Add Member
          </Link>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        {!supabase && (
          <div className="p-4 mb-6 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm">
            <strong>Configuration Required:</strong> Supabase credentials are missing. Please set up your environment variables.
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
