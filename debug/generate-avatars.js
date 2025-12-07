/**
 * Script to generate avatar images using DiceBear API
 * Generates 100 unique avatars in various styles
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const AVATARS_DIR = path.join(__dirname, '../public/avatars');

// DiceBear styles to use (mix of different styles for variety)
const STYLES = [
  'avataaars',
  'bottts',
  'lorelei',
  'notionists',
  'personas',
  'pixel-art',
  'thumbs',
  'fun-emoji',
];

// Ensure avatars directory exists
if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

// Function to download an avatar
function downloadAvatar(seed, style, filename) {
  return new Promise((resolve, reject) => {
    const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const filePath = path.join(AVATARS_DIR, filename);
      const fileStream = fs.createWriteStream(filePath);
      
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(filePath);
      });
      
      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

// Generate random seed
function randomSeed() {
  return Math.random().toString(36).substring(2, 15);
}

async function main() {
  console.log('🎨 Generating avatars...\n');
  
  const totalAvatars = 100;
  let generated = 0;
  
  for (let i = 1; i <= totalAvatars; i++) {
    const style = STYLES[i % STYLES.length];
    const seed = randomSeed();
    const filename = `avatar-${i}.svg`;
    
    try {
      await downloadAvatar(seed, style, filename);
      generated++;
      process.stdout.write(`\r✅ Generated ${generated}/${totalAvatars} avatars`);
      
      // Small delay to not overwhelm the API
      await new Promise(r => setTimeout(r, 100));
    } catch (error) {
      console.error(`\n❌ Failed to generate ${filename}: ${error.message}`);
    }
  }
  
  console.log(`\n\n🎉 Done! Generated ${generated} avatars in ${AVATARS_DIR}`);
}

main().catch(console.error);

