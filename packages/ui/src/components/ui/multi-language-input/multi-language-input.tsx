'use client'

import type { multiLanguageInputProviderLabels } from '@youj/core/labels'

import {
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type FocusEvent,
  type Ref,
} from 'react'
import type { YoujLabels } from '@youj/core/lib/youj/labels-types'
import { CopyIcon } from '@youj/icons/components/youj/icons/copy'
import { SparklesIcon } from '@youj/icons/components/youj/icons/sparkles'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../../lib/utils'
import { useFieldControl } from '../field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupTextarea } from '../input-group'
import { countCharacters, scriptTypography, type LocaleInput } from './multi-language-input-locales'
import {
  needsWork,
  translationStatus,
  type TranslationReview,
  type TranslationReviews,
  type TranslationStatus,
  type TranslationValue,
} from './multi-language-input-model'
import { MultiLanguageContext, ProviderCore, useMultiLanguageContext, type FieldHandle, type MultiLanguageView } from './multi-language-input-provider'
import { PaneCaption, SourcePane } from './multi-language-input-source'
import { StatusGlyph } from './multi-language-input-status'
import { MultiLanguageSwitcher } from './multi-language-input-switcher'

/* One field, many languages. The value is `Record<locale, string>`; the
 * control edits one locale at a time, marked with its `lang` and `dir` (so
 * Arabic and Hebrew run right to left, spellcheck and speech follow the
 * language, and Japanese gets Japanese glyphs) and named "Title, German".
 *
 * On its own it carries its switcher in its header. Inside a
 * MultiLanguageProvider it is just the field: the provider's switcher, active
 * locale and status model are shared by every field in the form.
 *
 * Status per locale: missing, outdated (the source changed since it was
 * translated), needs review (filled by a copy or a machine suggestion) or
 * complete. An empty locale offers "Copy from English" (or a suggestion) and
 * shows the source as its placeholder; an outdated or unreviewed one says so
 * under the text with "Mark reviewed". Side by side, the source sits beside
 * the translation, with what changed marked. `limit` counts characters as a
 * reader does, per locale, and flags text over it.
 *
 * Motion: switching locale drifts the new text in from the side it came
 * from; the locale tag fades to the new code; a fill flashes the surface
 * once. Reduced motion: the text swaps in place and nothing flashes. */

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

interface MultiLanguageInputProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange' | 'onBlur' | 'dir' | 'ref'> {
  /** The locales (BCP 47 tags or `{ code, label?, flag?, group? }`). Required on its own; inside a MultiLanguageProvider, the provider's apply. */
  locales?: LocaleInput[]
  /** On its own: the locale translations are made from. Default: the first locale. */
  sourceLocale?: string
  /** Locales a required field must be filled in. Default: the provider's, or the source locale. */
  requiredLocales?: string[]
  /** On its own: the locale being edited (controlled). */
  locale?: string
  onLocaleChange?: (locale: string) => void
  /** On its own: 'side-by-side' shows the source beside the translation. */
  view?: MultiLanguageView
  /** On its own: locales kept as one-press keys in the switcher. */
  pinned?: string[]
  value?: TranslationValue
  defaultValue?: TranslationValue
  onValueChange?: (value: TranslationValue) => void
  /** Per locale: the source text it was translated against and whether it's reviewed (controlled). Store it beside the value to keep "outdated" across sessions. */
  review?: TranslationReviews
  defaultReview?: TranslationReviews
  onReviewChange?: (review: TranslationReviews) => void
  /** Machine suggestions per locale, offered in empty locales and filled as "needs review". */
  suggestions?: Record<string, string>
  /** A textarea instead of a single line. */
  multiline?: boolean
  placeholder?: string
  disabled?: boolean
  /** Requires the required locales. Default: the surrounding Field's `required`. */
  required?: boolean
  /** Submits one hidden input per locale, `name[code]`. */
  name?: string
  /** A hard cap: the browser stops typing past it. */
  maxLength?: number
  /** A soft limit in characters, for every locale or per locale: a count, and an error past it. */
  limit?: number | Record<string, number>
  /** A message for invalid text in a locale, or nothing. */
  validate?: (text: string, locale: string) => string | null | undefined | false
  /** Errors per locale from your app or server. */
  errors?: Record<string, string | undefined>
  /** The text control, e.g. react-hook-form's `field.ref`. */
  ref?: Ref<HTMLInputElement & HTMLTextAreaElement>
  onBlur?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  /** Names the field outside a Field (the locale is added: "Title, German"). */
  'aria-label'?: string
}

function MultiLanguageInput(props: MultiLanguageInputProps) {
  const shared = useContext(MultiLanguageContext)
  return shared ? <LocalizedField {...props} /> : <StandaloneField {...props} />
}

function StandaloneField({ locales, sourceLocale, requiredLocales, locale, onLocaleChange, view, pinned, ...props }: MultiLanguageInputProps) {
  if (!locales) throw new Error('MultiLanguageInput needs `locales`, or a MultiLanguageProvider around it.')
  return (
    <ProviderCore
      standalone
      locales={locales}
      sourceLocale={sourceLocale}
      requiredLocales={requiredLocales}
      locale={locale}
      onLocaleChange={onLocaleChange}
      view={view}
      pinned={pinned}
    >
      <LocalizedField {...props} />
    </ProviderCore>
  )
}

const withReview = (reviews: TranslationReviews, code: string, next: TranslationReview | undefined): TranslationReviews => {
  const { [code]: _, ...rest } = reviews
  return next ? { ...rest, [code]: next } : rest
}

function LocalizedField({
  value: valueProp,
  defaultValue,
  onValueChange,
  review: reviewProp,
  defaultReview,
  onReviewChange,
  suggestions,
  multiline = false,
  placeholder,
  disabled: disabledProp,
  required: requiredProp,
  requiredLocales: requiredLocalesProp,
  name,
  maxLength,
  limit,
  validate,
  errors,
  ref,
  onBlur,
  className,
  'aria-label': ariaLabel,
  // A lone input's own; inside a provider, the provider's apply.
  locales: _locales,
  sourceLocale: _source,
  locale: _locale,
  onLocaleChange: _onLocale,
  view: _view,
  pinned: _pinned,
  ...props
}: MultiLanguageInputProps) {
  const k = useYouj()
  const c = useMultiLanguageContext()
  const { active, sourceLocale, byCode, labels, standalone } = c
  const field = useFieldControl(undefined, { labelable: false })
  const disabled = disabledProp || field.disabled
  const required = requiredProp ?? field.required ?? false
  const requiredLocales = requiredLocalesProp ?? c.requiredLocales

  const [valueState, setValueState] = useState<TranslationValue>(defaultValue ?? {})
  const value = valueProp ?? valueState
  const [reviewState, setReviewState] = useState<TranslationReviews>(defaultReview ?? {})
  const review = reviewProp ?? reviewState
  // The source text first seen stands in for a review: text there from the start is current until the source changes.
  const firstSource = useRef<string | undefined>(undefined)
  if (firstSource.current === undefined && value[sourceLocale]?.trim()) firstSource.current = value[sourceLocale]

  const limitOf = (code: string) => (typeof limit === 'number' ? limit : limit?.[code])
  const errorOf = (code: string): string | undefined => {
    if (errors?.[code]) return errors[code]
    const text = value[code] ?? ''
    const max = limitOf(code)
    const count = max === undefined ? 0 : countCharacters(text, code)
    if (max !== undefined && count > max) return labels.charactersOver(count - max)
    return validate?.(text, code) || undefined
  }

  // Bulk actions reach the latest state through here, several in one tick included.
  const latest = useRef({ value, review, valueProp, reviewProp, onValueChange, onReviewChange, sourceLocale })
  latest.current = { value, review, valueProp, reviewProp, onValueChange, onReviewChange, sourceLocale }
  const commit = (nextValue: TranslationValue, nextReview?: TranslationReviews) => {
    const l = latest.current
    l.value = nextValue
    if (l.valueProp === undefined) setValueState(nextValue)
    l.onValueChange?.(nextValue)
    if (!nextReview) return
    l.review = nextReview
    if (l.reviewProp === undefined) setReviewState(nextReview)
    l.onReviewChange?.(nextReview)
  }

  const handle = useMemo<FieldHandle>(() => {
    const now = () => latest.current
    return {
      copyFromSource: (code) => {
        const { value: v, review: r, sourceLocale: src } = now()
        if (code === src || v[code]?.trim() || !v[src]?.trim()) return false
        commit({ ...v, [code]: v[src]! }, withReview(r, code, { basis: v[src], unreviewed: true }))
        return true
      },
      clear: (code) => {
        const { value: v, review: r, sourceLocale: src } = now()
        if (code === src || !v[code]) return false
        commit({ ...v, [code]: '' }, withReview(r, code, undefined))
        return true
      },
      markReviewed: (code) => {
        const { value: v, review: r, sourceLocale: src } = now()
        const s = translationStatus(v, code, src, r[code], firstSource.current)
        if (s !== 'outdated' && s !== 'review') return false
        commit(v, withReview(r, code, { basis: v[src] ?? '' }))
        return true
      },
      snapshot: (code) => ({ text: now().value[code] ?? '', review: now().review[code] }),
      restore: (code, saved) => commit({ ...now().value, [code]: saved.text }, withReview(now().review, code, saved.review)),
    }
    // `commit` only reads `latest`, so the first one serves for good.
  }, [])

  // Registered with the provider: per-locale statuses and errors, sent again only when they change.
  const id = useId()
  const statuses = Object.fromEntries(c.locales.map((l) => [l.code, translationStatus(value, l.code, sourceLocale, review[l.code], firstSource.current)])) as Record<string, TranslationStatus>
  const errorFlags = Object.fromEntries(c.locales.map((l) => [l.code, !!errorOf(l.code)])) as Record<string, boolean>
  const entryKey = JSON.stringify([statuses, errorFlags])
  useIsomorphicLayoutEffect(() => {
    c.registry.set({ id, statuses, errors: errorFlags }, handle)
  }, [entryKey, c.registry])
  useIsomorphicLayoutEffect(() => () => c.registry.remove(id), [c.registry, id])

  const info = byCode.get(active)!
  const source = byCode.get(sourceLocale)!
  const text = value[active] ?? ''
  const status = statuses[active] ?? 'missing'
  const error = errorOf(active)
  const max = limitOf(active)
  const isSource = active === sourceLocale
  const compare = c.view === 'side-by-side' && !isSource
  const sourceText = value[sourceLocale] ?? ''
  const suggestion = !isSource && !text.trim() ? suggestions?.[active] : undefined
  const canCopy = !isSource && !text.trim() && !!sourceText.trim() && !suggestion
  const missingRequired = required && requiredLocales.includes(active) && status === 'missing'
  const typography = scriptTypography(info.script)

  // Switching locale drifts the new text in from the side it came from (a Web Animation, interrupted by the next switch).
  const controlEl = useRef<(HTMLInputElement & HTMLTextAreaElement) | null>(null)
  const frame = useRef<HTMLDivElement>(null)
  const shown = useRef(active)
  useIsomorphicLayoutEffect(() => {
    const from = shown.current
    shown.current = active
    const el = controlEl.current
    if (from === active || k.reduced || !el?.animate || !frame.current) return
    const order = c.locales.map((l) => l.code)
    const forward = order.indexOf(active) > order.indexOf(from)
    const rtl = getComputedStyle(frame.current).direction === 'rtl'
    const x = (forward ? 6 : -6) * (rtl ? -1 : 1)
    const easing = `cubic-bezier(${k.ease('enter').join(',')})` // youj-allow: the enter token's own curve, for a Web Animation
    const animation = el.animate([{ opacity: 0.25, transform: `translateX(${x}px)` }, { opacity: 1, transform: 'none' }], { duration: k.ms('base'), easing })
    return () => animation.cancel()
  }, [active])

  // A fill (copy or suggestion) flashes the surface and puts the caret at the end.
  const [flash, setFlash] = useState(0)
  const pendingCaret = useRef(false)
  useEffect(() => {
    const el = controlEl.current
    if (!pendingCaret.current || !el) return
    pendingCaret.current = false
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  })
  const fill = (next: string, message: string) => {
    commit({ ...value, [active]: next }, withReview(review, active, { basis: sourceText, unreviewed: true }))
    pendingCaret.current = true
    setFlash((n) => n + 1)
    c.announce(message)
  }

  const onText = (next: string) => {
    if (isSource) return commit({ ...value, [active]: next })
    // A person wrote it, against the source as it is now.
    const current = review[active]
    const settled = current && !current.unreviewed && current.basis === sourceText
    commit({ ...value, [active]: next }, settled ? undefined : withReview(review, active, { basis: sourceText }))
  }

  const setControl = (node: (HTMLInputElement & HTMLTextAreaElement) | null) => {
    controlEl.current = node
    if (standalone) c.focusTarget.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  const localeNameId = useId()
  const statusId = useId()
  const meterId = useId()
  const sourceId = useId()
  const note: { tone: 'danger' | 'muted' | 'warning'; text: string; glyph?: TranslationStatus; action?: boolean } | null = error
    ? { tone: 'danger', text: error }
    : missingRequired && (!isSource || field.invalid)
      ? { tone: field.invalid ? 'danger' : 'muted', text: labels.requiredIn(info.label), glyph: 'missing' }
      : status === 'outdated'
        ? { tone: 'warning', text: labels.sourceChanged(source.label), glyph: 'outdated', action: true }
        : status === 'review'
          ? { tone: 'muted', text: labels.filledAutomatically, glyph: 'review', action: true }
          : null
  const describedBy = [compare ? sourceId : null, note ? statusId : null, max !== undefined ? meterId : null].filter(Boolean).join(' ') || undefined
  const Control = multiline ? InputGroupTextarea : InputGroupInput

  return (
    <div
      data-slot="multi-language-input"
      aria-disabled={disabled || undefined}
      data-view={compare ? 'side-by-side' : 'single'}
      data-reduced-motion={k.reduced || undefined}
      className={cn('@container/mli own:flex w-full min-w-0 flex-col', className)}
      onKeyDown={c.onKeyDown}
      {...props}
    >
      <InputGroup ref={frame} className="h-auto flex-col items-stretch">
        {standalone && (
          <InputGroupAddon align="block-start" className="cursor-default border-b own:border-line own:px-1.5 own:pt-1.5 own:pb-1.5">
            <MultiLanguageSwitcher />
          </InputGroupAddon>
        )}
        <div className={cn('own:grid min-w-0', compare && '@[34rem]/mli:grid-cols-2')}>
          {compare && (
            <SourcePane
              id={sourceId}
              source={source}
              text={sourceText}
              basis={status === 'outdated' ? (review[active]?.basis ?? firstSource.current) : undefined}
              label={labels.translationSource}
              emptyLabel={labels.translationMissing}
            />
          )}
          <div className="own:flex min-w-0 flex-col">
            {compare && <PaneCaption hidden code={active} label={info.label} status={status} />}
            <div className="relative own:flex min-w-0 items-start">
              {flash > 0 && (
                <span
                  key={flash}
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-accent-subtle opacity-0 transition-opacity yj-duration-slow ease-standard starting:opacity-100"
                />
              )}
              <Control
                ref={setControl}
                lang={active}
                dir={info.dir}
                value={text}
                onValueChange={onText}
                onBlur={(event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlur?.(event)}
                placeholder={isSource ? placeholder : (suggestion ?? (sourceText.trim() ? sourceText : placeholder))}
                disabled={disabled}
                required={required && requiredLocales.includes(active)}
                maxLength={maxLength}
                aria-labelledby={field.labelId ? `${field.labelId} ${localeNameId}` : undefined}
                aria-label={!field.labelId && ariaLabel ? `${ariaLabel}, ${info.label}` : undefined}
                aria-describedby={describedBy}
                aria-invalid={error ? true : undefined}
                className={cn(
                  'relative',
                  multiline ? 'min-h-20' : 'h-control',
                  // Side by side, the text starts on the source's line, under its caption.
                  compare && (multiline ? 'own:pt-1' : 'h-auto own:pt-1 own:pb-2'),
                  typography.className,
                )}
                style={typography.style}
              />
              <span id={localeNameId} hidden>
                , {info.label}
              </span>
              {max !== undefined && !multiline && (
                <CharacterMeter id={meterId} count={countCharacters(text, active)} max={max} labels={labels} className={cn('relative own:me-2 shrink-0', compare ? 'own:mt-1.5' : 'self-center')} />
              )}
              {(suggestion || canCopy) && (
                <InputGroupButton
                  size="xs"
                  disabled={disabled}
                  className={cn('relative me-1.5 shrink-0', multiline || compare ? 'mt-1' : 'self-center')}
                  onClick={() => (suggestion ? fill(suggestion, labels.suggestionUsed) : fill(sourceText, labels.copiedFrom(source.label)))}
                >
                  {suggestion ? <SparklesIcon size={13} strokeWidth={1.75} /> : <CopyIcon size={13} strokeWidth={1.75} />}
                  {suggestion ? labels.useSuggestion : labels.copyFrom(source.label)}
                </InputGroupButton>
              )}
              {!standalone && !compare && (
                <span
                  key={active}
                  aria-hidden
                  className={cn(
                    'relative own:me-2 own:flex shrink-0 items-center gap-1 own:text-ui-xs own:font-medium own:tracking-wide own:text-fg-muted own:uppercase',
                    'transition-opacity yj-duration-fast ease-standard starting:opacity-0',
                    multiline ? 'own:mt-2' : 'self-center',
                  )}
                >
                  {needsWork(status) && <StatusGlyph status={status} />}
                  {active}
                </span>
              )}
            </div>
          </div>
        </div>
        {(note || (max !== undefined && multiline)) && (
          <InputGroupAddon
            align="block-end"
            className={cn('cursor-default items-start justify-between gap-3 own:px-2.5', note ? 'border-t own:border-line own:py-1.5' : 'own:pt-0 own:pb-1.5')}
          >
            {note ? (
              <p
                id={statusId}
                className={cn(
                  'own:flex min-w-0 items-start gap-1.5 text-start own:text-ui-sm',
                  note.tone === 'danger' ? 'own:text-danger-text' : note.tone === 'warning' ? 'own:text-warning-text' : 'own:text-fg-muted',
                )}
              >
                {note.glyph && <StatusGlyph status={note.glyph} className="mt-0.5" />}
                <span>{note.text}</span>
              </p>
            ) : (
              <span />
            )}
            <span className="own:flex shrink-0 items-center gap-2">
              {note?.action && (
                <InputGroupButton size="xs" variant="outline" disabled={disabled} onClick={() => handle.markReviewed(active) && c.announce(labels.markedReviewed(info.label))}>
                  {labels.markReviewed}
                </InputGroupButton>
              )}
              {max !== undefined && multiline && <CharacterMeter id={meterId} count={countCharacters(text, active)} max={max} labels={labels} />}
            </span>
          </InputGroupAddon>
        )}
      </InputGroup>
      {name && c.locales.map((l) => <input key={l.code} type="hidden" name={`${name}[${l.code}]`} value={value[l.code] ?? ''} />)}
    </div>
  )
}

/** "42/60" with a hairline that fills: amber from 90%, red past the limit. */
function CharacterMeter({ id, count, max, labels, className }: { id: string; count: number; max: number; labels: Pick<YoujLabels, keyof typeof multiLanguageInputProviderLabels>; className?: string }) {
  const ratio = max ? count / max : 0
  const tone = ratio > 1 ? 'danger' : ratio >= 0.9 ? 'warning' : 'muted'
  return (
    <span id={id} className={cn('own:flex items-center gap-1.5', className)}>
      <span aria-hidden className="relative h-1 w-8 overflow-hidden rounded-full bg-well">
        <span
          className={cn(
            'absolute inset-y-0 start-0 w-full origin-left [scale:var(--fill)_1] transition-[scale,background-color] yj-duration-base ease-standard rtl:origin-right',
            tone === 'danger' ? 'bg-danger' : tone === 'warning' ? 'bg-warning' : 'bg-fg-subtle',
          )}
          style={{ '--fill': Math.min(1, ratio) } as CSSProperties}
        />
      </span>
      <span className={cn('own:text-ui-sm own:tabular-nums', tone === 'danger' ? 'own:text-danger-text' : tone === 'warning' ? 'own:text-warning-text' : 'own:text-fg-muted')}>
        <span aria-hidden>
          {count}/{max}
        </span>
        <span className="sr-only">{labels.characterCount(count, max)}</span>
      </span>
    </span>
  )
}

export { MultiLanguageInput, type MultiLanguageInputProps }
