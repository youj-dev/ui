'use client'

import { useEffect, useId, useMemo, useRef, useState, type ElementType, type HTMLAttributes, type ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { MotionFeatures, PresenceSettled, ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { XIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { usePromptAttachments, type ChatFeedback } from '../../components/ui/chat'
import { Popover, PopoverContent } from '../../components/ui/popover'
import { Sheet, SheetContent } from '../../components/ui/sheet'
import { useIsMobile } from '../../hooks/use-mobile'
import { cn } from '../../lib/utils'
import { SupportChatContext, type SupportChatEnv } from './support-chat/context'
import { ConversationView } from './support-chat/conversation-view'
import {
  ARTICLES,
  articleHref,
  BRAND,
  DEFAULT_COPY,
  TEAM,
  THREADS,
  USER,
  type SupportAgent,
  type SupportArticle,
  type SupportAttachment,
  type SupportChatCopy,
  type SupportMessage,
  type SupportReply,
  type SupportStage,
  type SupportThread,
  type SupportUser,
} from './support-chat/data'
import { HomeView, toRecents, type Recent } from './support-chat/home-view'
import { HostPage } from './support-chat/host-page'
import { Launcher, Teaser } from './support-chat/launcher'
import { useConversation, type SupportOutgoing, type SupportSendHandler } from './support-chat/use-conversation'

/* Tern's support widget, built from the chat kit. A launcher in the corner
 * (with an unread count, and a teaser of the latest reply) opens a panel that
 * grows out of it (Popover's yj-pop from the launcher's corner); on phones it
 * is a full-screen Sheet sliding up instead. Home greets you, shows the team
 * and how fast they reply, your recent conversations and a help search; a
 * conversation starts with Tern Assistant, whose answers stream in, offers
 * quick replies, takes attachments, and hands off to a person, with the
 * header's status line following along. With the team away it takes an email
 * instead; a closed conversation ends on a rating. Views slide in the
 * direction you travel. Escape closes the panel and focus returns to the
 * launcher; clicking the page behind leaves it open, as a chat should.
 * Reduced motion: views, badge and teaser change in place, replies arrive
 * whole. Pass your `threads`, `team`, `user` and `articles`, answer through
 * `onSend` (it returns the reply to play; without it a scripted desk
 * answers), and rewrite any string in `copy`.
 * It is built for the compact layout density (ui.css), taken from the page. */

type View = 'home' | 'conversation'

interface SupportChatProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /** Just the widget, over the host's own page: no stand-in Tern page behind it. Default false. */
  embedded?: boolean
  /** Standalone: your page behind the widget. Default: Tern's data sources demo. */
  children?: ReactNode
  /** Starts with the panel open, when uncontrolled. Default false. */
  defaultOpen?: boolean
  /** Whether the panel is open, to control it. Pair with `onOpenChange`. */
  open?: boolean
  /** Called when the launcher, Escape or the close button opens or closes the panel. */
  onOpenChange?: (open: boolean) => void
  /** Where the panel starts: home, a new conversation (`'new'`), or a past one by id (`c-2231` with Mira, `c-2107` closed). Default 'home'. */
  defaultView?: 'home' | 'new' | (string & {})
  /** The team is online: handoffs reach a person. Offline, the assistant takes an email. Default true. */
  online?: boolean
  /** The product, named in the header, the assistant's name and the teaser. Default: Tern. */
  brand?: { name: string; logo?: ReactNode }
  /** The person chatting: greeted by `first`, initials on their messages. Default: Sam Okafor. */
  user?: SupportUser
  /** The people on the desk, faces on home; a handoff brings in the first unless the reply names one. Default: Mira, Jonas, Aiko. */
  team?: SupportAgent[]
  /** Past conversations, newest first, listed on home with their unread counts. Default: the demo's two. */
  threads?: SupportThread[]
  /** Help articles the search looks through; the first four show as popular. Default: Tern's seven. */
  articles?: SupportArticle[]
  /** Where an article opens. Default: tern.io/help/<id>. */
  getArticleHref?: (article: SupportArticle) => string
  /** The element for article links, e.g. Next.js `Link`. Default 'a'. */
  linkComponent?: ElementType
  /** Delivers a message to your desk; resolve with the reply to play (or nothing), reject to show the error in the thread. Default: a scripted desk. */
  onSend?: SupportSendHandler
  /** Sends the email left while the team is away; a rejection shows its message under the field. */
  onLeaveEmail?: (email: string, threadId: string) => Promise<unknown> | unknown
  /** A closed conversation was rated, with the optional note. */
  onRate?: (rating: { threadId: string; score: number; note: string }) => void
  /** An answer from the assistant was rated helpful or not. */
  onFeedback?: (messageId: string, feedback: ChatFeedback) => void
  /** Any of the widget's strings, to rewrite or translate; the ones naming the product take `brand.name`. */
  copy?: Partial<SupportChatCopy>
  /** Formats numbers and dates (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
}

function SupportChat({
  theme,
  embedded = false,
  children,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  defaultView = 'home',
  online = true,
  brand = BRAND,
  user = USER,
  team = TEAM,
  threads = THREADS,
  articles = ARTICLES,
  getArticleHref = articleHref,
  linkComponent = 'a',
  onSend,
  onLeaveEmail,
  onRate,
  onFeedback,
  copy: copyProp,
  locale,
  className,
  ...rest
}: SupportChatProps) {
  const k = useYouj()
  const mobile = useIsMobile()
  const panelId = useId()
  const titleId = useId()
  const launcher = useRef<HTMLButtonElement>(null)
  const startButton = useRef<HTMLButtonElement>(null)
  const composer = useRef<HTMLTextAreaElement>(null)
  const copyLocale = useLocale(locale ?? copyProp?.locale)
  const copy = useMemo(() => ({ ...DEFAULT_COPY, ...copyProp, locale: copyLocale }), [copyProp, copyLocale])
  const bot = copy.botName(brand.name)
  const [innerOpen, setInnerOpen] = useState(defaultOpen)
  const open = openProp ?? innerOpen
  const setOpen = (next: boolean) => {
    setInnerOpen(next)
    onOpenChange?.(next)
  }
  const [view, setView] = useState<View>(defaultView === 'home' ? 'home' : 'conversation')
  const [direction, setDirection] = useState(1)
  const [unread, setUnread] = useState<Record<string, number>>(() => Object.fromEntries(threads.map((t) => [t.id, t.unread ?? 0])))
  const [teaser, setTeaser] = useState(true)
  const files = usePromptAttachments()
  const convo = useConversation({
    thread: threads.find((t) => t.id === defaultView) ?? null,
    online,
    reduced: k.reduced,
    copy,
    user,
    bot,
    team,
    onSend,
  })
  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0)
  const ongoing = convo.threadId === 'new' && convo.messages.some((m) => m.from === 'user') && convo.stage !== 'ended'
  const unreadThread = threads.find((t) => unread[t.id])

  const go = (next: View) => {
    setDirection(next === 'conversation' ? 1 : -1)
    setView(next)
  }
  const openThread = (id: string) => {
    const thread = threads.find((t) => t.id === id) ?? null
    if (convo.threadId !== id) convo.start(thread)
    setUnread((u) => ({ ...u, [id]: 0 }))
    go('conversation')
  }
  const startNew = () => {
    if (!ongoing && (convo.threadId !== 'new' || convo.stage === 'ended')) convo.start(null)
    go('conversation')
  }

  // Moving between views takes focus along: the composer, or back to the main action.
  const moved = useRef(false)
  useEffect(() => {
    if (!moved.current) {
      moved.current = true
      return
    }
    const target = view === 'conversation' ? composer.current : startButton.current
    target?.focus({ preventScroll: true })
  }, [view])

  const fixtures = useMemo(() => toRecents(threads, copy, brand.name), [threads, copy, brand.name])
  const recents: Recent[] = ongoing
    ? [{ id: 'new', title: copy.yourConversation, preview: convo.messages.at(-1)?.text ?? '', when: copy.justNow, thread: null }, ...fixtures]
    : fixtures

  const env: SupportChatEnv = { copy, brand, bot, user, team, articles, articleHref: getArticleHref, linkComponent }

  const close = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={copy.close}
      onClick={() => setOpen(false)}
      className="text-fg-muted"
    >
      <XIcon size={16} strokeWidth={1.75} />
    </Button>
  )

  const slide = k.reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: direction * 28 }
  const panel = (
    <div data-reduced-motion={k.reduced || undefined} className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <m.div
          key={view}
          initial={slide}
          animate={{ opacity: 1, x: 0, transition: k.reduced ? { type: false } : k.spring('smooth') }}
          exit={k.reduced ? { opacity: 0, transition: { type: false } } : { opacity: 0, x: direction * -28, transition: k.tween('fast', 'exit') }}
          className="flex min-h-0 w-full flex-1 flex-col"
        >
          <PresenceSettled>
            {view === 'home' ? (
              <HomeView
                online={online}
                recents={recents}
                unread={unread}
                ongoing={ongoing}
                titleId={titleId}
                startRef={startButton}
                onStart={startNew}
                onOpen={(recent) => (recent.thread ? openThread(recent.id) : go('conversation'))}
                onAsk={(question) => {
                  convo.start(null)
                  go('conversation')
                  if (question) convo.send(question)
                }}
                close={close}
              />
            ) : (
              <ConversationView
                convo={convo}
                online={online}
                files={files}
                titleId={titleId}
                composerRef={composer}
                onBack={() => go('home')}
                close={close}
                onLeaveEmail={onLeaveEmail}
                onRate={onRate}
                onFeedback={onFeedback}
              />
            )}
          </PresenceSettled>
        </m.div>
      </AnimatePresence>
    </div>
  )

  const initialFocus = () => (view === 'home' ? startButton.current : composer.current) ?? true

  const widget = (
    <SupportChatContext value={env}>
      <MotionFeatures>
        <aside aria-label={copy.widgetLabel(brand.name)} {...rest} className={cn('fixed end-5 bottom-5 z-40 flex flex-col items-end gap-3', className)}>
          <AnimatePresence>
            {!open && teaser && unreadThread && (
              <Teaser
                key="teaser"
                message={unreadThread.messages.at(-1)!}
                onOpen={() => {
                  openThread(unreadThread.id)
                  setOpen(true)
                }}
                onDismiss={() => setTeaser(false)}
              />
            )}
          </AnimatePresence>
          <Launcher ref={launcher} open={open} unread={totalUnread} controls={panelId} onToggle={() => setOpen(!open)} />
          {mobile ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetContent
                id={panelId}
                side="bottom"
                showCloseButton={false}
                aria-label={copy.widgetLabel(brand.name)}
                initialFocus={initialFocus}
                finalFocus={launcher}
                className="h-dvh max-h-dvh border-0"
              >
                {panel}
              </SheetContent>
            </Sheet>
          ) : (
            <Popover
              open={open}
              // Clicking the page behind leaves the chat open; Escape and the close button don't.
              onOpenChange={(next, details) => {
                if (next || (details.reason !== 'outside-press' && details.reason !== 'focus-out')) setOpen(next)
              }}
            >
              <PopoverContent
                id={panelId}
                anchor={launcher}
                side="top"
                align="end"
                sideOffset={12}
                collisionPadding={16}
                aria-label={copy.widgetLabel(brand.name)}
                initialFocus={initialFocus}
                finalFocus={launcher}
                // The popup portals out of the widget, so a density set on the widget goes with it; the page's reaches it through the portal.
                data-yj-density={(rest as { 'data-yj-density'?: string })['data-yj-density']}
                className="h-[min(--spacing(168),calc(100dvh-7rem))] w-100 gap-0 overflow-hidden rounded-[min(var(--radius-overlay-lg),var(--ui--panel-radius-max))] p-0 shadow-lg"
              >
                {panel}
              </PopoverContent>
            </Popover>
          )}
        </aside>
      </MotionFeatures>
    </SupportChatContext>
  )

  if (embedded) return theme ? <ThemeScope theme={theme}>{widget}</ThemeScope> : widget
  return (
    <ThemeScope theme={theme}>
      {children === undefined ? (
        <SupportChatContext value={env}>
          <HostPage />
        </SupportChatContext>
      ) : (
        children
      )}
      {widget}
    </ThemeScope>
  )
}

export {
  SupportChat,
  type SupportChatProps,
  type SupportChatCopy,
  type SupportAgent,
  type SupportArticle,
  type SupportAttachment,
  type SupportMessage,
  type SupportOutgoing,
  type SupportReply,
  type SupportStage,
  type SupportThread,
  type SupportUser,
}
