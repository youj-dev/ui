import { useEffect, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowUpIcon } from '@youj/icons/components/youj/icons/arrow-up'
import { CopyIcon } from '@youj/icons/components/youj/icons/copy'
import { EyeIcon } from '@youj/icons/components/youj/icons/eye'
import { GlobeIcon } from '@youj/icons/components/youj/icons/globe'
import { SearchIcon } from '@youj/icons/components/youj/icons/search'
import { ThemeScope } from '@youj/core'
import { Specimen } from '../../stories/kit'
import { Field, FieldDescription, FieldLabel } from './field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from './input-group'
import { Kbd, KbdGroup } from './kbd'

const meta: Meta<typeof InputGroup> = {
  title: 'UI/Primitives/InputGroup',
  component: InputGroup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'One bordered frame around a bare text control and its addons (text, icons, keycaps, buttons) on the inline or block edges. The frame takes the control\'s hover, focus halo and invalid state; buttons inside keep their own focus ring. Clicking an addon\'s empty space focuses the control, as on a native field. Logical properties throughout, so it mirrors under RTL.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof InputGroup>

function CopyKey() {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <Field>
      <FieldLabel>Publishable key</FieldLabel>
      <InputGroup>
        <InputGroupInput readOnly defaultValue="pk_demo_51N8fTq2eZvKYlo2C9w" className="font-mono text-ui-sm" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={copied ? 'Copied' : 'Copy key'}
            onClick={() => {
              void navigator.clipboard?.writeText('pk_demo_51N8fTq2eZvKYlo2C9w').catch(() => {})
              setCopied(true)
              clearTimeout(timer.current)
              timer.current = setTimeout(() => setCopied(false), 1600)
            }}
          >
            <CopyIcon active={copied} className={copied ? 'text-success' : undefined} />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <FieldDescription>Safe to ship in client code.</FieldDescription>
      <span role="status" className="sr-only">
        {copied ? 'Key copied' : ''}
      </span>
    </Field>
  )
}

function Password() {
  const [shown, setShown] = useState(false)
  return (
    <Field>
      <FieldLabel>Password</FieldLabel>
      <InputGroup>
        <InputGroupInput type={shown ? 'text' : 'password'} defaultValue="correct horse battery" autoComplete="off" />
        <InputGroupAddon align="inline-end">
          {/* The name states the action, so pressing it is its own confirmation. */}
          <InputGroupButton size="icon-xs" aria-label={shown ? 'Hide password' : 'Show password'} onClick={() => setShown((s) => !s)}>
            <EyeIcon active={shown} />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}

/** The everyday shapes: search with a shortcut, a copyable key, a password reveal. */
export const Hero: Story = {
  render: () => (
    <div className="grid w-full max-w-[400px] gap-6">
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput aria-label="Search" placeholder="Search projects, people, docs…" />
        <InputGroupAddon align="inline-end">
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </InputGroupAddon>
      </InputGroup>
      <CopyKey />
      <Password />
    </div>
  ),
}

export const Addons: Story = {
  render: () => (
    <div className="grid w-full max-w-[440px] gap-5">
      <Specimen label="prefix text">
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>https://</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput aria-label="Domain" placeholder="acme.com" className="ps-0.5" />
          <InputGroupAddon align="inline-end">
            <GlobeIcon />
          </InputGroupAddon>
        </InputGroup>
      </Specimen>
      <Specimen label="prefix + suffix">
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>$</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput aria-label="Monthly budget" defaultValue="2,400" inputMode="decimal" className="tabular-nums" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>USD / month</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </Specimen>
      <Specimen label="invalid">
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>@</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput aria-label="Handle" defaultValue="ada lovelace" aria-invalid />
        </InputGroup>
      </Specimen>
      <Specimen label="disabled">
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput aria-label="Search" placeholder="Search is off during maintenance" disabled />
        </InputGroup>
      </Specimen>
      <Specimen label="textarea with a block-end toolbar">
        <InputGroup>
          <InputGroupTextarea aria-label="Message" placeholder="Ask anything…" />
          <InputGroupAddon align="block-end" className="justify-between">
            <InputGroupText className="text-ui-sm">
              <Kbd>⏎</Kbd> to send
            </InputGroupText>
            <InputGroupButton size="icon-xs" variant="default" aria-label="Send">
              <ArrowUpIcon trigger="none" />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Specimen>
    </div>
  ),
}

/** Under dir="rtl" the addons swap edges and the paddings mirror (logical properties). */
export const RightToLeft: Story = {
  render: () => (
    <ThemeScope dir="rtl">
      <div dir="rtl" className="grid w-full max-w-[400px] gap-5">
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput aria-label="بحث" placeholder="ابحث في المشاريع…" />
          <InputGroupAddon align="inline-end">
            <Kbd>⌘K</Kbd>
          </InputGroupAddon>
        </InputGroup>
        <CopyKey />
      </div>
    </ThemeScope>
  ),
}
