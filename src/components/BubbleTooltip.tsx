"use client"

import type { PoolUser, Position } from "@/types"

interface BubbleTooltipProps {
  user: PoolUser | null
  position: Position | null
}

export function BubbleTooltip({ user, position }: BubbleTooltipProps) {
  if (!user || !position) {
    return null
  }

  return (
    <div
      className="fixed z-50 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150"
      style={{
        left: position.x,
        top: position.y - 12,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2.5 shadow-xl max-w-[220px]">
        {/* User name */}
        <div className="font-semibold text-sm text-foreground truncate">
          {user.name}
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {user.bio}
          </div>
        )}

        {/* Status */}
        <div className="text-xs mt-2 flex items-center gap-1.5">
          {user.isReady ? (
            <>
              <span className="text-green-500">🟢</span>
              <span className="text-green-500">Ready to chat</span>
            </>
          ) : (
            <>
              <span className="text-muted-foreground">⚫</span>
              <span className="text-muted-foreground">Busy right now</span>
            </>
          )}
        </div>

        {/* Arrow pointing down */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-card/95 border-r border-b border-border rotate-45"
        />
      </div>
    </div>
  )
}

