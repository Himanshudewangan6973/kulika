'use client'

import { useState } from 'react'

interface SubmissionListProps {
  initialSubmissions: any[]
}

export default function SubmissionList({ initialSubmissions }: SubmissionListProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleApprove = async (id: string) => {
    setLoadingId(id)
    setMessage(null)
    try {
      const response = await fetch(`/api/admin/inbox/${id}/approve`, {
        method: 'POST',
      })
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Failed to approve')

      setMessage({ type: 'success', text: result.message })
      setSubmissions(subs => subs.map(s => s.id === id ? { ...s, status: 'Approved' } : s))
    } catch (error: any) {
      console.error('Approval error:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoadingId(null)
    }
  }

  const handleReject = async (id: string) => {
    setLoadingId(id)
    setMessage(null)
    try {
      const response = await fetch(`/api/admin/inbox/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Admin rejection' })
      })
      const result = await response.json()
      
      if (!response.ok) throw new Error(result.error || 'Failed to reject')

      setMessage({ type: 'success', text: 'Submission rejected' })
      setSubmissions(subs => subs.map(s => s.id === id ? { ...s, status: 'Rejected' } : s))
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div>
      {message && (
        <div className={`p-4 mb-6 rounded-lg border ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        <ul role="list" className="divide-y divide-gray-200">
          {submissions.length === 0 ? (
            <li className="px-6 py-12 text-center text-gray-500">
              No submissions found.
            </li>
          ) : (
            submissions.map((submission) => (
              <li key={submission.id} className={submission.status !== 'Pending' ? 'opacity-60 bg-gray-50' : ''}>
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold text-primary truncate">
                        {submission.submission_type}
                      </p>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        submission.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 
                        submission.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {submission.status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-col gap-1">
                      <p className="text-sm text-gray-900">
                        Target: <span className="font-semibold">{submission.raw_data?.full_name || submission.raw_data?.title || 'Unnamed'}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Submitted by {submission.submitter_name || 'Anonymous'} on {new Date(submission.submission_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex gap-2">
                    {submission.status === 'Pending' && (
                      <>
                        <button 
                          onClick={() => handleReject(submission.id)}
                          disabled={loadingId === submission.id}
                          className="px-3 py-1.5 text-xs font-medium border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleApprove(submission.id)}
                          disabled={loadingId === submission.id}
                          className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                          {loadingId === submission.id ? '...' : 'Approve'}
                        </button>
                      </>
                    )}
                    {submission.status === 'Approved' && (
                      <span className="text-xs text-gray-400 italic">Approved</span>
                    )}
                    {submission.status === 'Rejected' && (
                      <span className="text-xs text-gray-400 italic">Rejected</span>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
