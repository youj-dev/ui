'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type ElementType } from 'react'
import { ThemeScope, useYouj, type ThemeInput } from '@youj/core'
import { PresenceItem, PresenceList, Reveal } from '@youj/motion'
import { MessageIcon, SearchXIcon } from '@youj/icons'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion'
import { buttonVariants } from '../../components/ui/button'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useIsPhone } from '../../hooks/use-mobile'
import { cn } from '../../lib/utils'
import { AnswerFooter, type FaqFeedback } from './faq/answer'
import { DEFAULT_COPY, demo, fold, QUESTIONS, questionId, words, type FaqCopy, type FaqCta, type FaqQuestion } from './faq/data'
import { Marked, Search } from './faq/search'

/* Frequently asked questions, as a small help center that stays calm. On the inline start: the heading, a search that
 * filters as you type (the count of answers it leaves sits in the field; Escape clears it, ↓ goes to the first
 * question), the topics with how many each holds for the search, and a way to reach a person. On the end, the answers
 * grouped by topic in one Accordion: the search marks its words in questions and answers and opens an answer whose
 * body matched, so the hit is in view; questions that stop matching fade where they stand while the rest glide up.
 * Every answer has a deep link: arriving with `#its-id` (or following one) opens it, scrolls it into view and flashes
 * it; opening one writes its link in the address bar, and Copy link copies it. Under each answer, "Was this
 * helpful?" waits on the app's `onFeedback` and thanks you, and No hands you to a person. Answers stay in the page for
 * find-in-page (hiddenUntilFound). Reduced motion: lists change and answers open at once.
 *
 * Pass your `questions` (with a `topic` and an `id` each, ideally), own the open answers, the topic and the search
 * when the URL should hold them, wire `onFeedback` and the contact `cta`; every string is in `copy`. */

type HeadingLevel = 1 | 2 | 3

interface FaqProps extends Omit<ComponentProps<'section'>, 'children' | 'defaultValue'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** The questions, in order; their topics come from them. Default: the demo's twelve in four topics. */
  questions?: FaqQuestion[]
  /** The open answers, by id, controlled. */
  value?: string[]
  /** The answers open at first, by id, uncontrolled. Default: the first. */
  defaultValue?: string[]
  /** Called with the open answers' ids when one opens or closes. */
  onValueChange?: (value: string[]) => void
  /** The topic shown (`''` is all), controlled. */
  topic?: string
  /** The topic shown first, uncontrolled. Default all. */
  defaultTopic?: string
  onTopicChange?: (topic: string) => void
  /** The search, controlled. */
  query?: string
  /** The search first shown, uncontrolled. Default none. */
  defaultQuery?: string
  onQueryChange?: (query: string) => void
  /** Shows the search field. Default true. */
  search?: boolean
  /** Answers open from `#id` in the address bar, write it when opened, and offer Copy link. Default true. */
  deepLinks?: boolean
  /** Called with a reader's verdict on an answer; awaited. Default: a short demo wait. */
  onFeedback?: (question: FaqQuestion, helpful: boolean) => Promise<unknown> | unknown
  /** The way to a person, in the start column and after a No; `null` hides it. Default: Contact support → `#contact`. */
  cta?: FaqCta | null
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<FaqCopy>
  /** The section heading's level; topics sit one below and questions two. Default 2. */
  headingLevel?: HeadingLevel
  /** The element every link renders as, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: ElementType
}

const PAGE_LINK = () => `${window.location.origin}${window.location.pathname}${window.location.search}`

function Faq({
  theme,
  embedded = false,
  questions = QUESTIONS,
  value: valueProp,
  defaultValue,
  onValueChange,
  topic: topicProp,
  defaultTopic = '',
  onTopicChange,
  query: queryProp,
  defaultQuery = '',
  onQueryChange,
  search = true,
  deepLinks = true,
  onFeedback,
  cta = { label: 'Contact support', href: '#contact' },
  copy: copyProp,
  headingLevel = 2,
  linkComponent: Link = 'a',
  className,
  ...rest
}: FaqProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const k = useYouj()
  const titleId = useId()
  const Title = `h${headingLevel}` as const
  const Group = `h${headingLevel + 1}` as 'h2' | 'h3' | 'h4'
  const phone = useIsPhone()
  const list = useRef<HTMLDivElement>(null)
  const items = useMemo(() => questions.map((q) => ({ q, id: questionId(q), topic: q.topic ?? copy.general })), [questions, copy.general])
  const [value, setValue] = useControllableState(valueProp, defaultValue ?? (items[0] ? [items[0].id] : []))
  const [topic, setTopic] = useControllableState(topicProp, defaultTopic)
  const [query, setQuery] = useControllableState(queryProp, defaultQuery)
  // The answers closed by hand during this search: the search doesn't open them again.
  const [dismissed, setDismissed] = useState({ query, ids: [] as string[] })
  if (dismissed.query !== query) setDismissed({ query, ids: [] })
  const [feedback, setFeedback] = useState<Record<string, FaqFeedback>>({})
  const [flash, setFlash] = useState<string | null>(null)
  const written = useRef<string | null>(null)

  const terms = words(query)
  const text = (item: (typeof items)[number]) =>
    fold([item.q.question, typeof item.q.answer === 'string' ? item.q.answer : '', ...(item.q.keywords ?? [])].join(' '))
  const matching = items.filter((item) => terms.every((term) => text(item).includes(term)))
  const topics = [...new Set(items.map((item) => item.topic))].map((name) => ({ name, count: matching.filter((item) => item.topic === name).length }))
  const shown = topic ? matching.filter((item) => item.topic === topic) : matching
  const groups = topics.filter((t) => (!topic || t.name === topic) && t.count > 0)
  // An answer that matched in its body (not its question) opens while the search lasts, so the match is in view.
  const auto = terms.length
    ? shown
        .filter((i) => !value.includes(i.id) && !dismissed.ids.includes(i.id) && !terms.every((t) => fold(i.q.question).includes(t)))
        .map((i) => i.id)
    : []
  const open = [...value, ...auto]

  const commit = (next: string[]) => {
    setValue(next)
    onValueChange?.(next)
  }
  const pickTopic = (next: string) => {
    setTopic(next)
    onTopicChange?.(next)
  }
  const pickQuery = (next: string) => {
    setQuery(next)
    onQueryChange?.(next)
  }
  const toggle = (next: string[]) => {
    const opened = next.find((id) => !open.includes(id))
    const closed = auto.filter((id) => !next.includes(id))
    if (closed.length) setDismissed({ query, ids: [...dismissed.ids, ...closed] })
    commit(next.filter((id) => !auto.includes(id)))
    if (deepLinks && opened) {
      written.current = opened
      window.history.replaceState(window.history.state, '', `#${opened}`)
    }
  }

  // Deep links: `#id` on arrival or on a hashchange opens that answer, in view and flashed. The listener reads the
  // state as it is when the link arrives.
  const reveal = (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item || id === written.current) return
    if (topic && topic !== item.topic) pickTopic('')
    if (query && !matching.some((i) => i.id === id)) pickQuery('')
    if (!value.includes(id)) commit([...value, id])
    setFlash(id)
  }
  const latest = useRef(reveal)
  useLayoutEffect(() => {
    latest.current = reveal
  })
  useEffect(() => {
    if (!deepLinks) return
    const follow = () => latest.current(decodeURIComponent(window.location.hash.slice(1)))
    const frame = requestAnimationFrame(follow)
    window.addEventListener('hashchange', follow)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('hashchange', follow)
    }
  }, [deepLinks])
  useLayoutEffect(() => {
    if (!flash) return
    document.getElementById(flash)?.scrollIntoView({ block: 'center', behavior: k.reduced ? 'auto' : 'smooth' })
    const timer = setTimeout(() => setFlash(null), 1600)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- scrolls once per flash; k.reduced only picks how
  }, [flash])

  const give = (item: (typeof items)[number], helpful: boolean) => {
    setFeedback((f) => ({ ...f, [item.id]: 'sending' }))
    Promise.resolve(onFeedback ? onFeedback(item.q, helpful) : demo('Faq: onFeedback', 500)).then(
      () => setFeedback((f) => ({ ...f, [item.id]: helpful ? 'yes' : 'no' })),
      () =>
        setFeedback((f) => {
          const restOf = { ...f }
          delete restOf[item.id]
          return restOf
        }),
    )
  }

  // The way to a person: under the topics on a wide screen, after the answers on a narrow one.
  const stuck = cta && (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-surface p-5">
      <p className="text-ui-lg font-medium">{copy.stuckTitle}</p>
      <p className="text-pretty text-ui text-fg-muted">{copy.stuckDescription}</p>
      <Link href={cta.href} onClick={cta.onClick} data-yj-trigger="" className={buttonVariants({ variant: 'secondary', className: 'mt-1' })}>
        <MessageIcon size={16} /> {cta.label}
      </Link>
    </div>
  )

  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas py-20 md:py-28', className)}>
      <div className={cn('grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.85fr)] lg:gap-16', !embedded && 'mx-auto max-w-6xl px-4 sm:px-6')}>
        <div className="flex flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
          <Reveal className="flex flex-col items-start gap-4">
            {copy.eyebrow && <p className="text-ui-sm font-medium text-fg-muted">{copy.eyebrow}</p>}
            <Title id={titleId} className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {copy.title}
            </Title>
            {copy.description && <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>}
          </Reveal>
          {search && <Search copy={copy} value={query} onValueChange={pickQuery} count={matching.length} list={list} />}
          {topics.length > 1 &&
            (phone ? (
              <Select
                items={{ '': copy.all, ...Object.fromEntries(topics.map((t) => [t.name, t.name])) }}
                value={topic}
                onValueChange={(next) => pickTopic(next ?? '')}
              >
                <SelectTrigger aria-label={copy.topics} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{copy.all}</SelectItem>
                  {topics.map((t) => (
                    <SelectItem key={t.name} value={t.name}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <SegmentedControl
                orientation="vertical"
                value={topic || '*'}
                onValueChange={(next) => pickTopic(next === '*' ? '' : next)}
                aria-label={copy.topics}
                className="w-full"
              >
                {[{ name: '*', label: copy.all, count: matching.length }, ...topics.map((t) => ({ ...t, label: t.name }))].map((t) => (
                  <SegmentedControlItem key={t.name} value={t.name} className={cn('justify-between gap-3 ps-3', t.count === 0 && 'text-fg-subtle')}>
                    {t.label}
                    <span className="font-mono text-ui-xs text-fg-subtle tabular-nums">{t.count}</span>
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            ))}
          {stuck && <div className="hidden lg:block">{stuck}</div>}
        </div>
        {/* The answers scroll in their own height (936px at 100%): opening one, a topic or a search never resizes the section. */}
        <div ref={list} className="-mx-3 h-234 min-w-0 overflow-y-auto px-3 yj-scrollbar">
          {groups.length ? (
            <Accordion multiple value={open} onValueChange={(next: string[]) => toggle(next)} hiddenUntilFound>
              <PresenceList as="div" className="flex flex-col">
                {groups.flatMap((group) => [
                  <PresenceItem
                    as="div"
                    key={`topic:${group.name}`}
                    className="flex items-baseline justify-between gap-4 border-b border-line pt-8 pb-3 first:pt-0"
                  >
                    <Group className="text-ui-sm font-medium text-fg-muted">{group.name}</Group>
                    <span aria-hidden className="font-mono text-ui-xs text-fg-subtle tabular-nums">
                      {group.count}
                    </span>
                  </PresenceItem>,
                  ...shown
                    .filter((item) => item.topic === group.name)
                    .map((item) => (
                      <PresenceItem
                        as="div"
                        key={item.id}
                        // The flash of an answer reached by its link: a wash a step wider than the column.
                        className={cn('-mx-3 rounded-lg px-3 transition-colors yj-duration-slow ease-standard', flash === item.id && 'bg-selected')}
                      >
                        <AccordionItem value={item.id} id={deepLinks ? item.id : undefined} className="scroll-mt-24 last:border-b">
                          <AccordionTrigger headingLevel={(headingLevel + 2) as 3 | 4 | 5} className="py-4 text-ui-lg">
                            <span>
                              <Marked text={item.q.question} terms={terms} />
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="text-ui text-fg-muted">
                            {typeof item.q.answer === 'string' ? <Marked text={item.q.answer} terms={terms} /> : item.q.answer}
                            <AnswerFooter
                              copy={copy}
                              feedback={feedback[item.id]}
                              onFeedback={(helpful) => give(item, helpful)}
                              link={deepLinks ? () => `${PAGE_LINK()}#${item.id}` : undefined}
                              cta={cta}
                              Link={Link}
                            />
                          </AccordionContent>
                        </AccordionItem>
                      </PresenceItem>
                    )),
                ])}
              </PresenceList>
            </Accordion>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-16 text-center">
              <SearchXIcon size={24} className="text-fg-subtle" />
              <p className="text-ui-lg font-medium">{copy.noResults(query.trim())}</p>
              <p className="max-w-sm text-pretty text-ui text-fg-muted">{copy.noResultsHint}</p>
              {cta && (
                <Link href={cta.href} onClick={cta.onClick} className={buttonVariants({ variant: 'outline', className: 'mt-2' })}>
                  <MessageIcon size={16} /> {cta.label}
                </Link>
              )}
            </div>
          )}
        </div>
        {stuck && <div className="lg:hidden">{stuck}</div>}
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { Faq }
export type { FaqProps, FaqCopy, FaqQuestion, FaqCta }
