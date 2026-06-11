import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../config/supabase'

export type UserRole = 'owner' | 'cashier' | 'staff_gudang'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: any | null // supports Supabase User or Mock User
  profile: UserProfile | null
  loading: boolean
  role: UserRole | null
  isDemo: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  enableDemoMode: (role: UserRole) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const MOCK_PROFILES: Record<UserRole, UserProfile> = {
  owner: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'owner@smartpos.com',
    full_name: 'Pak Budi (Owner)',
    role: 'owner',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  cashier: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'cashier@smartpos.com',
    full_name: 'Siti (Cashier)',
    role: 'cashier',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  staff_gudang: {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'gudang@smartpos.com',
    full_name: 'Anto (Gudang Staff)',
    role: 'staff_gudang',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error.message)
        return null
      } else {
        return data as UserProfile
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err)
      return null
    }
  }

  useEffect(() => {
    // 1. Check if we have a demo session stored in localStorage
    const savedDemoRole = localStorage.getItem('smartpos_demo_role')
    if (savedDemoRole && (savedDemoRole === 'owner' || savedDemoRole === 'cashier' || savedDemoRole === 'staff_gudang')) {
      const mockProf = MOCK_PROFILES[savedDemoRole as UserRole]
      setUser({ id: mockProf.id, email: mockProf.email })
      setProfile(mockProf)
      setIsDemo(true)
      setLoading(false)
      return
    }

    // 2. Otherwise, check Supabase auth session
    const checkSupabaseSession = async () => {
      try {
        const isPlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder')
        if (isPlaceholder) {
          setLoading(false)
          return
        }

        const { data: { session } } = await supabase.auth.getSession()
        const currentUser = session?.user ?? null
        
        if (currentUser) {
          setUser(currentUser)
          const prof = await fetchProfile(currentUser.id)
          setProfile(prof)
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (err) {
        console.error('Failed to check Supabase auth session:', err)
      } finally {
        setLoading(false)
      }
    }

    checkSupabaseSession()

    // 3. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // If we are currently in demo mode, ignore Supabase changes
        if (localStorage.getItem('smartpos_demo_role')) return

        const currentUser = session?.user ?? null
        setUser(currentUser)
        
        if (currentUser) {
          const prof = await fetchProfile(currentUser.id)
          setProfile(prof)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    // Check if credentials match demo credentials or if Supabase is placeholder
    const isPlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder')
    
    // Check demo credentials ONLY if Supabase is a placeholder (unconfigured)
    if (isPlaceholder) {
      if (password === 'password123') {
        if (email === 'owner@smartpos.com') {
          enableDemoMode('owner')
          return { error: null }
        }
        if (email === 'cashier@smartpos.com') {
          enableDemoMode('cashier')
          return { error: null }
        }
        if (email === 'gudang@smartpos.com') {
          enableDemoMode('staff_gudang')
          return { error: null }
        }
      }
      return { 
        error: new Error('Supabase is not configured. Use the quick demo buttons or seeded demo credentials (owner@smartpos.com, cashier@smartpos.com, or gudang@smartpos.com with password password123).') 
      }
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      setLoading(false)
    }
    return { error }
  }

  const signOut = async () => {
    setLoading(true)
    if (isDemo) {
      localStorage.removeItem('smartpos_demo_role')
      setIsDemo(false)
      setUser(null)
      setProfile(null)
      setLoading(false)
      return { error: null }
    }

    const { error } = await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setLoading(false)
    return { error }
  }

  const enableDemoMode = (role: UserRole) => {
    const mockProf = MOCK_PROFILES[role]
    localStorage.setItem('smartpos_demo_role', role)
    setUser({ id: mockProf.id, email: mockProf.email })
    setProfile(mockProf)
    setIsDemo(true)
    setLoading(false)
  }

  const value = {
    user,
    profile,
    loading,
    role: profile?.role ?? null,
    isDemo,
    signIn,
    signOut,
    enableDemoMode,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
