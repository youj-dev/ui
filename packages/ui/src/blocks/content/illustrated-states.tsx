'use client'

import { useId, type ComponentProps, type ComponentType } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { Reveal, Stagger } from '@youj/motion'
import { DotGrid, Illustration, type IllustrationSlot } from '@youj/illustrations'
import {
  ArrowRightIcon,
  ExternalLinkIcon,
  HomeIcon,
  MailIcon,
  PlusIcon,
  ReceiptIcon,
  RefreshIcon,
  SearchIcon,
  UploadIcon,
} from '@youj/icons'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { cn } from '../../lib/utils'
import { COPY, SCENES, wait, type IllustratedStateKind, type StateCopy } from './illustrated-states/data'
import { StateDetail } from './illustrated-states/details'

/* The full pages an app needs between its real ones: a welcome for someone
 * new, an empty workspace, a 404, a maintenance window, a finished payment
 * and offline. One composition for all six, so they read as one family: a
 * scene from the illustrations on a field of drafting dots, the kind of
 * page in mono capitals, a plain title and sentence, two actions, and one
 * panel that makes the state specific (first steps, templates, where to go
 * instead, the window, the receipt, the connection).
 * Pick one with `state`. The scene assembles as the page opens and the words
 * rise in after it on a stagger; changing `state` plays it again. Offline's
 * Try again runs through Button's onAction (checking, then connected or
 * still offline) and its panel follows the browser's own online state.
 * Reduced motion: the scene is finished and still, and the words are there. */

type Icon = ComponentType<{ size?: number }>

const ICONS: Record<IllustratedStateKind, [primary: Icon, secondary: Icon | null, trailing: boolean]> = {
  welcome: [ArrowRightIcon, null, true],
  empty: [PlusIcon, UploadIcon, false],
  'not-found': [HomeIcon, SearchIcon, false],
  maintenance: [ExternalLinkIcon, MailIcon, true],
  success: [ArrowRightIcon, ReceiptIcon, true],
  offline: [RefreshIcon, null, false],
}

/** Offline's default retry: a short check, then whatever the browser says. */
const checkConnection = () =>
  // lint-blocks-allow: a real check of navigator.onLine, paced so Try again reads as a check
  wait(900).then(() => {
    if (!navigator.onLine) throw new Error('Still offline')
  })

interface IllustratedStateProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Which page. Default 'welcome'. */
  state?: IllustratedStateKind
  /** The picture: a scene from the illustrations by id, your own node, or `null` for none. Default: a scene that fits the state. */
  illustration?: IllustrationSlot
  /** Any of the state's strings, to rewrite or translate. */
  copy?: Partial<StateCopy>
  /** The main action. Offline runs it as Try again: resolve when connected, reject when not. Default: offline checks the browser; the rest do nothing. */
  onPrimary?: () => unknown
  onSecondary?: () => void
  /** Empty workspace: a template was picked. */
  onTemplate?: (name: string) => void
  /** 404: the address that missed. Default: a sample path. */
  path?: string
  /** Wraps the page in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page height around it. Default false. */
  embedded?: boolean
}

function IllustratedState({
  state = 'welcome',
  illustration,
  copy: copyProp,
  onPrimary,
  onSecondary,
  onTemplate,
  path,
  theme,
  embedded = false,
  className,
  ...rest
}: IllustratedStateProps) {
  const copy = { ...COPY[state], ...copyProp }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const [Primary, Secondary, trailing] = ICONS[state]
  const primaryIcon = <Primary size={16} />

  const content = (
    // Keyed by state, so a new state assembles and rises in from the start.
    <div key={state} className="flex w-full max-w-lg flex-col items-center gap-8 text-center">
      {illustration !== null && (
        <div data-slot="state-illustration" className="relative isolate flex w-full justify-center py-2">
          <DotGrid gap={18} />
          <Illustration scene={illustration} fallback={SCENES[state]} unit={20} className="max-w-full" />
        </div>
      )}

      <Stagger inView={false} variant="rise" delay={3} className="flex flex-col items-center gap-4">
        <span className="font-mono text-ui-xs uppercase tracking-[0.14em] text-fg-muted">{copy.eyebrow}</span>
        <Title id={titleId} className="text-balance text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          {copy.title}
        </Title>
        <p className="max-w-md text-pretty text-ui-lg text-fg-muted">{copy.body}</p>
        <div className="mt-2 flex w-full flex-wrap justify-center gap-3 max-sm:flex-col">
          {state === 'offline' ? (
            <AsyncButton
              size="lg"
              onAction={onPrimary ?? checkConnection}
              pendingLabel="Checking…"
              successLabel="Connected"
              errorLabel="Still offline"
            >
              {primaryIcon} {copy.primary}
            </AsyncButton>
          ) : (
            <Button size="lg" onClick={() => onPrimary?.()}>
              {!trailing && primaryIcon}
              {copy.primary}
              {trailing && primaryIcon}
            </Button>
          )}
          <Button size="lg" variant="outline" onClick={onSecondary}>
            {Secondary && <Secondary size={16} />}
            {copy.secondary}
          </Button>
        </div>
      </Stagger>

      <Reveal inView={false} delay={8} className={cn('flex w-full justify-center', state !== 'empty' && 'max-w-md')}>
        <StateDetail state={state} path={path} onTemplate={onTemplate} />
      </Reveal>
    </div>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('flex w-full justify-center px-4 py-12 text-fg', className)}>
      {content}
    </section>
  ) : (
    <main
      aria-labelledby={titleId}
      {...rest}
      className={cn('flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-14 text-fg sm:py-20', className)}
    >
      {content}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { IllustratedState, type IllustratedStateProps, type IllustratedStateKind }
export type { StateCopy } from './illustrated-states/data'
