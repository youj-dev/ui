'use client'

import { useEffect, useState, type ComponentProps } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { ArrowRightIcon, CheckCircleIcon } from '@youj/icons'
import { AvatarUpload } from '../../components/ui/avatar-upload'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardContent } from '../../components/ui/card'
import { EmptyMedia } from '../../components/ui/empty'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { TagInput } from '../../components/ui/tag-input'
import { Wizard, WizardStep } from '../../components/ui/wizard'
import { cn } from '../../lib/utils'
import { DEFAULT_COPY, demo, demoCheckSlug, initials, isEmail, toSlug, type CreateWorkspaceCopy, type CreateWorkspaceResult, type Option } from './create-workspace/data'
import { SlugField, useSlugStatus } from './create-workspace/slug-field'

/* Creating a workspace, in three short steps inside a Wizard: name it (its
 * URL follows the name until you edit it, and is checked for availability as
 * you type: a spinner, then a check or the reason it can't be used), add an
 * optional logo, say how big the team is and what it's for, then invite
 * people as email chips with a role, or skip. Steps slide in from the side
 * you're traveling to while the card's height glides; a step that doesn't
 * validate stays put and says why. Finishing lands on a done state whose check
 * draws itself. Swap `checkSlug` and `onCreate` for your API. Reduced motion:
 * steps and states swap in place. It is built for the compact layout density
 * (ui.css), taken from the page. */

interface CreateWorkspaceProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Wraps the page in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Any of the flow's strings, to rewrite or translate. */
  copy?: Partial<CreateWorkspaceCopy>
  /** Resolves true when a slug is free. Default: a demo that treats a few names (acme, admin, api…) as taken. */
  checkSlug?: (slug: string) => Promise<boolean>
  /** Creates the workspace (and sends invites). Reject to stay on the step. */
  onCreate?: (workspace: CreateWorkspaceResult) => unknown
  /** "Open workspace" on the done state. */
  onOpen?: (workspace: CreateWorkspaceResult) => void
}

function Choice({ label, placeholder, options, value, onChange, error }: { label: string; placeholder: string; options: Option[]; value: string; onChange: (value: string) => void; error?: string }) {
  return (
    <Field invalid={!!error} required>
      <FieldLabel>{label}</FieldLabel>
      <Select items={options} value={value || null} onValueChange={(next) => onChange(next as string)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError>{error}</FieldError>
    </Field>
  )
}

function CreateWorkspace({ theme, copy: copyProp, checkSlug = demoCheckSlug, onCreate = () => demo('CreateWorkspace: onCreate', 1100), onOpen, className, ...rest }: CreateWorkspaceProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string>()
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [slugTried, setSlugTried] = useState(false)
  const [logo, setLogo] = useState<{ file: File; url: string }>()
  const [teamSize, setTeamSize] = useState('')
  const [useCase, setUseCase] = useState('')
  const [teamTried, setTeamTried] = useState(false)
  const [invites, setInvites] = useState<string[]>([])
  const [role, setRole] = useState(copy.roles[0]?.value ?? 'member')
  const [done, setDone] = useState<CreateWorkspaceResult>()
  const { status, settle } = useSlugStatus(slug, checkSlug)

  useEffect(() => () => logo && URL.revokeObjectURL(logo.url), [logo])

  const result = (withInvites: boolean): CreateWorkspaceResult => ({
    name: name.trim(),
    slug,
    logo: logo?.file,
    teamSize,
    useCase,
    invites: withInvites ? invites : [],
    role,
  })
  const finish = async (withInvites: boolean) => {
    const workspace = result(withInvites)
    await onCreate(workspace)
    setDone(workspace)
  }
  const url = `${copy.urlPrefix}${slug}`

  const content = done ? (
    <Reveal inView={false} variant="rise" className="flex flex-col items-center gap-5 py-4 text-center">
      <EmptyMedia variant="icon" className="mb-0 size-16">
        <CheckCircleIcon trigger="mount" size={28} strokeWidth={1.5} className="size-7 text-success" />
      </EmptyMedia>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-semibold tracking-tight text-balance text-fg">{copy.doneTitle(done.name)}</h2>
        <p className="text-ui text-pretty text-fg-muted">{copy.doneDescription(url, done.invites.length)}</p>
      </div>
      <Button size="lg" onClick={() => onOpen?.(done)}>
        {copy.open} <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
      </Button>
    </Reveal>
  ) : (
    <Wizard
      headingLevel={2}
      step={step}
      onStepChange={setStep}
      backLabel={copy.back}
      nextLabel={copy.next}
      finishLabel={copy.sendInvites(invites.length)}
      finishSuccessLabel={copy.created}
      onComplete={() => finish(true)}
      footerStart={
        step === 2 && (
          <AsyncButton variant="ghost" pendingLabel={copy.creating} successLabel={copy.created} onAction={() => finish(false)}>
            {copy.skip}
          </AsyncButton>
        )
      }
    >
      <WizardStep
        id="workspace"
        title={copy.stepWorkspace}
        description={copy.stepWorkspaceDescription}
        validate={async () => {
          setSlugTried(true)
          if (!name.trim()) setNameError(copy.nameRequired)
          const slugStatus = await settle()
          return !!name.trim() && slugStatus === 'available' ? true : false
        }}
      >
        <FieldGroup className="gap-5">
          <Field invalid={!!nameError} required>
            <FieldLabel>{copy.name}</FieldLabel>
            <Input
              value={name}
              placeholder={copy.namePlaceholder}
              autoComplete="organization"
              onChange={(event) => {
                setName(event.target.value)
                setNameError(undefined)
                if (!slugEdited) setSlug(toSlug(event.target.value).replace(/-+$/, ''))
              }}
            />
            <FieldError>{nameError}</FieldError>
          </Field>
          <SlugField
            slug={slug}
            status={status}
            copy={copy}
            showIdleError={slugTried}
            onChange={(next) => {
              setSlug(next)
              setSlugEdited(next !== '')
            }}
          />
          <Field>
            <FieldLabel>
              {copy.logo} <span className="font-normal text-fg-muted">{copy.logoHint}</span>
            </FieldLabel>
            <AvatarUpload
                size={56}
                src={logo?.url}
                name={name || copy.namePlaceholder}
                fallback={<span data-yj-initials={initials(name || copy.namePlaceholder)} className="text-ui-lg font-semibold before:content-[attr(data-yj-initials)]" />}
                onSave={(file) => setLogo({ file, url: URL.createObjectURL(file) })}
                onRemove={() => setLogo(undefined)}
              />
          </Field>
        </FieldGroup>
      </WizardStep>
      <WizardStep
        id="team"
        title={copy.stepTeam}
        description={copy.stepTeamDescription}
        validate={() => {
          setTeamTried(true)
          return !!teamSize && !!useCase
        }}
      >
        <FieldGroup className="gap-5">
          <Choice label={copy.teamSize} placeholder={copy.teamSizePlaceholder} options={copy.teamSizes} value={teamSize} onChange={setTeamSize} error={teamTried && !teamSize ? copy.teamSizeRequired : undefined} />
          <Choice label={copy.useCase} placeholder={copy.useCasePlaceholder} options={copy.useCases} value={useCase} onChange={setUseCase} error={teamTried && !useCase ? copy.useCaseRequired : undefined} />
        </FieldGroup>
      </WizardStep>
      <WizardStep id="invite" title={copy.stepInvite} description={copy.stepInviteDescription} validate={() => (invites.length ? true : copy.invitesRequired)}>
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel>{copy.emails}</FieldLabel>
            <TagInput
              value={invites}
              onValueChange={setInvites}
              placeholder={copy.emailsPlaceholder}
              delimiters={[',', ' ', ';']}
              addOnBlur
              validate={(tag) => (isEmail(tag) ? undefined : copy.emailInvalid(tag))}
            />
            <FieldDescription>{copy.emailsHint}</FieldDescription>
          </Field>
          <Choice label={copy.role} placeholder={copy.role} options={copy.roles} value={role} onChange={setRole} />
        </FieldGroup>
      </WizardStep>
    </Wizard>
  )

  const page = (
    <div
      {...rest}
      className={cn('relative isolate flex min-h-dvh flex-col items-center bg-canvas px-4 py-8 text-fg md:py-14', className)}
    >
      <main className="flex w-full max-w-lg flex-col gap-6">
        <div className="flex flex-col gap-4">
          <span className="inline-flex items-center gap-2 text-ui font-semibold tracking-tight">
            <span aria-hidden className="grid size-6 place-items-center rounded-sm bg-accent text-ui-xs text-on-accent">
              {copy.brand.charAt(0)}
            </span>
            {copy.brand}
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
            <p className="text-ui text-pretty text-fg-muted">{copy.subtitle}</p>
          </div>
        </div>
        <Card className="shadow-md">
          <CardContent>{content}</CardContent>
        </Card>
      </main>
    </div>
  )
  return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
}

export { CreateWorkspace, type CreateWorkspaceProps }
