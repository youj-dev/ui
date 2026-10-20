'use client'

import { useId, useRef, useState, type ComponentProps } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Reveal, Stagger } from '@youj/motion'
import { CheckIcon, MailIcon, PhoneIcon } from '@youj/icons'
import { cn } from '../../lib/utils'
import {
  DEFAULT_COPY,
  REGIONS,
  SIZES,
  SLOTS,
  TOPICS,
  type ContactSalesCopy,
  type ContactSalesErrors,
  type ContactSalesMode,
  type ContactSalesRegion,
  type ContactSalesSlot,
  type ContactSalesStep,
  type ContactSalesValues,
} from './contact-sales/data'
import { Details } from './contact-sales/details'
import { Done } from './contact-sales/done'
import { PickTime } from './contact-sales/pick-time'
import { Stage } from './contact-sales/stage'

/* Book a sales call the way a good scheduler does, one question at a time.
 * A calm pitch on the inline start; on the end, a card that first asks when:
 * the region's person (who swaps in as the region changes, since the region
 * decides who answers and which times are on offer), a strip of days whose
 * raised key glides to the one chosen, and that day's times. Continue names
 * the time; then the card asks who, with the time pinned on top like a
 * ticket stub and three short rows of fields, and ends on a confirmation
 * that says the time in full. Writing instead is one link away and keeps
 * what was typed. Each step glides in from where the visitor is going while
 * the card's height follows, and its heading takes focus. Every field is
 * checked when the button is pressed (each problem under its field, the
 * first focused); a failed send keeps everything and raises an alert.
 * Reduced motion: the steps swap in place.
 *
 * Pass your `regions` (who answers where), `slots` (each tied to a region),
 * `sizes` and `topics`, and wire `onSubmit` (resolve for success; reject, and
 * an Error's message is shown); every string is in `copy`. */

interface ContactSalesProps extends Omit<ComponentProps<'section'>, 'children' | 'onSubmit'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** Who answers in each region. Default: the demo's Americas, Europe and Africa, and Asia Pacific. */
  regions?: ContactSalesRegion[]
  /** The times that can be booked; each is tied to a region (or open to all) and may be taken (`left: 0`). The strip shows the first seven days that have any. Default: the demo's next five working days. */
  slots?: ContactSalesSlot[]
  /** The company size choices; empty hides the control. */
  sizes?: string[]
  /** What the visitor might need; empty hides the control. */
  topics?: string[]
  /** Sends the request. Resolve for success; reject (an Error's message is shown) to keep the form and raise an alert. Default: a short demo wait. */
  onSubmit?: (values: ContactSalesValues) => Promise<unknown> | unknown
  /** Values the form starts with; `mode: 'message'` opens on writing instead. */
  defaultValues?: Partial<ContactSalesValues>
  /** Turn away personal addresses (Gmail, Outlook…). Default true. */
  requireWorkEmail?: boolean
  /** The longest message, in characters. Default 800. */
  maxMessage?: number
  /** Called when the visitor switches between booking a call and sending a message. */
  onModeChange?: (mode: ContactSalesMode) => void
  /** Called when the visitor picks a region. */
  onRegionChange?: (region: string) => void
  /** Called when the visitor picks a time. */
  onSlotChange?: (slot: ContactSalesSlot) => void
  /** The locale dates are written in. Default: the YoujProvider's. */
  locale?: string
  /** Show the email and phone under the pitch. Default true. */
  direct?: boolean
  /** The section heading's level; the card's steps sit one below. Default 2. */
  headingLevel?: 1 | 2 | 3
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<ContactSalesCopy>
}

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  // lint-blocks-allow: this is demo()'s own wait, behind the warning
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function ContactSales({
  theme,
  embedded = false,
  regions = REGIONS,
  slots = SLOTS,
  sizes = SIZES,
  topics = TOPICS,
  onSubmit = () => demo('ContactSales: onSubmit', 900),
  defaultValues,
  requireWorkEmail = true,
  maxMessage = 800,
  onModeChange,
  onRegionChange,
  onSlotChange,
  locale: localeProp,
  direct = true,
  headingLevel = 2,
  copy: copyProp,
  className,
  ...rest
}: ContactSalesProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Heading = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const StepHeading = `h${headingLevel + 1}` as 'h2' | 'h3' | 'h4'
  const initial = (): ContactSalesValues => ({
    mode: 'call',
    name: '',
    email: '',
    company: '',
    size: sizes[1] ?? sizes[0] ?? '',
    region: regions[0]?.id ?? '',
    topic: topics[0] ?? '',
    message: '',
    slot: null,
    ...defaultValues,
  })
  const [values, setValues] = useState(initial)
  const [step, setStep] = useState<ContactSalesStep>(() => (defaultValues?.mode === 'message' ? 'message' : 'time'))
  const [direction, setDirection] = useState<1 | -1>(1)
  const [slotError, setSlotError] = useState<string>()
  const [sent, setSent] = useState<ContactSalesValues | null>(null)
  const timesRef = useRef<HTMLDivElement>(null)
  const region = regions.find((r) => r.id === values.region) ?? regions[0]
  const regionSlots = slots.filter((slot) => !slot.region || slot.region === region?.id)

  const set = <K extends keyof ContactSalesValues>(key: K, value: ContactSalesValues[K]) => setValues((all) => ({ ...all, [key]: value }))
  const go = (next: ContactSalesStep, way: 1 | -1) => {
    setDirection(way)
    setStep(next)
  }
  const pickRegion = (id: string) => {
    // A time belongs to one region's team: choosing another clears it.
    setValues((all) => ({ ...all, region: id, slot: null }))
    onRegionChange?.(id)
  }
  const switchMode = (mode: ContactSalesMode) => {
    set('mode', mode)
    onModeChange?.(mode)
    go(mode === 'message' ? 'message' : 'time', mode === 'message' ? 1 : -1)
  }

  const card = (() => {
    if (step === 'done' && sent) return <Done heading={StepHeading} sent={sent} region={regions.find((r) => r.id === sent.region)} locale={locale} copy={copy} onAgain={() => {
      setSent(null)
      setValues(initial())
      go('time', -1)
    }} />
    if (step === 'time')
      return (
        <PickTime
          heading={StepHeading}
          regions={regions}
          region={region}
          slots={regionSlots}
          value={values.slot}
          onRegionChange={pickRegion}
          onSlotChange={(slot) => {
            set('slot', slot)
            setSlotError(undefined)
            onSlotChange?.(slot)
          }}
          onContinue={() => {
            if (values.slot) return go('details', 1)
            setSlotError(copy.slotMissing)
            timesRef.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus()
          }}
          onMessage={() => switchMode('message')}
          error={slotError}
          timesRef={timesRef}
          locale={locale}
          copy={copy}
        />
      )
    return (
      <Details
        heading={StepHeading}
        mode={step === 'message' ? 'message' : 'call'}
        values={values}
        set={set}
        regions={regions}
        region={region}
        onRegionChange={pickRegion}
        sizes={sizes}
        topics={topics}
        requireWorkEmail={requireWorkEmail}
        maxMessage={maxMessage}
        locale={locale}
        copy={copy}
        onSend={async (ready) => {
          await onSubmit(ready)
          setSent(ready)
          go('done', 1)
        }}
        onChangeTime={() => go('time', -1)}
        onCall={() => switchMode('call')}
      />
    )
  })()

  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('relative isolate overflow-hidden text-fg', !embedded && 'bg-canvas px-4 py-20 sm:px-6 md:py-28', className)}>
      <div className={cn('grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,--spacing(112))] lg:gap-20', !embedded && 'mx-auto max-w-6xl')}>
        <Stagger variant="rise" className="flex flex-col items-start gap-6 lg:sticky lg:top-8 lg:pt-4">
          <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>
          <Heading id={titleId} className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            {copy.title}
          </Heading>
          <p className="max-w-lg text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
          <ul className="flex flex-col gap-3">
            {copy.proof.map((line) => (
              <li key={line} className="flex items-center gap-3 text-ui text-fg">
                <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-subtle text-accent-text">
                  <CheckIcon size={14} strokeWidth={2.25} />
                </span>
                {line}
              </li>
            ))}
          </ul>
          {direct && (
            <div className="mt-2 flex flex-col gap-2 text-ui">
              <p className="font-medium text-fg">{copy.directTitle}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <a href={`mailto:${copy.directEmail}`} className="inline-flex items-center gap-2 rounded-sm text-fg-muted hover:text-fg focus-ring">
                  <MailIcon size={15} aria-hidden />
                  {copy.directEmail}
                </a>
                <a href={`tel:${copy.directPhone.replace(/[^+\d]/g, '')}`} className="inline-flex items-center gap-2 rounded-sm text-fg-muted hover:text-fg focus-ring">
                  <PhoneIcon size={15} aria-hidden />
                  {copy.directPhone}
                </a>
              </div>
            </div>
          )}
        </Stagger>
        <Reveal variant="rise" delay={3} className="min-w-0">
          {/* At least the tallest step's height at 100% (writing a message): picking a time, continuing or switching to a message never resizes the section; an error grows it. */}
          <div data-slot="contact-sales-card" className="min-h-168 rounded-2xl border border-line bg-surface p-5 shadow-md sm:p-6">
            <Stage step={step} direction={direction}>
              {card}
            </Stage>
          </div>
        </Reveal>
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { ContactSales }
export type { ContactSalesProps, ContactSalesCopy, ContactSalesRegion, ContactSalesSlot, ContactSalesValues, ContactSalesErrors, ContactSalesMode }
