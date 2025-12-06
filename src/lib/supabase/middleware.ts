import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './types'

// Роуты, требующие авторизации
const protectedRoutes = ['/', '/profile', '/pool']
const protectedPrefixes = ['/chat']

// Публичные роуты
const publicRoutes = ['/auth']

function isProtectedRoute(pathname: string): boolean {
  // Точное совпадение с защищёнными роутами
  if (protectedRoutes.includes(pathname)) {
    return true
  }
  
  // Проверка префиксов (например, /chat/*)
  return protectedPrefixes.some(prefix => pathname.startsWith(prefix))
}

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.includes(pathname)
}

/**
 * Обновляет сессию пользователя в middleware
 * Защищает роуты и перенаправляет неавторизованных пользователей
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ВАЖНО: Не удаляйте этот вызов getUser!
  // Он необходим для обновления сессии если токен истёк.
  // Простое обращение к supabase.auth.getSession() не обновляет сессию в браузере.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Если пользователь не авторизован и пытается попасть на защищённый роут
  if (!user && isProtectedRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth'
    return NextResponse.redirect(redirectUrl)
  }

  // Если пользователь авторизован и находится на странице авторизации
  if (user && isPublicRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

