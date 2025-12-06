# 🎯 Project Plan: "The Pool"

## Концепция

**The Pool** — визуальное пространство для поиска собеседников на мероприятии. Пользователь вводит что ищет, и "ныряет" в pool где участники отображаются как цветные круги. Чем ближе цвет к зелёному — тем лучше match с запросом.

---

## Страницы приложения

| Страница | Route | Описание |
|----------|-------|----------|
| Auth | `/auth` | Логин / Регистрация (Supabase Auth) |
| Home | `/` | Главная с полем поиска и кнопкой "Dive into Pool" |
| Profile | `/profile` | Редактирование профиля + toggle "Ready to chat" |
| Pool | `/pool?q=...` | Визуальное пространство с участниками |
| Chat | `/chat/[userId]` | Простой чат между двумя пользователями |

---

## User Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Auth     │────▶│    Home     │────▶│   Profile   │
│  (login/    │     │  (search    │     │  (edit +    │
│  register)  │     │   input)    │     │  toggle)    │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                           ▼ "Dive" + query
                    ┌─────────────┐
                    │    Pool     │
                    │  (bubbles)  │
                    └──────┬──────┘
                           │ click bubble (if ready)
                           ▼
                    ┌─────────────┐
                    │    Chat     │
                    │  (messages) │
                    └─────────────┘
```

---

## Структура базы данных (Supabase)

### Таблица `profiles`
```sql
CREATE TABLE profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  bio                 TEXT,
  telegram            TEXT,
  linkedin            TEXT,
  skills              TEXT[],
  can_help            TEXT,
  needs_help          TEXT,
  looking_for         TEXT[],
  has_startup         BOOLEAN DEFAULT FALSE,
  startup_stage       TEXT,
  startup_description TEXT,
  is_ready_to_chat    BOOLEAN DEFAULT FALSE,
  avatar_url          TEXT,
  embedding           VECTOR(1536),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- RLS политики
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

### Таблица `messages`
```sql
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого получения чата между двумя пользователями
CREATE INDEX idx_messages_conversation 
  ON messages(sender_id, receiver_id, created_at DESC);

-- RLS политики
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);
```

### Функция для поиска по similarity
```sql
CREATE OR REPLACE FUNCTION match_profiles(
  query_embedding VECTOR(1536),
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
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.bio,
    p.is_ready_to_chat,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM profiles p
  WHERE p.embedding IS NOT NULL
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## Компоненты UI

### Общие
- `Header` — навигация (Home, Profile, Logout)
- `AuthForm` — форма логина/регистрации
- `LoadingSpinner` — индикатор загрузки

### Home
- `SearchInput` — поле ввода "Кого ищешь?" + кнопка "Dive"

### Profile
- `ProfileForm` — редактирование всех полей профиля
- `ReadyToggle` — переключатель "Ready to chat" (Switch из shadcn)

### Pool
- `PoolCanvas` — основной контейнер с группами
- `PoolGroup` — одна группа с кружками
- `UserBubble` — отдельный круг пользователя
- `BubbleTooltip` — всплывающая подсказка (кастомная, не shadcn)

### Chat
- `ChatHeader` — заголовок с именем + кнопка обновления
- `MessageList` — список сообщений
- `MessageBubble` — отдельное сообщение
- `MessageInput` — поле ввода + кнопка отправки

---

## Логика Pool

### Алгоритм раскладки
```typescript
interface PoolUser {
  id: string;
  name: string;
  bio: string;
  isReady: boolean;
  score: number;      // 0-1, от RAG
  groupIndex: number; // 0-3
  position: { x: number; y: number };
}

function layoutPool(users: PoolUser[]): PoolUser[] {
  // 1. Разбить на 4 рандомные группы
  const shuffled = shuffle(users);
  const groups = chunk(shuffled, Math.ceil(shuffled.length / 4));
  
  // 2. Внутри каждой группы сортировать по score
  groups.forEach((group, groupIndex) => {
    group.sort((a, b) => b.score - a.score);
    
    // 3. Расположить по спирали от центра
    group.forEach((user, i) => {
      user.groupIndex = groupIndex;
      user.position = spiralPosition(i, group.length);
    });
  });
  
  return groups.flat();
}
```

### Размер и цвет bubble
```typescript
// Размер: 24px (score=0) до 48px (score=1)
function getBubbleSize(score: number): number {
  return 24 + score * 24;
}

// Цвет: интерполяция фиолетовый → зелёный
function getBubbleColor(score: number): string {
  const purple = { r: 168, g: 85, b: 247 };  // #a855f7
  const green = { r: 34, g: 197, b: 94 };    // #22c55e
  
  const r = Math.round(purple.r + (green.r - purple.r) * score);
  const g = Math.round(purple.g + (green.g - purple.g) * score);
  const b = Math.round(purple.b + (green.b - purple.b) * score);
  
  return `rgb(${r}, ${g}, ${b})`;
}
```

### Интерактивность
```typescript
// При движении мыши
onMouseMove(e) {
  bubbles.forEach(bubble => {
    const distance = getDistance(e, bubble.position);
    
    if (distance < 50) {
      bubble.scale = 1.5;        // Под курсором
      bubble.showTooltip = true;
    } else if (distance < 100) {
      bubble.scale = 1.2;        // Рядом
      bubble.showTooltip = false;
    } else {
      bubble.scale = 1.0;        // Далеко
      bubble.showTooltip = false;
    }
  });
}

// При клике
onClick(bubble) {
  if (bubble.isReady) {
    router.push(`/chat/${bubble.id}`);
  } else {
    // Показать toast "Пользователь сейчас занят"
  }
}
```

---

## API Routes (Next.js App Router)

### POST /api/search
```typescript
// Request
{ query: string }

// Response
{
  users: Array<{
    id: string;
    name: string;
    bio: string;
    isReady: boolean;
    score: number;
  }>
}
```

### GET /api/messages?userId=xxx
```typescript
// Response
{
  messages: Array<{
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
    isMine: boolean;
  }>
}
```

### POST /api/messages
```typescript
// Request
{ receiverId: string; content: string }

// Response
{ success: boolean; message: Message }
```

### POST /api/profile/embedding
```typescript
// Вызывается при сохранении профиля
// Генерирует embedding и сохраняет в БД
```

---

## RAG логика

### Генерация embedding профиля
```typescript
async function generateProfileEmbedding(profile: Profile): Promise<number[]> {
  const text = [
    profile.name,
    profile.bio,
    profile.skills?.join(', '),
    profile.can_help,
    profile.needs_help,
    profile.startup_description,
  ].filter(Boolean).join('. ');
  
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  
  return response.data[0].embedding;
}
```

### Поиск по запросу
```typescript
async function searchProfiles(query: string): Promise<PoolUser[]> {
  // 1. Получить embedding запроса
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });
  
  // 2. Найти похожие профили через pgvector
  const { data } = await supabase.rpc('match_profiles', {
    query_embedding: queryEmbedding.data[0].embedding,
    match_count: 100,
  });
  
  // 3. Преобразовать similarity в score (0-1)
  return data.map(row => ({
    ...row,
    score: row.similarity, // уже 0-1
  }));
}
```

---

## План реализации (по часам)

| # | Этап | Время | Задача | Результат |
|---|------|-------|--------|-----------|
| 1 | Setup | 1ч | Next.js + Supabase + shadcn + Tailwind | Пустой проект запускается |
| 2 | DB | 0.5ч | Создать таблицы в Supabase | Схема готова |
| 3 | Auth | 1ч | Страница /auth + Supabase Auth | Можно логиниться |
| 4 | Profile | 1.5ч | Страница /profile + форма + toggle | Можно редактировать профиль |
| 5 | Home | 0.5ч | Страница / + поле поиска | Можно вводить запрос |
| 6 | RAG | 1.5ч | API embeddings + search | Поиск работает |
| 7 | Pool | 2.5ч | Страница /pool + canvas + bubbles | Pool отображается |
| 8 | Chat | 1.5ч | Страница /chat/[id] + сообщения | Можно общаться |
| 9 | Polish | 1ч | Стили, анимации, edge cases | Красиво |

**Total: ~11 часов**

---

## Файловая структура

```
src/
├── app/
│   ├── layout.tsx            # Root layout + providers
│   ├── page.tsx              # Home (search input)
│   ├── auth/
│   │   └── page.tsx          # Login/Register
│   ├── profile/
│   │   └── page.tsx          # Edit profile
│   ├── pool/
│   │   └── page.tsx          # Pool canvas
│   ├── chat/
│   │   └── [userId]/
│   │       └── page.tsx      # Chat window
│   └── api/
│       ├── search/
│       │   └── route.ts      # RAG search
│       ├── messages/
│       │   └── route.ts      # Get/send messages
│       └── profile/
│           └── embedding/
│               └── route.ts  # Generate embedding
├── components/
│   ├── ui/                   # shadcn components
│   ├── Header.tsx
│   ├── AuthForm.tsx
│   ├── ProfileForm.tsx
│   ├── SearchInput.tsx
│   ├── PoolCanvas.tsx
│   ├── PoolGroup.tsx
│   ├── UserBubble.tsx
│   ├── BubbleTooltip.tsx
│   ├── ChatHeader.tsx
│   ├── MessageList.tsx
│   ├── MessageBubble.tsx
│   └── MessageInput.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser client
│   │   └── server.ts         # Server client
│   ├── openai.ts             # OpenAI client
│   ├── pool-utils.ts         # Layout algorithms
│   └── utils.ts              # Helpers
├── hooks/
│   ├── useAuth.ts
│   ├── useProfile.ts
│   └── useMessages.ts
└── types/
    └── index.ts              # TypeScript types
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# OpenAI (для embeddings)
OPENAI_API_KEY=sk-xxx

# Pool colors (опционально, можно менять)
NEXT_PUBLIC_COLOR_MATCH=#22c55e
NEXT_PUBLIC_COLOR_NO_MATCH=#a855f7
```

---

## Критические решения

1. **Без WebSockets** — чат обновляется кнопкой Refresh
2. **Без зума Pool** — все ~100 участников на одном экране
3. **Рандомные группы** — 4 группы, без умной кластеризации
4. **Supabase Auth** — email/password
5. **OpenAI embeddings** — text-embedding-3-small (дёшево, быстро)
6. **Клик по bubble** — сразу чат (если ready), иначе toast
7. **Not ready users** — полупрозрачные (opacity: 0.4), клик блокирован
8. **Tooltip** — показывает name + bio