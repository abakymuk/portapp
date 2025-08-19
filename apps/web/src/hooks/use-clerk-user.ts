'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'

interface UserProfile {
  id: string
  clerk_user_id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  position: string | null
  avatar_url: string | null
  timezone: string
  language: string
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export function useClerkUser() {
  const { user, isLoaded } = useUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!isLoaded) return

    if (user) {
      const loadProfile = async () => {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setProfile(profileData)
        setLoading(false)
      }

      loadProfile()
    } else {
      setProfile(null)
      setLoading(false)
    }
  }, [user, isLoaded, supabase])

  return { user, profile, loading, isLoaded }
}
