import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRightIcon } from '@/components/client'
import { PageHero } from '@/components/site/page-hero'
import { MessagesIcon } from '@/components/site/site-icons'
import { SiteFooter } from '@/components/site/site-footer'
import { ButtonLink } from '@/components/ui/button-link'
import { cn } from '@/lib/cn'
import { siteNav, startLinks } from '@/lib/nav'
import { project } from '@/lib/project'
import { roadmap, ROADMAP_REVIEW, type RoadmapStage } from './roadmap'

export const metadata: Metadata = {
  title: 'Roadmap',
  description: 'What Youj is doing now, what’s next, what’s later and what it’s exploring, as high-level themes. No dates.',
}

/* The roadmap on the landing's frame, laid out like the changelog: one frame
 * section per stage, its name on a rail that sticks beside the items on wide
 * screens. The rail's node says where a stage stands: solid for now,
 * the accent particle for next, an outline for later, dashed for exploring. Nothing animates. */

const NODE: Record<RoadmapStage['id'], string> = {
  shipped: 'bg-fg-muted',
  now: 'bg-fg',
  next: 'particle',
  later: 'border border-line-strong bg-canvas',
  exploring: 'border border-dashed border-line-strong bg-canvas',
}

function Stage({ stage }: { stage: RoadmapStage }) {
  return (
    <section aria-labelledby={stage.id} className="frame-section">
      <div className="gutter grid gap-6 py-12 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10 md:py-16">
        <div className="md:sticky md:top-[calc(var(--header-height)+2rem)] md:self-start">
          <div className="flex items-center gap-3">
            <span aria-hidden className={cn('size-[9px] shrink-0', NODE[stage.id])} />
            <h2 id={stage.id} className="type-heading scroll-mt-[calc(var(--header-height)+1.5rem)] text-fg">
              {stage.title}
            </h2>
          </div>
          <p className="mt-3 max-w-[30ch] ps-[21px] text-[13.5px] leading-relaxed text-pretty text-fg-muted">{stage.lede}</p>
        </div>
        <ul className="flex min-w-0 flex-col border-t border-line">
          {stage.items.map((item) => {
            const content = (
              <>
                <span className="type-body-strong text-fg">{item.title}</span>
                <span className="text-[14px] leading-relaxed text-pretty text-fg-muted">{item.body}</span>
              </>
            )
            return (
              <li key={item.id} id={item.id} className="scroll-mt-[calc(var(--header-height)+1.5rem)] border-b border-line">
                {item.href ? (
                  <Link prefetch={false}
                    href={item.href}
                    className="group/item grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 rounded-sm py-4 focus-ring"
                  >
                    <span className="flex flex-col gap-1">{content}</span>
                    <ArrowRightIcon
                      size={14}
                      aria-hidden
                      className="text-fg-subtle transition-[color,translate] yj-duration-fast ease-standard group-hover/item:translate-x-0.5 group-hover/item:text-fg rtl:-scale-x-100 rtl:group-hover/item:-translate-x-0.5"
                    />
                  </Link>
                ) : (
                  <div className="flex flex-col gap-1 py-4">{content}</div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default function RoadmapPage() {
  const nav = siteNav()
  const stages = roadmap()

  return (
    <>
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <div className="frame">
          <PageHero
            label="Roadmap"
            title="Where Youj is heading."
            lede={
              <p>
                High-level themes, not a feature list, and no dates. The changelog says what has shipped. {ROADMAP_REVIEW} Ideas and requests go to
                the{' '}
                <a href={project.discussions} className="underline underline-offset-4 hover:text-fg focus-ring">
                  Roadmap discussion on GitHub
                </a>
                .
              </p>
            }
          >
            <ButtonLink href={project.discussions} variant="outline" size="sm">
              <MessagesIcon size={14} aria-hidden />
              Suggest something
            </ButtonLink>
            <ButtonLink href="/changelog" variant="ghost" size="sm">
              Changelog
            </ButtonLink>
          </PageHero>
          {stages.map((stage) => (
            <Stage key={stage.id} stage={stage} />
          ))}
        </div>
      </main>
      <SiteFooter nav={nav} start={startLinks()} framed />
    </>
  )
}
