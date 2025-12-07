import type { Tables } from './database';

// ============================================
// Database Types (derived from Supabase)
// ============================================

/** Profile from database */
export type Profile = Tables<'profiles'>;

/** Message from database */
export type Message = Tables<'messages'>;

// ============================================
// Application Types
// ============================================

/** Position in 2D space for pool visualization */
export interface Position {
  x: number;
  y: number;
}

/** User representation in the pool visualization */
export interface PoolUser {
  id: string;
  name: string;
  bio: string | null;
  isReady: boolean;
  /** Similarity score (0-1) from match_profiles function */
  score: number;
  /** Position in the pool visualization */
  position: Position;
  /** Avatar URL for display */
  avatarUrl?: string | null;
}

// ============================================
// Function Return Types
// ============================================

/** Result from match_profiles function */
export interface MatchedProfile {
  id: string;
  name: string;
  bio: string | null;
  is_ready_to_chat: boolean;
  similarity: number;
}

/** Result from get_conversation function */
export interface ConversationMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_mine: boolean;
}

// ============================================
// Re-exports
// ============================================

export * from './database';

