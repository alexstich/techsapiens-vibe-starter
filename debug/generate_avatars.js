/**
 * Скрипт для генерации аватарок участников
 * 
 * Использование:
 * 1. npm install sharp (если не установлен)
 * 2. node debug/generate_avatars.js
 * 
 * Скрипт:
 * - Скачивает уникальные фото с thispersondoesnotexist.com
 * - Сжимает до 160x160
 * - Сохраняет в public/avatars/
 * - Обновляет participants.json с путями к аватаркам (custom_2)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Проверяем наличие sharp
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Модуль sharp не установлен!');
  console.error('   Выполните: npm install sharp');
  process.exit(1);
}

const AVATAR_SIZE = 160;
const AVATARS_DIR = path.join(__dirname, '..', 'public', 'avatars');
const PARTICIPANTS_PATH = path.join(__dirname, '..', 'data', 'participants.json');

// Задержка между запросами (чтобы не забанили)
const DELAY_MS = 1500;

// Создаём папку для аватарок
if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
  console.log('📁 Создана папка:', AVATARS_DIR);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Скачиваем изображение с thispersondoesnotexist.com
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    }, (response) => {
      if (response.statusCode === 200) {
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

// Сжимаем и сохраняем изображение
async function processAndSaveImage(imageBuffer, outputPath) {
  await sharp(imageBuffer)
    .resize(AVATAR_SIZE, AVATAR_SIZE, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ quality: 80 })
    .toFile(outputPath);
}

async function main() {
  // Читаем participants.json
  const participants = JSON.parse(fs.readFileSync(PARTICIPANTS_PATH, 'utf8'));
  console.log(`📊 Найдено ${participants.length} участников`);

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i];
    const avatarFilename = `avatar_${participant.id}.jpg`;
    const avatarPath = path.join(AVATARS_DIR, avatarFilename);
    
    // Путь для веба (относительно public/)
    const webPath = `/avatars/${avatarFilename}`;

    console.log(`\n[${i + 1}/${participants.length}] ${participant.name}`);

    // Проверяем, существует ли уже аватарка
    if (fs.existsSync(avatarPath) && participant.custom_2 === webPath) {
      console.log(`  ⏭️  Аватарка уже существует, пропускаем`);
      skipped++;
      continue;
    }

    try {
      // Скачиваем изображение
      console.log(`  ⬇️  Скачиваю фото...`);
      const imageBuffer = await downloadImage('https://thispersondoesnotexist.com/');
      
      // Сжимаем и сохраняем
      console.log(`  🔄 Сжимаю до ${AVATAR_SIZE}x${AVATAR_SIZE}...`);
      await processAndSaveImage(imageBuffer, avatarPath);
      
      // Обновляем custom_2 в данных участника
      participant.custom_2 = webPath;
      
      console.log(`  ✅ Сохранено: ${avatarFilename}`);
      generated++;

      // Задержка между запросами
      if (i < participants.length - 1) {
        console.log(`  ⏳ Ожидание ${DELAY_MS}ms...`);
        await delay(DELAY_MS);
      }
    } catch (error) {
      console.error(`  ❌ Ошибка: ${error.message}`);
      errors++;
    }
  }

  // Сохраняем обновлённый participants.json
  fs.writeFileSync(PARTICIPANTS_PATH, JSON.stringify(participants, null, 2), 'utf8');

  console.log('\n' + '='.repeat(50));
  console.log('📊 Готово!');
  console.log(`   Сгенерировано: ${generated}`);
  console.log(`   Пропущено: ${skipped}`);
  console.log(`   Ошибок: ${errors}`);
  console.log(`\n📁 Аватарки сохранены в: ${AVATARS_DIR}`);
  console.log(`📝 participants.json обновлён с путями в custom_2`);
}

main().catch(console.error);

