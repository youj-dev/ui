import { NextResponse, type NextRequest } from 'next/server'
import { createRateLimiter, SESSION_TTL, signIn, STEALTH_COOKIE, stealthConfig } from '@/lib/stealth'

const limiter = createRateLimiter()

/** The sign-in form's target: checks the password, sets the session cookie and goes back to the page that was asked for. */
export async function POST(request: NextRequest) {
  const config = stealthConfig()
  if (!config) return new NextResponse(null, { status: 404 })
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  const { location, session } = await signIn(await request.formData(), ip, config, limiter)
  // Relative redirects, so they stay on the host the form was posted to (request.url can name another, e.g. localhost for 127.0.0.1).
  const response = new NextResponse(null, { status: 303, headers: { Location: location } })
  if (session)
    response.cookies.set(STEALTH_COOKIE, session, {
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL,
    })
  return response
}
