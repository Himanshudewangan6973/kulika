import FamilyTree from '@/components/tree/FamilyTree'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function TreePage() {
  const supabase = createClient()
  let members: any[] = []

  if (supabase) {
    const { data: approvedMembers } = await supabase.from('family_members').select('*')
    const { data: allPending } = await supabase
      .from('inbox')
      .select('*')
      .eq('status', 'Pending')
    
    if (approvedMembers) {
      let mergedMembers = [...approvedMembers]
      
      if (allPending) {
        // 1. Process New Member submissions
        const newMembers = allPending
          .filter((item: any) => item.submission_type === 'New Member')
          .map((item: any) => ({
            ...item.raw_data,
            id: `pending-${item.id}`,
            status: 'Pending'
          }))
        
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
      } else {
        members = approvedMembers
      }
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-primary hover:text-primary-dark transition-colors">
            <span className="text-xl">←</span>
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
            <p className="text-gray-500 mt-2 mb-8 max-w-md mx-auto">Start documenting the Roots of Dewangan by adding the first family member.</p>
            <Link href="/submit" className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg">
              Add First Member
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Explore the multi-generational lineage of the Dewangan family. Use your mouse to zoom and pan.
              </p>
            </div>
            
            <FamilyTree initialMembers={members} />

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
