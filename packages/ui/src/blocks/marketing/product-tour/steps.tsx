'use client'

import { useState } from 'react'
import { CheckCircleIcon, GitBranchIcon, MessageIcon, RocketIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Slider } from '../../../components/ui/slider'
import { Switch } from '../../../components/ui/switch'
import { Textarea } from '../../../components/ui/textarea'
import { cn } from '../../../lib/utils'
import type { ProductTourStep, ProductTourStepContext } from './data'

/* The demo's four live pictures. Each is real components doing something real
 * on local state, and calls `complete` the first time the visitor does the
 * step's thing. */

// lint-blocks-allow: these waits only pace the demo steps' own buttons
const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const REPOS = [
  { id: 'web', name: 'acme/web', detail: 'TypeScript · updated 2 hours ago' },
  { id: 'api', name: 'acme/api', detail: 'Go · updated yesterday' },
  { id: 'docs', name: 'acme/docs', detail: 'MDX · updated 4 days ago' },
]

function Repos({ complete, copy }: ProductTourStepContext) {
  const [linked, setLinked] = useState<string[]>([])
  return (
    <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
      {REPOS.map((repo) => (
        <li key={repo.id} className="flex items-center gap-3 p-3.5">
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-band text-fg-muted">
            <GitBranchIcon size={16} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-ui font-medium text-fg">{repo.name}</span>
            <span className="truncate text-ui-sm text-fg-muted">{repo.detail}</span>
          </span>
          {linked.includes(repo.id) ? (
            <Badge variant="success">
              <CheckCircleIcon size={12} />
              Connected
            </Badge>
          ) : (
            <AsyncButton
              size="sm"
              variant="outline"
              // The tour's beacon points at the first repository's button.
              data-yj-tour-target={repo.id === REPOS[0]!.id ? '' : undefined}
              aria-label={copy.connectRepo(repo.name)}
              pendingLabel="Connecting…"
              onAction={async () => {
                await pause(900)
                setLinked((all) => [...all, repo.id])
                complete()
              }}
            >
              Connect
            </AsyncButton>
          )}
        </li>
      ))}
    </ul>
  )
}

const RULES = [
  { id: 'review', label: 'Require a review before production', hint: 'At least one approval on the pull request.' },
  { id: 'visual', label: 'Run visual tests on every preview', hint: 'Screenshots compared with main.' },
  { id: 'block', label: 'Block the deploy when a check fails', hint: 'Failing checks never reach production.' },
]

function Guardrails({ complete }: ProductTourStepContext) {
  const [on, setOn] = useState<Record<string, boolean>>({ review: true })
  return (
    <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
      {RULES.map((rule) => (
        <li key={rule.id} className="flex items-center justify-between gap-4 p-3.5">
          <label htmlFor={`rule-${rule.id}`} className="flex min-w-0 flex-col">
            <span className="text-ui font-medium text-fg">{rule.label}</span>
            <span className="text-ui-sm text-fg-muted">{rule.hint}</span>
          </label>
          <Switch
            id={`rule-${rule.id}`}
            data-yj-tour-target={rule.id === 'visual' ? '' : undefined}
            checked={!!on[rule.id]}
            onCheckedChange={(checked) => {
              setOn((all) => ({ ...all, [rule.id]: checked }))
              complete()
            }}
          />
        </li>
      ))}
    </ul>
  )
}

function Preview({ complete, copy }: ProductTourStepContext) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [sent, setSent] = useState<string | null>(null)
  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-xl border border-line bg-surface p-5">
        <div aria-hidden className="flex flex-col gap-2">
          <span className="h-3 w-1/3 rounded-full bg-fg" />
          <span className="h-2 w-2/3 rounded-full bg-well" />
          <span className="h-2 w-1/2 rounded-full bg-well" />
          <span className="mt-2 h-8 w-28 rounded-md bg-accent" />
        </div>
        <button
          type="button"
          aria-expanded={open}
          data-yj-tour-target={open ? undefined : ''}
          aria-label={copy.commentPin}
          onClick={() => setOpen((o) => !o)}
          className="absolute end-[30%] bottom-5 grid size-7 place-items-center rounded-full border-2 border-canvas bg-fg text-canvas shadow-md transition-transform yj-duration-fast ease-standard hover:scale-110 focus-ring"
        >
          <MessageIcon size={14} />
        </button>
      </div>
      <div className="rounded-xl border border-line bg-surface p-3.5">
        <div className="flex gap-2.5">
          <Avatar size="sm">
            <AvatarFallback>TB</AvatarFallback>
          </Avatar>
          <p className="text-ui-sm">
            <span className="font-medium text-fg">Theo</span> <span className="text-fg-muted">Can this button be bigger on mobile?</span>
          </p>
        </div>
        {sent && (
          <div className="mt-3 flex gap-2.5">
            <Avatar size="sm">
              <AvatarFallback>You</AvatarFallback>
            </Avatar>
            <p className="text-ui-sm">
              <span className="font-medium text-fg">You</span> <span className="text-fg-muted">{sent}</span>
            </p>
          </div>
        )}
        {open && !sent && (
          <form
            className="mt-3 flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              if (!draft.trim()) return
              setSent(draft.trim())
              setDraft('')
              complete()
            }}
          >
            <Textarea data-yj-tour-target="" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={copy.replyPlaceholder} aria-label={copy.replyLabel} rows={2} />
            <Button type="submit" size="sm" className="self-end" disabled={!draft.trim()}>
              Send
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

function Canary({ complete, done, copy }: ProductTourStepContext) {
  const [share, setShare] = useState(10)
  const [live, setLive] = useState(false)
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-ui font-medium text-fg">
          <RocketIcon size={16} className="text-accent" />
          dpl_8f2c · feat/klarna
        </span>
        <Badge variant={live ? 'success' : 'warning'}>{live ? 'Live' : 'Canary'}</Badge>
      </div>
      <div className="flex flex-col gap-3">
        <span className="flex items-baseline justify-between text-ui">
          <span className="font-medium text-fg">Traffic on the new build</span>
          <span className="font-mono font-medium text-accent tabular-nums">{live ? 100 : share}%</span>
        </span>
        <Slider
          data-yj-tour-target={share < 50 ? '' : undefined}
          value={[live ? 100 : share]}
          onValueChange={(next) => setShare(Array.isArray(next) ? next[0]! : next)}
          disabled={live}
          aria-label={copy.trafficLabel}
        />
        <span className={cn('text-ui-sm', share >= 50 || live ? 'text-success-text' : 'text-fg-muted')}>
          {live ? 'Everyone is on the new build. p95 184 ms, no errors.' : share >= 50 ? 'Error rate is flat. Safe to promote.' : 'Move the slider to 50% to see the canary hold.'}
        </span>
      </div>
      <AsyncButton
        data-yj-tour-target={share >= 50 ? '' : undefined}
        disabled={live || share < 50}
        pendingLabel="Promoting…"
        successLabel="Live"
        onAction={async () => {
          await pause(900)
          setLive(true)
          complete()
        }}
      >
        {done || live ? 'Promoted' : 'Promote to 100%'}
      </AsyncButton>
    </div>
  )
}

export const STEPS: ProductTourStep[] = [
  {
    id: 'connect',
    title: 'Connect a repository',
    description: 'Link GitHub, GitLab or Bitbucket and every branch builds on push. Nothing to configure.',
    prompt: 'Connect one of the repositories',
    render: (context) => <Repos {...context} />,
  },
  {
    id: 'guardrails',
    title: 'Set the guardrails',
    description: 'Decide what has to be true before anything reaches production. Rules live with the project and apply to everyone.',
    prompt: 'Flip a rule on or off',
    render: (context) => <Guardrails {...context} />,
  },
  {
    id: 'review',
    title: 'Review on the real thing',
    description: 'Every pull request gets a live preview. Teammates comment on the pixels, not a screenshot of them.',
    prompt: 'Open the pin and reply to Theo',
    render: (context) => <Preview {...context} />,
  },
  {
    id: 'ship',
    title: 'Ship with a canary',
    description: 'Send a slice of traffic to the new build and promote when the numbers hold. Roll back in a click if they do not.',
    prompt: 'Move traffic to 50%, then promote',
    render: (context) => <Canary {...context} />,
  },
]
