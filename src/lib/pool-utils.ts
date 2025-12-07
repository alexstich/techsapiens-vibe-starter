import type { PoolUser } from '@/types';

/**
 * Interpolates color from purple (#a855f7) to green (#22c55e) based on score
 * @param score - Value from 0 to 1
 * @returns HEX color string
 */
export function interpolateColor(score: number): string {
  // Clamp score to 0-1 range
  const clampedScore = Math.max(0, Math.min(1, score));

  // Purple: #a855f7 -> rgb(168, 85, 247)
  const r1 = 168, g1 = 85, b1 = 247;
  // Green: #22c55e -> rgb(34, 197, 94)
  const r2 = 34, g2 = 197, b2 = 94;

  // Linear interpolation
  const r = Math.round(r1 + (r2 - r1) * clampedScore);
  const g = Math.round(g1 + (g2 - g1) * clampedScore);
  const b = Math.round(b1 + (b2 - b1) * clampedScore);

  // Convert to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculates bubble size based on score
 * @param score - Value from 0 to 1
 * @returns Size in pixels (24-48px)
 */
export function getBubbleSize(score: number): number {
  // Clamp score to 0-1 range
  const clampedScore = Math.max(0, Math.min(1, score));
  // Linear: 24px at score 0, 48px at score 1
  return 24 + clampedScore * 24;
}

/**
 * Distributes users into groups while preserving relevance order
 * Users are sorted by score, then distributed so highest scores are spread across groups
 * @param users - Array of PoolUser objects
 * @param groupCount - Number of groups to create
 * @returns Array of user groups
 */
export function distributeInGroups(users: PoolUser[], groupCount: number): PoolUser[][] {
  if (groupCount <= 0 || users.length === 0) {
    return [];
  }

  // First sort users by score descending to ensure order is preserved
  const sorted = [...users].sort((a, b) => b.score - a.score);

  // Initialize groups
  const groups: PoolUser[][] = Array.from({ length: groupCount }, () => []);

  // Distribute users round-robin style (keeping relative order)
  // This spreads high-score users across all groups
  sorted.forEach((user, index) => {
    groups[index % groupCount].push(user);
  });

  // Each group is already sorted by the round-robin distribution
  // (first in each group has highest score)

  return groups;
}

/**
 * Lays out users in a spiral/concentric pattern around center
 * Higher score = closer to center
 * @param users - Array of PoolUser objects (should be sorted by score descending)
 * @param centerX - X coordinate of center
 * @param centerY - Y coordinate of center
 * @param radius - Maximum radius of the layout
 * @returns Users with positions set
 */
export function layoutGroup(
  users: PoolUser[],
  centerX: number,
  centerY: number,
  radius: number
): PoolUser[] {
  if (users.length === 0) {
    return [];
  }

  // Sort by score descending to ensure highest is at center
  const sorted = [...users].sort((a, b) => b.score - a.score);

  return sorted.map((user, index) => {
    if (index === 0) {
      // Highest score user at center
      return {
        ...user,
        position: { x: centerX, y: centerY },
      };
    }

    // Arrange others in spiral pattern
    // Golden angle for even distribution
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const angle = index * goldenAngle;

    // Distance from center increases with index (lower score = further out)
    // Using square root for more even visual distribution
    const normalizedDistance = Math.sqrt(index / sorted.length);
    const distance = normalizedDistance * radius;

    return {
      ...user,
      position: {
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
      },
    };
  });
}

