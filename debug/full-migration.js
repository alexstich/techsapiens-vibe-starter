/**
 * Полная миграция базы данных:
 * 1. Удаление всех существующих пользователей и чатов
 * 2. Создание пользователей из participants.json с паролем "1"
 * 3. Заполнение профилей данными
 * 4. Присвоение аватарок
 * 5. Генерация embeddings
 * 
 * Запуск: node --env-file=.env debug/full-migration.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// ============ КОНФИГУРАЦИЯ ============

const PASSWORD_FOR_ALL = '1'; // Пароль для всех пользователей

// ============ ИНИЦИАЛИЗАЦИЯ ============

// Проверка переменных окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!openaiKey) {
  console.error('❌ Missing OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const openai = new OpenAI({ apiKey: openaiKey });

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============

function loadParticipants() {
  const filePath = path.join(__dirname, '..', 'data', 'participants.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('   ❌ Ошибка генерации embedding:', error.message);
    return null;
  }
}

function buildProfileText(profile) {
  const textParts = [];
  
  if (profile.name) textParts.push(`Имя: ${profile.name}`);
  if (profile.bio) textParts.push(`О себе: ${profile.bio}`);
  if (profile.skills && profile.skills.length > 0) {
    textParts.push(`Навыки: ${profile.skills.join(', ')}`);
  }
  if (profile.can_help) textParts.push(`Могу помочь: ${profile.can_help}`);
  if (profile.needs_help) textParts.push(`Нужна помощь: ${profile.needs_help}`);
  if (profile.startup_description) {
    textParts.push(`Стартап: ${profile.startup_description}`);
  }
  
  return textParts.join('\n');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============ ОСНОВНЫЕ ФУНКЦИИ ============

async function step1_deleteAll() {
  console.log('\n📍 ШАГ 1: Удаление существующих данных...\n');
  
  // Удаляем сообщения
  console.log('   🗑️  Удаление сообщений...');
  const { error: msgError } = await supabase
    .from('messages')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Хак для удаления всех
  
  if (msgError) {
    console.log(`   ⚠️  Сообщения: ${msgError.message}`);
  } else {
    console.log('   ✅ Сообщения удалены');
  }
  
  // Удаляем все профили напрямую (чтобы не было orphaned)
  console.log('   🗑️  Удаление профилей...');
  const { error: profilesError } = await supabase
    .from('profiles')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (profilesError) {
    console.log(`   ⚠️  Профили: ${profilesError.message}`);
  } else {
    console.log('   ✅ Профили удалены');
  }
  
  // Получаем список всех пользователей
  console.log('   🗑️  Получение списка пользователей...');
  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('   ❌ Ошибка получения пользователей:', listError.message);
    return;
  }
  
  console.log(`   📋 Найдено ${authUsers.users.length} пользователей для удаления`);
  
  // Удаляем каждого пользователя (hard delete)
  let deleted = 0;
  for (const user of authUsers.users) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      user.id,
      true // shouldSoftDelete = false means HARD delete
    );
    if (deleteError) {
      console.error(`   ❌ Ошибка удаления ${user.email}: ${deleteError.message}`);
    } else {
      deleted++;
      process.stdout.write(`\r   🗑️  Удалено пользователей: ${deleted}/${authUsers.users.length}`);
    }
  }
  
  console.log(`\n   ✅ Удалено ${deleted} пользователей`);
}

// Функция для генерации email из имени (для участников без email)
function generateEmailFromName(name, index) {
  // Транслитерация и очистка имени
  const translitMap = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };
  
  const cleanName = name.toLowerCase()
    .split('')
    .map(char => translitMap[char] || char)
    .join('')
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);
  
  return `${cleanName}${index}@thepool.local`;
}

// Валидация email
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// Найти пользователя по email
async function findUserByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) return null;
  return data.users.find(u => u.email === email);
}

async function step2_createOrUpdateUsers(participants) {
  console.log('\n📍 ШАГ 2: Создание/обновление пользователей...\n');
  
  const processedUsers = [];
  let created = 0;
  let updated = 0;
  let errors = 0;
  let generatedEmails = 0;
  
  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i];
    
    // Определяем email - используем реальный или генерируем
    let email = participant.email;
    if (!isValidEmail(email)) {
      email = generateEmailFromName(participant.name, i + 1);
      generatedEmails++;
      console.log(`   📧 Сгенерирован email для ${participant.name}: ${email}`);
    }
    
    // Пробуем создать пользователя
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: PASSWORD_FOR_ALL,
      email_confirm: true,
      user_metadata: {
        name: participant.name
      }
    });
    
    if (authError) {
      // Если пользователь уже существует - обновляем пароль
      if (authError.message.includes('already been registered')) {
        const existingUser = await findUserByEmail(email);
        
        if (existingUser) {
          // Обновляем пароль существующего пользователя
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: PASSWORD_FOR_ALL }
          );
          
          if (updateError) {
            console.error(`   ❌ [${i + 1}/${participants.length}] ${participant.name}: не удалось обновить пароль`);
            errors++;
            continue;
          }
          
          processedUsers.push({
            id: existingUser.id,
            participant: participant,
            index: i,
            email: email,
            isExisting: true
          });
          
          updated++;
          process.stdout.write(`\r   ✅ Обработано: ${created + updated}/${participants.length} (создано: ${created}, обновлено: ${updated})`);
        } else {
          console.error(`   ❌ [${i + 1}/${participants.length}] ${participant.name}: пользователь существует, но не найден`);
          errors++;
        }
      } else {
        console.error(`   ❌ [${i + 1}/${participants.length}] ${participant.name}: ${authError.message}`);
        errors++;
      }
      continue;
    }
    
    // Пользователь создан успешно
    processedUsers.push({
      id: authData.user.id,
      participant: participant,
      index: i,
      email: email,
      isExisting: false
    });
    
    created++;
    process.stdout.write(`\r   ✅ Обработано: ${created + updated}/${participants.length} (создано: ${created}, обновлено: ${updated})`);
    
    // Небольшая задержка
    await sleep(50);
  }
  
  console.log(`\n   ✅ Готово: создано ${created}, обновлено ${updated} (${generatedEmails} с сгенерированным email), ошибок: ${errors}`);
  return processedUsers;
}

async function step3_fillProfiles(createdUsers) {
  console.log('\n📍 ШАГ 3: Заполнение профилей данными...\n');
  
  let updated = 0;
  let errors = 0;
  
  for (const user of createdUsers) {
    const p = user.participant;
    
    // Присваиваем аватарку (цикл по 100 аватаркам)
    const avatarNumber = (user.index % 100) + 1;
    const avatarUrl = `/avatars/avatar-${avatarNumber}.svg`;
    
    const profileData = {
      name: p.name,
      bio: p.bio || null,
      avatar_url: avatarUrl,
      telegram: p.telegram || null,
      linkedin: p.linkedin || null,
      skills: p.skills || [],
      looking_for: p.lookingFor || [],
      can_help: p.canHelp || null,
      needs_help: p.needsHelp || null,
      has_startup: p.hasStartup || false,
      startup_stage: p.startupStage || null,
      startup_description: p.startupDescription || null,
      is_ready_to_chat: true, // Все готовы к общению
    };
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id);
    
    if (updateError) {
      console.error(`   ❌ ${p.name}: ${updateError.message}`);
      errors++;
    } else {
      updated++;
      process.stdout.write(`\r   ✅ Обновлено профилей: ${updated}/${createdUsers.length}`);
    }
  }
  
  console.log(`\n   ✅ Обновлено ${updated} профилей, ошибок: ${errors}`);
}

async function step4_generateEmbeddings() {
  console.log('\n📍 ШАГ 4: Генерация embeddings...\n');
  
  // Получаем все профили
  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('id, name, bio, skills, can_help, needs_help, startup_description');
  
  if (fetchError) {
    console.error('   ❌ Ошибка получения профилей:', fetchError.message);
    return;
  }
  
  console.log(`   📋 Найдено ${profiles.length} профилей\n`);
  
  let success = 0;
  let failed = 0;
  let skipped = 0;
  
  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];
    const text = buildProfileText(profile);
    
    // Пропускаем если текста недостаточно
    if (text.length < 20) {
      console.log(`   ⏭️  [${i + 1}/${profiles.length}] ${profile.name} - пропущен (мало текста)`);
      skipped++;
      continue;
    }
    
    process.stdout.write(`\r   🔄 [${i + 1}/${profiles.length}] Генерация embedding для ${profile.name}...                    `);
    
    const embedding = await generateEmbedding(text);
    
    if (!embedding) {
      failed++;
      continue;
    }
    
    // Сохраняем embedding в базу
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ embedding: JSON.stringify(embedding) })
      .eq('id', profile.id);
    
    if (updateError) {
      console.log(`\n   ❌ ${profile.name}: ${updateError.message}`);
      failed++;
    } else {
      success++;
    }
    
    // Задержка для API
    await sleep(100);
  }
  
  console.log(`\n\n   ✅ Embeddings: успешно ${success}, ошибок ${failed}, пропущено ${skipped}`);
}

async function step5_verify() {
  console.log('\n📍 ШАГ 5: Проверка результатов...\n');
  
  // Подсчёт пользователей
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  console.log(`   👥 Пользователей в auth.users: ${authUsers?.users?.length || 0}`);
  
  // Подсчёт профилей
  const { count: profileCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  console.log(`   📋 Профилей в profiles: ${profileCount || 0}`);
  
  // Профили с embeddings
  const { data: profilesWithEmb } = await supabase
    .from('profiles')
    .select('id')
    .not('embedding', 'is', null);
  console.log(`   🧠 Профилей с embedding: ${profilesWithEmb?.length || 0}`);
  
  // Профили с аватарками
  const { data: profilesWithAvatar } = await supabase
    .from('profiles')
    .select('id')
    .not('avatar_url', 'is', null);
  console.log(`   🖼️  Профилей с аватаркой: ${profilesWithAvatar?.length || 0}`);
  
  // Сообщения
  const { count: msgCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true });
  console.log(`   💬 Сообщений: ${msgCount || 0}`);
}

// ============ MAIN ============

async function main() {
  console.log('═'.repeat(60));
  console.log('🚀 ПОЛНАЯ МИГРАЦИЯ БАЗЫ ДАННЫХ');
  console.log('═'.repeat(60));
  
  // Загрузка участников
  const participants = loadParticipants();
  console.log(`\n📂 Загружено ${participants.length} участников из participants.json`);
  
  // Выполняем шаги
  await step1_deleteAll();
  const createdUsers = await step2_createOrUpdateUsers(participants);
  
  if (createdUsers.length === 0) {
    console.error('\n❌ Не удалось создать ни одного пользователя!');
    process.exit(1);
  }
  
  await step3_fillProfiles(createdUsers);
  await step4_generateEmbeddings();
  await step5_verify();
  
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 МИГРАЦИЯ ЗАВЕРШЕНА!');
  console.log('═'.repeat(60));
  console.log(`\n📧 Все пользователи могут войти с паролем: "${PASSWORD_FOR_ALL}"`);
  console.log('\n');
}

main().catch(err => {
  console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', err);
  process.exit(1);
});
