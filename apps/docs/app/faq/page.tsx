import type { Metadata } from 'next'
import { FaqAccordion } from '@/components/site/faq-accordion'
import { Markdown } from '@/components/site/markdown'
import { PageHero } from '@/components/site/page-hero'
import { ArrowRightIcon } from '@/components/client'
import { MessagesIcon } from '@/components/site/site-icons'
import { SiteFooter } from '@/components/site/site-footer'
import { ButtonLink } from '@/components/ui/button-link'
import { plainText } from '@/lib/changelog'
import { siteNav, startLinks } from '@/lib/nav'
import { project } from '@/lib/project'
import { siteUrl } from '@/lib/site'
import { faq } from './questions'
import { InlineScript } from '@/components/inline-script'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Straight answers about Youj: license, shadcn/ui, React and Next.js support, bundle size, reduced motion, theming, icons, accessibility and getting help.',
}

/* Questions in groups on the landing's frame: an index of the groups on a
 * rail beside them on wide screens (above them on phones), and each group an
 * accordion. The answers are Markdown from ./questions, rendered on the
 * server; the same text goes out as FAQPage structured data. */

export default function FaqPage() {
  const nav = siteNav()
  const groups = faq()
  const site = siteUrl()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: `${site}/faq`,
    mainEntity: groups.flatMap((g) =>
      g.questions.map((q) => ({ '@type': 'Question', name: q.question, acceptedAnswer: { '@type': 'Answer', text: plainText(q.answer) } })),
    ),
  }

  return (
    <>
      <InlineScript type="application/ld+json" code={JSON.stringify(jsonLd).replace(/</g, '\\u003c')} />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <div className="frame">
          <PageHero
            label="FAQ"
            title="Questions, answered."
            lede={<p>What people ask before they install Youj, answered from the code and the docs. Each answer links to where the detail lives.</p>}
          />
          <div className="frame-section">
            <div className="gutter grid gap-10 py-12 md:grid-cols-[13rem_minmax(0,1fr)] md:py-16">
              <nav aria-label="Topics" className="md:sticky md:top-[calc(var(--header-height)+2rem)] md:self-start">
                <p className="type-label">Topics</p>
                <ol className="mt-4 flex flex-wrap gap-x-4 gap-y-2 md:flex-col md:gap-2.5">
                  {groups.map((g) => (
                    <li key={g.id}>
                      <a href={`#${g.id}`} className="flex items-baseline gap-2 rounded-sm text-[13.5px] text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg focus-ring">
                        {g.title}
                        <span className="type-small text-fg-subtle">{g.questions.length}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
              <div className="flex min-w-0 flex-col gap-14">
                {groups.map((g) => (
                  <section key={g.id} aria-labelledby={g.id}>
                    <h2 id={g.id} className="type-heading scroll-mt-[calc(var(--header-height)+1.5rem)] pb-4 text-fg">
                      {g.title}
                    </h2>
                    <FaqAccordion items={g.questions.map((q) => ({ id: q.id, question: q.question, answer: <Markdown>{q.answer}</Markdown> }))} />
                  </section>
                ))}
                <aside aria-labelledby="faq-more" className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6 sm:p-8">
                  <div aria-hidden className="dot-grid absolute inset-0 opacity-60 [mask-image:linear-gradient(to_left,black,transparent_60%)] rtl:[mask-image:linear-gradient(to_right,black,transparent_60%)]" />
                  <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 id="faq-more" className="type-subheading text-fg">
                        Didn’t find your question?
                      </h2>
                      <p className="mt-1.5 text-[14px] text-fg-muted">Ask it in GitHub Discussions, where the answer helps the next person too.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ButtonLink href={project.discussions} variant="outline">
                        <MessagesIcon size={15} aria-hidden />
                        Ask a question
                      </ButtonLink>
                      <ButtonLink href="/about#help" variant="ghost">
                        All the ways to get help
                        <ArrowRightIcon size={14} aria-hidden className="rtl:-scale-x-100" />
                      </ButtonLink>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter nav={nav} start={startLinks()} framed />
    </>
  )
}
