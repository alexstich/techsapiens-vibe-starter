import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { profileId } = await request.json()

    if (!profileId) {
      return NextResponse.json(
        { error: "Profile ID is required" },
        { status: 400 }
      )
    }

    // Создаём Supabase клиент
    const supabase = await createClient()

    // Получаем профиль
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("name, bio, skills, can_help, needs_help, startup_description")
      .eq("id", profileId)
      .single()

    if (fetchError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      )
    }

    // Собираем текст для эмбеддинга
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

    // Если текста недостаточно, не создаём эмбеддинг
    if (combinedText.length < 10) {
      return NextResponse.json(
        { message: "Not enough text to generate embedding" },
        { status: 200 }
      )
    }

    // Вызываем OpenAI Embeddings API
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: combinedText,
    })

    const embedding = embeddingResponse.data[0].embedding

    // Обновляем профиль с эмбеддингом
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ embedding: JSON.stringify(embedding) })
      .eq("id", profileId)

    if (updateError) {
      console.error("Error updating profile embedding:", updateError)
      return NextResponse.json(
        { error: "Failed to save embedding" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Embedding API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

