export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  INGEST_SECRET: process.env.INGEST_SECRET!,
  CRON_SECRET: process.env.CRON_SECRET!,
  DEFAULT_TZ: process.env.DEFAULT_TZ || 'America/Los_Angeles',
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const

// Проверка обязательных переменных
Object.entries(env).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`)
  }
})

// Проверка безопасности - SERVICE_ROLE_KEY не должен быть доступен на клиенте
if (typeof window !== 'undefined' && env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ SERVICE_ROLE_KEY is exposed to client! This is a security risk.')
}

// Экспорт типов
export type Env = typeof env
