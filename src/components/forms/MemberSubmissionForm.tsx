'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'

const memberSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  nickname: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']),
  date_of_birth: z.string().optional(),
  birth_place: z.string().optional(),
  lineage: z.enum(['Father', 'Mother', 'Both']),
  submitter_name: z.string().min(2, 'Your name is required'),
  submitter_email: z.string().email('Invalid email address'),
})

type MemberFormValues = z.infer<typeof memberSchema>

export default function MemberSubmissionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      gender: 'Male',
      lineage: 'Father',
    }
  })

  const onSubmit = async (data: MemberFormValues) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      if (!supabase) {
        console.warn('Supabase not initialized, simulating submission')
        await new Promise(resolve => setTimeout(resolve, 1000))
        setIsSubmitting(false)
        setMessage({ 
          type: 'success', 
          text: 'Demo Mode: Submission received locally! (Supabase not configured)' 
        })
        reset()
        return
      }

      const { error } = await supabase.from('inbox').insert({
        submission_type: 'New Member',
        status: 'Pending',
        raw_data: data,
        submitter_name: data.submitter_name,
        submitter_email: data.submitter_email,
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Thank you! Your submission has been sent for review.' })
      reset()
    } catch (error: any) {
      console.error('Submission error:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to submit. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold text-primary mb-6">Add Family Member</h2>
      
      {message && (
        <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              {...register('full_name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              placeholder="e.g. Ramesh Kumar Dewangan"
            />
            {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
            <input
              {...register('nickname')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              placeholder="e.g. Ramu"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              {...register('gender')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lineage</label>
            <select
              {...register('lineage')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            >
              <option value="Father">Father's Side</option>
              <option value="Mother">Mother's Side</option>
              <option value="Both">Both</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              {...register('date_of_birth')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Birth Place</label>
            <input
              {...register('birth_place')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              placeholder="e.g. Raipur, CG"
            />
          </div>
        </div>

        <hr className="my-6 border-gray-200" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Submitter Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
            <input
              {...register('submitter_name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            />
            {errors.submitter_name && <p className="mt-1 text-xs text-red-500">{errors.submitter_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Email *</label>
            <input
              type="email"
              {...register('submitter_email')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            />
            {errors.submitter_email && <p className="mt-1 text-xs text-red-500">{errors.submitter_email.message}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full mt-6 py-3 px-4 rounded-md text-white font-semibold transition-colors ${
            isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark shadow-md'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Member'}
        </button>
      </form>
    </div>
  )
}
