import { useRef, useState, type FormEvent } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox } from './checkbox'
import { Button } from './button'
import { Field, FieldDescription, FieldError, FieldLabel } from './field'
import { Input } from './input'
import { SignaturePad, type SignaturePadHandle, type SignatureValue } from './signature-pad'

const meta: Meta<typeof SignaturePad> = {
  title: 'UI/Inputs/Signature pad',
  component: SignaturePad,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'One self-contained surface to sign on: full-width Draw | Sign by typing tabs on top, the signing area under them, and a footer with Undo and Clear (quiet icon buttons) and Accept. Each stroke is one filled path of varying width (a pen’s pressure, or a pressure from speed), smoothed from every coalesced sample and stored as fractions of the pad’s width, so the pad resizes without losing ink. Sign by typing sets the name in a script face, the keyboard path (Enter on the focused drawing area goes there too). Accept is the kit’s AsyncButton: it awaits `onAccept(value)`, draws its check, and the signature locks: read-only, the signing line turns to the success ink with a small tick at its end, the ink settles onto its line, and a quiet Re-sign unlocks it; a rejection shows its message on the button. `locked`/`defaultLocked`/`onLockedChange` hold the lock from outside. In a form, `name` submits the accepted signature’s PNG and `required` blocks submit until one is accepted. Reduced motion: the tick, the settle and the placeholder swap at once.',
      },
    },
  },
  args: { typeInstead: true, aspectRatio: 3, strokeWidth: 3, readOnly: false, disabled: false },
  argTypes: {
    aspectRatio: { control: { type: 'range', min: 2, max: 5, step: 0.5 } },
    strokeWidth: { control: { type: 'range', min: 1, max: 6, step: 0.5 } },
  },
}
export default meta
type Story = StoryObj<typeof SignaturePad>

/** Every prop on the controls. Draw, undo, clear, switch to Sign by typing, then Accept to lock it and Re-sign to unlock. */
export const Playground: Story = {
  render: (args) => (
    <div className="w-full max-w-[520px]">
      <SignaturePad className="border-0 shadow-none" {...args} />
    </div>
  ),
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function ContractSigningDemo() {
  const pad = useRef<SignaturePadHandle>(null)
  const [agreed, setAgreed] = useState(false)
  const [preview, setPreview] = useState('')
  return (
    <div className="flex w-full max-w-[560px] flex-col gap-4 rounded-xl border border-line bg-surface p-5 text-fg">
      <div className="flex flex-col gap-1">
        <h3 className="text-ui-lg font-semibold">Master services agreement</h3>
        <p className="text-ui-sm text-fg-muted">Northwind Logistics and Acme Freight · 24 months from 1 November 2026</p>
      </div>
      <label className="flex items-center gap-2 text-ui-sm">
        <Checkbox checked={agreed} onCheckedChange={setAgreed} />I have read the agreement and sign it on behalf of Northwind.
      </label>
      <Field>
        <FieldLabel>Signature of the authorized signatory</FieldLabel>
        <SignaturePad
          ref={pad}
          className="border-0 shadow-none"
          disabled={!agreed}
          onAccept={async () => {
            // Your upload goes here; the button waits for it.
            await wait(900)
            setPreview(pad.current?.toDataURL() ?? '')
          }}
          onLockedChange={(locked) => !locked && setPreview('')}
        />
        <FieldDescription>Dana Whitfield, Head of Operations. Accepting locks the signature to the agreement.</FieldDescription>
      </Field>
      {preview && <img src={preview} alt="Signature as filed" className="h-10 self-start rounded-md border border-line bg-field px-2" />}
    </div>
  )
}

/** Signing a contract: consent first, then sign and Accept; the app's upload runs while the button spins, and the filed PNG shows once it locks. */
export const ContractSigning: Story = { name: 'Contract signing', render: () => <ContractSigningDemo /> }

/** Signing by typing the name, the way to sign without a pointer: it opens on the Sign by typing tab, set in a script face. */
export const SignByTyping: Story = {
  name: 'Sign by typing',
  render: (args) => (
    <div className="w-full max-w-[520px]">
      <SignaturePad className="border-0 shadow-none" {...args} defaultValue={{ kind: 'typed', text: 'Dana Whitfield' }} />
    </div>
  ),
}

function InAFormDemo() {
  const [sent, setSent] = useState<string | null>(null)
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    setSent(`${data.get('name')} · signature ${String(data.get('signature')).slice(0, 32)}…`)
  }
  return (
    <form onSubmit={submit} className="flex w-full max-w-[520px] flex-col gap-4">
      <Field>
        <FieldLabel>Full name</FieldLabel>
        <Input name="name" defaultValue="Dana Whitfield" />
      </Field>
      <Field required>
        <FieldLabel>Signature</FieldLabel>
        <SignaturePad className="border-0 shadow-none" name="signature" />
        <FieldDescription>Accept your signature; it is submitted with the form as a PNG.</FieldDescription>
        <FieldError match="valueMissing">Sign and accept before you submit.</FieldError>
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit">Submit</Button>
        {sent && (
          <span role="status" className="truncate font-mono text-ui-xs text-fg-muted">
            {sent}
          </span>
        )}
      </div>
    </form>
  )
}

/** In a native form: required, labeled by its Field, submitting the accepted signature's PNG data URL under `name`. Only an accepted signature counts: submit before accepting to see it stop the form. */
export const InAForm: Story = { name: 'In a form', render: () => <InAFormDemo /> }

const SIGNED: SignatureValue = {
  kind: 'drawn',
  strokes: [
    [
      [0.08, 0.21, 0.5],
      [0.1, 0.16, 0.6],
      [0.13, 0.12, 0.7],
      [0.15, 0.14, 0.7],
      [0.15, 0.2, 0.8],
      [0.14, 0.25, 0.8],
      [0.16, 0.24, 0.7],
      [0.2, 0.19, 0.6],
      [0.23, 0.17, 0.6],
      [0.24, 0.2, 0.7],
      [0.27, 0.22, 0.6],
      [0.31, 0.17, 0.5],
      [0.33, 0.15, 0.6],
      [0.34, 0.19, 0.7],
      [0.37, 0.22, 0.6],
      [0.41, 0.18, 0.5],
      [0.45, 0.14, 0.5],
      [0.47, 0.16, 0.6],
      [0.48, 0.21, 0.7],
      [0.52, 0.2, 0.6],
      [0.58, 0.16, 0.4],
    ],
    [
      [0.12, 0.25, 0.4],
      [0.24, 0.255, 0.5],
      [0.4, 0.25, 0.5],
      [0.56, 0.245, 0.4],
    ],
  ],
}

/** Accepted and locked: the line green with a tick at its end, the ink settled, tabs and Clear disabled, and Re-sign to unlock. */
export const AcceptedLocked: Story = {
  name: 'Accepted / locked',
  render: (args) => (
    <div className="w-full max-w-[520px]">
      <SignaturePad className="border-0 shadow-none" {...args} defaultValue={SIGNED} defaultLocked />
    </div>
  ),
}

/** A signature on file: read-only shows it without tabs, Undo, Clear or Accept, on a dashed edge. */
export const ReadOnly: Story = {
  name: 'Read only',
  render: (args) => (
    <div className="w-full max-w-[520px]">
      <SignaturePad className="border-0 shadow-none" {...args} readOnly value={SIGNED} label="Signature on file" />
    </div>
  ),
}
