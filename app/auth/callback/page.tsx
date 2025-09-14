"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()

      console.log("[v0] Auth callback page loaded")
      console.log("[v0] Search params:", Object.fromEntries(searchParams.entries()))

      try {
        console.log("[v0] Getting session from Supabase...")

        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("[v0] Session retrieval error:", error)
          throw error
        }

        console.log("[v0] Session retrieved successfully:", {
          hasSession: !!data.session,
          hasAccessToken: !!data.session?.access_token,
          hasRefreshToken: !!data.session?.refresh_token,
          userId: data.session?.user?.id,
          userEmail: data.session?.user?.email,
        })

        // Get mobile app parameters
        const appScheme = searchParams.get("app_scheme")
        const redirectUrl = searchParams.get("redirect_url")

        console.log("[v0] Mobile app parameters from callback:", { appScheme, redirectUrl })

        if (data.session && appScheme && redirectUrl) {
          // Redirect to mobile app with tokens
          const token = data.session.access_token
          const refreshToken = data.session.refresh_token

          console.log("[v0] Mobile app redirect detected in callback")
          console.log("[v0] Access token length:", token?.length || 0)
          console.log("[v0] Refresh token length:", refreshToken?.length || 0)

          const mobileRedirectUrl = `${appScheme}://callback#access_token=${token}&refresh_token=${refreshToken}`

          console.log("[v0] Mobile redirect URL constructed:", mobileRedirectUrl)
          console.log("[v0] Triggering automatic redirect to mobile app from callback...")

          setTimeout(() => {
            console.log("[v0] Executing window.location.href redirect from callback now...")
            window.location.href = mobileRedirectUrl
          }, 100)
        } else if (data.session) {
          // Regular web redirect
          console.log("[v0] No mobile parameters - redirecting to web dashboard")
          router.push("/dashboard")
        } else {
          // No session, redirect to login
          console.log("[v0] No session found - redirecting to login")
          router.push("/auth/login")
        }
      } catch (error: unknown) {
        console.error("[v0] Auth callback error:", error)
        setError(error instanceof Error ? error.message : "Authentication failed")
        setTimeout(() => {
          console.log("[v0] Redirecting to login after error...")
          router.push("/auth/login")
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-destructive">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <p className="text-xs text-muted-foreground">Redirecting to login...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Authenticating...</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Please wait while we sign you in</p>
        </CardContent>
      </Card>
    </div>
  )
}
