#!/bin/bash

# Скрипт для применения миграций к удалённой базе данных Supabase
# Использование: ./scripts/db-push.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Загружаем переменные окружения из .env
if [ -f "$PROJECT_ROOT/.env" ]; then
  export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

# Извлекаем project-id из URL
PROJECT_ID=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed 's|https://||' | cut -d'.' -f1)

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Ошибка: NEXT_PUBLIC_SUPABASE_URL не установлен в .env"
  exit 1
fi

echo "🚀 Применение миграций к проекту: $PROJECT_ID"

cd "$PROJECT_ROOT"

# Линкуем проект если ещё не залинкован
npx supabase link --project-ref "$PROJECT_ID" 2>/dev/null || true

# Применяем миграции
npx supabase db push

echo "✅ Миграции успешно применены"

# Генерируем типы после миграции
echo "📦 Обновление типов..."
"$SCRIPT_DIR/gen-types.sh"

