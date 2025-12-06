"use client"

import { useMemo } from "react"
import type { PoolUser, Position } from "@/types"
import { layoutGroup } from "@/lib/pool-utils"
import { UserBubble } from "./UserBubble"

interface PoolGroupProps {
  users: PoolUser[]
  groupIndex: number
  onHover: (user: PoolUser | null, bubblePosition?: Position) => void
  onClick: (user: PoolUser) => void
  mousePosition: Position | null
  groupOffset: Position
}

export const GROUP_SIZE = 300 // Width and height of each group container
const LAYOUT_RADIUS = 120 // Radius for spiral layout

export function PoolGroup({ 
  users, 
  groupIndex, 
  onHover, 
  onClick, 
  mousePosition,
  groupOffset,
}: PoolGroupProps) {
  // Calculate positions for all users in this group
  const positionedUsers = useMemo(() => {
    const centerX = GROUP_SIZE / 2
    const centerY = GROUP_SIZE / 2
    return layoutGroup(users, centerX, centerY, LAYOUT_RADIUS)
  }, [users])

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
      className="relative bg-secondary/20 rounded-2xl border border-border/50"
      style={{
        width: GROUP_SIZE,
        height: GROUP_SIZE,
      }}
    >
      {/* Optional: Group label */}
      <div className="absolute top-2 left-3 text-xs text-muted-foreground/50 font-medium">
        Group {groupIndex + 1}
      </div>

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
