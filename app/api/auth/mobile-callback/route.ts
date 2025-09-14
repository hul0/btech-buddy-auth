import { createClient } from "@/lib/supabase/server"
import { buildMobileRedirectUrl, extractMobileParams, validateMobileParams } from "@/lib/mobile-redirect"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const mobileParams = extractMobileParams(searchParams)

    // Validate mobile parameters
    const validation = validateMobileParams(mobileParams)
    if (!validation.isValid) {
      return NextResponse.json({ error: "Invalid mobile parameters", details: validation.errors }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current session
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session) {
      return NextResponse.json({ error: "No active session" }, { status: 401 })
    }

    // Build mobile redirect URL
    if (mobileParams.appScheme) {
      const redirectUrl = buildMobileRedirectUrl(
        mobileParams.appScheme,
        {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: session.expires_at,
        },
        mobileParams.redirectUrl || undefined,
      )

      return NextResponse.json({
        redirectUrl,
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        },
        user: session.user,
      })
    }

    return NextResponse.json({ error: "App scheme is required" }, { status: 400 })
  } catch (error) {
    console.error("Mobile callback API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
