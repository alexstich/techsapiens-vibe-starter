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

export function PoolCanvas({ users }: PoolCanvasProps) {
  const router = useRouter()
  const { toast } = useToast()
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [hoveredUser, setHoveredUser] = useState<PoolUser | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<Position | null>(null)
  const [mousePosition, setMousePosition] = useState<Position | null>(null)

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
    if (user.isReady) {
      // Navigate to chat with this user
      router.push(`/chat/${user.id}`)
    } else {
      // Show toast for busy user
      toast({
        title: "User unavailable",
        description: "This person is busy right now",
        variant: "destructive",
      })
    }
  }, [router, toast])

  // Calculate grid offset for centering
  const gridWidth = GROUP_SIZE * 2 + GAP
  const gridHeight = GROUP_SIZE * 2 + GAP

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tooltip */}
      <BubbleTooltip user={hoveredUser} position={tooltipPosition} />

      {/* 2x2 Grid of groups */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-6"
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
          <span>High match</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#a855f7]" />
          <span>Low match</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted opacity-40" />
          <span>Busy</span>
        </div>
      </div>
    </div>
  )
}
