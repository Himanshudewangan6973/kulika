'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface User {
  id: string
  email: string
  name: string
  community_id?: string
  community_name?: string
  user_metadata?: any
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUserProfile = async (sessionUser: any) => {
    if (!supabase) return null
    
    const metadata = sessionUser.user_metadata
    const rawName = metadata?.full_name || metadata?.name || sessionUser.email || 'Member'
    const displayName = rawName.includes('@') ? rawName.split('@')[0] : rawName

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('community_id, communities(name)')
        .eq('id', sessionUser.id)
        .single()

      return {
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: displayName,
        community_id: profile?.community_id,
        community_name: (profile as any)?.communities?.name,
        user_metadata: metadata,
      }
    } catch (error) {
      console.warn('Profile fetch error:', error)
      return {
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: displayName,
        user_metadata: metadata,
      }
    }
  }

  const refreshUser = async () => {
    if (!supabase) return
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const fullUser = await fetchUserProfile(session.user)
      setUser(fullUser)
      // Also refresh family spaces to update onboarding state
      try {
        const { useFamilySpaceStore } = await import('@/store/familySpaceStore')
        await useFamilySpaceStore.getState().loadMyFamilySpaces()
      } catch (e) {
        console.warn('Could not refresh family spaces:', e)
      }
    } else {
      setUser(null)
    }
  }

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    // Check current session
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          const fullUser = await fetchUserProfile(session.user)
          setUser(fullUser)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      if (session?.user) {
        const fullUser = await fetchUserProfile(session.user)
        setUser(fullUser)
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const logout = async () => {
    if (!supabase) return

    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout error:', error)
    } else {
      setUser(null)
      router.push('/')
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
