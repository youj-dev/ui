import type { ComponentType, ReactNode } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRightIcon } from '@/components/client'
import { PillarMark } from '@/components/landing/pillar-mark'
import { Section } from '@/components/landing/section'
import { PageHero } from '@/components/site/page-hero'
import { AudioLinesIcon, BookOpenIcon, BotIcon, BrandFigmaIcon, BrandGithubIcon, BugIcon, HeartIcon, MessagesIcon, ShieldAlertIcon, TerminalIcon } from '@/components/site/site-icons'
import { SiteFooter } from '@/components/site/site-footer'
import { ButtonLink } from '@/components/ui/button-link'
import { siteNav, startLinks, type PillarId } from '@/lib/nav'
import { project, sponsorUrl } from '@/lib/project'

export const metadata: Metadata = {
  title: 'About & support',
  description: 'What Youj is, the principles behind it, what ships in the box, the open source it builds on, and how to get help.',
}

/* What Youj is and how to reach the project, on the landing's frame:
 * the principles, the packages, the open source it stands on, and help.
 * Only what the repository shows: the maintainer is a GitHub handle and
 * nothing more, and what's next lives on /roadmap, without dates. The
 * sponsor card appears only when NEXT_PUBLIC_SPONSOR_URL is set. */

const MAINTAINER = { handle: 'louis-henry', url: 'https://github.com/louis-henry' }

const PRINCIPLES = [
  {
    title: 'One language',
    body: 'Components, motion, icons and illustrations read the same tokens, so one provider sets the theme, the speed and reduced motion for the whole app, portals included.',
  },
  {
    title: 'Precise motion',
    body: 'Motion starts at once, travels fast and stops exactly on its mark. One settle spring, with a single overshoot, is spent on success and arrival.',
  },
  {
    title: 'Accessible by default',
    body: 'Base UI primitives, full keyboard support and AA contrast in every theme. Reduced motion is a designed state that keeps the meaning.',
  },
  {
    title: 'Yours to own',
    body: 'Install the packages and import from them, or copy the source in with the Youj CLI and change anything. The same components either way; the copy-in route needs React 19.',
  },
]

function HelpCard({ Icon, title, body, href, action }: { Icon: ComponentType<{ size?: number; className?: string }>; title: string; body: ReactNode; href: string; action: string }) {
  const external = /^https?:/.test(href)
  return (
    <li className="flex">
      <Link prefetch={false}
        href={href}
        data-yj-trigger
        className="group/help flex flex-1 flex-col gap-4 rounded-2xl border border-line bg-surface p-5 transition-colors yj-duration-fast ease-standard hover:border-line-strong focus-ring sm:p-6"
      >
        <span aria-hidden className="grid size-9 place-items-center rounded-lg border border-line bg-canvas text-fg">
          <Icon size={18} />
        </span>
        <span className="flex flex-col gap-1.5">
          <span className="type-body-strong text-fg">{title}</span>
          <span className="text-[13.5px] leading-relaxed text-pretty text-fg-muted">{body}</span>
        </span>
        <span className="mt-auto flex items-center gap-1.5 text-[13px] font-medium text-fg">
          {action}
          <ArrowRightIcon size={14} aria-hidden className="text-fg-muted transition-transform yj-duration-fast ease-standard group-hover/help:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/help:-translate-x-0.5" />
          {external && <span className="sr-only">(GitHub)</span>}
        </span>
      </Link>
    </li>
  )
}

export default function AboutPage() {
  const nav = siteNav()
  const sponsor = sponsorUrl()

  const packages: { mark: PillarId | ComponentType<{ size?: number; strokeWidth?: number }>; name: string; what: string; count?: string; href: string }[] = [
    { mark: 'ui', name: '@youj/react', what: 'Accessible components on shadcn/ui and Base UI, plus blocks', href: '/docs/components' },
    { mark: 'motion', name: '@youj/motion', what: 'Motion tokens, the provider, primitives, effects, backgrounds and players', href: '/docs/motion' },
    { mark: 'icons', name: '@youj/icons', what: 'Original animated icons that morph between states', href: '/docs/icons' },
    { mark: 'illustrations', name: '@youj/illustrations', what: 'Isometric scenes and the kit to draw your own', href: '/docs/illustrations' },
    { mark: AudioLinesIcon, name: '@youj/sound', what: 'Designed interface sounds for the components’ cues, off until you add the provider', href: '/docs/sound' },
    { mark: TerminalIcon, name: '@youj/cli', what: 'The CLI: init, add, create, doctor and mcp', href: '/docs/installation' },
    { mark: BotIcon, name: '@youj/mcp', what: 'An MCP server that gives AI coding tools the docs, props and icons', href: '/docs/mcp' },
    { mark: BrandFigmaIcon, name: 'Figma kit', what: 'A plugin that builds the kit in Figma from the same tokens', href: '/docs/figma' },
  ]

  return (
    <>
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <div className="frame">
          <PageHero
            label="About & support"
            title="Accessible components, animated icons, illustrations and themes that move together."
            lede={
              <p>
                Youj is an open-source React kit. Its components are shadcn/ui on Base UI, re-skinned and accessible by default: keyboard, screen-reader and reduced-motion support, built toward WCAG 2.2 AA and checked with automated tests (not a conformance claim). Its motion system decides how
                everything moves; its icons are drawn for it. Use it as npm packages, or copy the source into your app.
              </p>
            }
          >
            <ButtonLink href={project.repo} variant="outline">
              <BrandGithubIcon size={15} aria-hidden />
              GitHub
            </ButtonLink>
            <ButtonLink href="/docs" variant="ghost">
              Read the docs
              <ArrowRightIcon size={14} aria-hidden className="rtl:-scale-x-100" />
            </ButtonLink>
          </PageHero>

          <Section id="principles" title="Four rules behind every part.">
            <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 md:mt-14">
              {PRINCIPLES.map((p) => (
                <li key={p.title} className="flex flex-col gap-2 bg-canvas p-6 sm:p-7">
                  <h3 className="type-subheading text-fg">{p.title}</h3>
                  <p className="max-w-[46ch] text-[14px] leading-relaxed text-pretty text-fg-muted">{p.body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-[13.5px] text-fg-muted">
              The motion rules, shown side by side with what they avoid:{' '}
              <Link prefetch={false} href="/docs/motion/principles" className="link-quiet text-fg">
                Motion principles
              </Link>
              .
            </p>
          </Section>

          <Section id="packages" title="Everything versions together.">
            <ul className="mt-12 flex flex-col border-t border-line md:mt-14">
              {packages.map((p) => (
                <li key={p.name} className="border-b border-line">
                  <Link prefetch={false}
                    href={p.href}
                    data-yj-trigger
                    className="group/pkg grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-1 rounded-sm py-4 transition-colors yj-duration-fast ease-standard focus-ring sm:grid-cols-[auto_16rem_minmax(0,1fr)_auto]"
                  >
                    {typeof p.mark === 'string' ? (
                      <PillarMark id={p.mark} />
                    ) : (
                      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-canvas text-fg">
                        <p.mark size={18} strokeWidth={1.5} />
                      </span>
                    )}
                    <span className="code-text">{p.name}</span>
                    <span className="col-start-2 text-[13.5px] text-fg-muted transition-colors yj-duration-fast ease-standard group-hover/pkg:text-fg sm:col-start-auto">{p.what}</span>
                    <span className="type-small col-start-2 text-fg-muted sm:col-start-auto sm:text-end">{p.count ?? ''}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            id="open-source"
            title="MIT licensed, built on open work."
            lede={
              <>
                Credits explains the projects Youj uses, including Lucide, which the originality test and `YoujIcon` use. The notices file carries their licenses. The brand
                marks in the icon set belong to their owners and aren’t covered by the MIT license.
              </>
            }
          >
            <div className="mt-8 flex flex-wrap gap-2">
              <ButtonLink href="/docs/contributing#credits-and-licenses" variant="outline">
                Credits
              </ButtonLink>
              <ButtonLink href={project.file('LICENSE')} variant="ghost">
                License
              </ButtonLink>
              <ButtonLink href={project.file('THIRD_PARTY_NOTICES.md')} variant="ghost">
                Third-party notices
              </ButtonLink>
              <ButtonLink href="/docs/contributing#brand-marks" variant="ghost">
                Brand marks
              </ButtonLink>
            </div>
            <dl className="mt-10 grid max-w-[40rem] grid-cols-[8rem_minmax(0,1fr)] gap-y-3 border-t border-line pt-6 text-[13.5px]">
              <dt id="maintainer" className="scroll-mt-[calc(var(--header-height)+1.5rem)] text-fg-muted">
                Maintainer
              </dt>
              <dd>
                <Link prefetch={false} href={MAINTAINER.url} className="link-quiet text-fg">
                  @{MAINTAINER.handle}
                </Link>
                <span className="sr-only"> (GitHub)</span>
              </dd>
              <dt className="text-fg-muted">Roadmap</dt>
              <dd className="text-fg-muted">
                What’s built and what’s next, without dates:{' '}
                <Link prefetch={false} href="/roadmap" className="link-quiet text-fg">
                  Roadmap
                </Link>
              </dd>
              <dt className="text-fg-muted">Security</dt>
              <dd className="text-fg-muted">
                Supported versions, reporting and the supply chain:{' '}
                <Link prefetch={false} href="/security" className="link-quiet text-fg">
                  Security policy
                </Link>
              </dd>
            </dl>
          </Section>

          <Section id="help" title="Get help." lede="Everything happens in the open, on GitHub. Search the docs first: most answers are one search away (⌘K or Ctrl K).">
            <ul className="mt-12 grid gap-3 sm:grid-cols-2 md:mt-14 lg:grid-cols-4">
              <HelpCard Icon={BookOpenIcon} title="Read the answers" body="Common questions, answered from the code: license, React, bundle size, theming, accessibility." href="/faq" action="FAQ" />
              <HelpCard
                Icon={BugIcon}
                title="Report a bug"
                body={
                  <>
                    Open an issue with your versions (<code className="code-inline">npx @youj/cli doctor</code> prints them) and a small reproduction.
                  </>
                }
                href={project.newIssue}
                action="Open an issue"
              />
              <HelpCard Icon={MessagesIcon} title="Ask a question" body="Questions, ideas and show-and-tell go to Discussions, where the answer helps the next person." href={project.discussions} action="Start a discussion" />
              <HelpCard Icon={ShieldAlertIcon} title="Report a vulnerability" body="Please don’t file a public issue. Report it privately, so it can be fixed before it’s public." href="/security" action="Security policy" />
              {sponsor && (
                <HelpCard Icon={HeartIcon} title="Sponsor" body="Youj is free. Sponsorship pays for the time that keeps it moving." href={sponsor} action="Become a sponsor" />
              )}
            </ul>
          </Section>
        </div>
      </main>
      <SiteFooter nav={nav} start={startLinks()} framed />
    </>
  )
}
