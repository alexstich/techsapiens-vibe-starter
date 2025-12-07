/**
 * Скрипт для проверки и обновления статуса is_ready_to_chat в базе данных
 * Устанавливает случайно для 50% пользователей is_ready_to_chat = true
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cqtujtrfxoegvbdcqdpx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdHVqdHJmeG9lZ3ZiZGNxZHB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDk1MzQ5MSwiZXhwIjoyMDgwNTI5NDkxfQ.x79Q8LB9n-MMwMbLhplsrgrAhdZfNGT9e3MC0rBEdms';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkStatus() {
  console.log('📊 Проверка текущего состояния is_ready_to_chat...\n');
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, name, is_ready_to_chat')
    .limit(500);
    
  if (error) {
    console.error('Ошибка при получении профилей:', error);
    return null;
  }
  
  const total = profiles.length;
  const ready = profiles.filter(p => p.is_ready_to_chat === true).length;
  const notReady = profiles.filter(p => p.is_ready_to_chat === false).length;
  const nullStatus = profiles.filter(p => p.is_ready_to_chat === null).length;
  
  console.log(`Всего профилей: ${total}`);
  console.log(`is_ready_to_chat = true: ${ready} (${((ready/total)*100).toFixed(1)}%)`);
  console.log(`is_ready_to_chat = false: ${notReady} (${((notReady/total)*100).toFixed(1)}%)`);
  console.log(`is_ready_to_chat = null: ${nullStatus} (${((nullStatus/total)*100).toFixed(1)}%)`);
  console.log('');
  
  return profiles;
}

async function updateRandomHalf() {
  console.log('🔄 Обновление статусов...\n');
  
  // Получаем все профили
  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .limit(500);
    
  if (fetchError) {
    console.error('Ошибка при получении профилей:', fetchError);
    return;
  }
  
  // Перемешиваем и выбираем ~50%
  const shuffled = profiles.sort(() => Math.random() - 0.5);
  const halfIndex = Math.floor(shuffled.length / 2);
  const toSetReady = shuffled.slice(0, halfIndex);
  const toSetNotReady = shuffled.slice(halfIndex);
  
  console.log(`Устанавливаем is_ready_to_chat = true для ${toSetReady.length} пользователей`);
  console.log(`Устанавливаем is_ready_to_chat = false для ${toSetNotReady.length} пользователей`);
  
  // Обновляем is_ready_to_chat = true
  const { error: errorReady } = await supabase
    .from('profiles')
    .update({ is_ready_to_chat: true })
    .in('id', toSetReady.map(p => p.id));
    
  if (errorReady) {
    console.error('Ошибка при обновлении ready:', errorReady);
    return;
  }
  
  // Обновляем is_ready_to_chat = false
  const { error: errorNotReady } = await supabase
    .from('profiles')
    .update({ is_ready_to_chat: false })
    .in('id', toSetNotReady.map(p => p.id));
    
  if (errorNotReady) {
    console.error('Ошибка при обновлении not ready:', errorNotReady);
    return;
  }
  
  console.log('✅ Обновление завершено!\n');
}

async function main() {
  console.log('='.repeat(50));
  console.log('Скрипт обновления статусов is_ready_to_chat');
  console.log('='.repeat(50) + '\n');
  
  // Проверяем текущее состояние
  await checkStatus();
  
  // Обновляем статусы
  await updateRandomHalf();
  
  // Проверяем результат
  console.log('📊 Результат после обновления:\n');
  await checkStatus();
}

main().catch(console.error);
