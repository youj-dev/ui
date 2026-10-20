'use client'

import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { BookmarkIcon, ListChecksIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { ShareRing } from '../../components/ui/share-ring'
import { NumberInput } from '../../components/ui/number-input'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Eyebrow } from '../../components/ui/typography'
import { useAnnouncer } from '../../hooks/use-announcer'
import { numberFormat } from '../../lib/utils'
import { BASE_YIELD, DEFAULT_COPY, FACTS, FACTS_FORMAT, GATHERED, INPUTS, STEPS, UNITS, demo, type ProcedureCopy, type ProcedureFact, type ProcedureInput, type ProcedureStep, type ProcedureUnit } from './procedure/data'
import { Inputs } from './procedure/inputs'
import { ProcedureBodyPlaceholder } from './procedure/states'
import { Steps } from './procedure/steps'
import { cn } from '../../lib/utils'

/* A procedure as a bench instrument: the inputs it uses up, the steps in
 * order, and what a yield amounts to. The facts are a ShareRing: each part's
 * amount times its weight splits the ring (the demo: a dish's calories into
 * protein, carbs and fat by the energy each brings), the total in big figures
 * in the bowl, amounts and shares in the legend; point at one to single it
 * out. The yield is a stepper that rescales every quantity live (each number
 * rolls, units spelled by Intl in the locale), and the switch under it flips
 * the ring between one yield and all of it. The inputs are a checklist, the
 * steps numbered, and a step with a timer carries a pill whose small ring
 * empties as it counts down, sounds when it's done and says so. The primary
 * pill adds whatever isn't ticked to a list. The demo is a recipe; pass your
 * own inputs, units, steps and facts. Swap the demo wait with `onAddToList`.
 * Loading, an error with Retry and no inputs take the body's place at its size.
 * Reduced motion: numbers and rings are drawn in place; the timers still count.
 * It is built for the compact layout density (ui.css), taken from the page; embedded,
 * it stops at its natural width, as it does on its own, unless `fill`. */

interface ProcedureProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2` (its sections `h3`s), without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (960px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<ProcedureCopy>
  /** How its dates, times and numbers read (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** What the procedure uses up, written for `baseYield`. */
  inputs?: ProcedureInput[]
  /** How each input's unit reads and rounds. Default: grams, milliliters, tbsp, tsp and pieces. */
  units?: ProcedureUnit[]
  steps?: ProcedureStep[]
  /** The parts of one yield; the ring splits their amount × weight. Default: protein, carbs and fat per serving. */
  facts?: ProcedureFact[]
  /** Intl.NumberFormat options for each fact's amount in the legend. Default: grams. */
  factsFormat?: Intl.NumberFormatOptions
  /** Intl.NumberFormat options for the ring's total, in the bowl and in the foot. Default: whole numbers. */
  totalFormat?: Intl.NumberFormatOptions
  /** What the inputs are written for. Default 2. */
  baseYield?: number
  /** The most the yield stepper goes to. Default 12. */
  maxYield?: number
  /** Input ids ticked as gathered at first. Default: the demo's two. */
  defaultGathered?: string[]
  /** Adds the unticked inputs to a list; resolve when they're in. Default: a short demo wait. */
  onAddToList?: (items: ProcedureInput[]) => Promise<unknown> | unknown
  /** Skeletons in place of the card's body while your procedure loads. Default false. */
  loading?: boolean
  /** Shown in place of the card's body when it fails to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no inputs. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
}

interface FrameProps {
  copy: ProcedureCopy
  Title: 'h1' | 'h2'
  titleId: string
  cap: string | false
  embedded: boolean
  saved?: boolean
  onSave?: () => void
  /** The foot: the status text and the primary pill. */
  footer: ReactNode
  children: ReactNode
  /** After the foot: what is not drawn, like the live region. */
  tail?: ReactNode
}

/** The card around the body: its head and its foot, the same whether the procedure is there or not. */
function Frame({ copy, Title, titleId, cap, embedded, saved = false, onSave, footer, children, tail }: FrameProps) {
  return (
    <Card className={cn('w-full text-fg', !embedded && cap)}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.subtitle}</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label={copy.save} aria-pressed={saved} onClick={onSave}>
            <BookmarkIcon size={15} active={saved} className={saved ? 'text-accent' : undefined} />
          </Button>
        </CardAction>
      </CardHeader>
      {children}
      <CardFooter className="flex-wrap">{footer}</CardFooter>
      {tail}
    </Card>
  )
}

function Procedure({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  inputs = INPUTS,
  units = UNITS,
  steps = STEPS,
  facts = FACTS,
  factsFormat = FACTS_FORMAT,
  totalFormat,
  baseYield = BASE_YIELD,
  maxYield = 12,
  defaultGathered = GATHERED,
  onAddToList,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: ProcedureProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  // Its natural width: on the card on its own page, on the section embedded (where a className can change it).
  const cap = !fill && 'max-w-240'
  const state = loading ? 'loading' : error ? 'error' : inputs.length === 0 ? 'empty' : null
  const frame = { copy, Title, titleId, cap, embedded } as const

  // The yield and the ticks are its own state from the first paint: a card that was loading mounts again when its procedure arrives.
  const card = state ? (
    <Frame {...frame} footer={<span className="me-auto font-mono text-ui-sm text-fg-subtle">—</span>}>
      <ProcedureBodyPlaceholder state={state} copy={copy} error={error} onRetry={onRetry} empty={empty} />
    </Frame>
  ) : (
    <ProcedureCard
      {...frame}
      inputs={inputs}
      units={units}
      steps={steps}
      facts={facts}
      factsFormat={factsFormat}
      totalFormat={totalFormat}
      baseYield={baseYield}
      maxYield={maxYield}
      defaultGathered={defaultGathered}
      onAddToList={onAddToList}
    />
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', cap, className)}>
      {card}
    </section>
  ) : (
    <main
      aria-labelledby={titleId}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

type CardProps = Omit<FrameProps, 'footer' | 'children' | 'tail' | 'saved' | 'onSave'> &
  Required<Pick<ProcedureProps, 'inputs' | 'units' | 'steps' | 'facts' | 'factsFormat' | 'baseYield' | 'maxYield' | 'defaultGathered'>> &
  Pick<ProcedureProps, 'totalFormat' | 'onAddToList'>

function ProcedureCard({ inputs, units, steps, facts, factsFormat, totalFormat, baseYield, maxYield, defaultGathered, onAddToList, ...frame }: CardProps) {
  const { copy, titleId, Title } = frame
  const SectionTitle = Title === 'h2' ? 'h3' : 'h2'
  const { announce, announcer } = useAnnouncer()
  const [amount, setAmount] = useState(baseYield)
  const [basis, setBasis] = useState<'unit' | 'whole'>('unit')
  const [gathered, setGathered] = useState<Set<string>>(() => new Set(defaultGathered))
  const [saved, setSaved] = useState(false)

  const times = basis === 'whole' ? amount : 1
  const parts = facts.map((f) => ({ id: f.id, label: f.label, value: f.amount * (f.weight ?? 1) * times, amount: f.amount * times }))
  const total = parts.reduce((sum, p) => sum + p.value, 0)
  const missing = inputs.filter((i) => !gathered.has(i.id))
  const num = numberFormat(copy.locale)
  const totalText = numberFormat(copy.locale, totalFormat ?? { maximumFractionDigits: 0 }).format(totalFormat ? total : Math.round(total))
  const figures = [
    { label: copy.prep, value: num.format(copy.prepTime), unit: copy.minutes },
    { label: copy.cook, value: num.format(copy.cookTime), unit: copy.minutes },
    { label: copy.level, value: copy.levelValue },
  ]

  return (
    <Frame
      {...frame}
      saved={saved}
      onSave={() => setSaved((s) => !s)}
      tail={announcer}
      footer={
        <>
          <span className="me-auto font-mono text-ui-sm text-fg-muted tabular-nums">
            {copy.status(amount)} · {(basis === 'whole' ? copy.totalWhole : copy.totalPerUnit)(`${totalText} ${copy.factsUnit}`)}
          </span>
          <AsyncButton
            disabled={!missing.length}
            pendingLabel={copy.adding}
            successLabel={copy.added}
            onAction={async () => {
              await (onAddToList ? onAddToList(missing) : demo('Procedure: onAddToList', 900))
              announce(copy.addedAnnounce(missing.length))
            }}
          >
            <ListChecksIcon size={14} />
            {copy.addToList(missing.length)}
          </AsyncButton>
        </>
      }
    >
      <CardContent className="grid gap-8 md:grid-cols-[minmax(0,1fr)_--spacing(68)] md:items-center">
        <ShareRing size="default" segments={parts} unit={copy.factsUnit} format={totalFormat} amountFormat={factsFormat} locale={copy.locale} aria-label={copy.facts} />
        <div className="flex flex-col gap-5">
          <dl className="grid grid-cols-3 gap-3">
            {figures.map((f) => (
              <div key={f.label} className="flex min-w-0 flex-col gap-1">
                <Eyebrow render={<dt />}>{f.label}</Eyebrow>
                <dd className="truncate font-mono text-ui-lg font-medium text-fg tabular-nums [unicode-bidi:plaintext]">
                  {f.value}
                  {f.unit && <span className="text-[0.8em] text-fg-muted">{' '}{f.unit}</span>}
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-2">
            <Eyebrow render={<label htmlFor={`${titleId}-yield`} />}>{copy.yield}</Eyebrow>
            <NumberInput id={`${titleId}-yield`} value={amount} min={1} max={maxYield} onValueChange={(v) => setAmount(v ?? 1)} locale={copy.locale} />
          </div>
          <SegmentedControl aria-label={copy.showing} value={basis} onValueChange={(v) => setBasis(v as 'unit' | 'whole')} className="w-full *:flex-1">
            <SegmentedControlItem value="unit">{copy.perUnit}</SegmentedControlItem>
            <SegmentedControlItem value="whole">{copy.whole}</SegmentedControlItem>
          </SegmentedControl>
        </div>
      </CardContent>

      <CardContent className="grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-10">
        <Inputs
          inputs={inputs}
          units={units}
          factor={amount / baseYield}
          gathered={gathered}
          onToggle={(id, on) =>
            setGathered((set) => {
              const next = new Set(set)
              if (on) next.add(id)
              else next.delete(id)
              return next
            })
          }
          copy={copy}
          SectionTitle={SectionTitle}
          titleId={`${titleId}-inputs`}
        />
        <Steps steps={steps} copy={copy} SectionTitle={SectionTitle} titleId={`${titleId}-steps`} announce={announce} />
      </CardContent>
    </Frame>
  )
}

export { Procedure, type ProcedureProps }
export type { ProcedureCopy, ProcedureFact, ProcedureInput, ProcedureStep, ProcedureUnit }
