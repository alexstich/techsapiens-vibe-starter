#!/bin/bash

# Скрипт для генерации типов Supabase
# Использование: ./scripts/gen-types.sh

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

echo "📦 Генерация типов для проекта: $PROJECT_ID"

# Генерируем типы
npx supabase gen types typescript --project-id "$PROJECT_ID" > "$PROJECT_ROOT/src/lib/supabase/types.ts"

echo "✅ Типы успешно сгенерированы в src/lib/supabase/types.ts"

