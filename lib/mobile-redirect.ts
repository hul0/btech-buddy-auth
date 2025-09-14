/**
 * Utility functions for handling mobile app redirects in WebView authentication
 */

export interface MobileRedirectParams {
  appScheme?: string | null
  redirectUrl?: string | null
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt?: number
}

/**
 * Check if the current request is from a mobile WebView
 */
export function isMobileWebView(userAgent?: string): boolean {
  if (!userAgent) return false

  // Common WebView user agent patterns
  const webViewPatterns = [
    /wv\)/i, // Android WebView
    /Version\/[\d.]+.*Mobile.*Safari/i, // iOS WebView
    /Mobile.*Safari.*Version/i, // iOS WebView alternative
    /; wv\)/i, // Android WebView alternative
  ]

  return webViewPatterns.some((pattern) => pattern.test(userAgent))
}

/**
 * Extract mobile redirect parameters from URL search params
 */
export function extractMobileParams(searchParams: URLSearchParams): MobileRedirectParams {
  return {
    appScheme: searchParams.get("app_scheme"),
    redirectUrl: searchParams.get("redirect_url"),
  }
}

/**
 * Build mobile app redirect URL with authentication tokens
 */
export function buildMobileRedirectUrl(appScheme: string, tokens: AuthTokens, redirectUrl?: string): string {
  const params = new URLSearchParams({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  })

  if (tokens.expiresAt) {
    params.set("expires_at", tokens.expiresAt.toString())
  }

  if (redirectUrl) {
    params.set("redirect_url", redirectUrl)
  }

  return `${appScheme}://auth/callback?${params.toString()}`
}

/**
 * Build web app URL with mobile parameters preserved
 */
export function buildWebUrlWithMobileParams(
  basePath: string,
  mobileParams: MobileRedirectParams,
  additionalParams?: Record<string, string>,
): string {
  const params = new URLSearchParams()

  if (mobileParams.appScheme) {
    params.set("app_scheme", mobileParams.appScheme)
  }

  if (mobileParams.redirectUrl) {
    params.set("redirect_url", mobileParams.redirectUrl)
  }

  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      params.set(key, value)
    })
  }

  const queryString = params.toString()
  return queryString ? `${basePath}?${queryString}` : basePath
}

/**
 * Validate mobile redirect parameters
 */
export function validateMobileParams(params: MobileRedirectParams): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (params.appScheme && !isValidAppScheme(params.appScheme)) {
    errors.push("Invalid app scheme format")
  }

  if (params.redirectUrl && !isValidRedirectUrl(params.redirectUrl)) {
    errors.push("Invalid redirect URL format")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Check if app scheme is valid
 */
function isValidAppScheme(scheme: string): boolean {
  // Basic validation for app scheme format
  const schemePattern = /^[a-zA-Z][a-zA-Z0-9+.-]*$/
  return schemePattern.test(scheme) && scheme.length > 0 && scheme.length < 50
}

/**
 * Check if redirect URL is valid
 */
function isValidRedirectUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Create a safe redirect function that handles both mobile and web redirects
 */
export function createRedirectHandler(mobileParams: MobileRedirectParams) {
  return {
    toLogin: () => buildWebUrlWithMobileParams("/auth/login", mobileParams),
    toSignup: () => buildWebUrlWithMobileParams("/auth/signup", mobileParams),
    toDashboard: () => "/dashboard",
    toMobileApp: (tokens: AuthTokens) => {
      if (!mobileParams.appScheme) {
        throw new Error("App scheme is required for mobile redirect")
      }
      return buildMobileRedirectUrl(mobileParams.appScheme, tokens, mobileParams.redirectUrl || undefined)
    },
  }
}
