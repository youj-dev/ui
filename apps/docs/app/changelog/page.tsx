import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import { Markdown } from '@/components/site/markdown'
import { PageHero } from '@/components/site/page-hero'
import { HashIcon, RssIcon } from '@/components/site/site-icons'
import { SiteFooter } from '@/components/site/site-footer'
import { ButtonLink } from '@/components/ui/button-link'
import { readChangelog, type ChangeKind, type ChangelogSection, type Release } from '@/lib/changelog'
import { cn } from '@/lib/cn'
import { siteNav, startLinks } from '@/lib/nav'
import { project } from '@/lib/project'

// The feed is offered once a release exists; an unreleased entry alone has nothing to subscribe to.
const hasRelease = () => readChangelog().releases.some((r) => !r.unreleased)

export function generateMetadata(): Metadata {
  return {
    title: 'Changelog',
    description: 'Every Youj release: what broke, what was added and what was fixed, with the migration for each breaking change.',
    // A page's `alternates` replaces the layout's, so the canonical is restated beside the feed.
    alternates: {
      canonical: '/changelog',
      ...(hasRelease() && { types: { 'application/rss+xml': [{ url: '/changelog.xml', title: 'Youj releases' }] } }),
    },
  }
}

/* The changelog as a timeline on the landing's frame: one frame section per
 * release, its version on a rail that sticks beside the entry on wide screens
 * and sits above it on phones. A node on the rail marks each release; the
 * accent particle marks the one still in progress. Sections carry their kind
 * (Breaking, Added, Changed, Fixed), and a breaking one is set apart, tinted
 * danger, so its migration can't be missed. Read from CHANGELOG.md at build
 * time; nothing here animates, so there's no reduced-motion variant to keep. */

const KIND: Record<ChangeKind, { label: string; tone: string }> = {
  breaking: { label: 'Breaking', tone: 'var(--color-danger)' },
  added: { label: 'Added', tone: 'var(--color-success)' },
  changed: { label: 'Changed', tone: 'var(--color-accent)' },
  fixed: { label: 'Fixed', tone: 'var(--color-warning)' },
}

const ORDER: ChangeKind[] = ['breaking', 'added', 'changed', 'fixed']

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`))
}

/** A heading's `code` spans, as code: "`@youj/react`" reads as a package name. */
function inline(text: string) {
  return text.split(/`([^`]+)`/).map((part, i) =>
    i % 2 ? (
      <code key={i} className="code-inline">
        {part}
      </code>
    ) : (
      part
    ),
  )
}

function KindTag({ kind }: { kind: ChangeKind }) {
  return (
    <span
      style={{ '--tag': KIND[kind].tone } as CSSProperties}
      className="inline-flex h-5 shrink-0 items-center gap-1.5 rounded-[5px] border border-[color-mix(in_oklch,var(--tag)_30%,var(--color-line))] bg-[color-mix(in_oklch,var(--tag)_8%,transparent)] px-1.5 type-label text-fg"
    >
      <span aria-hidden className="size-[5px] bg-(--tag)" />
      {KIND[kind].label}
    </span>
  )
}

function Section({ section, release }: { section: ChangelogSection; release: Release }) {
  const breaking = section.kind === 'breaking'
  const heading = section.title || KIND[section.kind].label
  return (
    <section
      aria-label={`${release.version}: ${heading}`}
      className={cn('min-w-0', breaking && 'callout rounded-xl border px-4 py-5 sm:px-6 sm:py-6')}
      style={breaking ? ({ '--callout': 'var(--color-danger)' } as CSSProperties) : undefined}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <KindTag kind={section.kind} />
        {section.title && (
          <h3 className="type-subheading min-w-0 text-fg">{inline(heading)}</h3>
        )}
      </div>
      {section.body && (
        <div className="prose mt-4 max-w-none [&_p]:max-w-[68ch] [&>figure]:my-5">
          <Markdown>{section.body}</Markdown>
        </div>
      )}
    </section>
  )
}

function Tally({ release }: { release: Release }) {
  const counts = ORDER.map((kind) => [kind, release.sections.filter((s) => s.kind === kind).length] as const).filter(([, n]) => n)
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1">
      {counts.map(([kind, n]) => (
        <li key={kind} className="type-small flex items-center gap-1.5 text-fg-muted">
          <span aria-hidden className="size-[5px]" style={{ background: KIND[kind].tone }} />
          {n} {KIND[kind].label.toLowerCase()}
        </li>
      ))}
    </ul>
  )
}

function Entry({ release, latest, pending }: { release: Release; latest: boolean; pending: number }) {
  // A version marked unreleased keeps its number as the title; "Unreleased" moves to the line under it.
  const numbered = release.unreleased && release.version !== 'Unreleased'
  return (
    <article aria-labelledby={release.id} className="frame-section">
      <div className="gutter grid gap-6 py-12 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10 md:py-16">
        <div className="relative md:sticky md:top-[calc(var(--header-height)+2rem)] md:self-start">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className={cn('size-[9px] shrink-0', release.unreleased ? 'particle size-[9px]' : latest ? 'bg-fg' : 'border border-line-strong bg-canvas')}
            />
            <h2 id={release.id} className="group/anchor scroll-mt-[calc(var(--header-height)+1.5rem)] type-heading leading-none text-fg tabular-nums">
              <a href={`#${release.id}`} className="inline-flex items-center gap-2 rounded-sm focus-ring">
                {release.version}
                <HashIcon size={14} className="text-fg-muted opacity-0 transition-opacity yj-duration-fast ease-standard group-hover/anchor:opacity-100 group-focus-within/anchor:opacity-100" aria-hidden />
              </a>
            </h2>
          </div>
          <div className="mt-3 flex flex-col gap-2.5 ps-[21px]">
            <p className="type-small text-fg-muted">
              {numbered ? (
                <>
                  <span className="text-fg">Unreleased</span> · not yet published
                </>
              ) : release.unreleased ? (
                <>In progress{pending ? ` · ${pending} ${pending === 1 ? 'changeset' : 'changesets'} pending` : ''}</>
              ) : (
                <>
                  {latest && <span className="text-fg">Latest</span>}
                  {latest && release.date && ' · '}
                  {release.date && <time dateTime={release.date}>{formatDate(release.date)}</time>}
                  {!latest && !release.date && 'Released'}
                </>
              )}
            </p>
            <Tally release={release} />
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-10">
          {release.intro && (
            <div className="prose max-w-none">
              <Markdown>{release.intro}</Markdown>
            </div>
          )}
          {release.sections.map((section, i) => (
            <Section key={i} section={section} release={release} />
          ))}
        </div>
      </div>
    </article>
  )
}

export default function ChangelogPage() {
  const nav = siteNav()
  const { releases, pending } = readChangelog()
  const latest = releases.find((r) => !r.unreleased)

  return (
    <>
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <div className="frame">
          <PageHero
            label="Changelog"
            title="Every release, in order."
            lede={
              <p>
                The packages ship together under one version, so one number describes the whole kit. Each entry says what broke and how to move, what’s new, and
                what was fixed.
              </p>
            }
          >
            {latest && (
              <ButtonLink href="/changelog.xml" variant="outline" size="sm" prefetch={false}>
                <RssIcon size={14} aria-hidden />
                RSS feed
              </ButtonLink>
            )}
            <ButtonLink href={project.file('CHANGELOG.md')} variant="ghost" size="sm">
              CHANGELOG.md
            </ButtonLink>
          </PageHero>
          {/* With one release, its heading below is the whole index. */}
          {releases.length > 1 && (
          <nav aria-label="Releases" className="frame-section">
            <ol className="gutter flex flex-wrap items-center gap-1.5 py-4">
              {releases.map((r) => (
                <li key={r.id}>
                  <a
                    href={`#${r.id}`}
                    className="inline-flex h-7 items-center gap-2 rounded-md border border-line bg-surface px-2.5 type-label tabular-nums text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg focus-ring"
                  >
                    {r.unreleased && <span aria-hidden className="particle size-[5px]" />}
                    {r.version}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          )}
          {releases.map((release) => (
            <Entry key={release.id} release={release} latest={release === latest} pending={pending} />
          ))}
        </div>
      </main>
      <SiteFooter nav={nav} start={startLinks()} framed />
    </>
  )
}
