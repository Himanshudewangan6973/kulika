import { createClient } from '@/lib/supabase/server'
import SubmissionList from '@/components/admin/SubmissionList'

export default async function AdminInboxPage() {
  const supabase = createClient()
  let submissions: any[] = []
  let fetchError = null

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('inbox')
        .select('*')
        .order('submission_date', { ascending: false })
      
      if (error) {
        fetchError = error
      } else {
        submissions = data || []
      }
    } catch (e: any) {
      fetchError = e
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Submission Inbox</h1>
            <p className="text-sm text-gray-500 mt-1">Review and approve family contributions</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
            <span className="text-sm font-medium text-gray-700">
              {submissions.filter(s => s.status === 'Pending').length} Pending
            </span>
          </div>
        </div>

        {!supabase && (
          <div className="p-4 mb-6 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm">
            <strong>Configuration Required:</strong> Supabase credentials are missing. Please set up your environment variables.
          </div>
        )}

        {fetchError && (
          <div className="p-4 mb-6 bg-red-50 text-red-700 border border-red-200 rounded-lg">
            Error loading submissions: {fetchError.message}
          </div>
        )}

        <SubmissionList initialSubmissions={submissions} />
      </div>
    </main>
  )
}
