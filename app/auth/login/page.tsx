"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get redirect URL from query params for mobile app communication
  const redirectUrl = searchParams.get("redirect_url")
  const appScheme = searchParams.get("app_scheme")

  console.log("[v0] Login page loaded with params:", {
    redirectUrl,
    appScheme,
    allParams: Object.fromEntries(searchParams.entries()),
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    console.log("[v0] Starting login process for email:", email)
    console.log("[v0] Mobile app parameters:", { appScheme, redirectUrl })

    try {
      console.log("[v0] Calling Supabase signInWithPassword...")
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("[v0] Supabase login error:", error)
        throw error
      }

      console.log("[v0] Login successful! Session data:", {
        hasSession: !!data.session,
        hasAccessToken: !!data.session?.access_token,
        hasRefreshToken: !!data.session?.refresh_token,
        userId: data.session?.user?.id,
        userEmail: data.session?.user?.email,
      })

      // If we have mobile app parameters, redirect to the app
      if (data.session && appScheme && redirectUrl) {
        const token = data.session.access_token
        const refreshToken = data.session.refresh_token

        console.log("[v0] Mobile app redirect detected - preparing custom URL scheme redirect")
        console.log("[v0] Access token length:", token?.length || 0)
        console.log("[v0] Refresh token length:", refreshToken?.length || 0)

        const mobileRedirectUrl = `${appScheme}://callback#access_token=${token}&refresh_token=${refreshToken}`

        console.log("[v0] Mobile redirect URL constructed:", mobileRedirectUrl)
        console.log("[v0] Triggering automatic redirect to mobile app...")

        setTimeout(() => {
          console.log("[v0] Executing window.location.href redirect now...")
          window.location.href = mobileRedirectUrl
        }, 100)
      } else {
        console.log("[v0] No mobile parameters detected - redirecting to web dashboard")
        router.push("/dashboard")
      }
    } catch (error: unknown) {
      console.error("[v0] Login error occurred:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
      console.log("[v0] Login process completed")
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <Card className="border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground">Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                />
              </div>
              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href={`/auth/signup${appScheme ? `?app_scheme=${appScheme}&redirect_url=${redirectUrl}` : ""}`}
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
