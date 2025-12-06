"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Waves } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/Header"
import { useAuth } from "@/hooks/useAuth"

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [query, setQuery] = useState("")
  const [error, setError] = useState("")

  const handleDiveIn = () => {
    if (!query.trim()) {
      setError("Please enter who you're looking for")
      return
    }
    setError("")
    router.push(`/pool?q=${encodeURIComponent(query.trim())}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleDiveIn()
    }
  }

  // Редирект на auth если не авторизован
  if (!loading && !user) {
    router.push("/auth")
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Main Content - Centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md flex flex-col items-center gap-8 text-center">
          {/* Icon */}
          <div className="relative">
            <Waves className="h-16 w-16 text-blue-500" />
          </div>
          
          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              The Pool
            </h1>
            <p className="text-lg text-muted-foreground">
              Find the right people to talk to
            </p>
          </div>

          {/* Search */}
          <div className="w-full space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Who are you looking for?"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  if (error) setError("")
                }}
                onKeyDown={handleKeyDown}
                className="h-12 text-base px-4 bg-secondary/50 border-border focus:border-blue-500"
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            {/* Dive In Button */}
            <Button 
              onClick={handleDiveIn}
              size="lg"
              className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/25"
            >
              <Waves className="h-5 w-5 mr-2" />
              Dive In
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
