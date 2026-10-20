'use client'

import { useEffect, useRef, useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, toast } from '@youj/react'
import { ChevronDownIcon } from '@youj/icons/components/youj/icons/chevron-down'
import { CopyIcon } from '@youj/icons/components/youj/icons/copy'
import { ExternalLinkIcon } from '@youj/icons/components/youj/icons/external-link'
import { LinkIcon } from '@youj/icons/components/youj/icons/link'
import { FileTextIcon } from '@youj/icons/components/youj/icons/file-text'
import { MoreHorizontalIcon } from '@youj/icons/components/youj/icons/more-horizontal'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useSoundCue } from '@youj/core/lib/youj/sound-cue'
import { ClaudeMark, CursorMark, GeminiMark, OpenAIMark, V0Mark } from '@/components/site/brand-marks'
import { cn } from '@/lib/cn'
import { copyToast } from '@/lib/copy-toast'

/* The page's own actions, in its header row beside "On this page": copy the
 * page as Markdown (its `.md` twin, app/llms.md), copy its link, or hand the
 * Markdown to an assistant. From `sm` a split button, Copy page | ▾; below
 * that one icon button. Both open the same menu. */

/** Where each assistant takes a prompt. Gemini's web app may ignore `q` and open empty; the link still lands there. */
export function openLinks(url: string, site: string, title: string) {
  const prompt = encodeURIComponent(`Read ${site}${url}.md and help me use Youj's ${title}.`)
  return [
    { label: 'Open in Claude', href: `https://claude.ai/new?q=${prompt}`, Icon: ClaudeMark },
    { label: 'Open in ChatGPT', href: `https://chatgpt.com/?q=${prompt}`, Icon: OpenAIMark },
    { label: 'Open in Gemini', href: `https://gemini.google.com/app?q=${prompt}`, Icon: GeminiMark },
    { label: 'Open in v0', href: `https://v0.dev/chat?q=${prompt}`, Icon: V0Mark },
    // An app scheme: it opens Cursor, not a tab.
    { label: 'Open in Cursor', href: `cursor://anysphere.cursor-deeplink/prompt?text=${prompt}`, Icon: CursorMark, app: true },
  ]
}

/** Copies the page's Markdown; `copied` holds for a moment after it lands. */
function useCopyPage(url: string, site: string) {
  const k = useYouj()
  const cue = useSoundCue()
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    setBusy(true)
    const text = fetch(`${url}.md`).then((res) => {
      if (!res.ok) throw new Error(`${res.status}`)
      return res.text()
    })
    try {
      // Safari drops the click's permission across an await: hand it the fetch as a pending item.
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
        const blob = text.then((t) => new Blob([t], { type: 'text/plain' }))
        await navigator.clipboard.write([new ClipboardItem({ 'text/plain': blob })])
      } else {
        await navigator.clipboard.writeText(await text)
      }
    } catch {
      cue('error')
      toast.error('Couldn’t copy the page', { id: 'copy-page' })
      return
    } finally {
      setBusy(false)
    }
    cue('success')
    copyToast('Page copied', 'As Markdown.')
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), k.ms('deliberate') * 3)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${site}${url}`)
    } catch {
      cue('error')
      toast.error('Couldn’t copy the link', { id: 'copy-link' })
      return
    }
    cue('success')
    copyToast('Link copied', `${site}${url}`)
  }

  return { copy, copyLink, copied, busy }
}

const shell =
  'inline-flex h-control items-center text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg focus-ring data-popup-open:text-fg'
const caps = 'text-ui leading-none font-medium'
/* The white key: the header search field's surface, hairline and soft shadow. */
const key = 'site-fill'

function Items({ url, site, title, copy, copyLink, copied }: { url: string; site: string; title: string; copy: () => void; copyLink: () => void; copied: boolean }) {
  return (
    <>
      <DropdownMenuItem data-yj-trigger onClick={copy} className="gap-2.5">
        <CopyIcon size={16} strokeWidth={1.6} active={copied} />
        Copy page as Markdown
      </DropdownMenuItem>
      <DropdownMenuItem data-yj-trigger onClick={copyLink} className="gap-2.5">
        <LinkIcon size={16} strokeWidth={1.6} />
        Copy page link
      </DropdownMenuItem>
      <DropdownMenuItem data-yj-trigger render={<a href={`${url}.md`} target="_blank" rel="noopener noreferrer" />} className="gap-2.5">
        <FileTextIcon size={16} strokeWidth={1.6} />
        <span className="flex-1">View as Markdown</span>
        <ExternalLinkIcon size={14} strokeWidth={1.6} className="text-fg-subtle" aria-hidden />
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      {openLinks(url, site, title).map(({ label, href, Icon, app }) => (
        <DropdownMenuItem
          key={label}
          data-yj-trigger
          render={<a href={href} {...(app ? {} : { target: '_blank', rel: 'noopener noreferrer' })} />}
          className="gap-2.5"
        >
          <Icon />
          <span className="flex-1">{label}</span>
          {!app && <ExternalLinkIcon size={14} strokeWidth={1.6} className="text-fg-subtle" aria-hidden />}
        </DropdownMenuItem>
      ))}
    </>
  )
}

export function PageActions({ url, site, title, className }: { url: string; site: string; title: string; className?: string }) {
  const { copy, copyLink, copied, busy } = useCopyPage(url, site)
  const items = <Items url={url} site={site} title={title} copy={copy} copyLink={copyLink} copied={copied} />
  const status = (
    <span aria-live="polite" className="sr-only">
      {copied ? 'Page copied to clipboard' : ''}
    </span>
  )

  return (
    <div className={cn('flex shrink-0', className)}>
      {/* sm and up: Copy page | ▾ */}
      <div role="group" aria-label="Page actions" className={cn('hidden rounded-lg sm:flex', key)}>
        <button type="button" onClick={copy} aria-busy={busy || undefined} className={cn(shell, 'gap-2 rounded-s-lg ps-2.5 pe-3 touch:ps-3 touch:pe-3.5')}>
          <CopyIcon size={16} strokeWidth={1.75} active={copied} />
          {/* Both labels hold the width, so the button doesn't jump when it confirms. */}
          <span className={cn(caps, 'grid [&>*]:col-start-1 [&>*]:row-start-1')}>
            <span aria-hidden={copied} className={cn(copied && 'invisible')}>Copy page</span>
            <span aria-hidden={!copied} className={cn(!copied && 'invisible')}>Copied</span>
          </span>
        </button>
        <span aria-hidden className="my-2 w-px bg-line" />
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="More page actions" className={cn(shell, 'rounded-e-lg px-2 touch:px-3')}>
            <ChevronDownIcon size={16} strokeWidth={1.75} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-60">
            {items}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Below sm: one icon button, the same menu. */}
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="Page actions" className={cn(shell, 'w-control justify-center rounded-lg sm:hidden', key)}>
          <MoreHorizontalIcon size={16} strokeWidth={1.75} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-60">
          {items}
        </DropdownMenuContent>
      </DropdownMenu>
      {status}
    </div>
  )
}
