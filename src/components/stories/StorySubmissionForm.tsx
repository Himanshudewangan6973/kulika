'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTreeStore } from '@/components/tree/store'

const storySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  story_text: z.string().min(50, 'Story must be at least 50 characters'),
  story_type: z.enum(['Life Event', 'Tradition', 'Lesson', 'Hardship', 'Achievement', 'Humor', 'Migration', 'Other']),
  storyteller: z.string().min(2, 'Storyteller name is required'),
  location: z.string().optional(),
  event_date: z.string().optional(),
})

type StoryFormValues = z.infer<typeof storySchema>

export default function StorySubmissionForm() {
  const setActiveWork = useTreeStore(state => state.setActiveWork)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    // Navigation Guard for browser refresh/tab close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSubmitting || isTranscribing) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    if (isSubmitting || isTranscribing) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isSubmitting, isTranscribing])

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<StoryFormValues>({
    resolver: zodResolver(storySchema),
    defaultValues: { story_type: 'Life Event' }
  })

  const storyText = watch('story_text')

  const startRecording = async () => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      alert('Microphone access requires a secure context (HTTPS or localhost).');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        transcribeAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err: any) {
      console.error('Error accessing microphone:', err)
      alert(`Microphone Error: ${err.message}. Please ensure permissions are enabled and you are using a standard browser.`)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      // Stop all tracks to release microphone
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  const transcribeAudio = async (blob: Blob) => {
    const controller = new AbortController()
    setAbortController(controller)
    setIsTranscribing(true)
    setActiveWork({ 
      id: 'story-transcribe', 
      type: 'UPLOAD', 
      message: 'Converting your voice into a digital narrative...' 
    })

    try {
      const formData = new FormData()
      formData.append('file', blob, 'recording.webm')

      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })

      if (!response.ok) throw new Error('Transcription failed')

      const result = await response.json()
      if (result.success) {
        const currentText = storyText || ''
        setValue('story_text', currentText + (currentText ? '\n\n' : '') + result.text)
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Transcription cancelled')
      } else {
        console.error('Transcription error:', err)
        alert('AI transcription failed, but you can still type your story.')
      }
    } finally {
      setIsTranscribing(false)
      setActiveWork(null)
      setAbortController(null)
    }
  }

  const onSubmit = async (data: StoryFormValues) => {
    setIsSubmitting(true)
    setActiveWork({ 
      id: 'story-submit', 
      type: 'SUBMISSION', 
      message: `Preserving "${data.title}" in the family archive...` 
    })

    try {
      // In production, would save to Supabase here
      await new Promise(resolve => setTimeout(resolve, 1500))
      setSubmitted(true)
      reset()
      setAudioUrl(null)
    } catch (error) {
      console.error('Story submission error:', error)
    } finally {
      setIsSubmitting(false)
      setActiveWork(null)
    }
  }

  const handleCancelWork = () => {
    if (abortController) {
      abortController.abort()
    }
    setIsSubmitting(false)
    setIsTranscribing(false)
    setActiveWork(null)
    setAbortController(null)
  }

  if (submitted) {
    return (
      <div className="bg-green-50 p-8 rounded-2xl border border-green-200 text-center">
        <span className="text-4xl">📜</span>
        <h3 className="text-xl font-bold text-green-800 mt-4">Story Submitted!</h3>
        <p className="text-green-600 mt-2">Your family narrative has been sent for preservation and review.</p>
        <button onClick={() => setSubmitted(false)} className="mt-6 text-primary font-bold hover:underline">Share another story</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Audio Assistant Widget */}
      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all ${
            isRecording ? 'bg-red-500 animate-pulse' : 
            isTranscribing ? 'bg-indigo-500' : 'bg-primary'
          }`}>
            {isRecording ? '⏹️' : isTranscribing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : '🎙️'}
          </div>
          <div>
            <h4 className="font-bold text-blue-900">
              {isTranscribing ? 'AI Narrative Processing' : 'Voice Narrative Assistant'}
            </h4>
            <p className="text-xs text-blue-700">
              {isTranscribing ? 'Please stay on this page while we finalize the transcription.' : 'Record your story and let AI transcribe it automatically.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={isTranscribing}
          onClick={isRecording ? stopRecording : startRecording}
          className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${
            isRecording ? 'bg-red-500 text-white' : 
            isTranscribing ? 'bg-slate-200 text-slate-400 cursor-not-allowed' :
            'bg-white text-primary border border-blue-200 hover:bg-blue-100'
          }`}
        >
          {isRecording ? 'Stop Recording' : 'Start Speaking'}
        </button>
      </div>

      {/* 2. Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">Story Title *</label>
            <input
              {...register('title')}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white transition-all"
              placeholder="e.g. The Great Migration to Raipur"
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
            <select
              {...register('story_type')}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white transition-all"
            >
              <option value="Life Event">Life Event</option>
              <option value="Tradition">Tradition</option>
              <option value="Lesson">Lesson</option>
              <option value="Hardship">Hardship</option>
              <option value="Achievement">Achievement</option>
              <option value="Humor">Humor</option>
              <option value="Migration">Migration</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Storyteller Name *</label>
            <input
              {...register('storyteller')}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white transition-all"
              placeholder="Who is telling this story?"
            />
            {errors.storyteller && <p className="mt-1 text-xs text-red-500">{errors.storyteller.message}</p>}
          </div>
        </div>

        <div className="relative">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            The Narrative * (Min 50 chars)
            {isTranscribing && <span className="ml-2 text-primary animate-pulse italic text-xs font-normal">AI is transcribing your voice...</span>}
          </label>
          <textarea
            {...register('story_text')}
            rows={8}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white transition-all"
            placeholder="Begin your story here or use the voice assistant above..."
          />
          {errors.story_text && <p className="mt-1 text-xs text-red-500">{errors.story_text.message}</p>}
        </div>

        {audioUrl && (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-4">
            <span className="text-xl">🎙️</span>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Attached Voice Recording</p>
              <audio src={audioUrl} controls className="h-8 w-full" />
            </div>
            <button type="button" onClick={() => setAudioUrl(null)} className="text-gray-400 hover:text-red-500">×</button>
          </div>
        )}

        <button
          type={isSubmitting ? 'button' : 'submit'}
          onClick={isSubmitting ? handleCancelWork : undefined}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
            isSubmitting ? 'bg-rose-500' : 'bg-primary hover:bg-primary-dark transform hover:-translate-y-0.5'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              Cancel Preservation
            </div>
          ) : 'Preserve Story'}
        </button>
      </form>
    </div>
  )
}
