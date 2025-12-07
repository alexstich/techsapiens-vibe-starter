"use client"

import Link from "next/link"
import { Waves, Home, User, LogOut, ArrowLeft, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"

interface HeaderProps {
  showBackButton?: boolean
  backHref?: string
  title?: string
}

export function Header({ showBackButton, backHref = "/", title }: HeaderProps) {
  const { signOut } = useAuth()

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left side: Back button or Logo */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        {showBackButton ? (
          <Link href={backHref}>
            <Button variant="ghost" size="sm" className="gap-2 h-10 px-3 touch-target">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Назад</span>
            </Button>
          </Link>
        ) : (
          <Link href="/" className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-foreground hover:opacity-80 transition-opacity">
            <Waves className="h-5 w-5 text-blue-500 shrink-0" />
            <span className="hidden xs:inline">The Pool</span>
          </Link>
        )}

        {/* Title for Pool/Chat pages */}
        {title && (
          <span className="text-sm sm:text-base text-muted-foreground truncate">
            {title}
          </span>
        )}
      </div>

      {/* Right side: Navigation + Logout */}
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 h-10 w-10 sm:w-auto px-2 sm:px-3 touch-target">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Главная</span>
          </Button>
        </Link>
        <Link href="/chats">
          <Button variant="ghost" size="sm" className="gap-2 h-10 w-10 sm:w-auto px-2 sm:px-3 touch-target">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Чаты</span>
          </Button>
        </Link>
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="gap-2 h-10 w-10 sm:w-auto px-2 sm:px-3 touch-target">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Профиль</span>
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={signOut}
          className="gap-2 h-10 w-10 sm:w-auto px-2 sm:px-3 text-muted-foreground hover:text-foreground touch-target"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Выйти</span>
        </Button>
      </div>
    </header>
  )
}

