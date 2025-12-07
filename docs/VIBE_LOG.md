

## 🚀 Phase 0: Составление ПЛАНА с CLAUDE

```
Я участвую в соревновании. Мне необходимо разработать часть новой соцсети. Ниже я приложу документацию. Мне необходимо чтоб ы ты произвел исследование и предложил несколько вариантов реализации задачи из документации(а она больше творческая) чтобы она была не очень емкая и в тоже время крайне уместная в том контексте. Мне необходимо реализовать функционал за 1 день, то есть его должно быть минимум.
```
```
Я думаю сделать следующее. 
Сделать rag для определение насколько пользователь соответствует твоему запросу.
Сделать функцию "Готов общатся"
И сделать красивый интерфейс для выбора собеседника. Интерфейс выбора должен быть такой,  поисковый space где люди в виде круглых иконок. Это как поле ты водишь мышкой и те кружки которые под курсором становятся больше, и после наведения появляется подсказка(допустим очень краткое bio), кружки рядом чуть поменьше и по мере удаления они должны быть маленькими. Цвет у кружков должен быть разный и в градации между двумя цветами. Один цвет это люди максимально тебе подходящие(или подходящие под твой запрос) и другой цвет, не подходящие. Давай даже придумаем название pool  для этого пространства. Ты как пользователь, вводишь сначала обязательно что ты хочешь найти, и после этого попадаешь в pool с такой механикой. Необязательно все пользователя должны помешаться на один экран. Ты видишь лишь часть бассейна. Наверное будут ограничения по зуму и можно будет отдалять и приближать группы. И еще можно пользователей группировать по каким-то критериям, но в группах они должны быть распределены по цветам то есть чтобы бассейн был похож н апятна. Допустим будет 5 групп, в каждой группе по 20 человек. Так вот в этой каждой группе в центре будет человек максимально тебе подходящий, а к краям минимально. 
Еще я думаю. Надо одну страницу это редактирование своего профиля
Одну страницу домашнюю.
Одну чисто логин/регистрация.
Из домашней можно "нырять" в pool предварительно обязательно написав кого ищешь. 
Я не знаю как лучше сделать. Показывать в пуле пользователя который не готов общаться или нет. НАверное показывать но не давать возможности с ним общатся. А с теми кто готов можно переходить к чату. 
Одна страница чат между тобой и другим пользователем. Самый простой функционал.
Отлично. 
Стек будет versel + supabase + next.js + snadcn
Теперь исходя из ТЗ и исходя из того я что я тебе написал надо составить несколько документов.
Во первых общий план и структуру приложения
Второе описание для дизайн системы
Список промтов для ide реализации каждой функции
Важно. Не делать лишних функций. Не усложнять. Все должно быть очень просто, и должно быть реализовано в самом простом варианте. 
У тебя наверняка есть вопросы? Задавай. Проверим как ты все понял!
```

# Cursor

## 🚀 Phase 1: Setup 

### Prompt 1.1 — Создание проекта
```
Create a new Next.js 14 project with App Router, TypeScript, Tailwind CSS, and ESLint.

Initialize with:
- src/ directory
- App Router
- Tailwind CSS
- TypeScript strict mode

Then install additional dependencies:
- @supabase/supabase-js
- @supabase/ssr
- openai
- lucide-react

Create .env.local with placeholders:
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

### Prompt 1.2 — Установка shadcn/ui
```
Initialize shadcn/ui with these settings:
- Style: New York
- Base color: Zinc
- CSS variables: yes

Install these components:
- button
- input
- card
- switch
- tabs
- textarea
- toast
- badge

Configure dark theme as default in globals.css.
Set background to #0a0a0f, foreground to #f4f4f5.
```

### Prompt 1.3 — Supabase клиенты
```
Create Supabase client utilities in src/lib/supabase/:

1. client.ts - Browser client using createBrowserClient
2. server.ts - Server client using createServerClient with cookies
3. middleware.ts - For auth session refresh

Follow Supabase SSR docs for Next.js App Router.
Export typed client with Database types (we'll generate later).
```
```
Все параметры в .env
Ты можешь написать скрипты в scripts/ чтобы они использовали .env  и выполняли необходимые действия с supabase и затем используй эти скрпиты для выполнения необходимых команд миграций
```
```
Создай правило в @.cursorrules для работы с supabase чтобы было понятно какие скрипты использовать
```

## 🗄️ Phase 2: Database (30 мин)

### Prompt 2.1 — SQL схема
```
Generate SQL for Supabase to create these tables:

1. profiles table:
- id (uuid, references auth.users)
- name (text, not null)
- bio (text)
- telegram (text)
- linkedin (text)
- skills (text array)
- can_help (text)
- needs_help (text)
- looking_for (text array)
- has_startup (boolean, default false)
- startup_stage (text)
- startup_description (text)
- is_ready_to_chat (boolean, default false)
- avatar_url (text)
- embedding (vector 1536)
- created_at, updated_at (timestamps)

2. messages table:
- id (uuid)
- sender_id, receiver_id (uuid, reference profiles)
- content (text, not null)
- created_at (timestamp)

Include:
- RLS policies (profiles: public read, own write; messages: participants only)
- Index on messages for conversation lookup
- Function match_profiles(query_embedding, match_count) returning similar profiles

Enable pgvector extension.
```
```
Это по сути миграция. Тебе надо ее сохранить, а потом применить!!
Также проверь @docs/DATABASE.md Необходимо создать и применить все миграции для полного создания всех таблиц и функций в базе. 
```
```
В .env есть SUPABASE_SERVICE_ROLE_KEY с помощью него можно произвести миграции
```
```
Так. Я добавил эти переменные -
@.env.local (4-7) 
Они должны тебе  дать возможность делать миграции.
```
```
Используй .env !! Ты сейчас плейсхолдер зачем-то берешь
```
```
Ты создал все поля, таблицы, функции из @docs/DATABASE.md ?
```

### Prompt 2.2 — TypeScript типы
```
Create src/types/index.ts with TypeScript interfaces:

- Profile (matching database schema)
- Message (matching database schema)  
- PoolUser (id, name, bio, isReady, score, position)
- Position { x: number, y: number }

Also create src/types/database.ts with Supabase Database type.
Use 'supabase gen types' pattern or manual definition.
```

---

## 🔐 Phase 3: Auth (1 час)

### Prompt 3.1 — Auth страница
```
Create src/app/auth/page.tsx:

- Centered card with tabs: "Login" / "Register"
- Email + Password inputs
- Submit button
- Use shadcn Tabs, Card, Input, Button
- On submit: call Supabase auth.signInWithPassword or auth.signUp
- On success: redirect to / (home)
- Show error toast on failure
- Dark theme styling

Keep it simple, no social auth.
```

### Prompt 3.2 — Auth middleware
```
Create src/middleware.ts:

- Refresh auth session on each request
- Protect routes: /, /profile, /pool, /chat/* require auth
- /auth is public
- Redirect unauthenticated users to /auth
- Use Supabase createServerClient pattern
```

### Prompt 3.3 — Auth hook
```
Create src/hooks/useAuth.ts:

- Get current user from Supabase
- Provide: user, loading, signOut function
- Listen to auth state changes
- Use in client components
```

---

## 👤 Phase 4: Profile (1.5 часа)

### Prompt 4.1 — Profile страница
```
Create src/app/profile/page.tsx:

- Fetch current user's profile from Supabase
- If no profile exists, create empty one on first load
- Form with all fields from schema
- "Ready to chat" Switch at the top (prominent)
- Save button at bottom
- On save: update profile in Supabase, show success toast
- Back button to home

Use shadcn Card, Input, Textarea, Switch, Button.
Dark theme, max-width 500px centered.
```

### Prompt 4.2 — Profile form component
```
Extract ProfileForm as separate component in src/components/ProfileForm.tsx:

Props:
- initialData: Profile
- onSave: (data: Profile) => Promise<void>
- loading: boolean

Fields:
- name (required)
- bio (textarea)
- skills (comma-separated input → array)
- telegram
- linkedin  
- can_help (textarea)
- needs_help (textarea)
- looking_for (comma-separated → array)
- has_startup (checkbox)
- startup_stage (input, show only if has_startup)
- startup_description (textarea, show only if has_startup)

Use react-hook-form for form state if needed, or simple useState.
```

### Prompt 4.3 — Generate embedding on save
```
Create API route src/app/api/profile/embedding/route.ts:

POST handler:
1. Get profile ID from request body
2. Fetch profile from Supabase
3. Combine text fields: name, bio, skills, can_help, needs_help, startup_description
4. Call OpenAI embeddings API (text-embedding-3-small)
5. Update profile.embedding in Supabase
6. Return success

Call this API after saving profile in ProfileForm.
```

---

## 🏠 Phase 5: Home (30 мин)

### Prompt 5.1 — Home страница
```
Create src/app/page.tsx (Home):

Layout:
- Header with logo "🏊 The Pool", Profile link, Logout button
- Centered content:
  - Large title "The Pool"
  - Subtitle "Find the right people to talk to"
  - Search input: "Who are you looking for?"
  - "Dive In" button (accent color, large)

On "Dive In":
- Validate search query is not empty
- Navigate to /pool?q={encodeURIComponent(query)}

Dark theme, full height, vertically centered.
Use Lucide icons: User, LogOut, Waves.
```

### Prompt 5.2 — Header component
```
Create src/components/Header.tsx:

- Logo with waves icon and "The Pool" text
- Navigation: Home, Profile links
- Logout button (calls signOut)
- Sticky top, dark background with border-bottom
- Use on all authenticated pages

Props:
- showBackButton?: boolean
- backHref?: string
- title?: string (for Pool and Chat pages)
```

---

## 🎱 Phase 6: Pool (2.5 часа)

### Prompt 6.1 — Search API
```
Прежде чем приступать к pool я хочу чтобы ты развернул локальную версию сайта!! Для тестирования. Базу supabase можешь использовать текущуюона тестовая. 
После разворачивания самостоятельно проверь в браузере страницы которые мы уже реализовали.
```
```
Используй .env (там указаны все параметры), а не .env.local
```
```
Пользователей еще нет в базе. Подтверждение почты выключил. 
```
```
Таблица profiles создана в базе. Какая-то внутреняя ошибка. Возможно дело в функции. Вот лог - 
```
```
- vector включен
- функция есть
- embedding есть такая колонка

Вот логи от запросов
```
```
Создай миграцию и примени самостоятельно
```
```
У тебя есть скрипты, supabase cli и установлены параметры в .env. Почему ты не можешь применить миграцию??
```
```
Create src/app/api/search/route.ts:

POST handler:
1. Get query from request body
2. Get current user ID (exclude from results)
3. Generate embedding for query using OpenAI
4. Call Supabase RPC match_profiles with embedding
5. Return users with: id, name, bio, isReady, score (similarity)

Handle errors gracefully.
```

### Prompt 6.2 — Pool utilities
```
Create src/lib/pool-utils.ts:

Functions:

1. interpolateColor(score: number): string
   - score 0 = #a855f7 (purple)
   - score 1 = #22c55e (green)
   - Linear interpolation

2. getBubbleSize(score: number): number
   - score 0 = 24px
   - score 1 = 48px
   - Linear: 24 + score * 24

3. distributeInGroups(users: PoolUser[], groupCount: number): PoolUser[][]
   - Shuffle users randomly
   - Split into groupCount arrays
   - Sort each group by score descending

4. layoutGroup(users: PoolUser[], centerX: number, centerY: number, radius: number): PoolUser[]
   - Place highest score user at center
   - Arrange others in spiral/concentric pattern
   - Higher score = closer to center
   - Return users with positions set
```

### Prompt 6.3 — Pool страница
```
Create src/app/pool/page.tsx:

1. Get query from searchParams
2. If no query, redirect to home
3. Call /api/search with query
4. Show loading state while fetching
5. Render PoolCanvas with results

Header: Back button, "Searching: {query}"
Full screen canvas area.
```

### Prompt 6.4 — PoolCanvas component
```
Create src/components/PoolCanvas.tsx:

Props:
- users: PoolUser[]

Behavior:
1. Split users into 4 groups using distributeInGroups
2. Layout as 2x2 grid of PoolGroup components
3. Each group has its own area on screen

CSS Grid layout:
- 2 columns, 2 rows
- Gap between groups
- Full height of viewport minus header
```

### Prompt 6.5 — PoolGroup component
```
Create src/components/PoolGroup.tsx:

Props:
- users: PoolUser[]
- groupIndex: number

Behavior:
1. Calculate positions using layoutGroup
2. Render UserBubble for each user
3. Position absolutely within group container

Container:
- relative positioning
- Defined width/height
- Subtle border or background to show group bounds (optional)
```

### Prompt 6.6 — UserBubble component
```
Create src/components/UserBubble.tsx:

Props:
- user: PoolUser
- position: Position
- onHover: (user: PoolUser | null) => void
- onClick: (user: PoolUser) => void

Render:
- Circular div at absolute position
- Size from getBubbleSize(score)
- Color from interpolateColor(score)
- If !isReady: opacity 0.4, cursor not-allowed
- If isReady: subtle pulse animation

Events:
- onMouseEnter: call onHover(user) after 200ms debounce
- onMouseLeave: call onHover(null)
- onClick: if isReady, call onClick(user)

Hover effect:
- Scale up on hover (CSS transition)
- Z-index higher when hovered
```

### Prompt 6.7 — BubbleTooltip component
```
Create src/components/BubbleTooltip.tsx:

Props:
- user: PoolUser | null
- position: Position | null

Render (when user is not null):
- Floating card above the bubble position
- User name (bold)
- Bio (truncated to 2 lines)
- Status: "🟢 Ready to chat" or "⚫ Busy right now"

Styling:
- Dark card background with blur
- Max width 220px
- Smooth fade in animation
- Position above bubble, centered
- Arrow pointing down (optional)
```

### Prompt 6.8 — Pool interactivity
```
Update PoolCanvas to handle hover and click:

State:
- hoveredUser: PoolUser | null
- tooltipPosition: Position | null

On bubble hover:
- Set hoveredUser
- Calculate tooltip position (above bubble)

On bubble click:
- If user.isReady: router.push(/chat/{user.id})
- If !isReady: show toast "This person is busy right now"

Render BubbleTooltip with current state.

Add effect: when mouse moves, calculate distance to each bubble
and apply scale classes (nearby = 1.2x, direct = 1.5x).
```

---

## 💬 Phase 7: Chat (1.5 часа)

### Prompt 7.1 — Messages API
```
Create src/app/api/messages/route.ts:

GET handler:
- Get userId from query params (other user)
- Get current user ID
- Fetch messages where (sender=me AND receiver=them) OR (sender=them AND receiver=me)
- Order by created_at ASC
- Return messages with isMine boolean

POST handler:
- Get receiverId and content from body
- Get current user ID as sender
- Insert message to Supabase
- Return created message
```

### Prompt 7.2 — Chat страница
```
Create src/app/chat/[userId]/page.tsx:

1. Get userId from params
2. Fetch other user's profile (name for header)
3. Fetch messages using /api/messages?userId=xxx
4. Render ChatWindow component

Header: Back to /pool, "Chat with {name}", Refresh button
Handle loading state.
```

### Prompt 7.3 — ChatWindow component
```
Create src/components/ChatWindow.tsx:

Props:
- messages: Message[]
- otherUser: { id: string, name: string }
- onSend: (content: string) => Promise<void>
- onRefresh: () => void
- loading: boolean

Layout:
- Scrollable message list (flex-1, overflow-y-auto)
- Fixed input area at bottom

Features:
- Auto-scroll to bottom on new messages
- Show empty state if no messages
```

### Prompt 7.4 — MessageList component
```
Create src/components/MessageList.tsx:

Props:
- messages: Message[]

Render:
- Map messages to MessageBubble
- Group by date (optional, can skip for MVP)
- Ref for scroll container
- useEffect to scroll to bottom when messages change
```

### Prompt 7.5 — MessageBubble component
```
Create src/components/MessageBubble.tsx:

Props:
- message: Message
- isMine: boolean

Styling:
- isMine: align right, blue background (#3b82f6)
- !isMine: align left, dark gray background (#27272a)
- Rounded corners (more rounded on "tail" side)
- Time below message (small, muted)
- Max width 70%
```

### Prompt 7.6 — MessageInput component
```
Create src/components/MessageInput.tsx:

Props:
- onSend: (content: string) => Promise<void>
- disabled: boolean

UI:
- Input field (grows with content, or fixed)
- Send button with icon
- Disable while sending

Behavior:
- Enter key sends (without Shift)
- Clear input after send
- Focus input on mount
```

---

## ✨ Phase 8: Polish (1 час)

### Prompt 8.1 — Loading states
```
Add loading states to all pages:

- Use Loader2 icon from Lucide with spin animation
- Centered in container
- Skeleton components (optional, can be simple spinner)

Pages to update:
- /profile (loading profile)
- /pool (loading search results)
- /chat/[id] (loading messages)
```

### Prompt 8.2 — Error handling
```
Add error handling:

1. Create src/components/ErrorMessage.tsx
   - Display error message with retry button

2. Add try-catch to all API calls
3. Show toast on errors
4. Redirect to home if pool has no results

Use sonner or shadcn toast for notifications.
```

### Prompt 8.3 — Empty states
```
Add empty states:

1. Pool with no results:
   "No matches found. Try a different search."
   Button to go back home.

2. Chat with no messages:
   "No messages yet. Say hi!"
   Focus on input.

3. Profile incomplete:
   Prompt to fill out profile for better matching.
```

### Prompt 8.4 — Animations polish
```
Add subtle animations:

1. Page transitions: fade in from bottom
2. Bubble hover: smooth scale with spring easing
3. Tooltip: fade in with slight translate
4. Button hover: slight lift with shadow
5. Message appear: fade in from side

Use Tailwind transitions or Framer Motion (if installed).
Keep it subtle, not distracting.
```

### Prompt 8.5 — Mobile responsive
```
Make app mobile-friendly:

1. Pool: single column on mobile, vertical scroll
2. Bubbles: tap to show tooltip, tap again to navigate
3. Chat: full width, larger touch targets
4. Forms: full width inputs
5. Header: hamburger menu or simplified

Test at 375px width (iPhone SE).
```

---

## 🧪 Phase 9: Testing & Deploy

### Prompt 9.1 — Seed data
```
Мне надо чтобы ты добавил еще 70 участников и сгенерировал данные для них в этом же файле. Там уже есть 31, надо добавить еще 70. Генерируй разные данные. Старайся чтобы были разные профессии, но напрвление было it, стартап, ai.
Хоби и увлечения можешь разбить на 5 тематик и выбирать всегда примерно из этих 5 тематик. 
```
```
Create a script src/scripts/seed.ts:

1. Read participants.json (mock data)
2. For each participant:
   - Create auth user (or skip if exists)
   - Create profile
   - Generate embedding
3. Log progress

Can be run with: npx ts-node src/scripts/seed.ts
Or create API route /api/seed for one-time use.
```

### Prompt 9.2 — Deploy checklist
```
Prepare for Vercel deploy:

1. Add all env variables to Vercel
2. Set SUPABASE_SERVICE_ROLE_KEY as secret
3. Test build locally: npm run build
4. Fix any TypeScript errors
5. Test auth flow end-to-end
6. Verify RLS policies work

Create vercel.json if needed for any config.
```
```
- Я хочу чтобы ты добавил в профиль avatar_url использовал для этого дополнительное поле custom_2. в интерфейсе его не надо нигде показывать, оно необходимо для отображения в пуле То есть надо c помощью скрипта нагенерировать фото на ресурсе https://thispersondoesnotexist.com/  , затем зжать их чтобы занимали мало места до размер 160*160 положить и рашареную папку, чтобы у был доступ через домен сайта. Домен такой - https://techsapiens-vibe-starter.vercel.app/   
Далее необходимо что аватарки отображались у пользователей в пуле. 
- по поводу отображения групп и в группах в пуле. Не надо вообще показывать границы групп и название, это внутренний сегмент нам для отображения. 
- Потом при просмотре отобразилось ли небольшое кол-во пользователй, либо остальные вышли за границе. Сделай отображение более компактным и плотным.
```
```
Я хочу чтобы ты проверил работу в браузере. В случае ошибок сделал правки. 
мне надо чтобы ты в частности проверил работу rag
Напиши в запросе перед пулом "Ищу фронтенд разработчика на react" И проверь каким образом будет строиться выборка. Необходима чтобы все фронтенд разработчики, особенно на React, были в верхней части списка
```
```
Также проверь что регистрация, а потом логин, проходит корректно!! 
```
```
Теперь про страницу чата. 
- Я хочу чтобы ты наверху чата добавил компактно профиль человека с кем разговариваешь
- ПРоверь полностью работу чата. Отправка/получение сообщений. Переход обратно в пул. Новое открытие. 
```
```
Ты не отобразил компактно профиль человека с кем разговариваешь. 
И еще локально происходит ошибка при переходе в чат
```
```
Я тебе еще говорил на генерировать иконки для аватарок пользотваелей. Сгенерируй. Создай скрипт и запусти его, потом создай еще один скрипт и запусти его, привяжи файлы к пользователям в базе, в любом порядки, неважно.
```
```
И еще надо иконку добавить. Чтобы в браузере было видно на вкладке. 
favicon
Создай или использую такую же как на домашней странице.
```
```
На странице чата при нажатии Назад нужно выходить обратно в пул из которого пришел. 
И почему-то все люди отображаются как занятые?
Проверь базу данных и включи рандомно для половины пользователей режим "Не заянят".
И еще давай людей в группе распределять более равномерно чтобы не было заметно границ между группами
```
```
Давай пока группу сделаем одну на весь экран. Чтобы не путатся. Пусть будет одна группа и внее будут входить все пользователи.
```
```
Такое ощущение что ты стер данные. Сейчас я открываю пользователей и у них пишется что профиль не заполнен. И в подсказке в bio в пуле ничего не написано.
Проверь. Это стерлись данные или проблема в чем-то другом.  Если данные в базе очистились, то надо сгенерировать новые и обновить записи в БД. Не перетери то что уже есть. Там аватарки и имена.
```
```
Отлично. Почему тогда в пул выбираетс яс десяток пользователей. Так сейчас используетс яодна группа то в пул должны попадать все пользователи!
```
```
Давай еще сделаем следущее. 
На старнице чата верхний профиль пусть будет сразу раскрыт.
```
```
Обнови еще @README.md 
Сделай описание проекта, стек, основные фитчи
```
```
Надо проверить как работает RAG 
Зарегестрируйся с новым профилем, но сделай его по тематике Строительства. 
Затем выйди и зайди под тестовым пользователем и попробуй найти этого пользователя по словам не указаным в его профиле но тематически которые рядом. 
И воббще проверь более детально как он работает и надо ил его улучшить. Сейчас поиск происходит только если слова точно совпадают. Я не увидел что работает RAG!!
```
```
Да исправь и сразу проверь, чтобы он работал!
```
```
RAG работает, но единственно пользователи с максимальным score отображаются фиолетовым цветом
```
```
Это отлично. 
Но у меня был вопрос именно по поводу цвета пользователя. Пользователь который первый даже он фиолетового цвета. А должен быть зеленного. Можно как-то распределить градации чтобы все таки максимально близкие записи были зеленного цвета. 
И еще один вопрос - проверь когда создаются embidings и протестируй. По идее при каждом изменении профиля пользователя.
```
```
Необходимо еще сделать чтобы при регистрации генирировалась аватарка для пользователя. Рандомная. И давай сделаем чтобы она отображалась в профиле и чате, но ее нельзя было менять. То есть чтобы она создавалась при регистрации один раз, без возможности редактирования.
```
```
И еще давай сделаем одну страницу дополнительно. Это список открытых чатов. 
Чтобы к нему можно было переходить, и уже из списка можно было переходить к самому чату.
```
```
Отлично. 
Теперь мне необходимо чтобы ты сделал следуюущее. 
- Удалил из базы текущих пользователей, и чаты.
- Заполнил их уже рабочими данными из файла @data/participants.json 
Необходимо данные перенести в точности в поля!! 
- После этого необходимо сгенерировать для каждого пользователя аватарку и занести это в соответствующее поле.
- Далее необходимо создать для каждого пользователя embedings
- Потом необходимо каждому пользователю присвоить пароль!! Пусть он будет у всех одинаковый "1" 
В итоге получиться по сути новая база данных с полностью рабочими данными и готовая к использованию.
Используй для этого скрипты существующие и можешь создать новые, все переменные есть в переменных окружения. 
```
```
Давай так сделаем. Что если существует пользователь с таким email, то проcто скидываем у него пароль на "1". Проблема только с users профили ты корректно сможешь заполнить. 
Можно так сделать?
```

# Gemini
```
Мне надо чтобы ты сделал небольшую презентацию чтобы я ее расшарил. Презинтация рассказывает про проект. Это проект который представлен на хакатоне из документации ты поймешь про что он.

Надо показать что реализован RAG, реализован флаг "Занято" и реализован  Pool  пространство отоюражения пользователей, и еще чат.

В конец напиши что этоновый стартап и я ищу единомышленников.

Алексей Гребенкин, контакт телеграм @avgrebenkin можешь ссылку на аккаунт телеграма в qr код сделать. qr Код должен быть красивым. Страниц должно быть 3-4

Статистика. Потрачено было 6 часов и примерно $5, Был использован CLaude, Cursor IDE, Opus4.5, Gemini 3 Pro(для презентации)

В презентации кстати можно перечислить стек
```