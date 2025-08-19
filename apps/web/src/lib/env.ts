// Клиентские переменные (доступны в браузере)
export const clientEnv = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  DEFAULT_TZ: process.env.DEFAULT_TZ || 'America/Los_Angeles',
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const

// Серверные переменные (только на сервере)
export const serverEnv = {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  INGEST_SECRET: process.env.INGEST_SECRET!,
  CRON_SECRET: process.env.CRON_SECRET!,
} as const

// Проверка клиентских переменных
Object.entries(clientEnv).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing client environment variable: ${key}`)
  }
})

// Проверка серверных переменных только на сервере
if (typeof window === 'undefined') {
  Object.entries(serverEnv).forEach(([key, value]) => {
    if (!value) {
      throw new Error(`Missing server environment variable: ${key}`)
    }
  })
}

// Проверка безопасности - SERVICE_ROLE_KEY не должен быть доступен на клиенте
if (typeof window !== 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ SERVICE_ROLE_KEY is exposed to client! This is a security risk.')
}

// Экспорт типов
export type ClientEnv = typeof clientEnv
export type ServerEnv = typeof serverEnv
