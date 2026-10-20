import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { StealthForm } from '@/components/site/stealth-form'
import { StealthScreen } from '@/components/site/stealth-screen'
import { safeNext, stealthConfig } from '@/lib/stealth'

export const metadata: Metadata = { title: 'Coming soon', robots: { index: false, follow: false } }

// The switch is read per request (it's off at build time in the usual case), so this page is never prerendered.
export const dynamic = 'force-dynamic'

/** The stealth gate (lib/stealth.ts): a coming-soon page with the early-access sign-in. It isn't there once the site is public. */
export default async function StealthPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams
  if (!stealthConfig()) notFound()

  return (
    <StealthScreen>
      <StealthForm next={safeNext(next)} error={error} />
    </StealthScreen>
  )
}
