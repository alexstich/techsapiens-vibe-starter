"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Header } from "@/components/Header"
import { PoolCanvas } from "@/components/PoolCanvas"
import { ErrorMessage } from "@/components/ErrorMessage"
import { Button } from "@/components/ui/button"
import type { PoolUser } from "@/types"

function PoolContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("q")

  const [users, setUsers] = useState<PoolUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If no query, redirect to home
    if (!query) {
      router.push("/")
      return
    }

    const fetchUsers = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        
        if (!response.ok) {
          throw new Error("Failed to search users")
        }

        const data = await response.json()
        setUsers(data.users || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [query, router])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header 
          showBackButton 
          backHref="/" 
          title={query ? `Поиск: ${query}` : undefined} 
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 animate-in fade-in-0 duration-300">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Ищем людей в пуле...</p>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header 
          showBackButton 
          backHref="/" 
          title={query ? `Поиск: ${query}` : undefined} 
        />
        <main className="flex-1 flex items-center justify-center">
          <ErrorMessage
            message={error}
            onRetry={() => window.location.reload()}
            retryLabel="Попробовать снова"
          />
        </main>
      </div>
    )
  }

  // Empty results
  if (users.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header 
          showBackButton 
          backHref="/" 
          title={query ? `Поиск: ${query}` : undefined} 
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6 text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            <div className="rounded-full bg-muted p-4">
              <span className="text-4xl">🔍</span>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Никого не найдено</h3>
              <p className="text-muted-foreground max-w-sm">
                По вашему запросу нет совпадений. Попробуйте другой поиск.
              </p>
            </div>
            <Button 
              onClick={() => router.push("/")}
              className="transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              Новый поиск
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Results
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        showBackButton 
        backHref="/" 
        title={`Поиск: ${query}`} 
      />
      <PoolCanvas users={users} />
    </div>
  )
}

function PoolLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showBackButton backHref="/" />
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-in fade-in-0 duration-300">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </main>
    </div>
  )
}

export default function PoolPage() {
  return (
    <Suspense fallback={<PoolLoading />}>
      <PoolContent />
    </Suspense>
  )
}

