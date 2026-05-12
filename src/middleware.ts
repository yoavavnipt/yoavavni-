import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/portal', '/running', '/_next', '/favicon']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check for clinic_user cookie (set on login)
  const user = request.cookies.get('clinic_user')
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icon).*)'],
}
