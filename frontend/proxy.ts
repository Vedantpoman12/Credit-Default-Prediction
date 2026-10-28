import { NextResponse } from "next/server"

import { auth } from "@/auth"

const AUTH_PAGES = new Set(["/login", "/signup", "/forgot-password"])
const PUBLIC_PAGES = new Set(["/terms", "/privacy"])

export default auth((request) => {
  const { pathname, search } = request.nextUrl
  const signedIn = Boolean(request.auth)

  if (pathname === "/" || AUTH_PAGES.has(pathname)) {
    return signedIn ? NextResponse.redirect(new URL("/score", request.nextUrl)) : NextResponse.next()
  }
  if (PUBLIC_PAGES.has(pathname) || signedIn) return NextResponse.next()

  const login = new URL("/login", request.nextUrl)
  login.searchParams.set("callbackUrl", `${pathname}${search}`)
  return NextResponse.redirect(login)
})

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|icon.svg|opengraph-image|robots.txt).*)"],
}
