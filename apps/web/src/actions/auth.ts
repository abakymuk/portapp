'use server'

import { createClient } from '@/lib/supabase/server'

export async function createUserProfile(userId: string, firstName?: string, lastName?: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        first_name: firstName || null,
        last_name: lastName || null,
      })

    if (error) {
      console.error('Error creating user profile:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error creating user profile:', error)
    return { success: false, error: 'Failed to create user profile' }
  }
}
