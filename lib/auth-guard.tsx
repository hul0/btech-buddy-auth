"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useMobileRedirect } from "@/hooks/use-mobile-redirect"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function AuthGuard({ children, requireAuth = true, redirectTo }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const { navigateWithMobileParams } = useMobileRedirect()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth check error:", error)
          setIsAuthenticated(false)
        } else {
          setIsAuthenticated(!!session)
        }

        // Handle redirect logic
        if (requireAuth && !session) {
          navigateWithMobileParams(redirectTo || "/auth/login")
        } else if (!requireAuth && session) {
          navigateWithMobileParams("/dashboard")
        }
      } catch (error) {
        console.error("Auth guard error:", error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)

      if (event === "SIGNED_OUT" && requireAuth) {
        navigateWithMobileParams("/auth/login")
      } else if (event === "SIGNED_IN" && !requireAuth) {
        navigateWithMobileParams("/dashboard")
      }
    })

    return () => subscription.unsubscribe()
  }, [requireAuth, redirectTo, router, navigateWithMobileParams])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Loading...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Checking authentication status</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show children if auth requirements are met
  if ((requireAuth && isAuthenticated) || (!requireAuth && !isAuthenticated)) {
    return <>{children}</>
  }

  // Return null while redirecting
  return null
}
