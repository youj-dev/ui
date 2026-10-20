'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Label,
  Textarea,
  Wizard,
  WizardStep,
} from '@youj/react'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function WizardDemo() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [slug, setSlug] = useState('acme')
  const [slugError, setSlugError] = useState<string>()
  const nameOk = name.trim().length >= 2
  const emailOk = /^\S+@\S+\.\S+$/.test(email)

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          Set up your workspace
        </CardTitle>
        <CardDescription>Four short steps. You can change everything later.</CardDescription>
      </CardHeader>
      <CardContent>
        <Wizard orientation="vertical" onComplete={() => wait(900)} finishLabel="Launch workspace" finishSuccessLabel="Ready">
          <WizardStep
            id="account"
            title="Create your account"
            description="We'll use this to sign you in."
            validate={() => {
              setTouched(true)
              return nameOk && emailOk
            }}
          >
            <div className="grid gap-4">
              <Field invalid={touched && !nameOk}>
                <FieldLabel>Full name</FieldLabel>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" autoComplete="name" />
                {touched && !nameOk && <FieldError>Enter your name.</FieldError>}
              </Field>
              <Field invalid={touched && !emailOk}>
                <FieldLabel>Work email</FieldLabel>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ada@analytical.io" type="email" autoComplete="email" />
                {touched && !emailOk && <FieldError>Enter a valid email address.</FieldError>}
              </Field>
            </div>
          </WizardStep>
          <WizardStep
            id="workspace"
            title="Name your workspace"
            description="The URL is where your team will find you."
            validate={async () => {
              await wait(700)
              const taken = slug.trim().toLowerCase() === 'acme'
              setSlugError(taken ? 'acme is taken. Try another.' : undefined)
              return !taken
            }}
          >
            <Field invalid={Boolean(slugError)}>
              <FieldLabel>Workspace URL</FieldLabel>
              <div className="flex items-center gap-2">
                <span className="text-ui text-fg-muted">youj.app/</span>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="max-w-48" />
              </div>
              <FieldDescription>"acme" is taken in this demo.</FieldDescription>
              {slugError && <FieldError>{slugError}</FieldError>}
            </Field>
          </WizardStep>
          <WizardStep id="integrations" title="Connect your tools" description="Bring in activity from where you already work." optional>
            <div className="grid gap-2">
              {['GitHub', 'Slack', 'Linear'].map((tool) => (
                <Label key={tool} className="flex items-center gap-3 rounded-lg border border-line p-3 has-data-checked:border-accent-line">
                  <Checkbox defaultChecked={tool === 'GitHub'} />
                  <span className="font-medium">{tool}</span>
                </Label>
              ))}
            </div>
          </WizardStep>
          <WizardStep id="invite" title="Invite your team" description="Separate addresses with commas.">
            <Field>
              <FieldLabel>Email addresses</FieldLabel>
              <Textarea placeholder="grace@navy.mil, alan@bletchley.uk" rows={3} />
            </Field>
          </WizardStep>
        </Wizard>
      </CardContent>
    </Card>
  )
}
