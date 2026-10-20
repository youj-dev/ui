'use client'

import { type ComponentProps, useId, useMemo, useState } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { ArrowRightIcon, CheckCircleIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { EmptyMedia } from '../../components/ui/empty'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet, FieldTitle } from '../../components/ui/field'
import { GradientSlider } from '../../components/ui/gradient-slider'
import { Input } from '../../components/ui/input'
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'
import { Wizard, WizardStep } from '../../components/ui/wizard'
import { cn, numberFormat } from '../../lib/utils'
import { ConfigPreview } from './setup-stepper/config-preview'
import {
  AUDIENCES,
  CHOICES,
  DEFAULT_COPY,
  OPTIONS,
  SCALE,
  TEMPLATE,
  handleOf,
  toLines,
  validName,
  demo,
  type SetupStepperAudience,
  type SetupStepperChoice,
  type SetupStepperConfig,
  type SetupStepperCopy,
  type SetupStepperOption,
  type SetupStepperScale,
} from './setup-stepper/data'
import { OptionChips } from './setup-stepper/option-chips'

/* Setting something up, three steps in a Wizard with the Stepper on top,
 * opening on the middle one (the demo sets up an AI assistant): a first step
 * of free text (the instructions it reads first), a second of settings (a
 * name that becomes its @handle, a choice in a Select with each one's hint
 * and size, a scale on a GradientSlider whose zones name the stretch the
 * value sits in, and options as pills you switch on), then who gets access.
 * The step titles, labels, choices, options, scale and audiences are all
 * yours: pass `scale={null}` to leave the slider out. Beside the form, the
 * config it will save, as TOML in a code well that rebuilds as you type: a
 * `~` in the gutter on every line that differs from where it started
 * (`initial`), and a brief accent wash on a line as its value changes. On a phone the config follows the form. Swap `onCreate` for
 * your API. It is built for the compact layout density (ui.css), taken from the page;
 * embedded, it keeps its natural width unless `fill`. Reduced motion: steps swap
 * in place, lines don't wash. */

interface SetupStepperProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the page in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around it. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (1152px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the flow's strings, to rewrite or translate. */
  copy?: Partial<SetupStepperCopy>
  /** Where the form starts, and what the config's `~` marks are measured against. Default: the template, a release-notes writer. */
  initial?: SetupStepperConfig
  /** What the select offers, in order. Default: three models. */
  choices?: SetupStepperChoice[]
  /** The pills you switch on. Default: five tools. */
  options?: SetupStepperOption[]
  /** The slider's range and zones; `null` leaves it out. Default: creativity from 0 to 1.5. */
  scale?: SetupStepperScale | null
  /** The radios of the last step. Default: only me, my team, everyone. */
  audiences?: SetupStepperAudience[]
  /** The step it opens on, from 0. Default 1, Behavior. */
  step?: number
  /** Creates it from the config; resolve when it exists. Reject to stay on the last step. */
  onCreate?: (config: SetupStepperConfig) => Promise<unknown> | unknown
  /** "Start a conversation" on the done state. */
  onOpen?: (config: SetupStepperConfig) => void
  /** Formats its numbers and dates (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
}

function SetupStepper({ theme, embedded = true, fill = false, copy: copyProp, initial = TEMPLATE, choices = CHOICES, options = OPTIONS, scale = SCALE, audiences = AUDIENCES, step: startStep = 1, onCreate, onOpen, locale, className, ...rest }: SetupStepperProps) {
  const lang = useLocale(locale ?? copyProp?.locale)
  const copy = useMemo(() => ({ ...DEFAULT_COPY, ...copyProp, locale: lang }), [copyProp, lang])
  const titleId = useId()
  const optionsId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const [step, setStep] = useState(startStep)
  const [config, setConfig] = useState(initial)
  const [tried, setTried] = useState<Record<string, boolean>>({})
  const [done, setDone] = useState<SetupStepperConfig>()
  const set = <K extends keyof SetupStepperConfig>(key: K, value: SetupStepperConfig[K]) => setConfig((c) => ({ ...c, [key]: value }))

  const zone = scale ? (scale.zones.find((z) => z.to === undefined || config.level <= z.to)?.label ?? '') : undefined
  const lines = useMemo(() => toLines(config, initial, copy, options, zone, scale?.decimals), [config, initial, copy, options, zone, scale?.decimals])
  const choice = choices.find((c) => c.value === config.choice)
  const compact = numberFormat(copy.locale, { notation: 'compact' })
  const nameError = tried.settings && !validName(config.name) ? copy.nameRequired : undefined
  const descriptionError = tried.details && !config.description.trim() ? copy.descriptionRequired : undefined

  const wizard = done ? (
    <Reveal inView={false} variant="rise" className="flex flex-1 flex-col items-center justify-center gap-5 py-6 text-center">
      <EmptyMedia variant="icon" className="mb-0 size-16">
        <CheckCircleIcon trigger="mount" size={28} strokeWidth={1.5} className="size-7 text-success" />
      </EmptyMedia>
      <div className="flex flex-col gap-1.5">
        <p className="text-xl font-semibold tracking-tight text-fg">{copy.doneTitle(handleOf(done.name))}</p>
        <p className="text-ui text-pretty text-fg-muted">{copy.doneDescription}</p>
      </div>
      <Button onClick={() => onOpen?.(done)}>
        {copy.open} <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
      </Button>
    </Reveal>
  ) : (
    <Wizard
      headingLevel={embedded ? 3 : 2}
      step={step}
      onStepChange={setStep}
      backLabel={copy.back}
      nextLabel={copy.next}
      finishLabel={copy.create}
      finishSuccessLabel={copy.created}
      onComplete={async () => {
        await (onCreate ? onCreate(config) : demo('SetupStepper: onCreate', 900))
        setDone(config)
      }}
    >
      <WizardStep
        id="details"
        title={copy.stepDetails}
        description={copy.stepDetailsDescription}
        validate={() => {
          setTried((t) => ({ ...t, details: true }))
          return !!config.description.trim()
        }}
      >
        <Field invalid={!!descriptionError} required>
          <FieldLabel>{copy.description}</FieldLabel>
          <Textarea value={config.description} rows={4} onChange={(event) => set('description', event.target.value)} />
          <FieldError>{descriptionError}</FieldError>
        </Field>
      </WizardStep>

      <WizardStep
        id="settings"
        title={copy.stepSettings}
        description={copy.stepSettingsDescription}
        validate={() => {
          setTried((t) => ({ ...t, settings: true }))
          return validName(config.name)
        }}
      >
        <FieldGroup className="gap-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field invalid={!!nameError} required>
              <FieldLabel>{copy.name}</FieldLabel>
              <Input value={config.name} placeholder={copy.namePlaceholder} autoComplete="off" spellCheck={false} maxLength={32} onChange={(event) => set('name', event.target.value)} />
              {nameError ? <FieldError>{nameError}</FieldError> : <FieldDescription className="font-mono">{copy.nameHint(handleOf(config.name))}</FieldDescription>}
            </Field>
            <Field>
              <FieldLabel>{copy.choice}</FieldLabel>
              <Select items={choices} value={config.choice} onValueChange={(next) => next && set('choice', next as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {choices.map((mo) => (
                    <SelectItem key={mo.value} value={mo.value}>
                      <span className="flex min-w-0 items-baseline gap-2">
                        {mo.label}
                        <span className="truncate text-ui-sm text-fg-muted">{mo.hint}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {choice && <FieldDescription className="font-mono">{choice.measure === undefined ? choice.hint : `${choice.hint} · ${copy.measure(compact.format(choice.measure))}`}</FieldDescription>}
            </Field>
          </div>
          {scale && (
            <GradientSlider
              label={copy.scale}
              value={config.level}
              onValueChange={(v) => set('level', v)}
              min={scale.min}
              max={scale.max}
              step={scale.step}
              ticks={scale.ticks}
              format={{ minimumFractionDigits: scale.decimals ?? 2, maximumFractionDigits: scale.decimals ?? 2 }}
              zones={scale.zones}
              locale={copy.locale}
            />
          )}
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <span id={optionsId} data-slot="eyebrow" className="text-ui font-medium text-fg">
                {copy.options}
              </span>
              <span className="font-mono text-ui-sm text-fg-muted tabular-nums">{copy.optionsCount(config.options.length)}</span>
            </div>
            <OptionChips options={options} value={config.options} onValueChange={(v) => set('options', v)} labelledBy={optionsId} />
          </div>
        </FieldGroup>
      </WizardStep>

      <WizardStep id="access" title={copy.stepAccess} description={copy.stepAccessDescription}>
        <FieldSet>
          <FieldLegend variant="label">{copy.audience}</FieldLegend>
          <RadioGroup value={config.audience} onValueChange={(v) => set('audience', v as string)}>
            {audiences.map((a) => (
              <FieldLabel key={a.value}>
                <Field orientation="horizontal">
                  <RadioGroupItem value={a.value} />
                  <FieldTitle>{a.label}</FieldTitle>
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </FieldSet>
      </WizardStep>
    </Wizard>
  )

  const body = (
    <div className={cn('grid w-full gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(--spacing(80),--spacing(104))] lg:items-start', !embedded && !fill && 'max-w-6xl')}>
      {/* At least the tallest step's height (Behavior, at an app's size), the buttons held at its foot: stepping never jumps; an error grows the card. */}
      <Card className="min-h-129.5 min-w-0">
        <CardContent className="flex flex-1 flex-col py-(--ui--panel-y) [&_[data-slot=wizard-footer]]:mt-auto [&_[data-slot=wizard]]:flex-1">
          {wizard}
        </CardContent>
      </Card>
      <ConfigPreview lines={lines} copy={copy} Heading={embedded ? 'h3' : 'h2'} titleId={`${titleId}-config`} className="lg:sticky lg:top-6" />
    </div>
  )

  const head = (
    <div className={cn('flex w-full flex-col gap-1.5', !embedded && !fill && 'max-w-6xl')}>
      <span className="font-mono text-ui-sm text-fg-muted">{copy.brand}</span>
      <Title id={titleId} className="text-2xl font-semibold tracking-tight text-balance text-fg">
        {copy.title}
      </Title>
      <p className="max-w-2xl text-ui text-pretty text-fg-muted">{copy.subtitle}</p>
    </div>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('flex w-full flex-col gap-5', !fill && 'max-w-6xl', className)}>
      {head}
      {body}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('flex min-h-dvh flex-col items-center gap-6 bg-canvas px-4 py-8 text-fg md:py-12', className)}>
      {head}
      {body}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { SetupStepper, type SetupStepperProps }
export type { SetupStepperAudience, SetupStepperChoice, SetupStepperConfig, SetupStepperCopy, SetupStepperOption, SetupStepperScale }
