import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] API Signup route called")

    const { email, password, redirectUrl } = await request.json()

    console.log("[v0] API Signup request data:", {
      email,
      hasPassword: !!password,
      passwordLength: password?.length || 0,
      redirectUrl,
    })

    if (!email || !password) {
      console.log("[v0] API Signup validation failed - missing email or password")
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      console.log("[v0] API Signup validation failed - password too short")
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    console.log("[v0] API Signup creating Supabase client...")
    const supabase = await createClient()

    const finalRedirectUrl = redirectUrl || `${request.nextUrl.origin}/auth/callback`
    console.log("[v0] API Signup email redirect URL:", finalRedirectUrl)

    console.log("[v0] API Signup calling Supabase signUp...")
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: finalRedirectUrl,
      },
    })

    if (error) {
      console.error("[v0] API Signup Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("[v0] API Signup successful! Response data:", {
      hasUser: !!data.user,
      hasSession: !!data.session,
      hasAccessToken: !!data.session?.access_token,
      hasRefreshToken: !!data.session?.refresh_token,
      userId: data.user?.id,
      userEmail: data.user?.email,
      needsConfirmation: !data.session,
      accessTokenLength: data.session?.access_token?.length || 0,
      refreshTokenLength: data.session?.refresh_token?.length || 0,
    })

    return NextResponse.json({
      user: data.user,
      session: data.session,
      message: "Signup successful. Please check your email for confirmation.",
    })
  } catch (error) {
    console.error("[v0] API Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
