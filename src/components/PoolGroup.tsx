"use client"

import { useMemo } from "react"
import type { PoolUser, Position } from "@/types"
import { layoutGroup } from "@/lib/pool-utils"
import { UserBubble } from "./UserBubble"

interface PoolGroupProps {
  users: PoolUser[]
  onHover: (user: PoolUser | null, bubblePosition?: Position) => void
  onClick: (user: PoolUser) => void
  mousePosition: Position | null
  groupOffset?: Position
  size?: number // Динамический размер контейнера
  radius?: number // Радиус для spiral layout
}

export const GROUP_SIZE = 280 // Дефолтный размер группы
const DEFAULT_RADIUS = 100 // Дефолтный радиус

export function PoolGroup({ 
  users, 
  onHover, 
  onClick, 
  mousePosition,
  groupOffset = { x: 0, y: 0 },
  size = GROUP_SIZE,
  radius = DEFAULT_RADIUS,
}: PoolGroupProps) {
  // Calculate positions for all users in this group
  const positionedUsers = useMemo(() => {
    const centerX = size / 2
    const centerY = size / 2
    return layoutGroup(users, centerX, centerY, radius)
  }, [users, size, radius])

  // Calculate scale for each bubble based on mouse proximity
  const getProximityScale = (bubblePosition: Position): number => {
    if (!mousePosition) return 1

    // Adjust mouse position relative to this group
    const relativeMouseX = mousePosition.x - groupOffset.x
    const relativeMouseY = mousePosition.y - groupOffset.y

    const dx = bubblePosition.x - relativeMouseX
    const dy = bubblePosition.y - relativeMouseY
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Direct hover (very close)
    if (distance < 30) return 1.5
    // Nearby
    if (distance < 80) return 1.2
    // Far
    return 1
  }

  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
      }}
    >
      {/* User bubbles */}
      {positionedUsers.map((user) => {
        const scale = getProximityScale(user.position)
        // Calculate absolute position for tooltip
        const absolutePosition: Position = {
          x: groupOffset.x + user.position.x,
          y: groupOffset.y + user.position.y,
        }
        
        return (
          <UserBubble
            key={user.id}
            user={user}
            position={user.position}
            scale={scale}
            onHover={(u) => onHover(u, u ? absolutePosition : undefined)}
            onClick={onClick}
          />
        )
      })}
    </div>
  )
}
