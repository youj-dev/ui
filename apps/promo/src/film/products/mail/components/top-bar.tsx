'use client'

import { Counter, SlidingIndicator } from '@youj/motion'
import { CommandIcon, PencilIcon, SearchIcon } from '@youj/icons'
import { Button } from '@youj/react/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@youj/react/components/ui/input-group'
import { Kbd } from '@youj/react/components/ui/kbd'
import { cn } from '@youj/react/lib/utils'
import { ME, type Stack } from '../data'
import { KICKER, STACK_NAMES } from '../styles'
import type { Folio } from '../use-folio'

const STACKS: Stack[] = ['inbox', 'later', 'done', 'sent', 'drafts']

/** The stacks, with their counts rolling as letters move between them; the current one is lifted by a gliding highlight. */
export function StackNav({ folio, className }: { folio: Folio; className?: string }) {
  return (
    <nav aria-label="Stacks" className={cn('relative isolate flex items-center gap-0.5 overflow-x-auto [scrollbar-width:none]', className)}>
      {STACKS.map((s) => {
        const n = s === 'sent' ? 0 : folio.count(s)
        return (
          <button
            key={s}
            type="button"
            aria-current={folio.stack === s ? 'page' : undefined}
            onClick={() => folio.pick(s)}
            className="flex h-control-sm shrink-0 items-center gap-1.5 rounded-md px-2.5 text-ui whitespace-nowrap text-fg-muted transition-colors yj-duration-fast ease-standard focus-ring hover:text-fg aria-[current=page]:text-fg"
          >
            {STACK_NAMES[s]}
            {n > 0 && <Counter value={n} mode="roll" inView={false} duration="slow" className="text-ui-sm text-fg-muted" />}
          </button>
        )
      })}
      <SlidingIndicator className="rounded-md bg-hover" />
    </nav>
  )
}

export function SearchField({ folio, className }: { folio: Folio; className?: string }) {
  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <SearchIcon size={15} />
      </InputGroupAddon>
      <InputGroupInput
        ref={folio.refs.search}
        aria-label="Search letters"
        placeholder={`Search ${STACK_NAMES[folio.stack].toLowerCase()}`}
        value={folio.query}
        onChange={(event) => folio.setQuery(event.target.value)}
      />
      <InputGroupAddon align="inline-end" className="max-md:hidden">
        <Kbd>/</Kbd>
      </InputGroupAddon>
    </InputGroup>
  )
}

export function Wordmark() {
  return (
    <span className="flex items-baseline gap-2">
      <span className="text-2xl leading-none font-semibold tracking-tight text-fg italic">Folio</span>
      <span className={cn(KICKER, 'max-lg:hidden')}>{ME.name}</span>
    </span>
  )
}

/** The top of the desk: the name, the stacks, search, the palette and Write. On a phone the stacks and search move into the index. */
export function TopBar({ folio, phone }: { folio: Folio; phone: boolean }) {
  return (
    <header className={cn('flex h-14 shrink-0 items-center border-b border-line', phone ? 'gap-2 px-4' : 'gap-5 px-5')}>
      <Wordmark />
      {!phone && <StackNav folio={folio} />}
      <span className="ms-auto" />
      {!phone && <SearchField folio={folio} className="md:w-44 lg:w-64" />}
      <Button variant="ghost" size={phone ? 'icon' : 'sm'} aria-label="Commands" aria-keyshortcuts="Meta+K" onClick={() => folio.setPalette(true)} className={cn(!phone && 'gap-1 max-lg:hidden')}>
        {phone ? (
          <CommandIcon size={17} />
        ) : (
          <>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </>
        )}
      </Button>
      <Button onClick={() => folio.compose()} size={phone ? 'icon' : 'default'} aria-label={phone ? 'Write a letter' : undefined} aria-keyshortcuts="C" data-yj-trigger="">
        <PencilIcon size={15} />
        {!phone && (
          <>
            Write <Kbd className="ms-1 border-on-accent/25 youj-allow-tint bg-on-accent/15 youj-allow-tint text-on-accent">C</Kbd>
          </>
        )}
      </Button>
    </header>
  )
}
