import { Suspense } from 'react'
import MemberSubmissionForm from '@/components/forms/MemberSubmissionForm'

export default function SubmitMemberPage() {
  return (
    <main className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Contribute to Family Heritage
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Help us preserve the Roots of Heritage by adding a new family member to our digital sanctuary.
          </p>
        </div>
        <Suspense fallback={<div>Loading form...</div>}>
          <MemberSubmissionForm />
        </Suspense>
      </div>
    </main>
  )
}
