'use client'

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import type { IllustrationSlot } from '@youj/illustrations'
import { SaveIcon } from '@youj/icons'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Progress, ProgressLabel, ProgressValue } from '../../components/ui/progress'
import { Wizard, WizardStep } from '../../components/ui/wizard'
import { useIsMobile } from '../../hooks/use-mobile'
import { cn } from '../../lib/utils'
import {
  ACCOUNTS,
  completeness,
  DEFAULT_COPY,
  demo,
  EMPTY,
  formatTime,
  LAPTOPS,
  makeSchemas,
  TEAMS,
  wait,
  type NewHire,
  type NewHireAccount,
  type WizardCopy,
  type Personal,
  type Role,
  type Setup,
} from './setup-wizard/data'
import { Done, Review } from './setup-wizard/review'
import { PersonalStep, RoleStep, SetupStep } from './setup-wizard/steps'

/* Onboarding a new hire, as a four-step Wizard: who they are (a PhoneInput
 * for the welcome text), their role (a DatePicker that only offers weekdays
 * from today), their accounts and laptop, then a review of it all with a way
 * back to each step. Every step is its own react-hook-form + zod Form, so
 * Continue (or Enter in a field) checks only that step: errors grow in under
 * their fields, focus lands on the first, and the Stepper marks the step. The
 * Progress bar above counts the fields a finished profile needs, and Save
 * draft keeps what's there (the line beside it says when). Sending the invite
 * lands on a success state with an illustration. Steps slide in from the side
 * you're traveling to while the card's height glides; on phones the Stepper
 * runs across the top. Reduced motion: steps swap in place and the bar jumps.
 * Pass your own `brand`, `teams`, `laptops` and `accounts`, take the hire in
 * `onSubmit` and drafts in `onSaveDraft`; every string is in `copy`.
 * It is built for the compact layout density (ui.css), taken from the page. */

const BRAND = { name: 'Northwind', logo: 'N' }

interface SetupWizardProps extends Omit<ComponentProps<'div'>, 'children' | 'onSubmit'> {
  /** Wraps the page in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A saved draft to pick up from. */
  draft?: Partial<NewHire>
  /** Keeps a draft; resolve when it's stored. Default: a short demo wait. */
  onSaveDraft?: (draft: NewHire) => Promise<unknown> | unknown
  /** Sends the invite; reject to stay on the review. Default: a short demo wait. */
  onSubmit?: (hire: NewHire) => Promise<unknown> | unknown
  /** "View profile" on the success state. */
  onViewProfile?: (hire: NewHire) => void
  /** The success state's picture: a scene by id, or your own node; `null` for none. Default: the success scene. */
  illustration?: IllustrationSlot
  /** The company in the header. Default: Northwind, with an "N" mark. */
  brand?: { name: string; logo?: ReactNode }
  /** The teams to choose from, by id. Default: the demo's six. */
  teams?: Record<string, string>
  /** The laptops to choose from, by id; `byod` reads as bringing their own. Default: Pro, Air or their own. */
  laptops?: Record<string, string>
  /** The accounts the setup step can switch on. Default: Slack, GitHub and Figma. */
  accounts?: NewHireAccount[]
  /** The earliest start date offered. Default: today, read after mount. */
  today?: Date
  /** The open step (0–3), controlled. Pair it with `onStepChange`. */
  step?: number
  /** Called with the step Continue, Back or a review edit moves to. */
  onStepChange?: (step: number) => void
  /** The page title's level; step titles sit one below. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** Formats dates and times. Default: the app's locale (YoujProvider's `locale`), else en-US. */
  locale?: string
  /** Any of the page's strings, including validation messages, to rewrite or translate. */
  copy?: Partial<WizardCopy>
}

const pick = <K extends keyof NewHire>(values: NewHire, keys: readonly K[]) => Object.fromEntries(keys.map((key) => [key, values[key]])) as Pick<NewHire, K>
const PERSONAL = ['firstName', 'lastName', 'email', 'phone'] as const
const ROLE = ['title', 'team', 'type', 'startDate'] as const
const SETUP = ['laptop', 'slack', 'github', 'figma', 'note'] as const
const STEPS = ['personal', 'role', 'setup', 'review']

const noSubscribe = () => () => {}

function SetupWizard({
  theme,
  draft,
  onSaveDraft = () => demo('SetupWizard: onSaveDraft', 700),
  onSubmit = () => demo('SetupWizard: onSubmit', 1100),
  onViewProfile,
  illustration,
  brand = BRAND,
  teams = TEAMS,
  laptops = LAPTOPS,
  accounts = ACCOUNTS,
  today: todayProp,
  step: stepProp,
  onStepChange,
  headingLevel = 1,
  locale: localeProp,
  copy: copyProp,
  className,
  ...rest
}: SetupWizardProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const Title = `h${headingLevel}` as const
  const stepLevel = (headingLevel + 1) as 2 | 3 | 4
  const titleId = useId()
  const mobile = useIsMobile()
  // Today is read after mount, so the server and the first client render agree.
  const midnight = useSyncExternalStore(
    noSubscribe,
    () => new Date().setHours(0, 0, 0, 0),
    () => null,
  )
  const clientToday = useMemo(() => (midnight === null ? undefined : new Date(midnight)), [midnight])
  const today = todayProp ?? clientToday
  // Rebuilt each render, so the messages follow `copy`.
  const schemas = makeSchemas(copy)
  const initial = { ...EMPTY, ...draft }
  const personal = useForm<Personal>({ resolver: zodResolver(schemas.personal), mode: 'onTouched', defaultValues: pick(initial, PERSONAL) })
  const role = useForm<Role>({ resolver: zodResolver(schemas.role), mode: 'onTouched', defaultValues: pick(initial, ROLE) })
  const setup = useForm<Setup>({ resolver: zodResolver(schemas.setup), mode: 'onTouched', defaultValues: pick(initial, SETUP) })
  const [ownStep, setOwnStep] = useState(0)
  const step = stepProp ?? ownStep
  const setStep = (next: number) => {
    setOwnStep(next)
    onStepChange?.(next)
  }
  const [done, setDone] = useState<NewHire | null>(null)
  const [failure, setFailure] = useState<string>()
  // Runs your callback, keeping a rejection's message beside Save draft until the next try.
  const attempt = async (action: () => unknown) => {
    setFailure(undefined)
    try {
      await action()
    } catch (failed) {
      setFailure(failed instanceof Error && failed.message ? failed.message : copy.failed)
      throw failed
    }
  }
  const [saved, setSaved] = useState<{ snapshot: string; at: Date | null } | null>(draft ? { snapshot: JSON.stringify(initial), at: null } : null)
  const main = useRef<HTMLElement>(null)

  const values = { ...useWatch({ control: personal.control }), ...useWatch({ control: role.control }), ...useWatch({ control: setup.control }) } as NewHire
  const snapshot = JSON.stringify(values)
  const dirty = snapshot !== (saved?.snapshot ?? JSON.stringify(EMPTY))
  const status = dirty
    ? saved
      ? copy.unsaved
      : copy.notSaved
    : saved?.at
      ? copy.draftSaved(formatTime(saved.at, locale))
      : saved
        ? copy.draftRestored
        : ''
  // Enter in a step's form moves on too; like Continue, it hands focus to the new step's title.
  const entered = useRef(false)
  const next = () => {
    entered.current = true
    setStep(Math.min(STEPS.length - 1, step + 1))
  }
  useEffect(() => {
    if (!entered.current) return
    entered.current = false
    main.current?.querySelector<HTMLElement>(`[id$="-${STEPS[step]}-title"]`)?.focus()
  }, [step])

  // The success state's title takes focus, so reading starts there.
  useEffect(() => {
    if (done) main.current?.querySelector<HTMLElement>('[data-done-title]')?.focus()
  }, [done])

  const startOver = () => {
    personal.reset(pick(EMPTY, PERSONAL))
    role.reset(pick(EMPTY, ROLE))
    setup.reset(pick(EMPTY, SETUP))
    setSaved(null)
    setStep(0)
    setDone(null)
  }

  const page = (
    <div {...rest} className={cn('flex min-h-dvh flex-col bg-canvas text-fg', className)}>
      <header data-yj-tone="header" className="border-b border-line bg-chrome">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center gap-3 px-4 sm:px-6">
          <span className="inline-flex items-center gap-2 text-ui font-semibold tracking-tight">
            <span aria-hidden className="grid size-6 place-items-center rounded-sm bg-accent text-ui-xs text-on-accent">
              {brand.logo}
            </span>
            {brand.name}
          </span>
          <span aria-hidden className="text-fg-subtle">
            /
          </span>
          <span className="text-ui text-fg-muted">{copy.section}</span>
        </div>
      </header>
      <main ref={main} aria-labelledby={titleId} className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
        <Card>
          <CardHeader>
            <CardTitle>
              <Title id={titleId}>{copy.title}</Title>
            </CardTitle>
            <CardDescription className="text-pretty">{copy.description}</CardDescription>
          </CardHeader>
          {done ? (
            <CardContent>
              <Done hire={done} copy={copy} locale={locale} level={stepLevel} illustration={illustration} onAnother={startOver} onView={() => onViewProfile?.(done)} />
            </CardContent>
          ) : (
            <>
              <CardContent>
                <Progress value={completeness(values)}>
                  <ProgressLabel>{copy.progress}</ProgressLabel>
                  <ProgressValue />
                </Progress>
              </CardContent>
              <CardContent>
                <Wizard
                  headingLevel={stepLevel}
                  step={step}
                  onStepChange={setStep}
                  orientation={mobile ? 'horizontal' : 'vertical'}
                  nextLabel={copy.continue}
                  finishLabel={copy.send}
                  finishSuccessLabel={copy.sent}
                  onComplete={async () => {
                    await attempt(() => onSubmit(values))
                    // lint-blocks-allow: pacing, so the sent state shows before the done view
                    await wait(400)
                    setDone(values)
                  }}
                  footerStart={
                    <div className="flex min-w-0 items-center gap-2">
                      <AsyncButton
                        variant="ghost"
                        pendingLabel={copy.saving}
                        successLabel={copy.saved}
                        onAction={async () => {
                          await attempt(() => onSaveDraft(values))
                          setSaved({ snapshot, at: new Date() })
                        }}
                      >
                        <SaveIcon size={15} />
                        {copy.saveDraft}
                      </AsyncButton>
                      <span aria-live="polite" data-slot="draft-status" className={cn('truncate text-ui-sm max-sm:sr-only', failure ? 'text-danger-text' : 'text-fg-muted')}>
                        {failure ?? status}
                      </span>
                    </div>
                  }
                >
                  <WizardStep id={STEPS[0]!} title={copy.personalTitle} description={copy.personalDescription} validate={() => personal.trigger(undefined, { shouldFocus: true })}>
                    <PersonalStep form={personal} onNext={next} copy={copy} />
                  </WizardStep>
                  <WizardStep id={STEPS[1]!} title={copy.roleTitle} description={copy.roleDescription} validate={() => role.trigger(undefined, { shouldFocus: true })}>
                    <RoleStep form={role} onNext={next} today={today} copy={copy} teams={teams} />
                  </WizardStep>
                  <WizardStep id={STEPS[2]!} title={copy.setupTitle} description={copy.setupDescription} validate={() => setup.trigger(undefined, { shouldFocus: true })}>
                    <SetupStep form={setup} onNext={next} copy={copy} laptops={laptops} accounts={accounts} />
                  </WizardStep>
                  <WizardStep id={STEPS[3]!} title={copy.reviewTitle} description={copy.reviewDescription}>
                    <Review hire={values} onEdit={setStep} copy={copy} teams={teams} laptops={laptops} accounts={accounts} locale={locale} />
                  </WizardStep>
                </Wizard>
              </CardContent>
            </>
          )}
        </Card>
      </main>
    </div>
  )
  return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
}

export { SetupWizard, type SetupWizardProps, type WizardCopy as SetupWizardCopy, type NewHire, type NewHireAccount }
