"use client"

import { useMemo, useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { PoolUser, Position } from "@/types"
import { distributeInGroups } from "@/lib/pool-utils"
import { PoolGroup, GROUP_SIZE } from "./PoolGroup"
import { BubbleTooltip } from "./BubbleTooltip"
import { useToast } from "@/hooks/use-toast"

interface PoolCanvasProps {
  users: PoolUser[]
}

const GROUP_COUNT = 4
const GAP = 24 // Gap between groups in pixels

// Hook to detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return isMobile
}

export function PoolCanvas({ users }: PoolCanvasProps) {
  const router = useRouter()
  const { toast } = useToast()
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  
  const [hoveredUser, setHoveredUser] = useState<PoolUser | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<Position | null>(null)
  const [mousePosition, setMousePosition] = useState<Position | null>(null)
  const [tappedUser, setTappedUser] = useState<PoolUser | null>(null)

  // Split users into 4 groups
  const groups = useMemo(() => {
    return distributeInGroups(users, GROUP_COUNT)
  }, [users])

  // Track mouse movement for proximity effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("mousemove", handleMouseMove)
      return () => container.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  const handleHover = useCallback((user: PoolUser | null, bubblePosition?: Position) => {
    setHoveredUser(user)
    if (user && bubblePosition && containerRef.current) {
      // Convert bubble position to screen coordinates for tooltip
      const rect = containerRef.current.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left + bubblePosition.x,
        y: rect.top + bubblePosition.y,
      })
    } else {
      setTooltipPosition(null)
    }
  }, [])

  const handleClick = useCallback((user: PoolUser) => {
    // On mobile: first tap shows tooltip, second tap navigates
    if (isMobile) {
      if (tappedUser?.id === user.id) {
        // Second tap - navigate
        if (user.isReady) {
          router.push(`/chat/${user.id}`)
        } else {
          toast({
            title: "Пользователь недоступен",
            description: "Этот человек сейчас занят",
            variant: "destructive",
          })
        }
        setTappedUser(null)
      } else {
        // First tap - show tooltip
        setTappedUser(user)
        setHoveredUser(user)
      }
      return
    }

    // Desktop: direct navigation
    if (user.isReady) {
      router.push(`/chat/${user.id}`)
    } else {
      toast({
        title: "Пользователь недоступен",
        description: "Этот человек сейчас занят",
        variant: "destructive",
      })
    }
  }, [router, toast, isMobile, tappedUser])

  // Calculate grid offset for centering
  const gridWidth = GROUP_SIZE * 2 + GAP
  const gridHeight = GROUP_SIZE * 2 + GAP

  // Clear tapped user when clicking outside
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      setTappedUser(null)
      setHoveredUser(null)
    }
  }, [])

  // Mobile: single column list view
  if (isMobile) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in-0 duration-300">
        {/* Mobile list view */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {users.map((user, index) => (
            <button
              key={user.id}
              onClick={() => handleClick(user)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 
                ${user.isReady 
                  ? "bg-card hover:bg-accent active:scale-[0.98]" 
                  : "bg-muted/50 opacity-60"
                }
                ${tappedUser?.id === user.id ? "ring-2 ring-primary" : ""}
                animate-in fade-in-0 slide-in-from-bottom-2
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Avatar circle */}
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shrink-0"
                style={{ 
                  backgroundColor: user.isReady 
                    ? `hsl(${120 + (1 - user.score) * 180}, 70%, 50%)` 
                    : "hsl(0, 0%, 40%)" 
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              
              {/* User info */}
              <div className="flex-1 text-left min-w-0">
                <div className="font-medium truncate">{user.name}</div>
                {user.bio && (
                  <div className="text-sm text-muted-foreground truncate">
                    {user.bio}
                  </div>
                )}
              </div>

              {/* Status indicator */}
              <div className={`w-3 h-3 rounded-full shrink-0 ${
                user.isReady ? "bg-green-500" : "bg-muted-foreground"
              }`} />
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 py-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span>Доступен</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />
            <span>Занят</span>
          </div>
        </div>
      </div>
    )
  }

  // Desktop: bubble grid view
  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in-0 duration-300">
      {/* Tooltip */}
      <BubbleTooltip user={hoveredUser} position={tooltipPosition} />

      {/* 2x2 Grid of groups */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-6"
        onClick={handleContainerClick}
      >
        <div 
          className="grid grid-cols-2 grid-rows-2 relative"
          style={{
            width: gridWidth,
            height: gridHeight,
            gap: GAP,
          }}
        >
          {groups.map((groupUsers, index) => (
            <PoolGroup
              key={index}
              users={groupUsers}
              groupIndex={index}
              onHover={handleHover}
              onClick={handleClick}
              mousePosition={mousePosition}
              groupOffset={{
                x: (index % 2) * (GROUP_SIZE + GAP),
                y: Math.floor(index / 2) * (GROUP_SIZE + GAP),
              }}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 pb-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
          <span>Высокое совпадение</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#a855f7]" />
          <span>Низкое совпадение</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted opacity-40" />
          <span>Занят</span>
        </div>
      </div>
    </div>
  )
}
