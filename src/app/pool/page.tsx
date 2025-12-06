"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Header } from "@/components/Header"
import { PoolCanvas } from "@/components/PoolCanvas"
import type { PoolUser } from "@/types"

export default function PoolPage() {
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
          title={query ? `Searching: ${query}` : undefined} 
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-muted-foreground">Searching the pool...</p>
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
          title={query ? `Searching: ${query}` : undefined} 
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-destructive">{error}</p>
            <button 
              onClick={() => router.push("/")}
              className="text-blue-500 hover:underline"
            >
              Go back home
            </button>
          </div>
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
          title={query ? `Searching: ${query}` : undefined} 
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-muted-foreground">No one found matching your search.</p>
            <button 
              onClick={() => router.push("/")}
              className="text-blue-500 hover:underline"
            >
              Try a different search
            </button>
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
        title={`Searching: ${query}`} 
      />
      <PoolCanvas users={users} />
    </div>
  )
}

