/**
 * Script to assign avatars to users in Supabase database
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read .env.local file manually
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key) {
        env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
  
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.log('Make sure .env.local has these variables set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🖼️  Assigning avatars to users...\n');
  
  // Get all profiles
  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('id, name')
    .order('created_at', { ascending: true });
  
  if (fetchError) {
    console.error('❌ Error fetching profiles:', fetchError.message);
    process.exit(1);
  }
  
  if (!profiles || profiles.length === 0) {
    console.log('No profiles found in database');
    process.exit(0);
  }
  
  console.log(`Found ${profiles.length} profiles\n`);
  
  let updated = 0;
  let errors = 0;
  
  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];
    // Assign avatar based on index (cycling through 1-100)
    const avatarNumber = (i % 100) + 1;
    const avatarUrl = `/avatars/avatar-${avatarNumber}.svg`;
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', profile.id);
    
    if (updateError) {
      console.error(`❌ Failed to update ${profile.name}: ${updateError.message}`);
      errors++;
    } else {
      updated++;
      process.stdout.write(`\r✅ Updated ${updated}/${profiles.length} profiles`);
    }
  }
  
  console.log(`\n\n🎉 Done! Updated ${updated} profiles, ${errors} errors`);
}

main().catch(console.error);

