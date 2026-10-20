'use client'

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type Ref } from 'react'
import { DEFAULT_LOOK, useSoundCue, useYouj } from '@youj/core'
import { themeErrors, themes } from '@youj/core/lib/youj/theme'
import { ChevronLeftIcon, ChevronRightIcon, CircleAlertIcon, CodeIcon, LinkIcon, RotateCcwIcon, ShuffleIcon, SidebarIcon } from '@youj/icons'
import { Badge, Kbd, Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger, Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@youj/react'
import { ThemeBuilder } from '@youj/react/docs/theme-builder'
import { ACCOUNTS, BRANDS, DEFAULT_FRAME, SCREENS, SEARCHES, SIDEBARS, TOPBARS, screensInNavOrder, type FrameConfig } from '@youj/react/docs/create/config'
import { createItems } from '@youj/react/docs/create/codegen'
import { SizeControl } from '@youj/react/docs/create/size-control'
import { DEFAULT_SIZE } from '@youj/react/docs/create/size-url'
import { LOOK_OPTIONS } from '@youj/react/docs/create/look-url'
import { InspectorSection, InspectorSelect } from '@youj/react/docs/inspector'
import { useThemeFonts } from '@youj/react/docs/create/load-fonts'
import { DEFAULT_THEME_NAME, readTheme } from '@youj/react/docs/create/theme-url'
import { ViewportFrame, type CodeFile } from '@/components/showcase/viewport-frame'
import { ExportCommand } from '@/components/ui/code-export-dialog'
import { TabList } from '@/components/ui/controls'
import { TOOLBAR_BUTTON } from '@/components/ui/preview-controls'
import { cn } from '@/lib/cn'
import { createPath } from '@/lib/create'
import { ExportDialog } from './export-dialog'
import { createCommand, exportState, usePartFiles, writtenFiles } from './export-files'
import { FrameOptions, PartOptions } from './frame-options'
import { ScreenOptions } from './screen-options'
import { highlightTsx } from './highlight'
import { STEPS, useCreate, usePreviewChannel, type Step } from './use-create'
import { copyToast } from '@/lib/copy-toast'

/* Create: build an app frame from the frame blocks, add screens from the
 * Screens catalog, give it a theme and a component style, and take it home as code. A studio across the whole
 * window: a compact panel of settings on the inline start (it folds away with
 * ⌘\ or its button, so the frame gets the room) and the live frame filling
 * the rest (the showcase's device frame, fed through lib/create). On phones
 * the panel is the page and the preview is a step of its own. Everything
 * lives in the URL. */

const DESKTOP = '(min-width: 1024px)'
const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(DESKTOP)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
const useDesktop = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP).matches,
    () => true,
  )

const noop = () => () => {}
/** This site's origin, for links and commands: empty on the server and while hydrating. */
const useOrigin = () =>
  useSyncExternalStore(
    noop,
    () => window.location.origin,
    () => '',
  )

const STEP_LABELS: Record<Step, string> = { frame: 'Frame', parts: 'Parts', screens: 'Screens', theme: 'Theme', preview: 'Preview' }
/** What each step sets, for its tab's tooltip. */
const STEP_NOTES: Record<Step, string> = { frame: 'sidebar, top bar and layout', parts: 'account, search and extras', screens: 'the pages in your app', theme: 'colors, type and style', preview: 'the frame itself' }

/** A step's tab: its number in a small key, then its name (which gives way first when the panel is tight). */
function StepLabel({ n, step }: { n: number; step: Step }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span aria-hidden className="grid size-5 shrink-0 max-sm:hidden place-items-center rounded-full border border-current/25 font-sans text-[11px] leading-none tabular-nums">
        {n}
      </span>
      <span className="min-w-0 truncate">{STEP_LABELS[step]}</span>
    </span>
  )
}

const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)]!

/** A frame, a few screens and a preset picked at random: a quick way to see the range. */
function shuffled(current: FrameConfig): FrameConfig {
  let next: FrameConfig
  do {
    next = {
      sidebar: pick(SIDEBARS),
      topbar: pick(TOPBARS),
      account: pick(ACCOUNTS),
      search: pick(SEARCHES.filter((s) => s !== 'none')),
      brand: pick(BRANDS),
      mobile: current.mobile,
      notifications: Math.random() > 0.3,
      upgrade: Math.random() > 0.5,
      screens: screensInNavOrder([...Object.keys(SCREENS)].sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 3))),
    }
  } while (next.sidebar === current.sidebar && next.topbar === current.topbar)
  return next
}

/** ⌘\ (Ctrl+\) folds the panel away and back, as design tools do; never while typing. */
function usePanelShortcut(toggle: () => void, enabled: boolean) {
  const latest = useRef(toggle)
  latest.current = toggle
  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '\\' || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey || event.repeat) return
      const target = event.target as HTMLElement | null
      if (target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')) return
      event.preventDefault()
      latest.current()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}

export function CreateStudio() {
  const id = useId()
  const create = useCreate()
  const { frame, theme, style, size, query, step, setStep } = create
  const desktop = useDesktop()
  const preview = useRef<HTMLElement>(null)
  usePreviewChannel(preview, query)
  // The panel's menus show the chosen typefaces in themselves.
  useThemeFonts(theme.fonts)

  const [codeTab, setCodeTab] = useState<'preview' | 'code'>('preview')
  const [open, setOpen] = useState(true)
  const panelOpen = open || !desktop
  const panel = useRef<HTMLElement>(null)
  const hideButton = useRef<HTMLButtonElement>(null)
  const showButton = useRef<HTMLButtonElement>(null)
  // Focus never stays in a folded (inert) panel: it moves to the button that brings it back, and in again with it.
  const toggle = () => {
    const inside = panel.current?.contains(document.activeElement)
    const onShow = document.activeElement === showButton.current
    setOpen((o) => !o)
    requestAnimationFrame(() => (inside ? showButton : onShow ? hideButton : null)?.current?.focus())
  }
  usePanelShortcut(toggle, desktop)
  // Every screen opens on the first step; a phone's preview is one tap away, in the steps' last tab.
  const shown: Step = desktop ? (step === 'preview' || !step ? 'frame' : step) : (step ?? 'frame')
  const order = STEPS.filter((s) => s !== 'preview' || !desktop)
  const tabs = order.map((s, i) => ({ value: s, label: <StepLabel n={i + 1} step={s} />, title: `Step ${i + 1}: ${STEP_LABELS[s]}, ${STEP_NOTES[s]}` }))
  const at = order.indexOf(shown)
  const back = order[at - 1]
  const next = order[at + 1]

  const origin = useOrigin()
  const [includeScreens, setIncludeScreens] = useState(true)
  const exported = useMemo(() => exportState({ frame, theme, style, size }, includeScreens), [frame, theme, style, size, includeScreens])
  // The link to share is the frame as designed; the export's is what it writes (the frame alone, when the screens stay behind).
  const shareLink = `${origin}${createPath({ frame, theme, style, size })}`
  const link = `${origin}${createPath(exported)}`
  const parts = usePartFiles(exported.frame, codeTab === 'code' || create.exporting)
  const written = useMemo(() => writtenFiles(exported, link, 'package'), [exported, link])
  // The parts only change with the frame, so a color's every step re-highlights just the written files.
  const highlightedParts = useMemo<CodeFile[]>(() => (parts ?? []).map((f) => ({ ...f, highlighted: highlightTsx(f.code) })), [parts])
  const files = useMemo<CodeFile[]>(() => [...written.map((f) => ({ ...f, highlighted: highlightTsx(f.code) })), ...highlightedParts], [written, highlightedParts])
  const install = useMemo(() => {
    const items = createItems(exported.frame, exported.style)
    return { command: `npx youj add ${items.join(' ')}`, deps: items }
  }, [exported.frame, exported.style])
  // A theme that misses AA can't be exported: the panel's command gives way to the issue.
  const blocked = useMemo(() => themeErrors(exported.theme).length, [exported.theme])

  return (
    <TooltipProvider>
      <div className="flex w-full flex-1 flex-col gap-2 p-2 lg:h-[calc(100dvh-var(--header-height))] lg:flex-none lg:flex-row">
        <aside
          ref={panel}
          id={`${id}-panel`}
          aria-label="Create settings"
          inert={!panelOpen || undefined}
          className={cn(
            'flex min-h-0 shrink-0 flex-col overflow-hidden rounded-xl border border-line bg-surface',
            // Folding: the width closes over content that keeps its own, so nothing reflows; the content fades first.
            'lg:w-[24rem] xl:w-[27rem] lg:transition-[width,margin,opacity,border-color] lg:yj-duration-slow lg:ease-standard',
            // Folded, it gives back the gap beside it too, so the preview runs to the window's gutter.
            !panelOpen && 'lg:-me-2 lg:w-0 lg:border-transparent lg:opacity-0',
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col lg:w-[24rem] xl:w-[27rem]">
            <header className="flex items-start gap-3 px-4 pt-4 pb-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h1 className="type-subheading text-fg">Make it yours</h1>
                  <ExperimentalNote />
                </div>
                <p className="text-[12.5px] leading-snug text-pretty text-fg-muted">An app frame and its screens, in your theme, as code.</p>
              </div>
              {desktop && <PanelButton ref={hideButton} open onClick={toggle} controls={`${id}-panel`} />}
            </header>
            <div className="px-3 pb-3">
              {/* Five steps on a phone: the tabs close up so they all fit. */}
              <TabList idBase={id} label="Steps" value={shown} onChange={setStep} tabs={tabs} variant="pill" fill className="max-sm:[&_[role=tab]]:px-2" />
            </div>
            <div
              // A step opens at its top, not where the last one was scrolled to.
              key={shown}
              role="tabpanel"
              id={`${id}-panel-${shown}`}
              aria-labelledby={`${id}-tab-${shown}`}
              tabIndex={0}
              className={cn('min-h-0 flex-1 border-t border-line px-4 py-4 outline-none lg:px-5 lg:[--spacing-control-sm:2.25rem] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent lg:overflow-y-auto lg:yj-scrollbar', shown === 'preview' && 'hidden')}
            >
              {shown === 'frame' && <FrameOptions frame={frame} onChange={create.setFrame} />}
              {shown === 'parts' && <PartOptions frame={frame} onChange={create.setFrame} />}
              {shown === 'screens' && <ScreenOptions frame={frame} onChange={create.setFrame} />}
              {shown === 'theme' && (
                <div className="flex flex-col gap-6">
                  <InspectorSection title="Look">
                    <InspectorSelect
                      label="Components"
                      value={style}
                      rich
                      options={LOOK_OPTIONS.map((option) => ({ value: option.id, label: option.name, note: option.description }))}
                      onChange={create.setLook}
                    />
                  </InspectorSection>
                  <SizeControl value={size} onChange={create.setSize} />
                  <ThemeBuilder controlsOnly value={theme} onChange={create.setTheme} onStyle={(picked) => create.setLook(picked.look)} />
                </div>
              )}
            </div>
            <footer className="sticky bottom-0 flex flex-col gap-2 border-t border-line bg-surface/95 youj-allow-glass px-2.5 pt-3 pb-2.5 backdrop-blur lg:static">
              <nav aria-label="Steps" className="flex items-center gap-2">
                {back && (
                  <button type="button" onClick={() => setStep(back)} className="inline-flex h-8 touch:h-11 items-center gap-1 rounded-lg px-2 text-[12.5px] font-medium text-fg-muted transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-hover hover:text-fg focus-ring">
                    <ChevronLeftIcon size={14} strokeWidth={1.9} className="rtl:-scale-x-100" />
                    Back
                  </button>
                )}
                <span className="ms-auto text-[12px] text-fg-muted tabular-nums">
                  Step {at + 1} of {order.length}
                </span>
                {next && (
                  <button
                    type="button"
                    onClick={() => setStep(next)}
                    className="inline-flex h-8 touch:h-11 items-center gap-1 rounded-lg border border-line bg-control px-2.5 text-[12.5px] font-medium text-fg transition-colors duration-(--yj-duration-fast) ease-standard hover:border-line-strong focus-ring"
                  >
                    Next: {STEP_LABELS[next]}
                    <ChevronRightIcon size={14} strokeWidth={1.9} className="rtl:-scale-x-100" />
                  </button>
                )}
              </nav>
              {blocked ? (
                <button
                  type="button"
                  onClick={() => setStep('theme')}
                  className="flex min-h-9 items-center gap-2 rounded-lg border border-danger-line bg-danger-subtle px-3 text-start text-[12px] leading-snug text-fg transition-colors yj-duration-fast ease-standard hover:bg-danger-subtle focus-ring"
                >
                  <CircleAlertIcon size={14} strokeWidth={1.75} className="shrink-0 text-danger" />
                  <span className="min-w-0 flex-1">The theme misses AA contrast, so the export waits. Review it</span>
                </button>
              ) : (
                <ExportCommand command={createCommand(link)} label="Create command" />
              )}
              <div className="flex items-center gap-1">
                <FooterButton
                  label="Shuffle the frame and theme"
                  onClick={() =>
                    create.replace({ frame: shuffled(frame), theme: readTheme(new URLSearchParams({ preset: pick(themes).id, name: theme.name ?? DEFAULT_THEME_NAME })), style, size })
                  }
                >
                  <ShuffleIcon size={15} strokeWidth={1.75} />
                </FooterButton>
                <FooterButton label="Start over" onClick={() => create.replace({ frame: DEFAULT_FRAME, theme: readTheme(new URLSearchParams({ preset: create.startPreset })), style: DEFAULT_LOOK, size: DEFAULT_SIZE })}>
                  <RotateCcwIcon size={15} strokeWidth={1.75} />
                </FooterButton>
                <CopyLink link={shareLink} />
                <ExportDialog
                  open={create.exporting}
                  onOpenChange={create.setExporting}
                  trigger={
                    <button
                      type="button"
                      className="ms-auto inline-flex h-8 touch:h-11 items-center gap-1.5 rounded-lg bg-accent px-3 text-[12.5px] font-medium text-on-accent shadow-xs transition-[filter] duration-(--yj-duration-fast) ease-standard hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
                      data-yj-trigger=""
                    >
                      <CodeIcon size={14} strokeWidth={1.9} />
                      Get the code
                    </button>
                  }
                  state={exported}
                  designed={frame}
                  includeScreens={includeScreens}
                  onIncludeScreensChange={setIncludeScreens}
                  link={link}
                  shareLink={shareLink}
                  files={files}
                  onTheme={() => {
                    create.setExporting(false)
                    setStep('theme')
                  }}
                />
              </div>
            </footer>
          </div>
        </aside>
        <section ref={preview} aria-label="Preview" className={cn('min-w-0 flex-1', !desktop && shown !== 'preview' && 'max-lg:hidden')}>
          <ViewportFrame
            src="/view/create"
            href={`/view/create${query ? `?${query}` : ''}`}
            title="Your frame"
            files={files}
            install={install}
            download="youj-frame"
            look={false}
            tab={codeTab}
            onTabChange={setCodeTab}
            start={desktop && !panelOpen ? <PanelButton ref={showButton} open={false} onClick={toggle} controls={`${id}-panel`} /> : undefined}
            height={desktop ? 'calc(100dvh - var(--header-height) - 4.25rem)' : 'min(760px, calc(100dvh - 10rem))'}
          />
        </section>
      </div>
    </TooltipProvider>
  )
}

/** Folds the panel away, or brings it back from the preview's toolbar. */
function PanelButton({ ref, open, onClick, controls }: { ref: Ref<HTMLButtonElement>; open: boolean; onClick: () => void; controls: string }) {
  const label = open ? 'Hide the panel' : 'Show the panel'
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            ref={ref}
            type="button"
            onClick={onClick}
            aria-label={label}
            aria-expanded={open}
            aria-controls={controls}
            aria-keyshortcuts="Meta+Backslash Control+Backslash"
            // In the preview's toolbar it takes the row's size.
            className={open ? 'icon-button rounded-lg' : TOOLBAR_BUTTON}
            data-yj-trigger=""
          />
        }
      >
        <SidebarIcon size={16} strokeWidth={1.75} active={!open} className="rtl:-scale-x-100" />
      </TooltipTrigger>
      <TooltipContent className="flex items-center gap-2">
        {label}
        <Kbd>⌘\</Kbd>
      </TooltipContent>
    </Tooltip>
  )
}

function FooterButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<button type="button" onClick={onClick} aria-label={label} className="icon-button size-8 touch:size-11 rounded-lg" data-yj-trigger="" />}>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function CopyLink({ link }: { link: string }) {
  const k = useYouj()
  const cue = useSoundCue()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(link)
        } catch {
          cue('error')
          return
        }
        cue('success')
        copyToast('Link copied', 'To this look.')
        setCopied(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), k.ms('deliberate') * 3)
      }}
      className="inline-flex h-8 touch:h-11 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-medium text-fg-muted transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-hover hover:text-fg focus-ring"
    >
      <LinkIcon size={14} strokeWidth={1.75} />
      {copied ? 'Copied' : 'Copy link'}
      <span role="status" className="sr-only">
        {copied ? 'Link copied' : ''}
      </span>
    </button>
  )
}

/** Create is unfinished: an Experimental pill beside the title says so, and its popover says how, without pushing the studio down. */
function ExperimentalNote() {
  return (
    <Popover>
      <PopoverTrigger render={<Badge variant="warning" render={<button type="button" aria-label="Create is experimental: what that means" className="cursor-pointer focus-ring" />} />}>
        Experimental
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-72 p-3">
        <PopoverTitle className="text-[13px] font-semibold">Create is still being built</PopoverTitle>
        <PopoverDescription className="mt-1 text-[12px] leading-snug text-pretty text-fg-muted">
          Some pieces are missing, things will change, and the code it exports may need touching up. Use it to explore and try ideas, not yet as the base of a
          production app.
        </PopoverDescription>
      </PopoverContent>
    </Popover>
  )
}

/** What the server sends while the studio loads: the panel's header and an empty frame, in the same places. */
export function StudioFallback() {
  return (
    <div className="flex w-full flex-1 flex-col gap-2 p-2 lg:h-[calc(100dvh-var(--header-height))] lg:flex-none lg:flex-row">
      <div className="flex flex-col rounded-xl border border-line bg-surface lg:w-[24rem] xl:w-[27rem]">
        <header className="flex flex-col gap-1 px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <h1 className="type-subheading text-fg">Make it yours</h1>
            <Badge variant="warning">Experimental</Badge>
          </div>
          <p className="text-[12.5px] leading-snug text-pretty text-fg-muted">An app frame and its screens, in your theme, as code.</p>
        </header>
      </div>
      <div aria-busy className="flex-1 rounded-xl border border-line bg-surface max-lg:hidden" />
    </div>
  )
}
