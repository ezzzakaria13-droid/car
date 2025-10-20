import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  console.log("[v0] Middleware checking path:", request.nextUrl.pathname)

  const userId = request.cookies.get("user_id")?.value
  const userRole = request.cookies.get("user_role")?.value

  console.log("[v0] Middleware cookies:", { userId: !!userId, userRole })

  if (request.nextUrl.pathname.startsWith("/auth")) {
    // If already logged in, redirect to appropriate dashboard
    if (userId && userRole) {
      const redirectUrl = userRole === "admin" ? "/admin" : "/employee"
      console.log("[v0] Already logged in, redirecting to:", redirectUrl)
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
    return NextResponse.next()
  }

  if (!userId || !userRole) {
    console.log("[v0] No auth cookies, redirecting to login")
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  const path = request.nextUrl.pathname

  if (path.startsWith("/admin") && userRole !== "admin") {
    console.log("[v0] Non-admin trying to access admin area, redirecting to employee")
    return NextResponse.redirect(new URL("/employee", request.url))
  }

  if (path.startsWith("/employee") && userRole === "admin") {
    console.log("[v0] Admin accessing employee area, allowing")
    // Allow admins to access employee pages
  }

  console.log("[v0] Middleware allowing access to:", path)
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
