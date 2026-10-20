import type { ReactNode } from 'react'
import { ThemeScope } from '@youj/core'
import { sitePreset } from '@/lib/preview'
import { YoujLockup } from '@/components/client'
import { StealthBackdrop, type StealthBackdropKind } from './stealth-backdrop'
import { StealthIntro } from './stealth-intro'

/**
 * The page's look, picked here. `backdrop`: `aurora` keeps the Aurora, toned
 * down to the tree's warm ink; `field` is a still, CSS-only dot ring and
 * vignette (no shader to load); `both` lays the ring over the Aurora, each a
 * little softer (under Save-Data, the dots alone). `mode`: `dark`
 * whatever the site's mode, or `site` to follow it (light gets Graphite).
 */
export const STEALTH_LOOK: { backdrop: StealthBackdropKind; mode: 'dark' | 'site' } = { backdrop: 'both', mode: 'dark' }

/**
 * The stealth gate's intro: the wordmark, Banyan growing in the middle with a
 * line of pre-launch phrases under it, a quiet countdown to the Worker's LAUNCH_AT (set in Cloudflare, read from /launch.json), and the
 * early-access-code entry (`children`, the form) behind a button at the top right.
 * Vercel renders it per request (app/stealth/page.vercel.tsx), Cloudflare as
 * a static page (page.static.tsx). The tree and the backdrop's shader load
 * after first paint, into boxes reserved here.
 */
export function StealthScreen({ children, look = STEALTH_LOOK }: { children: ReactNode; look?: typeof STEALTH_LOOK }) {
  const page = (
    <main
      id="main"
      data-theme={look.mode === 'dark' ? 'dark' : undefined}
      data-yj-look="classic"
      className="relative isolate flex min-h-dvh flex-1 flex-col items-center overflow-hidden bg-canvas px-4 text-fg"
    >
      <StealthBackdrop kind={look.backdrop} />
      <h1 className="sr-only">Youj is coming soon</h1>
      <header className="flex h-20 shrink-0 items-center justify-center sm:h-24">
        <YoujLockup animated optical="display" className="text-[30px] sm:text-[36px]" />
      </header>
      <div className="absolute end-3 top-5 z-10 sm:end-6 sm:top-7">{children}</div>
      <StealthIntro />
    </main>
  )
  // Basalt is scoped here in dark: the site's light mode is blue.
  return look.mode === 'dark' ? <ThemeScope theme={sitePreset('basalt')}>{page}</ThemeScope> : page
}
