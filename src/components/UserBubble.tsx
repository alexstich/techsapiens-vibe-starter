"use client"

import { useRef, useCallback } from "react"
import type { PoolUser, Position } from "@/types"
import { getBubbleSize, interpolateColor } from "@/lib/pool-utils"

interface UserBubbleProps {
  user: PoolUser
  position: Position
  scale?: number
  onHover: (user: PoolUser | null) => void
  onClick: (user: PoolUser) => void
}

export function UserBubble({ 
  user, 
  position, 
  scale = 1, 
  onHover, 
  onClick 
}: UserBubbleProps) {
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const size = getBubbleSize(user.score)
  const color = interpolateColor(user.score)

  const handleMouseEnter = useCallback(() => {
    // 200ms debounce
    hoverTimeoutRef.current = setTimeout(() => {
      onHover(user)
    }, 200)
  }, [user, onHover])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    onHover(null)
  }, [onHover])

  const handleClick = useCallback(() => {
    onClick(user)
  }, [user, onClick])

  return (
    <div
      className={`
        absolute rounded-full transition-all duration-200 ease-out
        flex items-center justify-center text-white font-medium text-xs
        ${user.isReady 
          ? "cursor-pointer hover:z-20" 
          : "opacity-40 cursor-not-allowed"
        }
        ${user.isReady && scale === 1 ? "animate-pulse-subtle" : ""}
      `}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        left: position.x - size / 2,
        top: position.y - size / 2,
        boxShadow: `0 0 ${size / 3}px ${color}40`,
        transform: `scale(${scale})`,
        zIndex: scale > 1 ? 10 : 1,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      title={user.name}
    >
      {/* First letter of name */}
      <span className="select-none">
        {user.name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}
