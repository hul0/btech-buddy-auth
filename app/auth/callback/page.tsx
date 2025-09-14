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

      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession()

        if (error) throw error

        // Get mobile app parameters
        const appScheme = searchParams.get("app_scheme")
        const redirectUrl = searchParams.get("redirect_url")

        if (data.session && appScheme && redirectUrl) {
          // Redirect to mobile app with tokens
          const token = data.session.access_token
          const refreshToken = data.session.refresh_token
          const mobileRedirectUrl = `${appScheme}://auth/callback?access_token=${token}&refresh_token=${refreshToken}&redirect_url=${encodeURIComponent(redirectUrl)}`
          window.location.href = mobileRedirectUrl
        } else if (data.session) {
          // Regular web redirect
          router.push("/dashboard")
        } else {
          // No session, redirect to login
          router.push("/auth/login")
        }
      } catch (error: unknown) {
        console.error("Auth callback error:", error)
        setError(error instanceof Error ? error.message : "Authentication failed")
        setTimeout(() => {
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
