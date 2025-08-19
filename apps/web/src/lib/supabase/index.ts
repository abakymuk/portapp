// Экспорт клиентов
export { createClient } from './browser'
export { createClient as createServerClient } from './server'

// Экспорт утилит
export { getCurrentUser, getCurrentUserServer, getOrgId } from './utils'

// Экспорт типов
export type { SupabaseClient } from './browser'
export type { SupabaseServerClient } from './server'
