"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { Tables } from "@/lib/supabase/types"

type Profile = Tables<"profiles">

interface ProfileFormProps {
  initialData: Profile
  onSave: (data: Partial<Profile>) => Promise<void>
  loading: boolean
}

export function ProfileForm({ initialData, onSave, loading }: ProfileFormProps) {
  // Form state
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [telegram, setTelegram] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [skills, setSkills] = useState("")
  const [lookingFor, setLookingFor] = useState("")
  const [canHelp, setCanHelp] = useState("")
  const [needsHelp, setNeedsHelp] = useState("")
  const [hasStartup, setHasStartup] = useState(false)
  const [startupStage, setStartupStage] = useState("")
  const [startupDescription, setStartupDescription] = useState("")

  // Populate form when initialData changes
  useEffect(() => {
    setName(initialData.name || "")
    setBio(initialData.bio || "")
    setTelegram(initialData.telegram || "")
    setLinkedin(initialData.linkedin || "")
    setSkills(initialData.skills?.join(", ") || "")
    setLookingFor(initialData.looking_for?.join(", ") || "")
    setCanHelp(initialData.can_help || "")
    setNeedsHelp(initialData.needs_help || "")
    setHasStartup(initialData.has_startup ?? false)
    setStartupStage(initialData.startup_stage || "")
    setStartupDescription(initialData.startup_description || "")
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Parse comma-separated arrays
    const skillsArray = skills
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    const lookingForArray = lookingFor
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    await onSave({
      name,
      bio: bio || null,
      telegram: telegram || null,
      linkedin: linkedin || null,
      skills: skillsArray.length > 0 ? skillsArray : null,
      looking_for: lookingForArray.length > 0 ? lookingForArray : null,
      can_help: canHelp || null,
      needs_help: needsHelp || null,
      has_startup: hasStartup,
      startup_stage: startupStage || null,
      startup_description: startupDescription || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">Основная информация</h3>
        
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Имя *
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ваше имя"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="bio" className="text-sm font-medium">
            О себе
          </label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Расскажите немного о себе..."
            rows={3}
          />
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">Контакты</h3>
        
        <div className="space-y-2">
          <label htmlFor="telegram" className="text-sm font-medium">
            Telegram
          </label>
          <Input
            id="telegram"
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="@username"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="linkedin" className="text-sm font-medium">
            LinkedIn
          </label>
          <Input
            id="linkedin"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/..."
          />
        </div>
      </div>

      {/* Skills & Interests */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">Навыки и интересы</h3>
        
        <div className="space-y-2">
          <label htmlFor="skills" className="text-sm font-medium">
            Навыки
          </label>
          <Input
            id="skills"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="React, TypeScript, Product Design..."
          />
          <p className="text-xs text-muted-foreground">
            Через запятую
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="lookingFor" className="text-sm font-medium">
            Ищу
          </label>
          <Input
            id="lookingFor"
            value={lookingFor}
            onChange={(e) => setLookingFor(e.target.value)}
            placeholder="Co-founder, Инвестор, Ментор..."
          />
          <p className="text-xs text-muted-foreground">
            Через запятую
          </p>
        </div>
      </div>

      {/* Help Exchange */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">Взаимопомощь</h3>
        
        <div className="space-y-2">
          <label htmlFor="canHelp" className="text-sm font-medium">
            Чем могу помочь
          </label>
          <Textarea
            id="canHelp"
            value={canHelp}
            onChange={(e) => setCanHelp(e.target.value)}
            placeholder="Опишите, чем вы можете помочь другим..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="needsHelp" className="text-sm font-medium">
            В чём нужна помощь
          </label>
          <Textarea
            id="needsHelp"
            value={needsHelp}
            onChange={(e) => setNeedsHelp(e.target.value)}
            placeholder="Опишите, в чём вам нужна помощь..."
            rows={2}
          />
        </div>
      </div>

      {/* Startup Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">Стартап</h3>
        
        <div className="flex items-center justify-between">
          <label htmlFor="hasStartup" className="text-sm font-medium">
            У меня есть стартап
          </label>
          <Switch
            id="hasStartup"
            checked={hasStartup}
            onCheckedChange={setHasStartup}
          />
        </div>

        {hasStartup && (
          <>
            <div className="space-y-2">
              <label htmlFor="startupStage" className="text-sm font-medium">
                Стадия стартапа
              </label>
              <Input
                id="startupStage"
                value={startupStage}
                onChange={(e) => setStartupStage(e.target.value)}
                placeholder="Идея, MVP, Pre-seed, Seed..."
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="startupDescription" className="text-sm font-medium">
                Описание стартапа
              </label>
              <Textarea
                id="startupDescription"
                value={startupDescription}
                onChange={(e) => setStartupDescription(e.target.value)}
                placeholder="Расскажите о вашем стартапе..."
                rows={3}
              />
            </div>
          </>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Сохранение..." : "Сохранить"}
      </Button>
    </form>
  )
}

