import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all profiles except current user
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, name, bio, skills, is_ready_to_chat")
      .neq("id", user.id)
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      currentUser: { id: user.id, email: user.email },
      users: profiles || [] 
    })
  } catch (error) {
    console.error("Users API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

