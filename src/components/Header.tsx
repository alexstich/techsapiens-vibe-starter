"use client"

import Link from "next/link"
import { Waves, Home, User, LogOut, ArrowLeft } from "lucide-react"
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
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left side: Back button or Logo */}
      <div className="flex items-center gap-4">
        {showBackButton ? (
          <Link href={backHref}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        ) : (
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-foreground hover:opacity-80 transition-opacity">
            <Waves className="h-5 w-5 text-blue-500" />
            <span>The Pool</span>
          </Link>
        )}

        {/* Title for Pool/Chat pages */}
        {title && (
          <span className="text-muted-foreground">
            {title}
          </span>
        )}
      </div>

      {/* Right side: Navigation + Logout */}
      <div className="flex items-center gap-1">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        </Link>
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={signOut}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  )
}

