import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { refresh_token } = await request.json()

    if (!refresh_token) {
      return NextResponse.json({ error: "Refresh token is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({
      session: data.session,
      user: data.user,
      message: "Token refreshed successfully",
    })
  } catch (error) {
    console.error("Refresh API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
