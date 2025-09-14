import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getUser() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const publicPaths = [
    "/",
    "/auth/login",
    "/auth/signup",
    "/auth/signup-success",
    "/auth/callback",
    "/auth/mobile-success",
    "/auth/error",
    "/api/health",
  ]

  // Define API paths that should be handled differently
  const apiPaths = ["/api/auth/login", "/api/auth/signup", "/api/auth/refresh", "/api/health"]

  // Check if current path is public
  const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith(path))
  const isApiPath = pathname.startsWith("/api/")
  const isProtectedApiPath = isApiPath && !apiPaths.some((path) => pathname.startsWith(path))

  // Handle API routes
  if (isApiPath) {
    // For protected API routes, return 401 if no user
    if (isProtectedApiPath && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    // Let API routes handle their own logic
    return supabaseResponse
  }

  // Handle page routes
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    const searchParams = request.nextUrl.searchParams
    const appScheme = searchParams.get("app_scheme")
    const redirectUrl = searchParams.get("redirect_url")

    url.pathname = "/auth/login"
    url.search = ""

    // Preserve mobile parameters
    if (appScheme) {
      url.searchParams.set("app_scheme", appScheme)
    }
    if (redirectUrl) {
      url.searchParams.set("redirect_url", redirectUrl)
    }

    return NextResponse.redirect(url)
  }

  if (user && (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup"))) {
    const url = request.nextUrl.clone()
    const searchParams = request.nextUrl.searchParams
    const appScheme = searchParams.get("app_scheme")

    // If mobile context, redirect to mobile success page
    if (appScheme) {
      url.pathname = "/auth/mobile-success"
      return NextResponse.redirect(url)
    } else {
      // Regular web redirect to dashboard
      url.pathname = "/dashboard"
      url.search = ""
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
