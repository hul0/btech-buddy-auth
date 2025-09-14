"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import {
  extractMobileParams,
  createRedirectHandler,
  buildMobileRedirectUrl,
  type AuthTokens,
  type MobileRedirectParams,
} from "@/lib/mobile-redirect"

export function useMobileRedirect() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const mobileParams: MobileRedirectParams = useMemo(() => extractMobileParams(searchParams), [searchParams])

  const redirectHandler = useMemo(() => createRedirectHandler(mobileParams), [mobileParams])

  const isMobileContext = useMemo(() => Boolean(mobileParams.appScheme), [mobileParams.appScheme])

  const redirectToMobileApp = useCallback(
    (tokens: AuthTokens) => {
      if (!mobileParams.appScheme) {
        console.warn("Cannot redirect to mobile app: no app scheme provided")
        return false
      }

      try {
        const redirectUrl = buildMobileRedirectUrl(
          mobileParams.appScheme,
          tokens,
          mobileParams.redirectUrl || undefined,
        )
        window.location.href = redirectUrl
        return true
      } catch (error) {
        console.error("Failed to redirect to mobile app:", error)
        return false
      }
    },
    [mobileParams],
  )

  const navigateWithMobileParams = useCallback(
    (path: string) => {
      if (path === "/dashboard") {
        router.push(path)
      } else if (path === "/auth/login") {
        router.push(redirectHandler.toLogin())
      } else if (path === "/auth/signup") {
        router.push(redirectHandler.toSignup())
      } else {
        router.push(path)
      }
    },
    [router, redirectHandler],
  )

  return {
    mobileParams,
    isMobileContext,
    redirectToMobileApp,
    navigateWithMobileParams,
    redirectHandler,
  }
}
