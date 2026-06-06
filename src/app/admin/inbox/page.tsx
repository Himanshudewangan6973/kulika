/**
 * @file src/app/admin/inbox/page.tsx
 * @description Admin inbox page for reviewing and approving family member submissions.
 * Requirement: Provides a centralized interface for moderators to manage the influx of new family data.
 */

import AdminInboxClient from '@/components/admin/AdminInboxClient'
import { createClient } from '@/lib/supabase/server'
import Alert from '@/components/ui/Alert'
import { MOCK_INBOX } from '@/lib/mock-data'
import { ShieldCheck } from 'lucide-react'

export default async function AdminInboxPage() {
  const supabase = await createClient()
  let submissions: any[] = []
  let fetchError: Error | null = null

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('inbox')
        .select('*')
        .order('submission_date', { ascending: false })
      
      if (error) {
        console.warn('Error fetching submissions, using mock data:', error)
        submissions = MOCK_INBOX
      } else {
        submissions = data || []
      }
    } catch (e: any) {
      console.warn('Fetch submissions failed, using mock data:', e)
      fetchError = e instanceof Error ? e : new Error(String(e))
      submissions = MOCK_INBOX
    }
  } else {
    submissions = MOCK_INBOX
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
              <ShieldCheck className="text-indigo-600" size={40} />
              Submission Inbox
            </h1>
            <p className="text-slate-500 mt-2 text-lg font-medium">Verify and merge family contributions.</p>
          </div>
        </div>

        {!supabase && (
          <Alert type="warning" message="Configuration Required:">
            <p className="text-sm">Supabase credentials are missing. Please set up your environment variables.</p>
          </Alert>
        )}

        {fetchError && (
          <Alert type="error" message={`Error loading submissions: ${fetchError.message}`} />
        )}

        <AdminInboxClient initialSubmissions={submissions} />
      </div>
    </main>
  )
}
