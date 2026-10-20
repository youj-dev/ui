'use client'

import type { ComponentProps, ElementType, ReactNode } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { Counter, Reveal, SpotlightGroup } from '@youj/motion'
import { BanknoteIcon } from '@youj/icons'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion'
import { AppPage } from '../../components/ui/app-page'
import { Card, CardContent } from '../../components/ui/card'
import { cn } from '../../lib/utils'
import { Contact, demoSubmit } from './help-center/contact'
import {
  ARTICLES,
  CATEGORIES,
  CHANNELS,
  FAQ,
  HELP_CENTER_COPY,
  POPULAR,
  TOPICS,
  demo,
  type HelpArticle,
  type HelpCategory,
  type HelpCenterCopy,
  type HelpChannel,
  type HelpQuestion,
  type HelpRequest,
  type HelpTopic,
} from './help-center/data'
import { Search } from './help-center/search'

/* Harbor's help center, in the Graphite theme. The hero's search filters articles
 * as you type: results arrive and leave through PresenceList, the matched
 * words are marked, and a status line counts them. Popular searches fill the
 * field in one press. Below, the six categories share one spotlight
 * (SpotlightGroup) and count their articles up as they scroll in (Counter),
 * and popular questions open in an Accordion. "Still stuck?" is a contact
 * panel: choosing Chat, Email or Phone retargets the typical reply time
 * (Counter, with its unit morphing through MorphLabel); the form takes a
 * topic, a message and attachments (FileUpload), and sending swaps it for a
 * skeleton and then the ticket through ContentSwap, the box easing between
 * heights. Reduced motion: results, counters and the swap are instant.
 *
 * Pass your `categories`, `articles` (or answer queries with `onSearch`),
 * `questions`, `channels` and `topics`, and send requests through `onSubmit`;
 * every string is in `copy`. */

interface HelpCenterProps extends Omit<ComponentProps<'div'>, 'children' | 'onSubmit'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter, with no brand bar or hero of its own (the status pill moves to the header's actions). Default true; `false` draws its own page (the brand bar and a centered hero). */
  embedded?: boolean
  /** The topic cards. Default: Harbor's six. */
  categories?: HelpCategory[]
  /** What the search looks through by title. Default: Harbor's thirteen. */
  articles?: HelpArticle[]
  /** Answers a search yourself (your search API, say); without it, `articles` are matched by title. */
  onSearch?: (query: string) => HelpArticle[] | Promise<HelpArticle[]>
  /** One-press searches under the field; `[]` hides the row. Default: four. */
  popular?: string[]
  /** The popular questions. Default: Harbor's five. */
  questions?: HelpQuestion[]
  /** The ways to reach support. Default: chat, email and phone. */
  channels?: HelpChannel[]
  /** The choices under "What's this about?". Default: Harbor's five. */
  topics?: HelpTopic[]
  /** Sends a support request and resolves with the ticket's id; reject with an Error to say why not. Default: a short demo wait. */
  onSubmit?: (request: HelpRequest) => Promise<string>
  /** Uploads an attachment. Default: a short demo wait. */
  onUpload?: (file: File) => Promise<unknown>
  /** The product in the header: `{ name, logo?, href? }`. Default: Harbor. */
  brand?: { name: string; logo?: ReactNode; href?: string }
  /** The status pill's link; `null` hides it. Default '#status'. */
  statusHref?: string | null
  /** Renders article and topic links, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: ElementType
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<HelpCenterCopy>
}

function HelpCenter({
  theme,
  embedded = true,
  categories = CATEGORIES,
  articles = ARTICLES,
  onSearch,
  popular = POPULAR,
  questions = FAQ,
  channels = CHANNELS,
  topics = TOPICS,
  onSubmit = demoSubmit,
  onUpload = () => demo('HelpCenter: onUpload', 900),
  brand,
  statusHref = '#status',
  linkComponent: Link = 'a',
  copy: copyProp,
  className,
  ...rest
}: HelpCenterProps) {
  const copy = { ...HELP_CENTER_COPY, ...copyProp }
  const status = statusHref !== null && (
    <a
      href={statusHref}
      className="focus-ring ms-auto inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-ui-sm text-fg-muted hover:text-fg"
    >
      <span aria-hidden className="relative flex size-2">
        <span className="absolute inset-0 rounded-full bg-success-line motion-safe:scale-[1.8]" />
        <span className="relative size-2 rounded-full bg-success" />
      </span>
      <span>
        {copy.status}
        <span className="sr-only">{copy.statusLink}</span>
      </span>
    </a>
  )
  const sections = (
    <>
      {categories.length > 0 && (
        <section aria-labelledby="topics" className="flex flex-col gap-5">
          <h2 id="topics" className="text-ui-lg font-semibold tracking-tight">
            {copy.topics}
          </h2>
          <SpotlightGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => (
              <Reveal key={c.id} delay={i % 3}>
                <Card spotlight size="sm" className="h-full">
                  <CardContent className="flex flex-col gap-3">
                    <span aria-hidden className="grid size-9 place-items-center rounded-lg bg-band text-fg-muted">
                      <c.icon size={18} />
                    </span>
                    <Link href={c.href ?? `#${c.id}`} className="focus-ring rounded-sm font-semibold text-fg after:absolute after:inset-0">
                      {c.title}
                    </Link>
                    <p className="text-ui text-fg-muted">{c.description}</p>
                    <p className="mt-auto text-ui-sm text-fg-muted">
                      <Counter value={c.count} className="font-medium text-fg" />
                      {copy.articles(c.count)}
                    </p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </SpotlightGroup>
        </section>
      )}

      {questions.length > 0 && (
        <section aria-labelledby="faq" className="grid gap-6 md:grid-cols-[18rem_1fr] md:gap-12">
          <div className="flex flex-col gap-2">
            <h2 id="faq" className="text-2xl font-semibold tracking-tight">
              {copy.faqTitle}
            </h2>
            <p className="text-ui text-fg-muted">{copy.faqDescription}</p>
          </div>
          {/* The questions and one open answer's room at 100%: opening more scrolls here rather than lengthening the page. */}
          <Accordion hiddenUntilFound className="-mx-1 h-70 overflow-y-auto px-1 yj-scrollbar">
            {questions.map((item, i) => (
              <AccordionItem key={item.q} value={i}>
                <AccordionTrigger className="text-ui-lg">{item.q}</AccordionTrigger>
                <AccordionContent className="text-ui text-fg-muted">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}

      <Contact copy={copy} channels={channels} topics={topics} onSubmit={onSubmit} onUpload={onUpload} />
    </>
  )

  if (embedded) {
    const page = (
      <AppPage {...rest} title={copy.title} description={copy.description} actions={status} className={cn('text-fg', className)}>
        <div className="flex flex-col gap-10">
          <Search copy={copy} articles={articles} categories={categories} popular={popular} onSearch={onSearch} Link={Link} />
          {sections}
        </div>
      </AppPage>
    )
    return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
  }
  return (
    <ThemeScope theme={theme}>
      <div className={cn('min-h-dvh bg-canvas text-fg', className)} {...rest}>
        <header className="border-b border-line">
          <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 md:px-8">
            <a href={brand?.href ?? '#harbor'} className="focus-ring flex items-center gap-2 rounded-md font-semibold tracking-tight">
              {brand?.logo ?? (
                <span aria-hidden className="grid size-6 place-items-center rounded-md bg-accent text-on-accent">
                  <BanknoteIcon size={14} />
                </span>
              )}
              {brand?.name ?? 'Harbor'} <span className="font-normal text-fg-muted">{copy.brandSuffix}</span>
            </a>
            {status}
          </div>
        </header>
        <main>
          <div className="relative isolate overflow-visible border-b border-line">
            <Reveal inView={false} className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 pt-16 pb-14 text-center md:px-8 md:pt-24 md:pb-20">
              <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">{copy.title}</h1>
              <p className="max-w-lg text-lg text-fg-muted">{copy.description}</p>
              <Search copy={copy} articles={articles} categories={categories} popular={popular} onSearch={onSearch} Link={Link} />
            </Reveal>
          </div>

          <div className="mx-auto flex max-w-5xl flex-col gap-16 px-4 py-14 md:px-8 md:py-20">
            {sections}
          </div>
        </main>
      </div>
    </ThemeScope>
  )
}

export { HelpCenter, HELP_CENTER_COPY }
export type { HelpArticle, HelpCategory, HelpCenterCopy, HelpCenterProps, HelpChannel, HelpQuestion, HelpRequest, HelpTopic }
