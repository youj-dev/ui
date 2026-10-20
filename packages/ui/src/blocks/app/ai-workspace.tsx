'use client'

import { useId, useRef, useState, type ComponentProps } from 'react'
import { ThemeScope, useYouj, type ThemeInput } from '@youj/core'
import { MenuIcon, ShareIcon } from '@youj/icons'
import { AppPage } from '../../components/ui/app-page'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { PromptInput, usePromptAttachments } from '../../components/ui/chat'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '../../components/ui/sheet'
import { cn } from '../../lib/utils'
import { COPY, MODELS, type ModelId } from './ai-workspace/data'
import { ChatSidebar } from './ai-workspace/sidebar'
import { Thread } from './ai-workspace/thread'
import { useWorkspace } from './ai-workspace/use-workspace'

/* An AI workspace for a product team: Atlas answers questions about the
 * team's metrics, docs and tickets. The sidebar lists the chats (pinned,
 * today, the week before; searchable), and a sheet holds it on phones. The
 * open chat's question is answered live as the workspace opens: Atlas reads
 * for a beat, thinks out loud (Atlas Deep), runs its tools (a metrics query,
 * a docs search), then streams a markdown answer whose [n] markers cite the
 * sources under it; follow-ups arrive when it's done. The composer takes
 * files (the paperclip, paste or drop), switches model, and turns into Stop
 * while a reply plays. Replies come from scripts (data.ts), timed by motion
 * tokens, so Speed slows them and the same prompt always plays the same way;
 * swap useWorkspace for your SDK's chat hook. Reduced motion: text lands a
 * phrase at a time, and the kit's shimmer, carets and glides hold still.
 * It is built for the compact layout density (ui.css), taken from the page.
 * Demo content — edit after adding. */

interface AiWorkspaceProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) titled with the open chat, holding Share, over the chat list and the conversation filling the page; no `main` of its own. Default true; `false` draws its own page (the conversation's own title bar, filling the viewport). */
  embedded?: boolean
  /** Answer the open chat's question live as the workspace opens. Default true. */
  autoplay?: boolean
  /** Atlas Deep thinks before it answers; Atlas Fast doesn't. Default 'deep'. */
  defaultModel?: ModelId
}

function AiWorkspace({ theme, embedded = true, autoplay = true, defaultModel = 'deep', className, ...rest }: AiWorkspaceProps) {
  const k = useYouj()
  const titleId = useId()
  const [model, setModel] = useState<ModelId>(defaultModel)
  const [menu, setMenu] = useState(false)
  const [draft, setDraft] = useState('')
  const field = useRef<HTMLTextAreaElement>(null)
  const files = usePromptAttachments()
  const { chats, active, status, send, stop, open, rate } = useWorkspace({ k, model, autoplay })

  const pick = (prompt: string) => {
    send(prompt)
    field.current?.focus()
  }
  const openChat = (id: string | null) => {
    open(id)
    setMenu(false)
  }

  const chatTitle = active?.title ?? COPY.newChat
  const menuTrigger = (
    <Sheet open={menu} onOpenChange={setMenu}>
      <SheetTrigger render={<Button variant="ghost" size="icon-sm" className="md:hidden" aria-label={COPY.openChats} />}>
        <MenuIcon size={16} strokeWidth={1.75} />
      </SheetTrigger>
      <SheetContent side="start" className="w-[min(--spacing(72),calc(100vw-2.5rem))] p-0">
        <SheetTitle className="sr-only">{COPY.chats}</SheetTitle>
        <ChatSidebar chats={chats} activeId={active?.id ?? null} onOpen={openChat} className="h-full pt-12" />
      </SheetContent>
    </Sheet>
  )
  const share = (
    <AsyncButton variant="ghost" size="sm" disabled={!active} onAction={() => new Promise((resolve) => setTimeout(resolve, k.ms('slow')))} pendingLabel="Sharing…" successLabel="Link copied">
      <ShareIcon size={15} strokeWidth={1.75} />
      <span className="max-sm:sr-only">{COPY.share}</span>
    </AsyncButton>
  )
  const conversation = (
    <>
      <Thread chat={active} idle={status === 'idle'} onPick={pick} onRate={(id, feedback) => active && rate(active.id, id, feedback)} />

      <div className="mx-auto w-full max-w-184 shrink-0 px-3 pb-3 sm:px-6 sm:pb-4">
        <PromptInput
          value={draft}
          onValueChange={setDraft}
          textareaRef={field}
          status={status}
          onStop={stop}
          label={COPY.label}
          placeholder={COPY.placeholder}
          attachments={files.attachments}
          onAttach={files.add}
          onRemoveAttachment={files.remove}
          accept=".csv,.pdf,.txt,.md,image/*"
          toolbar={
            <Select items={MODELS.map(({ value, label }) => ({ value, label }))} value={model} onValueChange={(next) => next && setModel(next as ModelId)}>
              <SelectTrigger size="sm" variant="ghost" aria-label={COPY.model} className="shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    <span className="flex min-w-0 items-baseline gap-2">
                      {m.label}
                      <span className="truncate text-ui-sm text-fg-muted">{m.hint}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          onSubmit={({ text, attachments }) => {
            send(
              text,
              attachments.map(({ id, name, size }) => ({ id, name, size })),
            )
            files.clear()
            setDraft('')
          }}
        />
        <p className="mt-2 text-center text-ui-xs text-fg-muted">{COPY.footnote}</p>
      </div>
    </>
  )
  const grid = 'grid grid-cols-[minmax(0,1fr)] md:grid-cols-[--spacing(66)_minmax(0,1fr)]'

  const view = embedded ? (
    <AppPage
      {...rest}
      title={chatTitle}
      actions={
        <>
          {menuTrigger}
          {share}
        </>
      }
      width="fill"
      // A tool: it fills the frame's height (the thread scrolls, the composer stays at the foot).
      className={cn('h-[calc(100dvh-(--spacing(16)))] min-h-144 text-fg', className)}
      classNames={{ body: 'min-h-0 flex-1' }}
    >
      <div className={cn(grid, 'min-h-0 flex-1 overflow-hidden rounded-xl border border-line')}>
        <ChatSidebar chats={chats} activeId={active?.id ?? null} onOpen={openChat} className="border-e border-line max-md:hidden" />
        <div className="flex min-h-0 min-w-0 flex-col">{conversation}</div>
      </div>
    </AppPage>
  ) : (
    <div {...rest} className={cn(grid, 'h-dvh min-h-144 bg-canvas text-fg', className)}>
      <ChatSidebar chats={chats} activeId={active?.id ?? null} onOpen={openChat} className="border-e border-line max-md:hidden" />

      <main aria-labelledby={titleId} className="flex min-h-0 min-w-0 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3 sm:px-4">
          {menuTrigger}
          <h1 id={titleId} className="min-w-0 flex-1 truncate text-ui font-medium">
            {chatTitle}
          </h1>
          {share}
        </header>
        {conversation}
      </main>
    </div>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { AiWorkspace, type AiWorkspaceProps }
