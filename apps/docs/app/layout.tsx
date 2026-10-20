import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { CloudflareAnalytics } from '@/components/site/cf-analytics'
import { SiteHeader } from '@/components/site/site-header'
import { EXPLORERS, KIT_INSTALL, siteNav, startLinks } from '@/lib/nav'
import { brandScript, brandTags } from '@/lib/site-brand'
import { siteHtmlProps, siteThemeCss } from '@/lib/site-preset'
import { isCanonicalSite, siteUrl } from '@/lib/site'
import { source } from '@/lib/source'
import { Providers } from './providers'
import { CALIBRATION } from '@/lib/calibration'
import { STAGE_PATTERN } from '@/components/site/stage'
import '@fontsource-variable/inter/opsz.css'
import '@fontsource-variable/jetbrains-mono'
import './global.css'
import { InlineScript } from '@/components/inline-script'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'Youj — UI components in motion', template: '%s · Youj' },
  description: 'Accessible UI components, animated icons, illustrations and themes that move together. Install the kit, or copy just the pieces you need.',
  // './' is each page's own path: every page names itself canonical, on the canonical host (lib/site), and shares as itself (X reads the og: tags).
  alternates: { canonical: './' },
  ...(!isCanonicalSite() && { robots: { index: false, follow: false } }),
  openGraph: { type: 'website', siteName: 'Youj', url: './' },
}

/* viewport-fit=cover lets the page run under a phone's notch and home indicator, and env(safe-area-inset-*) then
 * means something: the header (--header-height, styles/site.css), the menu sheet and the footer pad for it.
 * No themeColor here: the browser bar's color follows the site's own mode, which the head script above sets (lib/site-brand). */
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' }

export default function RootLayout({ children }: { children: ReactNode }) {
  const nav = siteNav()
  const tree = source.getPageTree()

  return (
    // The site's frame follows the color mode (Basalt in dark; in light, Basalt's character in Graphite's colors) through the stylesheet below; previews theme themselves (lib/preview.ts).
    <html lang="en" suppressHydrationWarning {...siteHtmlProps()} data-yj-calibration={CALIBRATION} data-stage-pattern={STAGE_PATTERN}>
      <head>
        {/* Basalt as CSS, both modes' colours keyed on next-themes' data-theme, which its script sets before first paint: the right side applies with no flash. */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: CSS generated from our own theme tokens, no user input */}
        <style id="site-theme" dangerouslySetInnerHTML={{ __html: siteThemeCss() }} />
        {/* The tab icon and the browser bar follow the mode, as the logo does (lib/site-brand): the script writes the stored mode's tags before first paint, the providers swap them on every change, and a visit without JavaScript gets dark's, the default. */}
        <InlineScript code={brandScript()} />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static brand tags built from our own site-brand data */}
        <noscript dangerouslySetInnerHTML={{ __html: brandTags('dark') }} />
        {/* Every page's title and headings (4 KB): preloaded, so they paint in it rather than swapping from Inter. */}
        <link rel="preload" href="/fonts/youj-display.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {/* Entrances render their first frame on the server; without JavaScript, show the final one. */}
        <noscript>
          <style>{'[style*="opacity:0"]{opacity:1!important;transform:none!important;filter:none!important}'}</style>
        </noscript>
      </head>
      <body className="flex min-h-dvh flex-col bg-canvas font-sans text-fg antialiased">
        <Providers search={{ pillars: nav.pillars, explorers: EXPLORERS, start: startLinks(tree), install: KIT_INSTALL }}>
          {/* Only what the header draws: its props are in every page's payload. */}
          <SiteHeader nav={{ menus: nav.menus, pages: nav.pages }} />
          {children}
        </Providers>
        <CloudflareAnalytics />
      </body>
    </html>
  )
}
