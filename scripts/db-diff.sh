#!/bin/bash

# Скрипт для создания миграции на основе изменений в базе данных
# Использование: ./scripts/db-diff.sh <migration_name>

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

MIGRATION_NAME=${1:-"migration"}

echo "📝 Создание миграции '$MIGRATION_NAME' для проекта: $PROJECT_ID"

cd "$PROJECT_ROOT"

# Линкуем проект если ещё не залинкован
npx supabase link --project-ref "$PROJECT_ID" 2>/dev/null || true

# Создаём миграцию на основе diff
npx supabase db diff -f "$MIGRATION_NAME"

echo "✅ Миграция создана в supabase/migrations/"

