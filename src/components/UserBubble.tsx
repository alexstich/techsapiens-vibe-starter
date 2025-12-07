"use client"

import { useRef, useCallback, useState } from "react"
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
  const [imgError, setImgError] = useState(false)

  const size = getBubbleSize(user.score)
  const color = interpolateColor(user.score)
  const hasAvatar = user.avatarUrl && !imgError

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
        absolute rounded-full flex items-center justify-center overflow-hidden
        transition-all duration-200 ease-out
        ${user.isReady 
          ? "cursor-pointer hover:z-20 hover:scale-110 hover:shadow-xl active:scale-105" 
          : "opacity-40 cursor-not-allowed"
        }
        ${user.isReady && scale === 1 ? "animate-pulse-subtle" : ""}
      `}
      style={{
        width: size,
        height: size,
        backgroundColor: hasAvatar ? 'transparent' : color,
        left: position.x - size / 2,
        top: position.y - size / 2,
        boxShadow: `0 0 ${size / 3}px ${color}40`,
        transform: `scale(${scale})`,
        zIndex: scale > 1 ? 10 : 1,
        border: hasAvatar ? `2px solid ${color}` : 'none',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      title={user.name}
    >
      {hasAvatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatarUrl!}
          alt={user.name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        /* First letter of name as fallback */
        <span className="select-none text-white font-medium text-xs">
          {user.name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )
}
