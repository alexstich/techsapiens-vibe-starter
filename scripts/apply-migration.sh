#!/bin/bash

# Скрипт для применения миграций через Supabase REST API
# Использование: ./scripts/apply-migration.sh [migration_file]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Загружаем переменные окружения из .env
if [ -f "$PROJECT_ROOT/.env" ]; then
  export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Ошибка: NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY не установлены в .env"
  exit 1
fi

MIGRATION_FILE=${1:-"$PROJECT_ROOT/supabase/migrations/20241206000001_initial_schema.sql"}

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Файл миграции не найден: $MIGRATION_FILE"
  exit 1
fi

echo "🚀 Применение миграции: $(basename $MIGRATION_FILE)"
echo "📍 К проекту: $NEXT_PUBLIC_SUPABASE_URL"

# Читаем SQL из файла
SQL_CONTENT=$(cat "$MIGRATION_FILE")

# Выполняем через REST API
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL_CONTENT" | jq -Rs .)}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
  echo "✅ Миграция успешно применена!"
else
  echo "⚠️  REST API не поддерживает exec_sql, пробуем через pg_query..."
  
  # Альтернативный метод - выполнить через psql URL
  # Извлекаем project-id
  PROJECT_ID=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed 's|https://||' | cut -d'.' -f1)
  
  echo ""
  echo "📋 Для применения миграции выполни SQL вручную:"
  echo "   1. Открой https://supabase.com/dashboard/project/${PROJECT_ID}/sql/new"
  echo "   2. Вставь содержимое файла: $MIGRATION_FILE"
  echo "   3. Нажми 'Run'"
  echo ""
  echo "Или используй psql с Database URL из Dashboard -> Settings -> Database"
fi

