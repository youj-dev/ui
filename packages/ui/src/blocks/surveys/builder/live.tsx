'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CheckIcon, CopyIcon, ExternalLinkIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../../../components/ui/input-group'
import { safeHref } from '../../../lib/safe-href'
import type { SurveyBuilderCopy, SurveyDeployment } from './data'
import { QrArt } from './qr-art'

/* The survey is live: a check lands, then the link to copy and open, and a
 * share card with its QR (art in the shape of one, or your real code through
 * `qrCode`). An embed adds its snippet to copy; in-app says who sees it.
 * Copy confirms in place for a moment and is read out. */

function useCopied() {
  const [copied, setCopied] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(key)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(null), 2000)
  }
  return { copied, copy }
}

interface LiveProps {
  deployment: SurveyDeployment
  url: string
  qrCode?: (url: string) => ReactNode
  copy: SurveyBuilderCopy
}

export function Live({ deployment, url, qrCode, copy }: LiveProps) {
  const { copied, copy: write } = useCopied()
  const layout = deployment.survey.design?.layout ?? 'conversational'
  const snippet = `<iframe src="${url}?embed=${layout}" title="${deployment.survey.title}" style="width:100%;height:640px;border:0"></iframe>`
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success-subtle text-success-text">
          <CheckIcon size={20} strokeWidth={2.25} trigger="mount" />
        </span>
        <h3 data-yj-step-heading tabIndex={-1} className="text-xl font-semibold tracking-tight outline-none">
          {copy.liveTitle}
        </h3>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-ui font-medium">{copy.link}</span>
        <InputGroup>
          <InputGroupInput readOnly value={url} aria-label={copy.link} onFocus={(e) => e.currentTarget.select()} className="font-mono text-ui-sm" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton aria-label={copy.openLink} render={<a href={safeHref(url) ?? undefined} target="_blank" rel="noreferrer" />}>
              <ExternalLinkIcon size={14} className="rtl:-scale-x-100" />
            </InputGroupButton>
            <InputGroupButton onClick={() => write('link', url)}>
              {copied === 'link' ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
              {copied === 'link' ? copy.copied : copy.copyLink}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4">
        <div className="grid size-28 shrink-0 place-items-center rounded-lg border border-line bg-surface p-2 text-fg">
          {qrCode ? qrCode(url) : <QrArt value={url} className="size-full" />}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-ui font-medium">{copy.shareCard}</span>
          <span className="text-ui-sm text-fg-muted">{copy.shareCardHint}</span>
          <span className="truncate font-mono text-ui-sm text-fg-subtle">{url.replace(/^https?:\/\//, '')}</span>
        </div>
      </div>

      {deployment.channel === 'embed' && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-ui font-medium">{copy.embedCode}</span>
            <Button variant="ghost" size="sm" onClick={() => write('code', snippet)}>
              {copied === 'code' ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
              {copied === 'code' ? copy.copied : copy.copyCode}
            </Button>
          </div>
          <pre className="overflow-x-auto yj-scrollbar rounded-lg border border-line bg-surface p-3 font-mono text-ui-sm whitespace-pre-wrap break-all text-fg-muted">
            {snippet}
          </pre>
        </div>
      )}
      <span role="status" className="sr-only">
        {copied ? copy.copied : ''}
      </span>
    </div>
  )
}
