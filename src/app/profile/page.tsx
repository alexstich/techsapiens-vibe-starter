"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { ProfileForm } from "@/components/ProfileForm"
import type { Tables } from "@/lib/supabase/types"

type Profile = Tables<"profiles">

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isReadyToChat, setIsReadyToChat] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        router.push("/auth")
        return
      }
      
      setUserId(user.id)
      
      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      
      if (profileError && profileError.code !== "PGRST116") {
        toast({
          variant: "destructive",
          title: "Ошибка загрузки профиля",
          description: profileError.message,
        })
        setIsLoading(false)
        return
      }
      
      // If no profile exists, create one
      if (!profileData) {
        const newProfile: Profile = {
          id: user.id,
          name: user.email?.split("@")[0] || "New User",
          bio: null,
          avatar_url: null,
          telegram: null,
          linkedin: null,
          skills: null,
          looking_for: null,
          can_help: null,
          needs_help: null,
          has_startup: false,
          startup_stage: null,
          startup_description: null,
          is_ready_to_chat: false,
          embedding: null,
          created_at: null,
          updated_at: null,
        }
        
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            name: newProfile.name,
          })
        
        if (insertError) {
          toast({
            variant: "destructive",
            title: "Ошибка создания профиля",
            description: insertError.message,
          })
        }
        
        setProfile(newProfile)
        setIsLoading(false)
        return
      }
      
      setProfile(profileData)
      setIsReadyToChat(profileData.is_ready_to_chat ?? false)
      setIsLoading(false)
    }
    
    loadProfile()
  }, [supabase, router])

  const handleSave = async (data: Partial<Profile>) => {
    if (!userId) return
    
    setIsSaving(true)
    
    const { error } = await supabase
      .from("profiles")
      .update({
        ...data,
        is_ready_to_chat: isReadyToChat,
      })
      .eq("id", userId)
    
    if (error) {
      setIsSaving(false)
      toast({
        variant: "destructive",
        title: "Ошибка сохранения",
        description: error.message,
      })
      return
    }
    
    // Генерируем эмбеддинг профиля
    try {
      await fetch("/api/profile/embedding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profileId: userId }),
      })
    } catch (embeddingError) {
      console.error("Error generating embedding:", embeddingError)
      // Не показываем ошибку пользователю, эмбеддинг - не критичен
    }
    
    setIsSaving(false)
    
    toast({
      title: "Профиль сохранён",
      description: "Ваши изменения успешно сохранены",
    })
  }

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-[500px] mx-auto space-y-4">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-2"
        >
          ← Назад
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Мой профиль</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Ready to Chat Switch - Prominent at top */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border">
              <div>
                <p className="font-medium">Готов к общению</p>
                <p className="text-sm text-muted-foreground">
                  Другие пользователи смогут вас найти
                </p>
              </div>
              <Switch
                checked={isReadyToChat}
                onCheckedChange={setIsReadyToChat}
              />
            </div>

            {/* Profile Form */}
            <ProfileForm
              initialData={profile}
              onSave={handleSave}
              loading={isSaving}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
