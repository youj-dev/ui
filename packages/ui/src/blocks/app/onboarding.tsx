'use client'

import { useState, type ComponentProps, type ElementType, type ReactNode } from 'react'
import { presetById, ThemeScope, themes, useTheme } from '@youj/core'
import { PresenceItem, PresenceList } from '@youj/motion'
import { DotGrid, Illustration, type IllustrationSlot } from '@youj/illustrations'
import { CheckCircleIcon, RocketIcon, SparklesIcon, UserPlusIcon, XIcon } from '@youj/icons'
import { Button, buttonVariants } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardContent } from '../../components/ui/card'
import { EmptyMedia } from '../../components/ui/empty'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '../../components/ui/input-group'
import { RadioGroup } from '../../components/ui/radio-group'
import { Stepper } from '../../components/ui/stepper'
import { cn } from '../../lib/utils'
import { DEFAULT_COPY, demo, slug, type OnboardingCopy, type OnboardingSetup } from './onboarding/data'
import { StepHeading, ThemeCard } from './onboarding/parts'

/* First run, in four steps under a Stepper: a welcome (over an isometric
 * scene of a team round a table, or any illustration by id), naming the
 * workspace, choosing a theme preset (each choice card previews itself in its
 * own theme, and the whole page re-themes as you pick), and inviting
 * teammates (added addresses fade into the list and out of it). Each step
 * arrives with a short rise on the base token; focus moves to its heading so
 * the change is heard. Finishing runs through Button's onAction and lands on
 * "You're all set". Reduced motion: steps swap instantly and the scene is
 * still. Name your product with `brand`, take the setup in `onFinish`, send
 * people on with `dashboardHref`; every string is in `copy`. It is built for
 * the compact layout density (ui.css), taken from the page. */

const BRAND = { name: 'Northwind' }

interface OnboardingProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Creates the workspace from the answers; resolve to show "You're all set", throw to show why it failed. Default: a demo wait. */
  onFinish?: (setup: OnboardingSetup) => unknown
  /** The welcome step's picture: a scene from the illustrations by id, your own node, or `null` for the sparkles icon. Default 'team'. */
  illustration?: IllustrationSlot
  /** The product the welcome names. Default: Northwind. */
  brand?: { name: string; logo?: ReactNode }
  /** Answers filled in at the start, e.g. the company name from sign-up. */
  defaultValues?: Partial<OnboardingSetup>
  /** The theme presets to choose from, by id. Default: every preset. */
  presets?: string[]
  /** The open step (0–3), controlled. Pair it with `onStepChange`. */
  step?: number
  /** The step open at first, uncontrolled. Default 0. */
  defaultStep?: number
  /** Called with the step a Back, Get started or Continue moves to. */
  onStepChange?: (step: number) => void
  /** Where "Open your dashboard" goes; without it the button calls `onOpenDashboard`. */
  dashboardHref?: string
  /** Called from "Open your dashboard". */
  onOpenDashboard?: () => void
  /** Renders the dashboard link, e.g. Next.js `Link`. Default 'a'. */
  linkComponent?: ElementType
  /** The page title's level (visually hidden); step titles sit one below. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the flow's strings, to rewrite or translate. */
  copy?: Partial<OnboardingCopy>
}

function Onboarding({
  onFinish = () => demo('Onboarding: onFinish', 1200),
  illustration,
  brand = BRAND,
  defaultValues,
  presets = themes.map((t) => t.id),
  step: stepProp,
  defaultStep = 0,
  onStepChange,
  dashboardHref,
  onOpenDashboard,
  linkComponent: Link = 'a',
  headingLevel = 1,
  copy: copyProp,
  className,
  ...rest
}: OnboardingProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const Title = `h${headingLevel}` as const
  const stepLevel = (headingLevel + 1) as 2 | 3 | 4
  const steps = [
    { id: 'welcome', title: copy.stepWelcome },
    { id: 'workspace', title: copy.stepWorkspace },
    { id: 'theme', title: copy.stepTheme },
    { id: 'invite', title: copy.stepInvite, optional: true },
  ]
  const inherited = useTheme()
  const [ownStep, setOwnStep] = useState(defaultStep)
  const step = stepProp ?? ownStep
  const setStep = (next: number) => {
    setOwnStep(next)
    onStepChange?.(next)
  }
  const [done, setDone] = useState(false)
  const [failure, setFailure] = useState<string>()
  const [name, setName] = useState(defaultValues?.name ?? '')
  const [nameError, setNameError] = useState<string>()
  // The app's own theme until a preset is picked here, so a re-themed page re-themes the wizard too.
  const [picked, setTheme] = useState<string | undefined>(defaultValues?.theme)
  const chosen = picked ?? inherited.id
  const [invites, setInvites] = useState<string[]>(defaultValues?.invites ?? [])
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string>()

  const next = () => {
    if (step === 1 && !name.trim()) {
      setNameError(copy.nameRequired)
      return
    }
    setStep(step + 1)
  }
  const addInvite = () => {
    const value = email.trim()
    if (!/^\S+@\S+\.\S+$/.test(value)) return setEmailError(copy.emailInvalid)
    if (invites.includes(value)) return setEmailError(copy.emailTaken)
    setInvites((list) => [...list, value])
    setEmail('')
  }

  return (
    <ThemeScope theme={picked ? presetById(picked) : undefined}>
      <div {...rest} className={cn('relative isolate flex min-h-dvh flex-col items-center bg-canvas px-4 py-8 md:py-14', className)}>
        <div className="flex w-full max-w-xl flex-col gap-8">
          <Title className="sr-only">{copy.page}</Title>
          <Stepper aria-label={copy.stepper} steps={steps} current={done ? steps.length : step} compact />
          <Card className="shadow-md">
            <CardContent>
              {/* Keyed by step: each one mounts fresh and rises in. */}
              <main
                key={done ? 'done' : step}
                className="flex flex-col gap-6 transition-[opacity,translate] yj-duration-base ease-enter starting:translate-y-1.5 starting:opacity-0"
              >
                {done ? (
                  <div className="flex flex-col items-center gap-5 py-4 text-center">
                    <EmptyMedia variant="icon" className="mb-0 size-16">
                      <CheckCircleIcon trigger="mount" size={28} strokeWidth={1.5} className="size-7 text-success" />
                    </EmptyMedia>
                    <StepHeading level={stepLevel} title={copy.doneTitle} description={copy.doneDescription(name.trim(), invites.length)} />
                    {dashboardHref ? (
                      <Link href={dashboardHref} onClick={onOpenDashboard} className={buttonVariants({ size: 'lg' })}>
                        <RocketIcon size={16} /> {copy.openDashboard}
                      </Link>
                    ) : (
                      <Button size="lg" onClick={onOpenDashboard}>
                        <RocketIcon size={16} /> {copy.openDashboard}
                      </Button>
                    )}
                  </div>
                ) : step === 0 ? (
                  <>
                    {illustration === null ? (
                      <EmptyMedia variant="icon" className="mb-0">
                        <SparklesIcon trigger="mount" size={20} className="size-5" />
                      </EmptyMedia>
                    ) : (
                      <div data-slot="onboarding-illustration" className="relative isolate grid place-items-center overflow-hidden rounded-lg bg-transparent px-2 py-1">
                        <DotGrid gap={16} />
                        <Illustration scene={illustration} fallback="team" unit={21} />
                      </div>
                    )}
                    <StepHeading level={stepLevel} title={copy.welcomeTitle(brand.name)} description={copy.welcomeDescription} />
                  </>
                ) : step === 1 ? (
                  <>
                    <StepHeading level={stepLevel} title={copy.nameTitle} description={copy.nameDescription} />
                    <FieldGroup className="gap-5">
                      <Field invalid={!!nameError} required>
                        <FieldLabel>{copy.nameLabel}</FieldLabel>
                        <Input
                          value={name}
                          placeholder={copy.namePlaceholder}
                          onChange={(event) => {
                            setName(event.target.value)
                            setNameError(undefined)
                          }}
                          onKeyDown={(event) => event.key === 'Enter' && next()}
                        />
                        <FieldError>{nameError}</FieldError>
                      </Field>
                      <Field>
                        <FieldLabel>{copy.url}</FieldLabel>
                        <InputGroup>
                          <InputGroupAddon>
                            <InputGroupText>{copy.urlPrefix}</InputGroupText>
                          </InputGroupAddon>
                          <InputGroupInput readOnly value={slug(name) || copy.urlFallback} />
                        </InputGroup>
                        <FieldDescription>{copy.urlDescription}</FieldDescription>
                      </Field>
                    </FieldGroup>
                  </>
                ) : step === 2 ? (
                  <>
                    <StepHeading level={stepLevel} title={copy.themeTitle} description={copy.themeDescription} />
                    <RadioGroup aria-label={copy.themeGroup} value={chosen ?? null} onValueChange={(value) => setTheme(value as string)} className="grid gap-3 sm:grid-cols-2">
                      {presets.map((id) => (
                        <ThemeCard key={id} id={id} preview={copy.themePreview} />
                      ))}
                    </RadioGroup>
                  </>
                ) : (
                  <>
                    <StepHeading level={stepLevel} title={copy.inviteTitle} description={copy.inviteDescription} />
                    <Field invalid={!!emailError}>
                      <FieldLabel>{copy.email}</FieldLabel>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          value={email}
                          placeholder={copy.emailPlaceholder}
                          onChange={(event) => {
                            setEmail(event.target.value)
                            setEmailError(undefined)
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              addInvite()
                            }
                          }}
                        />
                        <Button variant="outline" onClick={addInvite}>
                          <UserPlusIcon size={16} /> {copy.add}
                        </Button>
                      </div>
                      <FieldError>{emailError}</FieldError>
                    </Field>
                    <PresenceList aria-label={copy.invites} className="flex flex-col gap-1.5">
                      {invites.map((address) => (
                        <PresenceItem key={address} className="flex items-center gap-2 rounded-md border border-line bg-band py-1 ps-3 pe-1 text-ui">
                          <span className="min-w-0 flex-1 truncate">{address}</span>
                          <Button variant="ghost" size="icon-xs" aria-label={copy.remove(address)} onClick={() => setInvites((list) => list.filter((a) => a !== address))}>
                            <XIcon size={14} />
                          </Button>
                        </PresenceItem>
                      ))}
                    </PresenceList>
                  </>
                )}
              </main>
            </CardContent>
          </Card>
          {!done && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep(step - 1)} className={step === 0 ? 'invisible' : undefined} aria-hidden={step === 0 || undefined} tabIndex={step === 0 ? -1 : undefined}>
                {copy.back}
              </Button>
              {step < steps.length - 1 ? (
                <Button onClick={next}>{step === 0 ? copy.start : copy.continue}</Button>
              ) : (
                <AsyncButton
                  pendingLabel={copy.finishing}
                  successLabel={copy.finished}
                  onAction={async () => {
                    setFailure(undefined)
                    try {
                      await onFinish({ name: name.trim(), theme: chosen, invites })
                    } catch (failed) {
                      setFailure(failed instanceof Error && failed.message ? failed.message : copy.failed)
                      throw failed
                    }
                  }}
                  onActionStateChange={(state) => state === 'success' && setDone(true)}
                >
                  {copy.finish(invites.length)}
                </AsyncButton>
              )}
              {failure && <p className="basis-full text-end text-ui-sm text-danger-text">{failure}</p>}
            </div>
          )}
        </div>
      </div>
    </ThemeScope>
  )
}

export { Onboarding, type OnboardingProps, type OnboardingCopy, type OnboardingSetup }
