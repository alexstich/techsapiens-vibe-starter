"use client"

import { useEffect, useRef } from "react"
import { MessageCircle } from "lucide-react"
import { MessageBubble } from "./MessageBubble"
import type { ConversationMessage } from "@/types"

interface MessageListProps {
  messages: ConversationMessage[]
}

export function MessageList({ messages }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center animate-in fade-in-0 duration-300">
        <div className="flex flex-col items-center gap-4 text-center p-6">
          <div className="rounded-full bg-muted p-4">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-semibold">Нет сообщений</h3>
            <p className="text-sm text-muted-foreground">
              Начните диалог — напишите привет! 👋
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-3"
    >
      {messages.map((message, index) => (
        <MessageBubble 
          key={message.id} 
          message={message} 
          style={{ animationDelay: `${index * 50}ms` }}
        />
      ))}
    </div>
  )
}

