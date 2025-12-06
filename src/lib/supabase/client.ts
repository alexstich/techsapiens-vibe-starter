import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * Создает Supabase клиент для использования в браузере (Client Components)
 * Используется в компонентах с 'use client' директивой
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

