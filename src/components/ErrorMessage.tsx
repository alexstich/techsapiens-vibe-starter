"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorMessage({
  title = "Произошла ошибка",
  message,
  onRetry,
  retryLabel = "Попробовать снова",
}: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <div className="rounded-full bg-destructive/10 p-3">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="gap-2 mt-2 transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <RefreshCw className="h-4 w-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  )
}

