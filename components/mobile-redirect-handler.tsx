"use client"

import type React from "react"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { extractMobileParams, validateMobileParams, isMobileWebView } from "@/lib/mobile-redirect"

interface MobileRedirectHandlerProps {
  children: React.ReactNode
  onMobileDetected?: (isMobile: boolean) => void
}

export function MobileRedirectHandler({ children, onMobileDetected }: MobileRedirectHandlerProps) {
  const searchParams = useSearchParams()
  const [isMobile, setIsMobile] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    // Check if this is a mobile WebView
    const userAgent = navigator.userAgent
    const mobileDetected = isMobileWebView(userAgent)
    setIsMobile(mobileDetected)
    onMobileDetected?.(mobileDetected)

    // Validate mobile parameters if present
    const mobileParams = extractMobileParams(searchParams)
    if (mobileParams.appScheme || mobileParams.redirectUrl) {
      const validation = validateMobileParams(mobileParams)
      if (!validation.isValid) {
        setValidationErrors(validation.errors)
        console.warn("Invalid mobile parameters:", validation.errors)
      }
    }
  }, [searchParams, onMobileDetected])

  // Show validation errors in development
  if (process.env.NODE_ENV === "development" && validationErrors.length > 0) {
    console.warn("Mobile redirect validation errors:", validationErrors)
  }

  return (
    <div data-mobile-webview={isMobile} data-mobile-params-valid={validationErrors.length === 0}>
      {children}
    </div>
  )
}
