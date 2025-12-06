-- ============================================
-- MIGRATION: Initial Schema for "The Pool"
-- ============================================

-- 1. Включить расширения
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Таблица profiles
-- ============================================
CREATE TABLE profiles (
  -- Primary key = auth user id
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  
  -- Contact
  telegram TEXT,
  linkedin TEXT,
  
  -- Skills & interests
  skills TEXT[] DEFAULT '{}',
  looking_for TEXT[] DEFAULT '{}',
  
  -- Help exchange
  can_help TEXT,
  needs_help TEXT,
  
  -- Startup info
  has_startup BOOLEAN DEFAULT FALSE,
  startup_stage TEXT,
  startup_description TEXT,
  
  -- Status
  is_ready_to_chat BOOLEAN DEFAULT FALSE,
  
  -- RAG embedding (OpenAI text-embedding-3-small = 1536 dims)
  embedding VECTOR(1536),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого поиска по embedding
CREATE INDEX IF NOT EXISTS profiles_embedding_idx 
  ON profiles 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Автообновление updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 3. Таблица messages
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого получения переписки между двумя пользователями
CREATE INDEX IF NOT EXISTS messages_conversation_idx 
  ON messages(
    LEAST(sender_id, receiver_id),
    GREATEST(sender_id, receiver_id),
    created_at DESC
  );

-- Индекс для получения сообщений пользователя
CREATE INDEX IF NOT EXISTS messages_user_idx 
  ON messages(sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS messages_receiver_idx 
  ON messages(receiver_id, created_at DESC);

-- 4. Row Level Security (RLS)
-- ============================================

-- Включить RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies

-- Любой авторизованный пользователь может видеть профили
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Пользователь может создать только свой профиль
CREATE POLICY "Users can create own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Пользователь может редактировать только свой профиль
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Messages policies

-- Пользователь видит только свои сообщения (отправленные или полученные)
CREATE POLICY "Users can view their messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id
  );

-- Пользователь может отправлять сообщения только от своего имени
CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- 5. Функция поиска по similarity
-- ============================================
CREATE OR REPLACE FUNCTION match_profiles(
  query_embedding VECTOR(1536),
  current_user_id UUID DEFAULT NULL,
  match_count INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  bio TEXT,
  is_ready_to_chat BOOLEAN,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.bio,
    p.is_ready_to_chat,
    -- Cosine similarity: 1 - distance
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM profiles p
  WHERE 
    p.embedding IS NOT NULL
    -- Исключить текущего пользователя
    AND (current_user_id IS NULL OR p.id != current_user_id)
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 6. Функция получения сообщений между двумя пользователями
-- ============================================
CREATE OR REPLACE FUNCTION get_conversation(
  user1_id UUID,
  user2_id UUID,
  message_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  receiver_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  is_mine BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.sender_id,
    m.receiver_id,
    m.content,
    m.created_at,
    m.sender_id = user1_id AS is_mine
  FROM messages m
  WHERE 
    (m.sender_id = user1_id AND m.receiver_id = user2_id)
    OR (m.sender_id = user2_id AND m.receiver_id = user1_id)
  ORDER BY m.created_at ASC
  LIMIT message_limit;
END;
$$;

-- 7. Триггер создания профиля при регистрации
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер на auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

