"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface MessageInputProps {
  onSend: (content: string) => Promise<void>
  disabled: boolean
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState("")
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus input on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSend = async () => {
    const trimmedContent = content.trim()
    if (!trimmedContent || sending || disabled) return

    setSending(true)
    try {
      await onSend(trimmedContent)
      setContent("")
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift sends the message
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isDisabled = disabled || sending || !content.trim()

  return (
    <div className="border-t border-border p-3 sm:p-4 bg-background">
      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Напишите сообщение..."
          disabled={disabled || sending}
          className="min-h-[44px] max-h-[120px] resize-none text-base"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={isDisabled}
          size="icon"
          className="h-11 w-11 shrink-0 touch-target transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

