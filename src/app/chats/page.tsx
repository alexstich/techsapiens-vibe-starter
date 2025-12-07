"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, MessageCircle } from "lucide-react"
import { Header } from "@/components/Header"
import { ErrorMessage } from "@/components/ErrorMessage"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"

interface ChatPreview {
  id: string
  name: string
  avatarUrl: string | null
  bio: string | null
  lastMessage: string
  lastMessageAt: string
  isFromMe: boolean
}

export default function ChatsPage() {
  const router = useRouter()
  const [chats, setChats] = useState<ChatPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchChats() {
      try {
        const response = await fetch("/api/chats")
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push("/auth")
            return
          }
          throw new Error("Не удалось загрузить чаты")
        }

        const data = await response.json()
        setChats(data.chats || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Что-то пошло не так")
      } finally {
        setLoading(false)
      }
    }

    fetchChats()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showBackButton backHref="/" title="Мои чаты" />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 animate-in fade-in-0 duration-300">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Загрузка чатов...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showBackButton backHref="/" title="Мои чаты" />
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

  if (chats.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showBackButton backHref="/" title="Мои чаты" />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6 text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            <div className="rounded-full bg-muted p-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Пока нет чатов</h3>
              <p className="text-muted-foreground max-w-sm">
                Найдите интересных людей в пуле и начните общение!
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-md"
            >
              Найти людей
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showBackButton backHref="/" title="Мои чаты" />
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        <div className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
          {chats.map((chat) => (
            <Link
              key={chat.id}
              href={`/chat/${chat.id}`}
              className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all hover:shadow-sm"
            >
              {/* Avatar */}
              {chat.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={chat.avatarUrl}
                  alt={chat.name}
                  className="w-12 h-12 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium shrink-0">
                  {chat.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">{chat.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(chat.lastMessageAt), {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {chat.isFromMe && <span className="text-foreground/70">Вы: </span>}
                  {chat.lastMessage}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
