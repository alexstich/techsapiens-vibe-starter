"use client"

import { MessageList } from "./MessageList"
import { MessageInput } from "./MessageInput"
import type { ConversationMessage } from "@/types"

interface ChatWindowProps {
  messages: ConversationMessage[]
  otherUser: { id: string; name: string }
  onSend: (content: string) => Promise<void>
  onRefresh: () => void
  loading: boolean
}

export function ChatWindow({
  messages,
  onSend,
  loading,
}: ChatWindowProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <MessageList messages={messages} />
      <MessageInput onSend={onSend} disabled={loading} />
    </div>
  )
}

