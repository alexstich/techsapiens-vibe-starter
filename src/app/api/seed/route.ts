import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"
import fs from "fs"
import path from "path"

// Admin client с service_role key для создания пользователей
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface Participant {
  id: number
  name: string
  telegram: string
  linkedin: string
  bio: string
  skills: string[]
  hasStartup: boolean
  startupStage: string
  startupDescription: string
  startupName: string
  lookingFor: string[]
  canHelp: string
  needsHelp: string
  aiUsage: string
  email: string
  photo: string
  custom_1: string
}

// Генерация embedding для профиля
async function generateEmbedding(profile: {
  name: string
  bio: string
  skills: string[]
  can_help: string
  needs_help: string
  startup_description: string
}): Promise<number[] | null> {
  const textParts: string[] = []

  if (profile.name) {
    textParts.push(`Имя: ${profile.name}`)
  }
  if (profile.bio) {
    textParts.push(`О себе: ${profile.bio}`)
  }
  if (profile.skills && profile.skills.length > 0) {
    textParts.push(`Навыки: ${profile.skills.join(", ")}`)
  }
  if (profile.can_help) {
    textParts.push(`Могу помочь: ${profile.can_help}`)
  }
  if (profile.needs_help) {
    textParts.push(`Нужна помощь: ${profile.needs_help}`)
  }
  if (profile.startup_description) {
    textParts.push(`Стартап: ${profile.startup_description}`)
  }

  const combinedText = textParts.join("\n")

  if (combinedText.length < 10) {
    return null
  }

  try {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: combinedText,
    })
    return embeddingResponse.data[0].embedding
  } catch (error) {
    console.error("Error generating embedding:", error)
    return null
  }
}

// Небольшая задержка для rate limiting
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(request: NextRequest) {
  try {
    // Проверяем секретный ключ для защиты endpoint'а
    const { secret } = await request.json()

    if (secret !== process.env.SEED_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Читаем participants.json
    const participantsPath = path.join(
      process.cwd(),
      "data",
      "participants.json"
    )
    const participantsData = fs.readFileSync(participantsPath, "utf-8")
    const participants: Participant[] = JSON.parse(participantsData)

    console.log(`📊 Found ${participants.length} participants to seed`)

    const results = {
      total: participants.length,
      created: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i]
      const email = `user${participant.id}@techsapiens.local`
      const password = `TechSapiens2024!${participant.id}`

      console.log(
        `\n[${i + 1}/${participants.length}] Processing: ${participant.name}`
      )

      try {
        // 1. Создаем auth user
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              name: participant.name,
            },
          })

        let userId: string

        if (authError) {
          // Если пользователь уже существует, пробуем найти его
          if (authError.message?.includes("already been registered")) {
            console.log(`  ⚠️ User already exists, looking up...`)

            // Ищем существующего пользователя
            const { data: existingUsers } =
              await supabaseAdmin.auth.admin.listUsers()
            const existingUser = existingUsers?.users?.find(
              (u) => u.email === email
            )

            if (existingUser) {
              userId = existingUser.id
              console.log(`  ✓ Found existing user: ${userId}`)
            } else {
              throw new Error("User exists but not found")
            }
          } else {
            throw authError
          }
        } else {
          userId = authData.user!.id
          console.log(`  ✓ Created auth user: ${userId}`)
        }

        // 2. Проверяем существует ли профиль
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .single()

        if (existingProfile) {
          console.log(`  ⚠️ Profile already exists, skipping...`)
          results.skipped++
          continue
        }

        // 3. Создаем профиль
        const profileData = {
          id: userId,
          name: participant.name,
          bio: participant.bio || null,
          avatar_url: participant.photo || null,
          telegram: participant.telegram || null,
          linkedin: participant.linkedin || null,
          skills: participant.skills || [],
          looking_for: participant.lookingFor || [],
          can_help: participant.canHelp || null,
          needs_help: participant.needsHelp || null,
          has_startup: participant.hasStartup || false,
          startup_stage: participant.startupStage || null,
          startup_description: participant.startupDescription || null,
          is_ready_to_chat: Math.random() > 0.3, // 70% шанс быть готовым к чату
        }

        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .insert(profileData)

        if (profileError) {
          throw profileError
        }

        console.log(`  ✓ Created profile`)

        // 4. Генерируем embedding
        const embedding = await generateEmbedding({
          name: profileData.name,
          bio: profileData.bio || "",
          skills: profileData.skills,
          can_help: profileData.can_help || "",
          needs_help: profileData.needs_help || "",
          startup_description: profileData.startup_description || "",
        })

        if (embedding) {
          const { error: embeddingError } = await supabaseAdmin
            .from("profiles")
            .update({ embedding: JSON.stringify(embedding) })
            .eq("id", userId)

          if (embeddingError) {
            console.log(`  ⚠️ Failed to save embedding: ${embeddingError.message}`)
          } else {
            console.log(`  ✓ Generated and saved embedding`)
          }
        } else {
          console.log(`  ⚠️ Not enough text for embedding`)
        }

        results.created++

        // Rate limiting - небольшая задержка между запросами
        await delay(200)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error"
        console.error(`  ❌ Error: ${errorMessage}`)
        results.errors.push(`${participant.name}: ${errorMessage}`)
      }
    }

    console.log("\n" + "=".repeat(50))
    console.log("📊 Seed completed!")
    console.log(`   Created: ${results.created}`)
    console.log(`   Skipped: ${results.skipped}`)
    console.log(`   Errors: ${results.errors.length}`)

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}

// GET для проверки статуса
export async function GET() {
  return NextResponse.json({
    message: "Seed API is ready",
    usage: "POST with { secret: 'your-seed-secret' }",
    note: "Make sure SUPABASE_SERVICE_ROLE_KEY and SEED_SECRET are set in .env",
  })
}

