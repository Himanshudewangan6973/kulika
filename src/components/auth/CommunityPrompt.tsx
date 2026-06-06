'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './AuthProvider'
import { Globe, Plus, Check, ChevronRight, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function CommunityPrompt() {
  const { user, refreshUser } = useAuth()
  const [communities, setCommunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showOther, setShowOther] = useState(false)
  const [otherName, setOtherName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function loadCommunities() {
      if (!supabase) return
      const { data, error: fetchError } = await supabase.from('communities').select('*').order('name')
      if (fetchError) {
        console.error('❌ Error fetching communities:', {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code
        })
      }
      setCommunities(data || [])
      setLoading(false)
    }
    if (user && !user.community_id) {
      loadCommunities()
    }
  }, [user, supabase])

  if (!mounted || !user || user.community_id) return null

  const handleJoin = async () => {
    if (!supabase || !user || (!selectedId && !otherName)) return
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      let finalCommunityId = selectedId

      if (showOther && otherName.trim()) {
        // Try to insert with just name first to avoid schema cache issues with newer columns
        const { data: newComm, error: commError } = await supabase
          .from('communities')
          .insert({ name: otherName })
          .select()
          .single()
        
        if (commError) {
          console.error('Community creation error:', commError)
          // Check for specific schema cache error to give better advice
          if (commError.message?.includes('schema cache')) {
            throw new Error('Database schema is updating. Please try again in 30 seconds or select an existing community.')
          }
          throw new Error(commError.message || 'Failed to create new community')
        }
        finalCommunityId = newComm.id
      }

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          community_id: finalCommunityId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (upsertError) {
        console.error('Profile upsert error:', upsertError)
        throw new Error(upsertError.message || 'Failed to update your profile')
      }

      await refreshUser()
    } catch (err: any) {
      console.error('Full error object:', err)
      setError(err.message || 'Failed to join community. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="bg-indigo-600 p-10 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
           <Globe className="mb-6 opacity-80" size={48} />
           <h2 className="text-3xl font-black tracking-tight mb-2">Identify Your Community</h2>
           <p className="text-indigo-100 font-medium">To provide a tailored experience, please select your primary community or add a new one.</p>
        </div>

        <div className="p-10 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-xs font-bold leading-tight">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {communities.map((comm) => (
                <button
                  key={comm.id}
                  disabled={isSubmitting}
                  onClick={() => { setSelectedId(comm.id); setShowOther(false); setError(null); }}
                  className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${
                    selectedId === comm.id 
                      ? 'border-indigo-600 bg-indigo-50 shadow-md' 
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="text-left">
                    <p className={`font-black ${selectedId === comm.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                      {comm.name}
                    </p>
                    {comm.description && <p className="text-xs text-slate-500 font-medium">{comm.description}</p>}
                  </div>
                  {selectedId === comm.id && <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white"><Check size={14} /></div>}
                </button>
              ))}

              <button
                disabled={isSubmitting}
                onClick={() => { setShowOther(true); setSelectedId(null); setError(null); }}
                className={`w-full flex items-center gap-4 p-5 rounded-3xl border-2 border-dashed transition-all ${
                  showOther 
                    ? 'border-indigo-600 bg-indigo-50 shadow-md' 
                    : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${showOther ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <Plus size={20} />
                </div>
                <div className="text-left">
                  <p className={`font-black ${showOther ? 'text-indigo-900' : 'text-slate-800'}`}>My community isn't listed</p>
                  <p className="text-xs text-slate-500 font-medium">Add your own community name</p>
                </div>
              </button>

              <AnimatePresence>
                {showOther && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <input
                      autoFocus
                      disabled={isSubmitting}
                      type="text"
                      placeholder="Enter community name (e.g. Sharma, Verma)"
                      value={otherName}
                      onChange={(e) => setOtherName(e.target.value)}
                      className="w-full mt-2 px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-[24px] focus:border-indigo-500 focus:ring-0 outline-none font-bold text-slate-900 transition-all disabled:opacity-50"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="p-10 pt-0">
          <button
            disabled={(!selectedId && !otherName.trim()) || isSubmitting}
            onClick={handleJoin}
            className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3 group"
          >
            {isSubmitting ? (
              <span className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                Confirm Community
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
