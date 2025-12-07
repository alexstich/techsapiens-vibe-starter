"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
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
      
      // If no profile exists, create one with random avatar
      if (!profileData) {
        // Генерируем случайную аватарку из 100 доступных
        const randomAvatarNumber = Math.floor(Math.random() * 100) + 1
        const avatarUrl = `/avatars/avatar-${randomAvatarNumber}.svg`
        
        const newProfile: Profile = {
          id: user.id,
          name: user.email?.split("@")[0] || "New User",
          bio: null,
          avatar_url: avatarUrl,
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
            avatar_url: avatarUrl,
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
        <div className="flex flex-col items-center gap-4 animate-in fade-in-0 duration-300">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Загрузка профиля...</p>
        </div>
      </div>
    )
  }

  // Check if profile is incomplete
  const isProfileIncomplete = !profile.bio || !profile.skills || !profile.looking_for

  return (
    <div className="min-h-screen bg-background py-6 sm:py-8 px-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <div className="max-w-[500px] mx-auto space-y-4">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-2 h-10 touch-target transition-all hover:shadow-sm"
        >
          ← Назад
        </Button>

        {/* Incomplete profile alert */}
        {isProfileIncomplete && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              💡 Заполните профиль полностью для лучшего подбора
            </p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
              Добавьте bio, навыки и что вы ищете
            </p>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col items-center gap-4">
              {/* Avatar - не редактируется */}
              {profile.avatar_url && (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profile.avatar_url}
                    alt={profile.name || "Аватар"}
                    className="w-24 h-24 rounded-full border-4 border-primary/20"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-muted rounded-full p-1">
                    <span className="text-xs text-muted-foreground">🔒</span>
                  </div>
                </div>
              )}
              <CardTitle className="text-xl sm:text-2xl text-center">Мой профиль</CardTitle>
            </div>
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
