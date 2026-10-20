'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState, type HTMLAttributes } from 'react'
import { useForm, useWatch, type FieldErrors, type Resolver } from 'react-hook-form'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Form } from '../../components/ui/form'
import { cn } from '../../lib/utils'
import {
  DEFAULT_COPY,
  demo,
  problem,
  same,
  SETTINGS_GROUPS,
  SETTINGS_VALUES,
  type SettingsField,
  type SettingsFormCopy,
  type SettingsGroup,
  type SettingsOption,
  type SettingsSaveError,
  type SettingsValue,
  type SettingsValues,
} from './settings/data'
import { SettingRow } from './settings/field'
import type { RunCheck } from './settings/status'
import { SaveBar, type BarMode } from './settings/save-bar'
import { useGuard } from './settings/use-guard'

/* A settings section done the way the best products do it, from data: groups
 * of fields in two columns (each group's title and description on the inline
 * start, its fields beside them; one column when the card is narrow). Change
 * anything and it's marked in the gutter with its own Reset, while the
 * card's foot turns into a save bar with the count of changes, Discard and
 * Save (⌘S or Ctrl+S from anywhere on the page). While the card's end is out
 * of view the bar sticks to the bottom of the window. Fields check
 * themselves when you leave them (then as you type), a URL-style field asks
 * whether a changed value is free, and Save checks everything, focuses the
 * first problem and puts any field errors your server sends back under
 * their fields. Discard leaves Undo for a few seconds.
 *
 * Unsaved changes can't be lost by accident: closing the tab asks first, and
 * a link elsewhere in the app is held while the bar turns amber, shakes once
 * and offers to save or discard and then continue there. Reduced motion: no
 * rise and no shake; every state is still shown and said.
 *
 * Pass your `groups` of fields and the saved settings (`defaultValue`, or
 * `value` with `onValueChange`), save through `onSave`, and tell your router
 * about unsaved changes with `onDirtyChange`; every string is in `copy`. */

interface SettingsFormProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'defaultValue' | 'onSubmit'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A panel inside another page: an `h2` instead of the page's `h1` (its groups an `h3`), and no page around it. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (768px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<SettingsFormCopy>
  /** Picks the plural of its counts (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The settings, in groups. Default: a workspace's name, defaults and security. */
  groups?: SettingsGroup[]
  /** The saved settings, controlled: pair it with `onValueChange`. A new value updates every field you haven't changed. */
  value?: SettingsValues
  /** The saved settings to start from, when the block owns them. Default: the demo workspace's. */
  defaultValue?: SettingsValues
  /** Called with the settings once a save goes through. */
  onValueChange?: (values: SettingsValues) => void
  /** Saves the settings (all of them, and the names of those that changed). Reject with `{ fields: { name: message } }` to put messages under fields, or with an Error to say why in the bar. Default: a short demo wait. */
  onSave?: (values: SettingsValues, changed: string[]) => Promise<unknown> | unknown
  /** Called when unsaved changes appear or go, to guard your router's own navigation. */
  onDirtyChange?: (dirty: boolean) => void
  /** Ask before the tab closes and hold links elsewhere in the app while changes are unsaved. Default true. */
  guard?: boolean
}

type CheckEntry = { promise: Promise<true | string>; result?: true | string }

function SettingsForm({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  groups = SETTINGS_GROUPS,
  value,
  defaultValue = SETTINGS_VALUES,
  onValueChange,
  onSave,
  onDirtyChange,
  guard = true,
  className,
  ...rest
}: SettingsFormProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const lang = useLocale(locale)
  const plural = useMemo(() => new Intl.PluralRules(lang), [lang])
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const GroupTitle = embedded ? 'h3' : 'h2'
  const root = useRef<HTMLElement>(null)
  const saveRef = useRef<HTMLButtonElement>(null)
  const fields = groups.flatMap((group) => group.fields)
  const [ownSaved, setOwnSaved] = useState(defaultValue)
  const saved = value ?? ownSaved

  const checks = useRef(new Map<string, CheckEntry>())
  const runCheck: RunCheck = useCallback((field, text) => {
    const key = `${field.name}\u0000${text}`
    let entry = checks.current.get(key)
    if (!entry) {
      // A check that fails to answer doesn't block saving: the server has the last word.
      const created: CheckEntry = { promise: Promise.resolve(field.check?.(text) ?? true).catch(() => true as const) }
      created.promise.then((result) => (created.result = result))
      checks.current.set(key, created)
      entry = created
    }
    return entry
  }, [])

  // The fields' own rules; a changed value with a check also needs its answer (awaited on save).
  const resolver: Resolver<SettingsValues> = async (values, _context, options) => {
    const errors: Record<string, { type: string; message: string }> = {}
    for (const field of fields) {
      if (options.names && !options.names.includes(field.name)) continue
      const current = values[field.name]
      let message = problem(field, current, values, copy)
      if (!message && field.type === 'text' && field.check && typeof current === 'string' && current && current !== saved[field.name]) {
        const entry = options.names ? checks.current.get(`${field.name}\u0000${current}`) : runCheck(field, current)
        const result = options.names ? entry?.result : await entry?.promise
        if (typeof result === 'string') message = result
      }
      if (message) errors[field.name] = { type: 'validate', message }
    }
    return Object.keys(errors).length ? { values: {}, errors: errors as FieldErrors<SettingsValues> } : { values, errors: {} }
  }

  const form = useForm<SettingsValues>({ defaultValues: saved, values: value, resetOptions: { keepDirtyValues: true }, resolver, mode: 'onTouched' })
  const current = useWatch({ control: form.control })
  const changed = fields.filter((field) => !same(current[field.name], saved[field.name])).map((field) => field.name)
  const dirty = changed.length > 0

  const [everSaved, setEverSaved] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [nudges, setNudges] = useState(0)
  const [discarded, setDiscarded] = useState<{ draft: SettingsValues; names: string[] } | null>(null)
  if (dirty && discarded) setDiscarded(null)
  const mode: BarMode = dirty ? (nudges ? 'nudge' : 'dirty') : discarded ? 'discarded' : 'idle'

  const { release } = useGuard({
    root,
    dirty,
    guard,
    onBlocked: (byKeyboard) => {
      setNudges((n) => n + 1)
      if (byKeyboard) saveRef.current?.focus({ focusVisible: true } as FocusOptions)
    },
    onSave: () => saveRef.current?.click(),
  })

  // Typing again means staying: the held link and a failed save's message go.
  useEffect(() => {
    return form.subscribe({
      formState: { values: true },
      callback: ({ type }) => {
        if (type !== 'change') return
        setNudges(0)
        setFailure(null)
        release()
      },
    })
  }, [form, release])

  // Undo lasts a few seconds.
  useEffect(() => {
    if (!discarded) return
    const timer = setTimeout(() => setDiscarded(null), 6000)
    return () => clearTimeout(timer)
  }, [discarded])

  const reported = useRef(dirty)
  useEffect(() => {
    if (reported.current === dirty) return
    reported.current = dirty
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])

  const save = async (values: SettingsValues) => {
    const names = fields.filter((field) => !same(values[field.name], saved[field.name])).map((field) => field.name)
    // Enter in a field with nothing changed has nothing to save.
    if (!names.length) return
    setFailure(null)
    try {
      await (onSave ? onSave(values, names) : demo('SettingsForm: onSave', 900))
    } catch (cause) {
      const answer = cause as SettingsSaveError | undefined
      for (const [name, message] of Object.entries(answer?.fields ?? {})) form.setError(name, { type: 'server', message })
      setFailure(answer?.message || copy.failed)
      throw cause
    }
    setOwnSaved(values)
    form.reset(values, { keepValues: true })
    setEverSaved(true)
    setDiscarded(null)
    // A held link is followed now that it's saved.
    setNudges(0)
    onValueChange?.(values)
  }

  const discard = () => {
    setDiscarded({ draft: form.getValues(), names: changed })
    setFailure(null)
    setNudges(0)
    // useForm's resetOptions keep dirty values for a new `value`; a discard drops them.
    form.reset(saved, { keepDirtyValues: false })
  }

  const undo = () => {
    if (!discarded) return
    for (const name of discarded.names) form.setValue(name, discarded.draft[name]!, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
    setDiscarded(null)
  }

  const card = (
    <article
      ref={root}
      aria-labelledby={titleId}
      {...(embedded ? rest : null)}
      className={cn(
        '@container/settings w-full overflow-clip rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface text-fg',
        embedded ? 'shadow-sm' : 'shadow-lg',
        !fill && 'max-w-3xl',
        embedded && className,
      )}
    >
      <Form form={form} onSubmit={save}>
        <header className="flex flex-col gap-1 px-(--ui--panel-x) py-(--ui--panel-head-y)">
          <Title id={titleId} className="text-xl leading-tight font-semibold tracking-tight">
            {copy.title}
          </Title>
          <p className="text-ui text-fg-muted">{copy.description}</p>
        </header>
        {groups.map((group) => (
          <section
            key={group.id}
            aria-labelledby={`${titleId}-${group.id}`}
            className="grid gap-x-10 gap-y-5 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y) @2xl/settings:grid-cols-[minmax(0,--spacing(52))_minmax(0,1fr)]"
          >
            <div className="flex flex-col gap-1">
              <GroupTitle id={`${titleId}-${group.id}`} className="text-ui font-semibold text-fg">
                {group.title}
              </GroupTitle>
              {group.description && <p className="text-ui-sm text-pretty text-fg-muted">{group.description}</p>}
            </div>
            <div className="@container/fields flex min-w-0 flex-col gap-6">
              {group.fields.map((field) => (
                <SettingRow key={field.name} field={field} saved={saved[field.name]} copy={copy} plural={plural} runCheck={runCheck} />
              ))}
            </div>
          </section>
        ))}
        <SaveBar
          mode={mode}
          count={changed.length}
          discardedCount={discarded?.names.length ?? 0}
          saved={everSaved}
          failure={failure}
          nudges={nudges}
          plural={plural}
          copy={copy}
          saveRef={saveRef}
          onDiscard={discard}
          onUndo={undo}
          onStay={() => {
            setNudges(0)
            release()
          }}
        />
      </Form>
    </article>
  )

  const view = embedded ? (
    card
  ) : (
    <main {...rest} className={cn('grid min-h-dvh w-full place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { SettingsForm, DEFAULT_COPY as SETTINGS_FORM_COPY }
export type { SettingsField, SettingsFormCopy, SettingsFormProps, SettingsGroup, SettingsOption, SettingsSaveError, SettingsValue, SettingsValues }
