"use client"

import type { ConversationMessage } from "@/types"
import type { CSSProperties } from "react"

interface MessageBubbleProps {
  message: ConversationMessage
  style?: CSSProperties
}

export function MessageBubble({ message, style }: MessageBubbleProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div
      className={`flex animate-in fade-in-0 duration-200 ${
        message.is_mine 
          ? "justify-end slide-in-from-right-4" 
          : "justify-start slide-in-from-left-4"
      }`}
      style={style}
    >
      <div
        className={`max-w-[80%] sm:max-w-[70%] px-4 py-2 transition-all ${
          message.is_mine
            ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
            : "bg-muted text-foreground rounded-2xl rounded-bl-md"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={`text-xs mt-1 ${
            message.is_mine ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}

