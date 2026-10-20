'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import type { YoujLabels } from '@youj/core/lib/youj/labels-types'
import { useLocale } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { multiLanguageInputProviderLabels } from '@youj/core/labels'
import { useAnnouncer } from '../../../hooks/use-announcer'
import { useControllableState } from '../../../hooks/use-controllable-state'
import { describeLocale, type LocaleInfo, type LocaleInput } from './multi-language-input-locales'
import { describeSummary, needsWork, summarize, type FieldStatus, type LocaleSummary, type TranslationReview } from './multi-language-input-model'

/* One active locale and one status model for any number of fields. Each
 * MultiLanguageInput inside registers its per-locale statuses and a handle
 * for bulk actions; the provider sums them per locale for the switcher, the
 * progress meter and "next to translate". Keyboard: Mod+Alt+↓ / ↑ anywhere
 * inside moves to the next or previous locale that needs work, and is
 * announced, since focus stays where it is (usually in the text). */

type MultiLanguageView = 'single' | 'side-by-side'
type BulkAction = 'copy' | 'review' | 'clear'

interface BulkResult {
  action: BulkAction
  locale: string
  /** How many fields changed. */
  fields: number
  /** Puts every field back as it was before the action. */
  undo: () => void
}

interface FieldSnapshot {
  text: string
  review?: TranslationReview
}

interface FieldHandle {
  /** Fills the locale from the source when it's empty. True when it changed. */
  copyFromSource: (locale: string) => boolean
  clear: (locale: string) => boolean
  markReviewed: (locale: string) => boolean
  snapshot: (locale: string) => FieldSnapshot
  restore: (locale: string, saved: FieldSnapshot) => void
}

interface FieldEntry extends FieldStatus {
  id: string
}

function createRegistry() {
  const entries = new Map<string, FieldEntry>()
  const handles = new Map<string, FieldHandle>()
  const listeners = new Set<() => void>()
  let snapshot: FieldEntry[] = []
  const emit = () => {
    snapshot = [...entries.values()]
    for (const listener of listeners) listener()
  }
  return {
    set(entry: FieldEntry, handle: FieldHandle) {
      entries.set(entry.id, entry)
      handles.set(entry.id, handle)
      emit()
    },
    remove(id: string) {
      if (!entries.delete(id)) return
      handles.delete(id)
      emit()
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },
    getSnapshot: () => snapshot,
    handles: () => [...handles.values()],
  }
}

type Registry = ReturnType<typeof createRegistry>

interface MultiLanguageContextValue {
  locales: LocaleInfo[]
  byCode: Map<string, LocaleInfo>
  sourceLocale: string
  requiredLocales: string[]
  active: string
  /** `announce`: say where you are, for moves that leave focus elsewhere (a shortcut, a pick). */
  setActive: (code: string, announce?: boolean) => void
  view: MultiLanguageView
  setView: (view: MultiLanguageView) => void
  missingOnly: boolean
  setMissingOnly: (on: boolean) => void
  pinned: string[]
  recents: string[]
  groupBy: 'region' | 'script' | 'none'
  displayLocale: string
  labels: Pick<YoujLabels, keyof typeof multiLanguageInputProviderLabels>
  summaries: Record<string, LocaleSummary>
  /** The next (1) or previous (-1) locale that needs work, if any. */
  neighbour: (direction: 1 | -1) => string | undefined
  step: (direction: 1 | -1) => void
  bulk: (action: BulkAction, locale?: string) => BulkResult
  registry: Registry
  announce: (text: string) => void
  onKeyDown: (event: KeyboardEvent) => void
  /** Set when a lone MultiLanguageInput made this provider for itself. */
  standalone: boolean
  /** A lone input's text control: where focus goes after picking a locale. */
  focusTarget: { current: HTMLElement | null }
}

const MultiLanguageContext = createContext<MultiLanguageContextValue | null>(null)

function useMultiLanguageContext(): MultiLanguageContextValue {
  const context = useContext(MultiLanguageContext)
  if (!context) throw new Error('MultiLanguage parts must be inside a MultiLanguageProvider or a MultiLanguageInput.')
  return context
}

interface MultiLanguageProviderProps {
  /** The locales, as BCP 47 tags ('en', 'pt-BR') or `{ code, label?, flag?, group? }`. Their order is the order everywhere. */
  locales: LocaleInput[]
  /** The locale translations are made from. Default: the first locale. */
  sourceLocale?: string
  /** Locales a required field must be filled in. Default: the source locale. */
  requiredLocales?: string[]
  /** The locale being edited (controlled). */
  locale?: string
  /** The locale edited at first (uncontrolled). Default: the source locale. */
  defaultLocale?: string
  onLocaleChange?: (locale: string) => void
  /** Locales kept as one-press keys in the switcher; the rest are a search away. Default: every locale when there are 5 or fewer, else the source and required locales. */
  pinned?: string[]
  /** 'side-by-side' shows the source beside each translation. */
  view?: MultiLanguageView
  defaultView?: MultiLanguageView
  onViewChange?: (view: MultiLanguageView) => void
  /** Lists only the locales that need work in the picker. */
  missingOnly?: boolean
  defaultMissingOnly?: boolean
  onMissingOnlyChange?: (missingOnly: boolean) => void
  /** How the picker groups the locales. Default 'region'. */
  groupBy?: 'region' | 'script' | 'none'
  /** The language locales are named in. Default: the YoujProvider's locale. */
  displayLocale?: string
  /** After a bulk action: offer an Undo with `result.undo`. */
  onBulkAction?: (result: BulkResult) => void
  children: ReactNode
}

/** One active locale, one status model and one switcher for every MultiLanguageInput inside. */
function MultiLanguageProvider(props: MultiLanguageProviderProps) {
  return <ProviderCore {...props} />
}

/** The provider, also made by a lone MultiLanguageInput for itself (`standalone`). */
function ProviderCore(props: MultiLanguageProviderProps & { standalone?: boolean }) {
  const {
    locales: localesProp,
    sourceLocale: sourceProp,
    requiredLocales: requiredProp,
    locale: localeProp,
    defaultLocale,
    onLocaleChange,
    pinned: pinnedProp,
    view: viewProp,
    defaultView = 'single',
    onViewChange,
    missingOnly: missingOnlyProp,
    defaultMissingOnly = false,
    onMissingOnlyChange,
    groupBy = 'region',
    displayLocale: displayProp,
    onBulkAction,
    standalone = false,
    children,
  } = props
  const displayLocale = useLocale(displayProp)
  const labels = useComponentLabels(multiLanguageInputProviderLabels)
  // Keyed by content, so an inline `locales` array doesn't redescribe every locale each render.
  const key = localesProp.map((l) => (typeof l === 'string' ? l : `${l.code}:${l.label ?? ''}:${l.flag ?? ''}:${l.group ?? ''}`)).join('|')
  const locales = useMemo(() => localesProp.map((l) => describeLocale(l, displayLocale)), [key, displayLocale])
  const byCode = useMemo(() => new Map(locales.map((l) => [l.code, l])), [locales])
  const codes = useMemo(() => locales.map((l) => l.code), [locales])
  const sourceLocale = sourceProp && byCode.has(sourceProp) ? sourceProp : (codes[0] ?? '')
  const requiredKey = (requiredProp ?? [sourceLocale]).join('|')
  const requiredLocales = useMemo(() => requiredKey.split('|').filter(Boolean), [requiredKey])

  const [activeState, setActiveState] = useControllableState(localeProp, defaultLocale ?? sourceLocale)
  const active = byCode.has(activeState) ? activeState : sourceLocale
  const [view, setViewState] = useControllableState(viewProp, defaultView)
  const [missingOnly, setMissingOnlyState] = useControllableState(missingOnlyProp, defaultMissingOnly)
  const [recents, setRecents] = useState<string[]>([])
  const [registry] = useState(createRegistry)
  const [focusTarget] = useState<{ current: HTMLElement | null }>(() => ({ current: null }))
  const fields = useSyncExternalStore(registry.subscribe, registry.getSnapshot, registry.getSnapshot)
  const summaries = useMemo(() => summarize(fields, codes, sourceLocale), [fields, codes, sourceLocale])
  const { announce, announcer } = useAnnouncer()

  const pinnedKey = pinnedProp?.join('|')
  const pinned = useMemo(() => {
    const list = pinnedKey !== undefined ? pinnedKey.split('|') : codes.length <= 5 ? codes : [sourceLocale, ...requiredLocales].slice(0, 4)
    // The source leads; unknown and repeated codes drop out.
    return [...new Set([sourceLocale, ...list])].filter((c) => byCode.has(c))
  }, [pinnedKey, codes, sourceLocale, requiredLocales, byCode])

  const setActive = useCallback(
    (code: string, say = false) => {
      if (!byCode.has(code)) return
      if (code !== active) {
        setActiveState(code)
        onLocaleChange?.(code)
        if (!pinned.includes(code)) setRecents((list) => [code, ...list.filter((c) => c !== code)].slice(0, 3))
      }
      if (say) announce(labels.editingLanguage(byCode.get(code)!.label, describeSummary(labels, summaries[code])))
    },
    [active, byCode, pinned, setActiveState, onLocaleChange, announce, labels, summaries],
  )

  const neighbour = useCallback(
    (direction: 1 | -1) => {
      const n = codes.length
      const start = codes.indexOf(active)
      for (let i = 1; i < n; i++) {
        const code = codes[(((start + direction * i) % n) + n) % n]!
        if (needsWork(summaries[code]?.status ?? 'complete')) return code
      }
      return undefined
    },
    [codes, active, summaries],
  )

  const step = useCallback(
    (direction: 1 | -1) => {
      const next = neighbour(direction)
      if (next) setActive(next, true)
      else announce(labels.everyLanguageComplete)
    },
    [neighbour, setActive, announce, labels],
  )

  const bulk = useCallback(
    (action: BulkAction, locale = active): BulkResult => {
      const handles = registry.handles()
      const saved = handles.map((handle) => [handle, handle.snapshot(locale)] as const)
      let changed = 0
      for (const handle of handles) {
        const did = action === 'copy' ? handle.copyFromSource(locale) : action === 'review' ? handle.markReviewed(locale) : handle.clear(locale)
        if (did) changed++
      }
      const result: BulkResult = { action, locale, fields: changed, undo: () => saved.forEach(([handle, s]) => handle.restore(locale, s)) }
      announce(labels.translationBulkDone(action, byCode.get(locale)?.label ?? locale, changed))
      onBulkAction?.(result)
      return result
    },
    [active, registry, announce, labels, byCode, onBulkAction],
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Parts nest (a lone input holds its switcher), so the innermost handler wins.
      if (event.defaultPrevented || !event.altKey || !(event.metaKey || event.ctrlKey) || event.shiftKey) return
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
      event.preventDefault()
      step(event.key === 'ArrowDown' ? 1 : -1)
    },
    [step],
  )

  const value = useMemo<MultiLanguageContextValue>(
    () => ({
      locales,
      byCode,
      sourceLocale,
      requiredLocales,
      active,
      setActive,
      view,
      setView: (next) => {
        setViewState(next)
        onViewChange?.(next)
      },
      missingOnly,
      setMissingOnly: (next) => {
        setMissingOnlyState(next)
        onMissingOnlyChange?.(next)
      },
      pinned,
      recents,
      groupBy,
      displayLocale,
      labels,
      summaries,
      neighbour,
      step,
      bulk,
      registry,
      announce,
      onKeyDown,
      standalone,
      focusTarget,
    }),
    [locales, byCode, sourceLocale, requiredLocales, active, setActive, view, missingOnly, pinned, recents, groupBy, displayLocale, labels, summaries, neighbour, step, bulk, registry, announce, onKeyDown, standalone, focusTarget],
  )

  return (
    <MultiLanguageContext.Provider value={value}>
      {children}
      {announcer}
    </MultiLanguageContext.Provider>
  )
}

/** The shared state of the surrounding MultiLanguageProvider (or lone MultiLanguageInput), for your own toolbar. */
function useMultiLanguage() {
  const c = useMultiLanguageContext()
  return {
    locales: c.locales,
    sourceLocale: c.sourceLocale,
    requiredLocales: c.requiredLocales,
    locale: c.active,
    setLocale: (code: string) => c.setActive(code, true),
    view: c.view,
    setView: c.setView,
    missingOnly: c.missingOnly,
    setMissingOnly: c.setMissingOnly,
    /** Per locale: its worst status and how many fields are in each. */
    summaries: c.summaries,
    next: () => c.step(1),
    previous: () => c.step(-1),
    copyFromSource: (locale?: string) => c.bulk('copy', locale),
    markReviewed: (locale?: string) => c.bulk('review', locale),
    clear: (locale?: string) => c.bulk('clear', locale),
  }
}

export { MultiLanguageContext, MultiLanguageProvider, ProviderCore, useMultiLanguage, useMultiLanguageContext }
export type { BulkResult, FieldHandle, FieldSnapshot, MultiLanguageProviderProps, MultiLanguageView }
