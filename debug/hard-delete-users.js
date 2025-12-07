/**
 * Скрипт для полного (hard) удаления ВСЕХ пользователей из auth.users
 * Использует прямой SQL запрос для обхода soft delete
 * 
 * Запуск: node --env-file=.env debug/hard-delete-users.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log('🗑️  Полное удаление всех пользователей...\n');
  
  // 1. Удаляем все профили
  console.log('   Удаление профилей...');
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (profileError) {
    console.log(`   ⚠️  ${profileError.message}`);
  } else {
    console.log('   ✅ Профили удалены');
  }
  
  // 2. Удаляем все сообщения
  console.log('   Удаление сообщений...');
  const { error: msgError } = await supabase
    .from('messages')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (msgError) {
    console.log(`   ⚠️  ${msgError.message}`);
  } else {
    console.log('   ✅ Сообщения удалены');
  }
  
  // 3. Получаем всех пользователей
  console.log('   Получение списка пользователей...');
  const { data: authData, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error(`   ❌ ${listError.message}`);
    return;
  }
  
  const users = authData.users;
  console.log(`   📋 Найдено ${users.length} пользователей\n`);
  
  if (users.length === 0) {
    console.log('   ✅ База пуста!');
    return;
  }
  
  // 4. Удаляем каждого через API (это должно быть hard delete по умолчанию)
  let deleted = 0;
  let failed = 0;
  
  for (const user of users) {
    // Передаём false для shouldSoftDelete чтобы гарантировать hard delete
    const { error } = await supabase.auth.admin.deleteUser(user.id, false);
    
    if (error) {
      console.log(`   ❌ ${user.email}: ${error.message}`);
      failed++;
    } else {
      deleted++;
      process.stdout.write(`\r   ✅ Удалено: ${deleted}/${users.length}`);
    }
  }
  
  console.log(`\n\n   Удалено: ${deleted}, ошибок: ${failed}`);
  
  // 5. Проверка
  const { data: checkData } = await supabase.auth.admin.listUsers();
  console.log(`\n   📊 Осталось пользователей: ${checkData?.users?.length || 0}`);
  
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  console.log(`   📊 Осталось профилей: ${count || 0}`);
  
  console.log('\n✅ Готово!');
}

main().catch(console.error);
