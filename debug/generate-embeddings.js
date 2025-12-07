/**
 * Скрипт для генерации embeddings для всех профилей у которых их нет.
 * Запуск: node --env-file=.env debug/generate-embeddings.js
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Нужен service role для обхода RLS
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    return null;
  }
}

function buildProfileText(profile) {
  const textParts = [];

  if (profile.name) {
    textParts.push(`Имя: ${profile.name}`);
  }
  if (profile.bio) {
    textParts.push(`О себе: ${profile.bio}`);
  }
  if (profile.skills && profile.skills.length > 0) {
    textParts.push(`Навыки: ${profile.skills.join(', ')}`);
  }
  if (profile.can_help) {
    textParts.push(`Могу помочь: ${profile.can_help}`);
  }
  if (profile.needs_help) {
    textParts.push(`Нужна помощь: ${profile.needs_help}`);
  }
  if (profile.startup_description) {
    textParts.push(`Стартап: ${profile.startup_description}`);
  }

  return textParts.join('\n');
}

async function main() {
  console.log('🔍 Загружаем профили без embedding...\n');

  // Получаем все профили где embedding IS NULL
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, name, bio, skills, can_help, needs_help, startup_description, embedding')
    .is('embedding', null);

  if (error) {
    console.error('❌ Ошибка загрузки профилей:', error.message);
    return;
  }

  console.log(`📋 Найдено ${profiles.length} профилей без embedding\n`);

  if (profiles.length === 0) {
    console.log('✅ Все профили уже имеют embedding!');
    return;
  }

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];
    const text = buildProfileText(profile);

    // Пропускаем если текста недостаточно
    if (text.length < 10) {
      console.log(`⏭️  [${i + 1}/${profiles.length}] ${profile.name} - пропущен (мало текста)`);
      skipped++;
      continue;
    }

    console.log(`🔄 [${i + 1}/${profiles.length}] ${profile.name}...`);

    const embedding = await generateEmbedding(text);

    if (!embedding) {
      console.log(`   ❌ Ошибка генерации embedding`);
      failed++;
      continue;
    }

    // Сохраняем embedding в базу
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ embedding: JSON.stringify(embedding) })
      .eq('id', profile.id);

    if (updateError) {
      console.log(`   ❌ Ошибка сохранения: ${updateError.message}`);
      failed++;
    } else {
      console.log(`   ✅ Embedding сохранён`);
      success++;
    }

    // Небольшая задержка чтобы не перегрузить API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 РЕЗУЛЬТАТ:');
  console.log(`   ✅ Успешно: ${success}`);
  console.log(`   ❌ Ошибки: ${failed}`);
  console.log(`   ⏭️  Пропущено: ${skipped}`);
  console.log('='.repeat(50));
}

main().catch(console.error);
