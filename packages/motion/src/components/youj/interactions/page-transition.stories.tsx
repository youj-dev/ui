import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChevronLeft, Inbox, Paperclip, Star } from 'lucide-react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { PageTransition, SharedElement, type PageDirection, type PageTransitionProps, type PageVariant } from './page-transition'

type Args = Pick<PageTransitionProps, 'variant'>

const meta: Meta<Args> = {
  title: 'Motion/Interactions/PageTransition',
  component: PageTransition as never,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`<PageTransition routeKey variant direction>` animates between routes. Variants: **fade-through**, **slide** (a push that reverses on `direction="back"`), **clip-reveal** and **curtain** (a panel sweeps across and the page swaps while covered). Pages stack in one grid cell, so nothing is measured or absolutely positioned. `SharedElement name` wraps Motion `layoutId`: the same name on both pages flies between positions. Shared elements fly under fade-through only; when the page itself travels they render in place, so the motion is not doubled. Reduced motion turns every variant into a short crossfade and shared elements jump.',
      },
    },
  },
  argTypes: { variant: { control: 'inline-radio', options: ['fade-through', 'slide', 'clip-reveal', 'curtain'] } },
  args: { variant: 'fade-through' },
}
export default meta
type Story = StoryObj<Args>

const MAIL = [
  { id: 'm1', from: 'Mira Okafor', initials: 'MO', subject: 'Q3 roadmap review', preview: 'Pulled the notes from Tuesday into one doc. Two open questions on the billing work…', time: '9:41', starred: true },
  { id: 'm2', from: 'Deploy bot', initials: 'DB', subject: 'acme-web deployed to production', preview: 'a41f9e2 · Tighten cache headers. Build 38s, 0 warnings.', time: '9:12', starred: false },
  { id: 'm3', from: 'Jonas Lindqvist', initials: 'JL', subject: 'Motion tokens, round two', preview: 'I think settle wants a touch less bounce. Try 0.2 and tell me if arrival still reads.', time: 'Tue', starred: false },
  { id: 'm4', from: 'Priya Raman', initials: 'PR', subject: 'Offsite logistics', preview: 'Train tickets are booked. Dinner on Thursday, 7pm, the place by the canal.', time: 'Mon', starred: true },
]

/** A tiny in-story router: a stack of paths, push and back, with the direction derived from the last move. */
function useFakeRouter(initial: string) {
  const [stack, setStack] = useState([initial])
  const [direction, setDirection] = useState<PageDirection>('forward')
  return {
    path: stack[stack.length - 1]!,
    direction,
    canGoBack: stack.length > 1,
    push: (p: string) => {
      setDirection('forward')
      setStack((s) => [...s, p])
    },
    back: () => {
      setDirection('back')
      setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
    },
  }
}

function Avatar({ initials, big = false }: { initials: string; big?: boolean }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-full border border-line bg-well font-medium text-fg ${big ? 'size-12 text-base' : 'size-9 text-xs'}`}>
      {initials}
    </span>
  )
}

function MailApp({ variant }: { variant: PageVariant }) {
  const router = useFakeRouter('/inbox')
  const openId = router.path.startsWith('/inbox/') ? router.path.split('/')[2] : undefined
  const mail = MAIL.find((m) => m.id === openId)

  return (
    <div className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex h-11 items-center gap-2 border-b border-line px-3">
        <button
          type="button"
          onClick={router.back}
          disabled={!router.canGoBack}
          aria-label="Back"
          className="grid size-7 place-items-center rounded-md text-fg-muted outline-none enabled:hover:bg-hover enabled:hover:text-fg disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="font-mono text-xs text-fg-subtle">{router.path}</span>
      </div>
      <PageTransition routeKey={router.path} variant={variant} direction={router.direction} className="h-[380px]">
        {mail ? (
          <article className="h-full bg-surface p-5">
            <div className="flex items-center gap-3">
              <SharedElement name={`avatar-${mail.id}`} className="rounded-full">
                <Avatar initials={mail.initials} big />
              </SharedElement>
              <div className="min-w-0">
                <p className="text-sm font-medium text-fg">{mail.from}</p>
                <p className="text-xs text-fg-subtle">to me · {mail.time}</p>
              </div>
              {mail.starred && <Star className="ml-auto size-4 fill-current text-warning" />}
            </div>
            <SharedElement name={`subject-${mail.id}`} className="mt-5 w-fit">
              <h2 className="text-lg font-semibold tracking-tight text-fg">{mail.subject}</h2>
            </SharedElement>
            <p className="mt-3 text-sm leading-6 text-fg-muted">{mail.preview}</p>
            <p className="mt-3 text-sm leading-6 text-fg-muted">
              Let me know what you think before Friday so we can lock the plan and share it with the wider team.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs text-fg-muted">
              <Paperclip className="size-3.5" />
              notes-q3.pdf · 212 KB
            </div>
          </article>
        ) : (
          <div className="h-full bg-surface">
            <div className="flex items-center gap-2 px-4 pt-4 pb-2 text-sm font-medium text-fg">
              <Inbox className="size-4 text-fg-muted" />
              Inbox
              <span className="ml-auto text-xs font-normal text-fg-subtle">{MAIL.length} messages</span>
            </div>
            <ul>
              {MAIL.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/inbox/${m.id}`)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left outline-none hover:bg-hover focus-visible:bg-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
                  >
                    <SharedElement name={`avatar-${m.id}`} className="rounded-full">
                      <Avatar initials={m.initials} />
                    </SharedElement>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium text-fg">{m.from}</span>
                        <span className="shrink-0 text-xs text-fg-subtle">{m.time}</span>
                      </span>
                      <SharedElement name={`subject-${m.id}`} className="w-fit">
                        <span className="block truncate text-[13px] text-fg">{m.subject}</span>
                      </SharedElement>
                      <span className="block truncate text-[13px] text-fg-muted">{m.preview}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </PageTransition>
    </div>
  )
}

/** A mail client: open a message, then go back. The avatar and subject are shared elements. */
export const Hero: Story = {
  render: ({ variant = 'fade-through' }) => <MailApp key={variant} variant={variant} />,
}

const TABS = ['Overview', 'Activity', 'Settings'] as const

function TabbedPanel({ variant }: { variant: PageVariant }) {
  const [tab, setTab] = useState(0)
  const [direction, setDirection] = useState<PageDirection>('forward')
  return (
    <div className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-line bg-surface">
      <div role="tablist" aria-label="Project" className="flex gap-1 border-b border-line p-1.5">
        {TABS.map((t, i) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === i}
            onClick={() => {
              setDirection(i >= tab ? 'forward' : 'back')
              setTab(i)
            }}
            className="rounded-md px-3 py-1.5 text-sm text-fg-muted outline-none aria-selected:bg-selected aria-selected:text-fg focus-visible:ring-2 focus-visible:ring-accent"
          >
            {t}
          </button>
        ))}
      </div>
      <PageTransition routeKey={TABS[tab]!} variant={variant} direction={direction} className="h-56">
        <div role="tabpanel" className="h-full bg-surface p-5">
          <p className="text-sm font-medium text-fg">{TABS[tab]}</p>
          <div className="mt-4 space-y-2">
            {[0.9, 0.7, 0.8, 0.5].map((w, i) => (
              <div key={i} className="h-2.5 rounded-full bg-well" style={{ width: `${w * (tab + 2) * 30}%` }} />
            ))}
          </div>
        </div>
      </PageTransition>
    </div>
  )
}

/** Tabs derive direction from index, so slide and clip-reveal travel the right way. */
export const DirectionalTabs: Story = {
  args: { variant: 'slide' },
  render: ({ variant = 'fade-through' }) => <TabbedPanel variant={variant} />,
}

/** All four variants side by side on the same tabs. */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {(['fade-through', 'slide', 'clip-reveal', 'curtain'] as const).map((v) => (
        <div key={v}>
          <p className="mb-2 font-mono text-xs text-fg-subtle">{v}</p>
          <TabbedPanel variant={v} />
        </div>
      ))}
    </div>
  ),
}

/** Reduced motion: every variant is a short crossfade; shared elements jump. */
export const ReducedMotion: Story = {
  render: ({ variant = 'fade-through' }) => (
    <YoujProvider reducedMotion="always">
      <MailApp variant={variant} />
    </YoujProvider>
  ),
}
