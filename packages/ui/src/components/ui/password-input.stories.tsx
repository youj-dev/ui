import { useId, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Specimen } from '../../stories/kit'
import { AsyncButton } from './async-button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from './field'
import { PasswordInput, PasswordRequirements, PasswordStrength, defaultPasswordRequirements } from './password-input'

const meta: Meta<typeof PasswordInput> = {
  title: 'UI/Inputs/PasswordInput',
  component: PasswordInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A password field with a reveal toggle, a strength meter and a requirements checklist, composed inside one Field. The toggle is motion’s EyeIcon: the eye blinks shut and a slash is drawn through it as the password shows; a pointer press keeps the caret in the field so you can peek mid-word, and Caps Lock shows a quiet mark and is announced. PasswordStrength is a Base UI meter in four segments that fill from the inline start a stagger step apart, tinting from danger to success; the built-in scorer weighs length and character variety against common passwords, runs and repeats, or pass your own `scorer`. PasswordRequirements ticks each rule with CheckIcon’s draw. Reduced motion: everything swaps at once.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof PasswordInput>

function NewPassword({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  const rulesId = useId()
  return (
    <Field>
      <FieldLabel>New password</FieldLabel>
      <PasswordInput
        autoComplete="new-password"
        value={value}
        onValueChange={setValue}
        aria-describedby={rulesId}
        placeholder="At least 8 characters"
      />
      <PasswordStrength value={value} />
      <PasswordRequirements id={rulesId} value={value} />
    </Field>
  )
}

function ChangePassword() {
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const rulesId = useId()
  const allMet = defaultPasswordRequirements.every((r) => r.test(next))
  const mismatch = confirm.length > 0 && confirm !== next
  return (
    <Card className="w-full max-w-[420px]">
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>You’ll stay signed in on this device.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel>Current password</FieldLabel>
            <PasswordInput defaultValue="hunter2hunter2" />
          </Field>
          <Field>
            <FieldLabel>New password</FieldLabel>
            <PasswordInput autoComplete="new-password" value={next} onValueChange={setNext} aria-describedby={rulesId} />
            <PasswordStrength value={next} />
            <PasswordRequirements id={rulesId} value={next} />
          </Field>
          <Field invalid={mismatch}>
            <FieldLabel>Confirm new password</FieldLabel>
            <PasswordInput autoComplete="new-password" value={confirm} onValueChange={setConfirm} />
            <FieldError>{mismatch ? 'Passwords don’t match yet.' : undefined}</FieldError>
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter className="justify-end">
        <AsyncButton
          disabled={!allMet || confirm !== next}
          onAction={() => new Promise((resolve) => setTimeout(resolve, 900))}
          pendingLabel="Updating…"
          successLabel="Password updated"
        >
          Update password
        </AsyncButton>
      </CardFooter>
    </Card>
  )
}

/** Change a password: strength and rules update as you type; the button waits for a match. */
export const Hero: Story = {
  render: () => <ChangePassword />,
}

export const Playground: Story = {
  render: (args) => (
    <Field className="w-72">
      <FieldLabel>Password</FieldLabel>
      <PasswordInput {...args} />
    </Field>
  ),
}

/** The scorer at each step, very weak to strong. */
export const Strength: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-5">
      {['password', 'youjlib', 'youjlib42', 'Youjlib-42', 'Youjlib-42-motion!'].map((pw) => (
        <Specimen key={pw} label={pw}>
          <PasswordStrength value={pw} />
        </Specimen>
      ))}
    </div>
  ),
}

/** A custom scorer: here, a stricter length-only policy with its own labels. */
export const CustomScorer: Story = {
  render: () => {
    function Custom() {
      const [value, setValue] = useState('')
      return (
        <Field className="w-80">
          <FieldLabel>Passphrase</FieldLabel>
          <PasswordInput autoComplete="new-password" value={value} onValueChange={setValue} />
          <PasswordStrength
            value={value}
            scorer={(p) => Math.min(4, Math.floor(p.length / 5))}
            labels={['Too short', 'Short', 'Okay', 'Long', 'Passphrase']}
          />
          <FieldDescription>Four or more words beat any symbol.</FieldDescription>
        </Field>
      )
    }
    return <Custom />
  },
}

export const States: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-5">
      <Specimen label="revealed">
        <PasswordInput aria-label="Password" defaultValue="correct horse" defaultVisible />
      </Specimen>
      <Specimen label="invalid">
        <Field invalid>
          <FieldLabel>Password</FieldLabel>
          <PasswordInput defaultValue="nope" />
          <FieldError>That password is incorrect.</FieldError>
        </Field>
      </Specimen>
      <Specimen label="disabled">
        <PasswordInput aria-label="Password" defaultValue="secret" disabled />
      </Specimen>
      <Specimen label="requirements, partly met">
        <div className="w-80">
          <NewPassword initial="Youjlib4" />
        </div>
      </Specimen>
    </div>
  ),
}

/** Reduced motion: the eye swaps, segments fill and checks appear at once. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <div className="w-80">
        <NewPassword initial="Youjlib4" />
      </div>
    </YoujProvider>
  ),
}
