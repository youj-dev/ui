import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Checkbox } from './checkbox'
import { Field, FieldDescription, FieldError, FieldLabel } from './field'
import { Input } from './input'
import { Label } from './label'
import { RadioGroup, RadioGroupItem } from './radio-group'
import { Textarea } from './textarea'
import { Wizard, WizardStep, type WizardProps } from './wizard'

const meta: Meta<WizardProps> = {
  title: 'UI/Display/Wizard',
  component: Wizard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A multi-step flow on the Stepper: one step at a time with Back and Continue. A step can `validate` before it is left (sync or async; Continue shows a spinner while it runs); a failure marks the step in the Stepper, shows and announces its message, and keeps you there. The incoming step slides in from the side you travel to while the outgoing one leaves the other way (24px and a fade on the base token), and the panel\'s height glides on the smooth spring, so rapid presses retarget without jumps. "Step 2 of 4" is a polite live region, focus moves to the new step\'s heading, and Finish runs `onComplete` through Button\'s onAction. Reduced motion: steps swap in place.',
      },
    },
  },
}
export default meta
type Story = StoryObj<WizardProps>

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const Onboarding: Story = {
  name: 'Hero: onboarding',
  render: function Render() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [slug, setSlug] = useState('acme')
    // A field shows its error once it's been left (blurred) or the step submitted, never before.
    const [touched, setTouched] = useState({ name: false, email: false })
    const [slugError, setSlugError] = useState<string>()
    const nameInvalid = touched.name && name.trim().length < 2
    const emailInvalid = touched.email && !/^\S+@\S+\.\S+$/.test(email)
    return (
      <Card className="w-full max-w-[760px]">
        <CardHeader>
          <CardTitle>Set up Youj</CardTitle>
          <CardDescription>Four short steps. You can change everything later.</CardDescription>
        </CardHeader>
        <CardContent>
          <Wizard orientation="vertical" onComplete={() => wait(900)} finishLabel="Launch workspace" finishSuccessLabel="Ready">
            <WizardStep
              id="account"
              title="Create your account"
              description="We'll use this to sign you in."
              validate={() => {
                setTouched({ name: true, email: true })
                return name.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(email)
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field invalid={nameInvalid}>
                  <FieldLabel>Full name</FieldLabel>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    placeholder="Ada Lovelace"
                    autoComplete="name"
                  />
                  {nameInvalid && <FieldError>Enter your name.</FieldError>}
                </Field>
                <Field invalid={emailInvalid}>
                  <FieldLabel>Work email</FieldLabel>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    placeholder="ada@analytical.io"
                    type="email"
                    autoComplete="email"
                  />
                  {emailInvalid && <FieldError>Enter a valid email address.</FieldError>}
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
                setSlugError(taken ? 'youj.app/acme is taken. Try another.' : undefined)
                return !taken
              }}
            >
              <Field invalid={Boolean(slugError)}>
                <FieldLabel>Workspace URL</FieldLabel>
                <div className="flex items-center gap-2">
                  <span className="text-ui text-fg-muted">youj.app/</span>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="max-w-56" />
                </div>
                <FieldDescription>Lowercase letters, numbers and dashes. "acme" is taken in this demo.</FieldDescription>
                <FieldError>{slugError}</FieldError>
              </Field>
            </WizardStep>
            <WizardStep id="integrations" title="Connect your tools" description="Bring in activity from where you already work." optional>
              <div className="grid gap-2">
                {['GitHub', 'Slack', 'Linear', 'Sentry'].map((tool) => (
                  <Label key={tool} className="flex items-center gap-3 rounded-lg border border-line p-3 has-data-checked:border-accent-line has-data-checked:bg-accent-subtle">
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
  },
}

export const Checkout: Story = {
  name: 'Checkout steps',
  render: function Render() {
    const [card, setCard] = useState('')
    const [cardError, setCardError] = useState(false)
    return (
      <Card className="w-full max-w-[600px]">
        <CardContent>
          <Wizard nextLabel="Continue" finishLabel="Place order" finishSuccessLabel="Order placed" onComplete={() => wait(1100)}>
            <WizardStep id="cart" title="Your cart" description="2 items">
              <ul className="divide-y divide-line rounded-lg border border-line text-ui">
                {[
                  ['Youj Pro, annual', '$240.00'],
                  ['Extra seats × 3', '$108.00'],
                ].map(([item, price]) => (
                  <li key={item} className="flex justify-between px-3 py-2.5">
                    <span>{item}</span>
                    <span className="tabular-nums">{price}</span>
                  </li>
                ))}
              </ul>
            </WizardStep>
            <WizardStep id="shipping" title="Delivery" description="Licenses are delivered by email; hardware keys ship.">
              <RadioGroup defaultValue="email" aria-label="Delivery method" className="grid gap-2">
                {[
                  ['email', 'Email only', 'Free · instant'],
                  ['standard', 'Hardware key, standard', '$6 · 3–5 days'],
                  ['express', 'Hardware key, express', '$18 · next day'],
                ].map(([value, title, meta]) => (
                  <Label key={value} className="flex items-center gap-3 rounded-lg border border-line p-3 has-data-checked:border-accent-line has-data-checked:bg-accent-subtle">
                    <RadioGroupItem value={value!} />
                    <span className="flex-1 font-medium">{title}</span>
                    <span className="text-ui-sm text-fg-muted">{meta}</span>
                  </Label>
                ))}
              </RadioGroup>
            </WizardStep>
            <WizardStep
              id="payment"
              title="Payment"
              description="Try continuing with the field empty."
              validate={() => {
                const ok = card.replace(/\s/g, '').length >= 12
                setCardError(!ok)
                return ok ? true : 'Enter a card number to continue.'
              }}
            >
              <Field invalid={cardError}>
                <FieldLabel>Card number</FieldLabel>
                <Input value={card} onChange={(e) => setCard(e.target.value)} inputMode="numeric" placeholder="4242 4242 4242 4242" autoComplete="cc-number" />
              </Field>
            </WizardStep>
            <WizardStep id="review" title="Review and pay">
              <dl className="grid grid-cols-[1fr_auto] gap-y-1.5 text-ui">
                <dt className="text-fg-muted">Subtotal</dt>
                <dd className="tabular-nums">$348.00</dd>
                <dt className="text-fg-muted">Tax</dt>
                <dd className="tabular-nums">$27.84</dd>
                <dt className="border-t border-line pt-1.5 font-medium">Total</dt>
                <dd className="border-t border-line pt-1.5 font-semibold tabular-nums">$375.84</dd>
              </dl>
            </WizardStep>
          </Wizard>
        </CardContent>
      </Card>
    )
  },
}

export const WithCancel: Story = {
  name: 'Footer slot',
  render: () => (
    <Card className="w-full max-w-[560px]">
      <CardContent>
        <Wizard footerStart={<Button variant="ghost">Cancel</Button>}>
          <WizardStep id="one" title="Choose a template">
            <p className="text-ui text-fg-muted">Start from a blank project or a template.</p>
          </WizardStep>
          <WizardStep id="two" title="Configure">
            <p className="text-ui text-fg-muted">Environment variables and build settings.</p>
          </WizardStep>
          <WizardStep id="three" title="Deploy">
            <p className="text-ui text-fg-muted">Ship the first build.</p>
          </WizardStep>
        </Wizard>
      </CardContent>
    </Card>
  ),
}
