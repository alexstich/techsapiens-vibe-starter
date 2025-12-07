/**
 * Script to populate Supabase profiles with data from participants.json
 * Does NOT overwrite existing name and avatar_url fields
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read .env file manually
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Load participants data
function loadParticipants() {
  const filePath = path.join(__dirname, '..', 'data', 'participants.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

async function main() {
  console.log('📝 Populating profiles with data from participants.json...\n');
  
  // Get all profiles from Supabase
  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('id, name, bio, avatar_url')
    .order('created_at', { ascending: true });
  
  if (fetchError) {
    console.error('❌ Error fetching profiles:', fetchError.message);
    process.exit(1);
  }
  
  console.log(`Found ${profiles.length} profiles in database\n`);
  
  // Load participants data
  const participants = loadParticipants();
  console.log(`Loaded ${participants.length} participants from JSON\n`);
  
  let updated = 0;
  let skipped = 0;
  
  // Update profiles with participant data (distribute evenly)
  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];
    
    // Skip if profile already has bio (already populated)
    if (profile.bio && profile.bio.length > 10) {
      skipped++;
      continue;
    }
    
    // Get a participant (cycling through the list)
    const participant = participants[i % participants.length];
    
    // Prepare update data (don't overwrite name or avatar_url)
    const updateData = {
      bio: participant.bio || null,
      skills: participant.skills || [],
      can_help: participant.canHelp || null,
      needs_help: participant.needsHelp || null,
      looking_for: participant.lookingFor || [],
      has_startup: participant.hasStartup || false,
      startup_stage: participant.startupStage || null,
      startup_description: participant.startupDescription || null,
      telegram: participant.telegram || null,
      linkedin: participant.linkedin || null,
      is_ready_to_chat: Math.random() > 0.3, // 70% ready to chat
    };
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profile.id);
    
    if (updateError) {
      console.error(`❌ Failed to update ${profile.name}: ${updateError.message}`);
    } else {
      updated++;
      process.stdout.write(`\r✅ Updated ${updated}/${profiles.length - skipped} profiles (${skipped} skipped)`);
    }
  }
  
  console.log(`\n\n🎉 Done! Updated ${updated} profiles, skipped ${skipped} (already had data)`);
}

main().catch(console.error);

