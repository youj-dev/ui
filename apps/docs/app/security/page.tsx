import type { Metadata } from 'next'
import { Markdown } from '@/components/site/markdown'
import { PageHero } from '@/components/site/page-hero'
import { ShieldAlertIcon } from '@/components/site/site-icons'
import { SiteFooter } from '@/components/site/site-footer'
import { ButtonLink } from '@/components/ui/button-link'
import { siteNav, startLinks } from '@/lib/nav'
import { privateAdvisory, project, securityEmail } from '@/lib/project'
import { readPolicy } from './policy'

export const metadata: Metadata = {
  title: 'Security',
  description:
    'How to report a Youj vulnerability privately, which versions get fixes, what happens next, and what the packages, CLI and MCP server do on your machine.',
}

/* SECURITY.md on the landing's frame, laid out like the FAQ: an index of its
 * sections on a rail beside them on wide screens (above them on phones), and
 * each section as prose. The report button leads, since that's what most
 * visitors came for. Nothing animates. */

export default function SecurityPage() {
  const nav = siteNav()
  const policy = readPolicy()

  return (
    <>
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <div className="frame">
          <PageHero label="Security" title="Report privately. Fixed, then disclosed." lede={<Markdown>{policy.intro}</Markdown>}>
            <ButtonLink href={`mailto:${securityEmail}`} size="sm">
              <ShieldAlertIcon size={14} aria-hidden />
              Report a vulnerability
            </ButtonLink>
            <ButtonLink href={privateAdvisory} variant="ghost" size="sm">
              GitHub advisory
            </ButtonLink>
            <ButtonLink href={project.file('SECURITY.md')} variant="ghost" size="sm">
              SECURITY.md
            </ButtonLink>
          </PageHero>
          <div className="frame-section">
            <div className="gutter grid gap-10 py-12 md:grid-cols-[13rem_minmax(0,1fr)] md:py-16">
              <nav aria-label="Sections" className="md:sticky md:top-[calc(var(--header-height)+2rem)] md:self-start">
                <p className="type-label">On this page</p>
                <ol className="mt-4 flex flex-wrap gap-x-4 gap-y-2 md:flex-col md:gap-2.5">
                  {policy.sections.map((s) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} className="rounded-sm text-[13.5px] text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg focus-ring">
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
              <div className="flex max-w-[48rem] min-w-0 flex-col gap-14">
                {policy.sections.map((s) => (
                  <section key={s.id} aria-labelledby={s.id}>
                    <h2 id={s.id} className="type-heading scroll-mt-[calc(var(--header-height)+1.5rem)] pb-4 text-fg">
                      {s.title}
                    </h2>
                    <div className="prose max-w-none">
                      <Markdown>{s.body}</Markdown>
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter nav={nav} start={startLinks()} framed />
    </>
  )
}
