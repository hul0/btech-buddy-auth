import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] API Login route called")

    const { email, password } = await request.json()

    console.log("[v0] API Login request data:", {
      email,
      hasPassword: !!password,
      passwordLength: password?.length || 0,
    })

    if (!email || !password) {
      console.log("[v0] API Login validation failed - missing email or password")
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    console.log("[v0] API Login creating Supabase client...")
    const supabase = await createClient()

    console.log("[v0] API Login calling Supabase signInWithPassword...")
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("[v0] API Login Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.log("[v0] API Login successful! Response data:", {
      hasUser: !!data.user,
      hasSession: !!data.session,
      hasAccessToken: !!data.session?.access_token,
      hasRefreshToken: !!data.session?.refresh_token,
      userId: data.user?.id,
      userEmail: data.user?.email,
      accessTokenLength: data.session?.access_token?.length || 0,
      refreshTokenLength: data.session?.refresh_token?.length || 0,
    })

    return NextResponse.json({
      user: data.user,
      session: data.session,
      message: "Login successful",
    })
  } catch (error) {
    console.error("[v0] API Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
