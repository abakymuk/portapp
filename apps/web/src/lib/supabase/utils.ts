import { createClient } from './browser'
import { createClient as createServerClient } from './server'

// Утилита для получения клиента в зависимости от окружения
export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    // В серверном окружении нужно использовать async функцию
    throw new Error('Use createServerClient() for server-side operations')
  }
  return createClient()
}

// Утилита для проверки аутентификации
export async function getCurrentUser() {
  const supabase = getSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  
  return user
}

// Утилита для получения org_id из JWT
export function getOrgId(user: any): string | null {
  return user?.user_metadata?.org_id || null
}

// Утилита для проверки аутентификации на сервере
export async function getCurrentUserServer() {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting user on server:', error)
    return null
  }
  
  return user
}
