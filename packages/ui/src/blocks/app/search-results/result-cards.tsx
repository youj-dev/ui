'use client'

import type { MouseEvent, ReactNode } from 'react'
import { useLocale } from '@youj/core'
import { CornerDownLeftIcon, FileTextIcon, KanbanIcon } from '@youj/icons'
import { Avatar, AvatarFallback, AvatarGroup } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { Kbd } from '../../../components/ui/kbd'
import { Progress } from '../../../components/ui/progress'
import { cn } from '../../../lib/utils'
import { personOf, useSearchConfig } from './copy'
import type { DocumentItem, PersonItem, ProjectItem, SearchItem } from './data'
import { highlight, updatedLabel } from './model'

/* One layout per result type, so a scan tells them apart before reading:
 * documents lead with where they live and what they say, people with a face
 * and their local time, projects with status and how far along they are.
 * Each card is one stop: its title is a link stretched over the card, so the
 * whole card is the target and the focus ring wraps it. Matches of the query
 * are marked in titles, paths, excerpts and bios. */

export function Highlight({ text, words }: { text: string; words: string[] }) {
  return (
    <>
      {highlight(text, words).map((part, i) =>
        part.match ? (
          <mark key={i} className="-mx-px rounded-[3px] bg-warning-line px-px text-fg">
            {part.text}
          </mark>
        ) : (
          part.text
        ),
      )}
    </>
  )
}

function Person({ id, size = 'sm' }: { id: string; size?: 'sm' | 'lg' }) {
  const { people } = useSearchConfig()
  return (
    <Avatar size={size}>
      <AvatarFallback>{personOf(people, id).initials}</AvatarFallback>
    </Avatar>
  )
}

interface CardProps {
  /** The title's heading level: one below the results heading. */
  titleAs: 'h3' | 'h4' | 'h5'
  words: string[]
  onOpen: (item: SearchItem, event: MouseEvent<HTMLAnchorElement>) => void
}

interface ShellProps {
  as: CardProps['titleAs']
  item: SearchItem
  onOpen: CardProps['onOpen']
  lead: ReactNode
  title: ReactNode
  /** Beside the title, outside the link's name (a status). */
  badge?: ReactNode
  children: ReactNode
}

function Shell({ as: Title, item, onOpen, lead, title, badge, children }: ShellProps) {
  const { link: Link, getHref } = useSearchConfig()
  return (
    <article
      className={cn(
        'group/result relative flex gap-3.5 rounded-xl border border-transparent px-3 py-3.5 sm:px-4',
        'transition-[background-color,border-color] yj-duration-fast ease-standard',
        'hover:bg-hover has-[a:focus-visible]:border-focus has-[a:focus-visible]:bg-hover',
      )}
    >
      <div className="shrink-0 pt-0.5">{lead}</div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Title className="flex flex-wrap items-center gap-x-2 gap-y-1 pe-9 text-ui font-medium text-fg">
          <Link
            href={getHref(item)}
            data-result
            onClick={(event: MouseEvent<HTMLAnchorElement>) => onOpen(item, event)}
            className="outline-none after:absolute after:inset-0 after:rounded-xl"
          >
            {title}
          </Link>
          {badge}
        </Title>
        {children}
      </div>
      <Kbd
        aria-hidden
        className={cn(
          'absolute end-3 top-3.5 opacity-0 transition-[opacity,translate] yj-duration-fast ease-standard reduced:translate-x-0',
          '-translate-x-1 rtl:translate-x-1 group-hover/result:translate-x-0 group-hover/result:opacity-100',
          'group-has-[a:focus-visible]/result:translate-x-0 group-has-[a:focus-visible]/result:opacity-100',
        )}
      >
        <CornerDownLeftIcon size={12} />
      </Kbd>
    </article>
  )
}

const Meta = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-ui-sm text-fg-muted [&>[data-dot]]:text-line">{children}</div>
)
const Dot = () => (
  <span data-dot aria-hidden>
    ·
  </span>
)

function DocumentCard({ item, words, onOpen, titleAs }: CardProps & { item: DocumentItem }) {
  const { copy, people, today, locale: configLocale } = useSearchConfig()
  const locale = useLocale(configLocale)
  const owner = personOf(people, item.owner)
  return (
    <Shell
      as={titleAs}
      item={item}
      onOpen={onOpen}
      lead={
        <span className="grid size-9 place-items-center rounded-lg border border-line bg-surface text-fg-muted">
          <FileTextIcon size={18} aria-hidden />
        </span>
      }
      title={<Highlight text={item.title} words={words} />}
    >
      <p className="-order-1 truncate text-ui-xs text-fg-muted">
        <Highlight text={item.path.join(' / ')} words={words} />
      </p>
      <p className="line-clamp-2 text-ui text-fg-muted">
        <Highlight text={item.excerpt} words={words} />
      </p>
      <Meta>
        <span className="flex items-center gap-1.5">
          <Person id={item.owner} />
          {owner.name}
        </span>
        <Dot />
        <span>{copy.updated(updatedLabel(item.updated, today, copy, locale))}</span>
        <Dot />
        <span>{copy.minRead(item.minutes)}</span>
        <span className="flex gap-1 max-sm:hidden">
          {item.tags.map((t) => (
            <Badge key={t} variant="secondary">
              {t}
            </Badge>
          ))}
        </span>
      </Meta>
    </Shell>
  )
}

function localTime(utc: number, today: Date, locale: string) {
  const date = new Date(today.getTime() + utc * 3_600_000)
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' })
}

function PersonCard({ item, words, onOpen, titleAs }: CardProps & { item: PersonItem }) {
  const { copy, people, today, locale: configLocale } = useSearchConfig()
  const locale = useLocale(configLocale)
  const p = personOf(people, item.owner)
  return (
    <Shell as={titleAs} item={item} onOpen={onOpen} lead={<Person id={item.owner} size="lg" />} title={<Highlight text={item.title} words={words} />}>
      <p className="-order-1 text-ui-xs text-fg-muted">{copy.person}</p>
      <p className="text-ui text-fg">
        <Highlight text={`${p.role}, ${p.team}`} words={words} />
      </p>
      <p className="line-clamp-2 text-ui text-fg-muted">
        <Highlight text={item.bio} words={words} />
      </p>
      <Meta>
        <span>{p.location}</span>
        <Dot />
        <span className="tabular-nums">{copy.localTime(localTime(p.utc, today, locale))}</span>
        <Dot />
        <span className="truncate">{p.email}</span>
      </Meta>
    </Shell>
  )
}

const STATUS = { 'on-track': 'success', 'at-risk': 'warning', done: 'secondary' } as const

function ProjectCard({ item, words, onOpen, titleAs }: CardProps & { item: ProjectItem }) {
  const { copy, people } = useSearchConfig()
  return (
    <Shell
      as={titleAs}
      item={item}
      onOpen={onOpen}
      lead={
        <span className="grid size-9 place-items-center rounded-lg bg-accent-subtle text-accent">
          <KanbanIcon size={18} aria-hidden />
        </span>
      }
      title={<Highlight text={item.title} words={words} />}
      badge={<Badge variant={STATUS[item.status]}>{copy.projectStatus[item.status]}</Badge>}
    >
      <p className="-order-1 text-ui-xs text-fg-muted">{copy.ledBy(personOf(people, item.owner).name)}</p>
      <p className="line-clamp-2 text-ui text-fg-muted">
        <Highlight text={item.summary} words={words} />
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-0.5">
        <Progress value={item.progress} aria-label={copy.progress(item.title)} className="w-40 flex-nowrap">
          <span className="order-last w-9 shrink-0 text-end text-ui-sm text-fg-muted tabular-nums">{item.progress}%</span>
        </Progress>
        <AvatarGroup className="-space-x-1" aria-label={copy.members(item.members.length)}>
          {item.members.map((m) => (
            <Person key={m} id={m} />
          ))}
        </AvatarGroup>
        <span className="text-ui-sm text-fg-muted">{item.status === 'done' ? copy.shipped(item.due) : copy.due(item.due)}</span>
      </div>
    </Shell>
  )
}

export function ResultCard({ item, ...props }: CardProps & { item: SearchItem }) {
  switch (item.type) {
    case 'document':
      return <DocumentCard item={item} {...props} />
    case 'person':
      return <PersonCard item={item} {...props} />
    case 'project':
      return <ProjectCard item={item} {...props} />
  }
}
