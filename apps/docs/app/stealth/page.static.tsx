import type { Metadata } from 'next'
import { StealthFormFromUrl } from '@/components/site/stealth-form'
import { StealthScreen } from '@/components/site/stealth-screen'

export const metadata: Metadata = { title: 'Coming soon', robots: { index: false, follow: false } }

/** The stealth gate's sign-in on Cloudflare: a static page, so the form reads `next` and `error` in the browser. The Worker (worker/index.ts) answers the post, and 404s this page while the site is public. */
export default function StealthPage() {
  return (
    <StealthScreen>
      <StealthFormFromUrl />
    </StealthScreen>
  )
}
