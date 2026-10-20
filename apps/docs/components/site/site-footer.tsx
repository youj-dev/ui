import { IntentLink } from '@/components/site/intent-link'
import { durations } from '@youj/core/lib/youj/tokens'
import { YoujLockup } from '@/components/client'
import { FooterWordmark } from '@/components/site/footer-wordmark'
import { cn } from '@/lib/cn'
import type { NavLink, SiteNav } from '@/lib/nav'
import { REPO_URL } from '@/lib/project'
import { sitePresetFonts } from '@/lib/site-preset'

function Column({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="type-label">{title}</p>
      <ul className="flex flex-col gap-0.5 touch:gap-0 touch:[&_a]:min-w-11 touch:[&_a]:py-3">
        {links.map((link) => (
          <li key={link.url}>
            <IntentLink
              href={link.url}
              className="inline-block rounded-sm py-1 text-[13.5px] text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg focus-ring"
            >
              {link.title}
            </IntentLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The project around the kit: its history, answers, and where to get help. */
const PROJECT: NavLink[] = [
  { title: 'Changelog', url: '/changelog' },
  { title: 'FAQ', url: '/faq' },
  { title: 'Roadmap', url: '/roadmap' },
  { title: 'About & support', url: '/about' },
  { title: 'Security', url: '/security' },
  { title: 'GitHub', url: REPO_URL },
]

/**
 * The site's foot: the family, where to start and the project, a colophon read from the
 * site's preset (its typefaces) and the motion tokens, and the wordmark at page scale. `framed` lines it up with
 * the landing page's construction frame.
 */
export function SiteFooter({ nav, start, framed = false }: { nav: SiteNav; start: NavLink[]; framed?: boolean }) {
  // Under "Youj", each part by the name the header gives it.
  const family = nav.pillars.map((p) => ({ title: p.label, url: p.url }))
  const steps = Object.values(durations).join(' · ')
  const fonts = sitePresetFonts().map((font) => font.label).join(' · ')
  // Each destination once: a start page the family already links (Theming) stays there; Credits is in the colophon.
  const docs = [...start, { title: 'Registry (JSON)', url: '/r/registry.json' }].filter(
    (link, i, all) => all.findIndex((l) => l.url === link.url) === i && !family.some((f) => f.url === link.url),
  )

  return (
    <footer className={cn('border-t border-line', framed && 'border-t-0')}>
      <div className={cn(framed ? 'frame frame-section' : 'mx-auto max-w-[1440px] border-line')}>
        <div className="gutter grid grid-cols-2 gap-x-6 gap-y-10 py-14 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:py-16">
          <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
            <YoujLockup className="text-[20px]" />
            <p className="max-w-[30ch] text-[14px] leading-relaxed text-pretty text-fg-muted">Components, icons, illustrations and themes that move together.</p>
          </div>
          <Column title="Youj" links={family} />
          <Column title="Docs" links={docs} />
          <Column title="Project" links={PROJECT} />
        </div>
        <div className="gutter flex flex-col gap-2 border-t border-line py-5 text-[12.5px] text-fg-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Built entirely with Youj. MIT licensed · <IntentLink href="/docs/contributing#credits-and-licenses" className="rounded-sm underline-offset-4 hover:text-fg hover:underline focus-ring touch:-mx-1.5 touch:px-1.5 touch:py-3.5">Credits</IntentLink></p>
          <p className="type-small text-fg-muted">
            {fonts} · {steps} ms
          </p>
        </div>
        <div className="gutter pt-2 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <FooterWordmark />
        </div>
      </div>
    </footer>
  )
}
