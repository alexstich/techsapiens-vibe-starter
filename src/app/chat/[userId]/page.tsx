"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Loader2, RefreshCw, ChevronDown, ChevronUp, MessageCircle, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Header } from "@/components/Header"
import { ChatWindow } from "@/components/ChatWindow"
import { ErrorMessage } from "@/components/ErrorMessage"
import { Button } from "@/components/ui/button"
import type { ConversationMessage } from "@/types"

interface ChatUserProfile {
  id: string
  name: string
  bio: string | null
  skills: string[] | null
  telegram: string | null
  linkedin: string | null
  can_help: string | null
  looking_for: string[] | null
  avatar_url: string | null
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = params.userId as string
  
  // Сохраняем query параметр пула для навигации назад
  const poolQuery = searchParams.get("q")
  const backUrl = poolQuery ? `/pool?q=${encodeURIComponent(poolQuery)}` : "/pool"

  const supabase = createClient()

  const [otherUser, setOtherUser] = useState<ChatUserProfile | null>(null)
  const [showProfile, setShowProfile] = useState(true)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch other user's profile
  const fetchOtherUser = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, bio, skills, telegram, linkedin, can_help, looking_for, avatar_url")
      .eq("id", userId)
      .single()

    if (error) {
      setError("Пользователь не найден")
      return null
    }

    return data as ChatUserProfile
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
        <Header showBackButton backHref={backUrl} />
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
        <Header showBackButton backHref={backUrl} />
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
      {/* Custom header with user profile */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Main header row */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(backUrl)}
              className="gap-1 px-2"
            >
              ← Назад
            </Button>
            <div className="flex items-center gap-2">
              {otherUser.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={otherUser.avatar_url}
                  alt={otherUser.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                  {otherUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-medium text-sm">{otherUser.name}</span>
                {otherUser.bio && (
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {otherUser.bio}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProfile(!showProfile)}
              className="gap-1 text-xs"
            >
              {showProfile ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Профиль
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        
        {/* Expandable profile section */}
        {showProfile && (
          <div className="px-4 pb-3 border-t border-border/50 bg-muted/30">
            <div className="pt-3 space-y-2">
              {/* Bio */}
              {otherUser.bio ? (
                <p className="text-sm text-foreground">{otherUser.bio}</p>
              ) : null}
              
              {/* Skills */}
              {otherUser.skills && otherUser.skills.length > 0 ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Навыки:</p>
                  <div className="flex flex-wrap gap-1">
                    {otherUser.skills.slice(0, 8).map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {otherUser.skills.length > 8 && (
                      <span className="px-2 py-0.5 text-xs text-muted-foreground">
                        +{otherUser.skills.length - 8}
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
              
              {/* Looking for */}
              {otherUser.looking_for && otherUser.looking_for.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground font-medium">Ищет:</span>{" "}
                  {otherUser.looking_for.join(", ")}
                </p>
              ) : null}
              
              {/* Can help */}
              {otherUser.can_help ? (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  <span className="text-foreground font-medium">Может помочь:</span>{" "}
                  {otherUser.can_help}
                </p>
              ) : null}
              
              {/* Contact links */}
              {(otherUser.telegram || otherUser.linkedin) ? (
                <div className="flex gap-3 pt-1">
                  {otherUser.telegram && (
                    <a
                      href={`https://t.me/${otherUser.telegram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <MessageCircle className="h-3 w-3" />
                      Telegram
                    </a>
                  )}
                  {otherUser.linkedin && (
                    <a
                      href={otherUser.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      LinkedIn
                    </a>
                  )}
                </div>
              ) : null}
              
              {/* Empty state when no profile data */}
              {!otherUser.bio && 
               (!otherUser.skills || otherUser.skills.length === 0) && 
               (!otherUser.looking_for || otherUser.looking_for.length === 0) && 
               !otherUser.can_help && 
               !otherUser.telegram && 
               !otherUser.linkedin && (
                <p className="text-xs text-muted-foreground italic">
                  Профиль ещё не заполнен
                </p>
              )}
            </div>
          </div>
        )}
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

