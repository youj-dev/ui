'use client'

import type { ReactNode } from 'react'
import { ArrowRightIcon, HomeIcon, InboxIcon, PlusIcon, SearchIcon, SettingsIcon, UsersIcon, XIcon } from '@youj/icons'
import { Badge, Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@youj/react'
import { cn } from '@/lib/cn'
import type { ContextCopy } from './context-copy'

/* A scene where it would live (./context-copy says which screen and its words): an app's empty state, an onboarding
 * dialog over the app, or a website's hero, built from @youj/react's own parts in the stage's theme. Each is a minimal
 * screen with the scene as its picture, drawn large (about as wide as the screen's words): what it would be in a real
 * product, never a thumbnail in a busy page. The composition is a picture of a screen: hidden from assistive tech, its
 * buttons out of the tab order; the stage says in words what it shows (contextLabel). Each is laid out for its
 * container, so a narrow stage gets the phone's layout of the same screen, never a shrunken desktop one. The stage loads
 * this module as a chunk of its own (it draws only in the browser). */

interface ContextProps {
  copy: ContextCopy
  /** The scene's room: a box as wide as its holder, at the scene's aspect. */
  scene: ReactNode
  className?: string
}

/** A screen around the scene. */
export default function SceneContext({ copy, scene, className }: ContextProps) {
  const Screen = copy.kind === 'empty' ? EmptyScreen : copy.kind === 'onboarding' ? OnboardingScreen : HeroScreen
  return (
    <div aria-hidden className={cn('@container w-full', className)}>
      <Screen copy={copy} scene={scene} />
    </div>
  )
}

/** Out of the tab order: it's a picture of these buttons. */
const still = { tabIndex: -1 } as const

const shadow = 'shadow-[0_1px_2px_color-mix(in_oklab,var(--color-shadow)_6%,transparent),0_24px_48px_-24px_color-mix(in_oklab,var(--color-shadow)_28%,transparent)]'

const NAV = [
  { Icon: HomeIcon, label: 'Home' },
  { Icon: InboxIcon, label: '' },
  { Icon: UsersIcon, label: 'Team' },
  { Icon: SettingsIcon, label: 'Settings' },
]

/** An app's window with nothing in it yet: a title bar, a sidebar from a tablet's width, and the empty state, its picture large. */
function EmptyScreen({ copy, scene }: Omit<ContextProps, 'className'>) {
  return (
    <div className={cn('mx-auto flex w-full max-w-[48rem] flex-col overflow-hidden rounded-xl border border-line bg-canvas text-fg', shadow)}>
      <div className="flex h-10 shrink-0 items-center gap-3 border-b border-line bg-surface px-3.5">
        <span className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-2.5 rounded-full bg-line-strong" />
          ))}
        </span>
        <span className="truncate text-[13px] font-medium">{copy.title}</span>
        <span className="ms-auto hidden h-7 w-44 items-center gap-2 rounded-md border border-line bg-canvas px-2 text-[12px] text-fg-muted @md:flex">
          <SearchIcon size={13} strokeWidth={1.75} />
          Search
          <kbd className="ms-auto font-sans text-[11px] text-fg-muted">⌘K</kbd>
        </span>
        <span className="ms-auto size-6 shrink-0 rounded-full bg-[color-mix(in_oklab,var(--color-accent)_70%,var(--color-fg))] @md:ms-0" />
      </div>
      <div className="flex min-h-0">
        <nav className="hidden w-40 shrink-0 flex-col gap-0.5 border-e border-line bg-surface p-2 @2xl:flex">
          {NAV.map(({ Icon, label }, i) => (
            <span key={i} className={cn('flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] text-fg-muted', !label && 'bg-band text-fg')}>
              <Icon size={15} strokeWidth={1.75} className="shrink-0" />
              <span className="truncate">{label || copy.title}</span>
            </span>
          ))}
        </nav>
        <Empty className="min-w-0 flex-1 gap-5 px-6 py-8 @max-md:gap-3 @max-md:px-4 @max-md:py-5">
          <EmptyHeader className="max-w-[26rem] gap-2">
            {/* The picture is the empty state's: as wide as its words. */}
            <EmptyMedia className="mb-2 w-[min(23rem,100%)] @max-md:mb-0 @max-md:w-[min(15rem,100%)]">{scene}</EmptyMedia>
            <EmptyTitle>{copy.heading}</EmptyTitle>
            <EmptyDescription className="@max-md:hidden">{copy.body}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row flex-wrap justify-center gap-2">
            <Button {...still} size="sm">
              <PlusIcon size={15} strokeWidth={1.75} />
              {copy.primary}
            </Button>
            <Button {...still} size="sm" variant="outline" className="@max-md:hidden">
              {copy.secondary}
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </div>
  )
}

/** A step of a setup as a dialog over the app it sets up: the scene large on a tinted well, the step, what it asks, how far along, on or skip. */
function OnboardingScreen({ copy, scene }: Omit<ContextProps, 'className'>) {
  const [at, of] = copy.title.match(/(\d+) of (\d+)/)?.slice(1).map(Number) ?? [1, 1]
  return (
    <div className="relative mx-auto flex w-full max-w-[48rem] items-center justify-center px-4 py-6 @md:px-10 @md:py-8">
      {/* The app it's over: its outline alone, dimmed under the dialog's scrim. */}
      <div className="absolute inset-0 overflow-hidden rounded-xl border border-line bg-canvas">
        <div className="flex h-10 items-center gap-2 border-b border-line bg-surface px-3.5">
          <span className="h-2 w-20 rounded-full bg-band" />
          <span className="ms-auto size-6 rounded-full bg-band" />
        </div>
        <div className="flex flex-col gap-3 p-5">
          {[64, 88, 76, 52].map((w, i) => (
            <span key={i} className="h-3 rounded-full bg-band" style={{ width: `${w}%` }} />
          ))}
        </div>
        <span className="absolute inset-0 bg-scrim" />
      </div>
      <div className={cn('relative flex w-full max-w-[29rem] flex-col overflow-hidden rounded-2xl border border-line bg-surface text-fg', shadow)}>
        <div className="relative isolate grid place-items-center border-b border-line bg-band px-8 pt-7 pb-5 @max-md:px-5 @max-md:pt-4 @max-md:pb-3">
          <span className="dot-grid absolute inset-0 -z-10 opacity-70 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_55%,black,transparent)]" />
          <XIcon size={15} strokeWidth={1.75} className="absolute end-3.5 top-3.5 text-fg-muted" />
          <div className="w-[min(21rem,100%)] @max-md:w-[min(13rem,100%)]">{scene}</div>
        </div>
        <div className="flex min-w-0 flex-col gap-2 p-5 @max-md:gap-1.5 @max-md:p-4">
          <span className="text-[12px] font-medium text-fg-muted">{copy.title}</span>
          <h3 className="text-[1.25rem] leading-tight font-semibold tracking-tight text-balance @max-md:text-[1.0625rem]">{copy.heading}</h3>
          <p className="text-[13.5px] leading-relaxed text-pretty text-fg-muted @max-md:hidden">{copy.body}</p>
          <div className="mt-3 flex items-center gap-3 @max-md:mt-2">
            <div className="flex flex-1 gap-1.5" role="presentation">
              {Array.from({ length: of }, (_, i) => (
                <span key={i} className={cn('h-1 flex-1 rounded-full', i < at ? 'bg-accent' : 'bg-band')} />
              ))}
            </div>
            <Button {...still} size="sm" variant="ghost" className="@max-md:hidden">
              {copy.secondary}
            </Button>
            <Button {...still} size="sm">
              {copy.primary}
              <ArrowRightIcon size={15} strokeWidth={1.75} className="rtl:-scale-x-100" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** A website's first screen: its bar, then the headline and its two calls to action, the scene large on the end side. */
function HeroScreen({ copy, scene }: Omit<ContextProps, 'className'>) {
  return (
    <div className={cn('mx-auto flex w-full max-w-[52rem] flex-col overflow-hidden rounded-xl border border-line bg-canvas text-fg', shadow)}>
      <div className="flex h-11 shrink-0 items-center gap-5 border-b border-line px-5">
        <span className="flex items-center gap-2 text-[13px] font-semibold">
          <span className="size-4 rounded-[5px] bg-accent" />
          Lumen
        </span>
        <span className="hidden gap-4 text-[12.5px] text-fg-muted @lg:flex">
          <span>Product</span>
          <span>Pricing</span>
          <span>About</span>
        </span>
        <Button {...still} size="xs" variant="outline" className="ms-auto">
          Sign in
        </Button>
      </div>
      <div className="grid items-center gap-6 px-8 py-10 @2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] @2xl:gap-2 @2xl:py-12 @max-2xl:justify-items-center @max-2xl:gap-3 @max-2xl:px-5 @max-2xl:py-5 @max-2xl:text-center">
        <div className="flex min-w-0 flex-col items-start gap-3.5 @max-2xl:order-2 @max-2xl:items-center">
          <Badge variant="outline" className="@max-md:hidden">
            {copy.title}
          </Badge>
          <h3 className="text-[1.875rem] leading-[1.08] font-semibold tracking-tight text-balance @max-md:text-[1.375rem]">{copy.heading}</h3>
          <p className="max-w-[22rem] text-[13.5px] leading-relaxed text-pretty text-fg-muted @max-md:hidden">{copy.body}</p>
          <div className="mt-1 flex flex-wrap gap-2 @max-2xl:justify-center">
            <Button {...still} size="sm">
              {copy.primary}
            </Button>
            <Button {...still} size="sm" variant="ghost" className="@max-md:hidden">
              {copy.secondary}
              <ArrowRightIcon size={15} strokeWidth={1.75} className="rtl:-scale-x-100" />
            </Button>
          </div>
        </div>
        <div className="grid w-full min-w-0 place-items-center @max-2xl:order-1 @max-2xl:w-[min(17rem,100%)] @max-md:w-[min(12rem,100%)]">{scene}</div>
      </div>
    </div>
  )
}
