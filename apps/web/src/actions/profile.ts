'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'

interface ProfileData {
  first_name: string
  last_name: string
  phone: string
  position: string
  timezone: string
  language: string
}

export async function updateProfile(data: ProfileData) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return { error: 'Пользователь не авторизован' }
    }

    const supabase = await createClient()

    // Обновляем профиль
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        clerk_user_id: userId,
        first_name: data.first_name || null,
        last_name: data.last_name || null,
        phone: data.phone || null,
        position: data.position || null,
        timezone: data.timezone,
        language: data.language,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error updating profile:', error)
      return { error: 'Ошибка при обновлении профиля' }
    }

    revalidatePath('/profile')
    return { success: true }
  } catch (error) {
    console.error('Error in updateProfile:', error)
    return { error: 'Произошла ошибка при обновлении профиля' }
  }
}
