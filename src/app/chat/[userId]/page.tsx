"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Header } from "@/components/Header"
import { ChatWindow } from "@/components/ChatWindow"
import { ErrorMessage } from "@/components/ErrorMessage"
import { Button } from "@/components/ui/button"
import type { ConversationMessage } from "@/types"

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string

  const supabase = createClient()

  const [otherUser, setOtherUser] = useState<{ id: string; name: string } | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch other user's profile
  const fetchOtherUser = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("id", userId)
      .single()

    if (error) {
      setError("Пользователь не найден")
      return null
    }

    return data
  }, [supabase, userId])

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    const response = await fetch(`/api/messages?userId=${userId}`)

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || "Failed to fetch messages")
    }

    const data = await response.json()
    return data.messages as ConversationMessage[]
  }, [userId])

  // Initial load
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)

      try {
        // Check auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth")
          return
        }

        // Can't chat with yourself
        if (user.id === userId) {
          router.push("/")
          return
        }

        // Fetch other user and messages in parallel
        const [userData, messagesData] = await Promise.all([
          fetchOtherUser(),
          fetchMessages(),
        ])

        if (!userData) return

        setOtherUser(userData)
        setMessages(messagesData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase, userId, router, fetchOtherUser, fetchMessages])

  // Refresh messages
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const messagesData = await fetchMessages()
      setMessages(messagesData)
    } catch (err) {
      console.error("Failed to refresh messages:", err)
    } finally {
      setRefreshing(false)
    }
  }

  // Send message
  const handleSend = async (content: string) => {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receiverId: userId,
        content,
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || "Failed to send message")
    }

    // Refresh messages after sending
    await handleRefresh()
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showBackButton backHref="/pool" />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-muted-foreground">Загрузка чата...</p>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error || !otherUser) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showBackButton backHref="/pool" />
        <main className="flex-1 flex items-center justify-center">
          <ErrorMessage
            message={error || "Пользователь не найден"}
            onRetry={() => router.push("/")}
            retryLabel="На главную"
          />
        </main>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Custom header with refresh button */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/pool")}
            className="gap-2"
          >
            ← Назад
          </Button>
          <span className="font-medium">Чат с {otherUser.name}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </header>

      <ChatWindow
        messages={messages}
        otherUser={otherUser}
        onSend={handleSend}
        onRefresh={handleRefresh}
        loading={refreshing}
      />
    </div>
  )
}

