import SubmissionList from '@/components/admin/SubmissionList'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Alert from '@/components/ui/Alert'

export default async function AdminInboxPage() {
  const supabase = await createClient()
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
        <div className="mb-8">
          <Link href="/" className="text-primary hover:text-primary-dark font-medium flex items-center gap-2 transition-all hover:-translate-x-1">
            <span className="text-xl">←</span> Back Home
          </Link>
        </div>
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
          <Alert type="warning" message="Configuration Required:">
            <p className="text-sm">Supabase credentials are missing. Please set up your environment variables.</p>
          </Alert>
        )}

        {fetchError && (
          <Alert type="error" message={`Error loading submissions: ${fetchError.message}`} />
        )}

        <SubmissionList initialSubmissions={submissions} />
      </div>
    </main>
  )
}
