'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { useTreeStore } from '@/components/tree/store'
import { submissionSchema, SubmissionData } from '@/lib/schemas/memberSchema'
import Alert from '@/components/ui/Alert'
import MemberLookup from './MemberLookup'
import { 
  User, 
  Users, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  Check,
  Globe,
  Plus
} from 'lucide-react'

type Step = 'IDENTITY' | 'PERSONAL' | 'LINEAGE' | 'SUBMITTER'

export default function MemberSubmissionForm() {
  const { user: authUser } = useAuth()
  const searchParams = useSearchParams()
  const communityIdParam = searchParams.get('communityId')
  const setActiveWork = useTreeStore(state => state.setActiveWork)
  
  const [activeStep, setActiveStep] = useState<Step>('IDENTITY')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [lastSubmitted, setLastSubmitted] = useState<SubmissionData | null>(null)
  const [communities, setCommunities] = useState<any[]>([])
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Navigation Guard for browser refresh/tab close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSubmitting) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    if (isSubmitting) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isSubmitting])

  useEffect(() => {
    async function loadCommunities() {
      if (!supabase) return
      try {
        const { data } = await supabase.from('communities').select('id, name').order('name')
        setCommunities(data || [])
      } catch (err) {
        console.error('Error fetching communities:', err)
      } finally {
        setIsLoadingCommunities(false)
      }
    }
    loadCommunities()
  }, [supabase])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<SubmissionData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      gender: 'Other',
      lineage: 'Father',
      community_id: communityIdParam || '',
      submitterName: '',
      submitterEmail: '',
    }
  })

  // Sync auth user to form values to satisfy Zod schema
  useEffect(() => {
    if (authUser) {
      if (authUser.name) setValue('submitterName', authUser.name)
      if (authUser.email) setValue('submitterEmail', authUser.email)
    }
  }, [authUser, setValue])

  const onInvalid = (errors: any) => {
    console.error('📋 Form Validation Failed:', errors)
    setMessage({ 
      type: 'error', 
      text: 'Please check the form for missing or invalid information.' 
    })
  }

  const onSubmit = async (data: SubmissionData) => {
    const controller = new AbortController()
    setAbortController(controller)
    setIsSubmitting(true)
    setMessage(null)
    setLastSubmitted(null)

    // Set global active work state
    setActiveWork({ 
      id: 'member-submit', 
      type: 'SUBMISSION', 
      message: `Preserving record for ${data.full_name}...` 
    })

    // Use auth data if logged in
    const submitterName = authUser?.name || data.submitterName
    const submitterEmail = authUser?.email || data.submitterEmail

    try {
      console.log('🚀 Starting submission for:', data.full_name)
      console.log('📝 Submitter:', { name: submitterName, email: submitterEmail })

      if (!supabase) {
        console.warn('⚠️ Supabase not initialized, simulating submission')
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIsSubmitting(false)
        setActiveWork(null)
        setMessage({ 
          type: 'success', 
          text: 'Demo Mode: Submission received locally! (Supabase not configured)' 
        })
        setLastSubmitted({ ...data, submitterName, submitterEmail })
        reset()
        setActiveStep('IDENTITY')
        return
      }

      // Supabase .insert() doesn't support .abortSignal directly on the query object, 
      // but we handle the state in finally and the catch block if we wrapper it properly.
      const payload = {
        submission_type: 'New Member',
        status: 'Pending',
        raw_data: data,
        submitter_name: submitterName,
        submitter_email: submitterEmail,
        community_id: data.community_id === 'other' ? null : data.community_id
      }
      
      console.log('📤 Sending payload to Supabase:', payload)

      const { data: insertData, error } = await supabase.from('inbox').insert(payload).select()

      if (error) {
        console.error('❌ Supabase insert error:', error)
        throw error
      }

      console.log('✅ Submission success:', insertData)

      setMessage({ type: 'success', text: 'Thank you! Your submission has been sent for review.' })
      setLastSubmitted(data)
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🛑 Submission cancelled')
      } else {
        console.error('💥 Submission error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        setMessage({ 
          type: 'error', 
          text: `Submission Failed: ${error.message || 'Unknown error'}. Please try again.` 
        })
      }
    } finally {
      setIsSubmitting(false)
      // Small delay before clearing active work to avoid guard race conditions
      setTimeout(() => setActiveWork(null), 100)
      setAbortController(null)
    }
  }

  const handleCancelSubmission = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🛑 User clicked Cancel Submission')
    
    if (abortController) {
      abortController.abort()
    }
    
    setIsSubmitting(false)
    setActiveWork(null)
    setAbortController(null)
    setMessage({ type: 'error', text: 'Submission cancelled by user.' })
  }

  const nextStep = async () => {
    let fieldsToValidate: any[] = []
    if (activeStep === 'IDENTITY') fieldsToValidate = ['full_name', 'community_id']
    if (activeStep === 'SUBMITTER' && !authUser) {
      fieldsToValidate = ['submitterName', 'submitterEmail']
    }
    
    const isValid = await trigger(fieldsToValidate)
    if (!isValid) return

    if (activeStep === 'IDENTITY') setActiveStep('PERSONAL')
    else if (activeStep === 'PERSONAL') setActiveStep('LINEAGE')
    else if (activeStep === 'LINEAGE') setActiveStep('SUBMITTER')
  }

  const prevStep = () => {
    if (activeStep === 'PERSONAL') setActiveStep('IDENTITY')
    else if (activeStep === 'LINEAGE') setActiveStep('PERSONAL')
    else if (activeStep === 'SUBMITTER') setActiveStep('LINEAGE')
  }

  const handleAddNew = () => {
    setMessage(null)
    setLastSubmitted(null)
    reset()
    setActiveStep('IDENTITY')
  }

  if (message?.type === 'success') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-emerald-600 p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="w-20 h-20 bg-white text-emerald-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl relative z-10">
            <Check size={40} />
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-2 relative z-10">Submission Successful!</h2>
          <p className="text-emerald-50 font-medium relative z-10">Your contribution to the family heritage has been recorded.</p>
        </div>

        <div className="p-10">
          <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 mb-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Preserved Record</h4>
            <div className="space-y-4">
              <DetailRow label="Full Name" value={lastSubmitted?.full_name} />
              <DetailRow label="Gender" value={lastSubmitted?.gender} />
              <DetailRow label="Birth Place" value={lastSubmitted?.birthPlace} />
              <DetailRow label="Status" value={lastSubmitted?.isDeceased ? 'Deceased' : 'Living'} />
              <DetailRow label="Submitter" value={lastSubmitted?.submitterName} />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleAddNew}
              className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 group"
            >
              <Plus size={24} className="group-hover:rotate-90 transition-transform" />
              Add Another Member
            </button>
            <button
              onClick={() => window.location.href = '/tree'}
              className="w-full py-4 bg-white text-slate-600 border border-slate-200 rounded-[24px] font-bold hover:bg-slate-50 transition-all"
            >
              View Family Tree
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden">
      {/* HEADER & STEPPER */}
      <div className="bg-indigo-600 p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <h2 className="text-2xl font-black tracking-tight mb-6">Add Family Member</h2>
        
        <div className="flex items-center justify-between relative z-10">
          <StepIcon active={activeStep === 'IDENTITY'} completed={['PERSONAL', 'LINEAGE', 'SUBMITTER'].includes(activeStep)} icon={<User size={18} />} label="Identity" />
          <StepLine />
          <StepIcon active={activeStep === 'PERSONAL'} completed={['LINEAGE', 'SUBMITTER'].includes(activeStep)} icon={<FileText size={18} />} label="Personal" />
          <StepLine />
          <StepIcon active={activeStep === 'LINEAGE'} completed={activeStep === 'SUBMITTER'} icon={<Users size={18} />} label="Lineage" />
          <StepLine />
          <StepIcon active={activeStep === 'SUBMITTER'} completed={false} icon={<Check size={18} />} label="Finish" />
        </div>
      </div>

      <div className="p-8">
        {message && message.type === 'error' && (
          <Alert type="error" message={message.text} />
        )}

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          {activeStep === 'IDENTITY' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <SectionHeader title="Basic Identity" subtitle="Primary naming and community information" />
               
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Full Name *</label>
                 <input
                   {...register('full_name')}
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-bold placeholder:text-slate-300 transition-all"
                   placeholder="e.g. Ramesh Kumar Dewangan"
                 />
                 {errors.full_name && <p className="mt-2 text-xs text-rose-500 font-bold ml-1">{errors.full_name.message}</p>}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <InputGroup label="Preferred Display Name" {...register('preferred_display_name')} placeholder="e.g. Ramu" />
                 <InputGroup label="Native Name (Hindi)" {...register('native_name')} placeholder="e.g. रमेश देवांगन" />
               </div>

               <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                    <Globe size={18} className="text-indigo-600" />
                    <h4 className="font-black text-xs uppercase tracking-widest text-indigo-900">Community Context</h4>
                 </div>
                 
                 <div>
                   <select
                     {...register('community_id')}
                     disabled={isLoadingCommunities}
                     className={`w-full px-4 py-3 bg-white border ${errors.community_id ? 'border-rose-300 ring-1 ring-rose-100' : 'border-indigo-100'} rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-bold transition-all disabled:opacity-50`}
                   >
                     <option value="">{isLoadingCommunities ? 'Loading Communities...' : 'Select Community...'}</option>
                     {communities.map(comm => (
                       <option key={comm.id} value={comm.id}>{comm.name}</option>
                     ))}
                     <option value="other">Other...</option>
                   </select>
                   {errors.community_id && <p className="mt-2 text-xs text-rose-500 font-bold ml-1">{errors.community_id.message}</p>}
                 </div>

                 {watch('community_id') === 'other' && (
                   <div className="animate-in zoom-in-95 duration-200">
                     <input
                       {...register('community_override')}
                       className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-bold transition-all"
                       placeholder="Specify Community (e.g. Sharma)"
                     />
                   </div>
                 )}
               </div>
            </div>
          )}

          {activeStep === 'PERSONAL' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <SectionHeader title="Personal Information" subtitle="Life details and biographical summary" />
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Gender</label>
                    <select
                      {...register('gender')}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-bold transition-all"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <InputGroup label="Date of Birth" type="date" {...register('dateOfBirth')} />
               </div>

               <InputGroup label="Birth Place" {...register('birthPlace')} placeholder="e.g. Raipur, Chhattisgarh" />

               <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <input
                    type="checkbox"
                    {...register('isDeceased')}
                    className="rounded-lg text-indigo-600 focus:ring-indigo-500 h-6 w-6 border-slate-300"
                  />
                  <div>
                    <p className="text-sm font-black text-slate-800 leading-none">Deceased</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">Check if the member has passed away</p>
                  </div>
               </div>

               {watch('isDeceased') && (
                 <div className="animate-in zoom-in-95 duration-200">
                    <InputGroup label="Date of Death" type="date" {...register('dateOfDeath')} />
                 </div>
               )}

               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Bio / Story</label>
                 <textarea
                   {...register('bio')}
                   rows={4}
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-bold placeholder:text-slate-300 transition-all"
                   placeholder="Brief summary of their life, achievements, personality..."
                 />
               </div>
            </div>
          )}

          {activeStep === 'LINEAGE' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <SectionHeader title="Lineage Connections" subtitle="Map their position within the family tree" />
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <MemberLookup 
                   label="Father / Parent 1" 
                   onSelect={(id) => setValue('parent1Id', id)}
                   onClear={() => setValue('parent1Id', '')}
                   placeholder="Search ancestors..."
                 />
                 <MemberLookup 
                   label="Mother / Parent 2" 
                   onSelect={(id) => setValue('parent2Id', id)}
                   onClear={() => setValue('parent2Id', '')}
                   placeholder="Search ancestors..."
                 />
               </div>

               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                 <label className="block text-sm font-bold text-slate-700 mb-2">Lineage Side</label>
                 <div className="grid grid-cols-3 gap-3">
                    <SideButton active={watch('lineage') === 'Father'} label="Father's" onClick={() => setValue('lineage', 'Father')} />
                    <SideButton active={watch('lineage') === 'Mother'} label="Mother's" onClick={() => setValue('lineage', 'Mother')} />
                    <SideButton active={watch('lineage') === 'Both'} label="Both" onClick={() => setValue('lineage', 'Both')} />
                 </div>
               </div>
            </div>
          )}

          {activeStep === 'SUBMITTER' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <SectionHeader title="Submitter Information" subtitle="Your contact details for review follow-up" />
               
               {authUser ? (
                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                       <User size={20} />
                     </div>
                     <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Authenticated Contributor</p>
                       <p className="text-sm font-black text-slate-800 leading-none">{authUser.name}</p>
                     </div>
                   </div>
                   <p className="text-xs text-slate-500 font-medium leading-relaxed pt-2 border-t border-slate-100">
                     Your name and email will be recorded to verify the authenticity of this submission.
                   </p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Your Name *</label>
                      <input
                        {...register('submitterName')}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-bold placeholder:text-slate-300 transition-all"
                      />
                      {errors.submitterName && <p className="mt-2 text-xs text-rose-500 font-bold ml-1">{errors.submitterName.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Your Email *</label>
                      <input
                        type="email"
                        {...register('submitterEmail')}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-bold placeholder:text-slate-300 transition-all"
                      />
                      {errors.submitterEmail && <p className="mt-2 text-xs text-rose-500 font-bold ml-1">{errors.submitterEmail.message}</p>}
                    </div>
                 </div>
               )}

               <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 text-emerald-800 text-sm">
                  <div className="flex items-center gap-3 font-black uppercase tracking-widest text-[10px] mb-2">
                    <Check size={16} />
                    Ready for Review
                  </div>
                  <p className="font-medium">Once submitted, administrators will verify the data before it is merged into the global lineage map.</p>
               </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="pt-8 flex gap-4 border-t border-slate-100">
            {activeStep !== 'IDENTITY' && !isSubmitting && (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft size={20} />
                Back
              </button>
            )}
            
            {activeStep !== 'SUBMITTER' ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 group"
              >
                Next Step
                <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </button>
            ) : isSubmitting ? (
              <button
                type="button"
                onClick={(e) => handleCancelSubmission(e)}
                className="flex-[2] py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-sm hover:bg-rose-100 transition-all flex items-center justify-center gap-2 cursor-pointer relative z-50"
              >
                <div className="w-5 h-5 border-3 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                Cancel Submission
              </button>
            ) : (
              <button
                type="submit"
                className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
              >
                Submit Member
                <Check size={20} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string, subtitle: string }) {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
      <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
    </div>
  )
}

function InputGroup({ label, ...props }: any) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">{label}</label>
      <input
        {...props}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-bold placeholder:text-slate-300 transition-all"
      />
    </div>
  )
}

function StepIcon({ active, completed, icon, label }: any) {
  return (
    <div className="flex flex-col items-center gap-2 group">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${
        active 
          ? 'bg-white text-indigo-600 scale-110 shadow-xl shadow-white/20' 
          : completed 
            ? 'bg-emerald-400 text-white' 
            : 'bg-white/20 text-white/60'
      }`}>
        {completed ? <Check size={18} /> : icon}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-white' : 'text-white/40'}`}>
        {label}
      </span>
    </div>
  )
}

function StepLine() {
  return <div className="h-0.5 flex-1 bg-white/20 mx-2 mb-6 rounded-full" />
}

function SideButton({ active, label, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
        active 
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' 
          : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
      }`}
    >
      {label}
    </button>
  )
}

function DetailRow({ label, value }: { label: string, value: any }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-400 font-bold uppercase tracking-tighter">{label}</span>
      <span className="text-slate-800 font-black">{value || 'Not specified'}</span>
    </div>
  )
}
