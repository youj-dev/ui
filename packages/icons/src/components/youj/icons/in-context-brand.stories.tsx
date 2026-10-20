import { useState, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { cn } from '@youj/core'
import type { YoujIconComponent } from './icon-base'
import { ArrowRightIcon } from './arrow-right'
import { BrandDiscordIcon } from './brand-discord'
import { BrandFigmaIcon } from './brand-figma'
import { BrandGithubIcon } from './brand-github'
import { BrandLinkedinIcon } from './brand-linkedin'
import { BrandXIcon } from './brand-x'
import { CheckIcon } from './check'
import { MailIcon } from './mail'
import { ease, focusRing } from './story-kit'

const meta = {
  title: 'Icons/In context/Brand marks',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "Single-color brand marks for social sign-in, connected accounts and social links: GitHub, X, LinkedIn, Discord and Figma, each drawn from the brand's own published asset and fitted to the 24-unit grid. Brand marks never animate: brand guidelines forbid altering or animating them, so they hold still under every trigger while the UI icons around them keep their choreography (the arrows nudge on hover). They take `currentColor`; keep them black, white or gray (LinkedIn also allows its blue, Discord its Blurple). Google, Apple, Microsoft, Slack and GitLab are not in the set: their guidelines require their own full-color artwork or don't allow redistributing the mark, so use the sign-in assets each provider publishes. Reduced motion changes nothing for the marks; the arrows hold still too.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/* ── Shared UI ───────────────────────────────────────────────────────────── */


function Button({ variant = 'secondary', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-10 items-center gap-2.5 rounded-lg px-3.5 text-sm font-medium whitespace-nowrap',
        ease,
        focusRing,
        variant === 'primary' && 'bg-accent text-on-accent hover:opacity-90',
        variant === 'secondary' && 'border border-line bg-surface text-fg hover:bg-hover',
        variant === 'ghost' && 'text-fg-muted hover:bg-hover hover:text-fg',
        className,
      )}
      {...props}
    />
  )
}

const TRADEMARKS =
  'GitHub, X, LinkedIn, Discord and Figma are trademarks of their respective owners. Their marks appear here only to refer to those services, as each brand’s guidelines allow; no endorsement is implied.'

function TrademarkNote({ className }: { className?: string }) {
  return <p className={cn('text-xs leading-relaxed text-fg-subtle', className)}>{TRADEMARKS}</p>
}

/* ── Sign in ─────────────────────────────────────────────────────────────── */

const PROVIDERS: { name: string; Icon: YoujIconComponent }[] = [
  { name: 'GitHub', Icon: BrandGithubIcon },
  { name: 'X', Icon: BrandXIcon },
  { name: 'LinkedIn', Icon: BrandLinkedinIcon },
  { name: 'Discord', Icon: BrandDiscordIcon },
]

function SignInCard() {
  const [pending, setPending] = useState<string | null>(null)
  return (
    <section aria-labelledby="brand-sign-in" className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <h2 id="brand-sign-in" className="text-lg font-semibold tracking-tight text-fg">
        Sign in to Acme
      </h2>
      <p className="mt-1 text-sm text-fg-muted">Pick up where your team left off.</p>
      <div className="mt-5 flex flex-col gap-2">
        {PROVIDERS.map(({ name, Icon }) => (
          <Button key={name} onClick={() => setPending(name)} aria-busy={pending === name || undefined} className="w-full justify-start">
            <Icon size={18} className="text-fg" />
            <span className="flex-1 text-start">Continue with {name}</span>
            <ArrowRightIcon size={16} className="text-fg-subtle rtl:-scale-x-100" />
          </Button>
        ))}
      </div>
      <div className="my-5 flex items-center gap-3 text-xs text-fg-subtle" role="separator" aria-label="or">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
      <label className="block text-xs font-medium text-fg-muted" htmlFor="brand-email">
        Work email
      </label>
      <input
        id="brand-email"
        type="email"
        placeholder="you@acme.co"
        className={cn('mt-1.5 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-fg placeholder:text-fg-subtle', focusRing)}
      />
      <Button variant="primary" className="mt-3 w-full justify-center">
        <MailIcon size={16} />
        Continue with email
      </Button>
      <p role="status" className="mt-2 min-h-4 text-xs text-fg-muted">
        {pending ? `Redirecting to ${pending}…` : ''}
      </p>
    </section>
  )
}

/* ── Connected accounts ──────────────────────────────────────────────────── */

interface Account {
  name: string
  Icon: YoujIconComponent
  detail: string
  connected: boolean
}

const ACCOUNTS: Account[] = [
  { name: 'GitHub', Icon: BrandGithubIcon, detail: 'acme-inc · 38 repositories', connected: true },
  { name: 'Figma', Icon: BrandFigmaIcon, detail: 'Acme brand kit · synced 2 min ago', connected: true },
  { name: 'Discord', Icon: BrandDiscordIcon, detail: 'Post release notes to #announcements', connected: false },
  { name: 'LinkedIn', Icon: BrandLinkedinIcon, detail: 'Share launches from the company page', connected: false },
  { name: 'X', Icon: BrandXIcon, detail: '@acme · post changelog highlights', connected: true },
]

function AccountRow({ account }: { account: Account }) {
  const [connected, setConnected] = useState(account.connected)
  const [justConnected, setJustConnected] = useState(false)
  const { name, Icon, detail } = account
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-well text-fg">
        <Icon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-medium text-fg">
          {name}
          {connected && (
            <span className="inline-flex items-center gap-1 text-xs font-normal text-success">
              <CheckIcon size={14} strokeWidth={2} trigger={justConnected ? 'mount' : 'none'} />
              Connected
            </span>
          )}
        </p>
        <p className="truncate text-xs text-fg-muted">{detail}</p>
      </div>
      <Button
        variant={connected ? 'ghost' : 'secondary'}
        className="h-8 px-3 text-xs"
        aria-label={`${connected ? 'Disconnect' : 'Connect'} ${name}`}
        onClick={() => {
          setJustConnected(!connected)
          setConnected(!connected)
        }}
      >
        {connected ? 'Disconnect' : 'Connect'}
      </Button>
    </li>
  )
}

function ConnectedAccounts() {
  return (
    <section aria-labelledby="brand-accounts" className="w-full max-w-md rounded-2xl border border-line bg-surface shadow-sm">
      <header className="border-b border-line px-4 py-3.5">
        <h2 id="brand-accounts" className="text-sm font-semibold text-fg">
          Connected accounts
        </h2>
        <p className="mt-0.5 text-xs text-fg-muted">Sign in with them, or let Acme post and sync on your behalf.</p>
      </header>
      <ul className="divide-y divide-line">
        {ACCOUNTS.map((a) => (
          <AccountRow key={a.name} account={a} />
        ))}
      </ul>
    </section>
  )
}

/* ── Social footer ───────────────────────────────────────────────────────── */

const SOCIAL: { name: string; Icon: YoujIconComponent }[] = [
  { name: 'GitHub', Icon: BrandGithubIcon },
  { name: 'X', Icon: BrandXIcon },
  { name: 'LinkedIn', Icon: BrandLinkedinIcon },
  { name: 'Discord', Icon: BrandDiscordIcon },
]

function SocialLink({ name, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { name: string; children: ReactNode }) {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      aria-label={`Acme on ${name}`}
      title={name}
      className={cn('flex size-9 items-center justify-center rounded-lg text-fg-muted hover:bg-hover hover:text-fg', ease, focusRing)}
      {...props}
    >
      {children}
    </a>
  )
}

function SocialFooter() {
  return (
    <footer className="flex w-full flex-col gap-3 border-t border-line pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">© 2026 Acme, Inc.</p>
        <nav aria-label="Acme elsewhere" className="flex items-center gap-1">
          {SOCIAL.map(({ name, Icon }) => (
            <SocialLink key={name} name={name}>
              <Icon size={18} />
            </SocialLink>
          ))}
        </nav>
      </div>
      <TrademarkNote className="max-w-2xl" />
    </footer>
  )
}

/* ── Stories ─────────────────────────────────────────────────────────────── */

export const Hero: Story = {
  render: () => (
    <div className="min-h-screen bg-canvas px-4 py-10 md:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-center">
          <SignInCard />
          <ConnectedAccounts />
        </div>
        <SocialFooter />
      </div>
    </div>
  ),
}

const ALL: { label: string; Icon: YoujIconComponent }[] = [...PROVIDERS.map((p) => ({ label: p.name, Icon: p.Icon })), { label: 'Figma', Icon: BrandFigmaIcon }]

/** Every mark at the sizes UI uses them, with a line icon for weight. */
export const Sizes: Story = {
  render: () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-canvas p-10">
      <table className="text-fg">
        <caption className="pb-4 text-start text-sm font-medium text-fg">Brand marks at 16, 20, 24 and 32</caption>
        <tbody>
          {ALL.map(({ label, Icon }) => (
            <tr key={label}>
              <th scope="row" className="pe-6 text-start text-xs font-normal text-fg-muted">
                {label}
              </th>
              {[16, 20, 24, 32].map((s) => (
                <td key={s} className="px-3 py-2">
                  <Icon size={s} aria-label={`${label}, ${s} pixels`} />
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <th scope="row" className="pe-6 text-start text-xs font-normal text-fg-muted">
              Line icon, for weight
            </th>
            {[16, 20, 24, 32].map((s) => (
              <td key={s} className="px-3 py-2">
                <MailIcon size={s} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <TrademarkNote className="max-w-md text-center" />
    </div>
  ),
}
