'use client'

import { useCallback, useState } from 'react'
import { motion } from 'motion/react'
import { ContentSwap, Counter, MorphLabel, useMorphRoot } from '@youj/motion'
import { CheckIcon, CopyIcon, MailIcon, ShareIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Skeleton } from '../../../components/ui/skeleton'
import type { WaitlistCopy, WaitlistPlace } from './data'

/** A Button that is its own morph root: its box reshapes as its MorphLabel changes. */
function useMorphButton() {
  const [radius, setRadius] = useState<string>()
  const ref = useCallback((el: HTMLButtonElement | null) => {
    if (el) setRadius(getComputedStyle(el).borderRadius || undefined)
  }, [])
  return { ref, render: <motion.button {...useMorphRoot(radius)} /> }
}

function PlaceSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-12 w-44" />
      <Skeleton className="h-control w-full" />
    </div>
  )
}

interface PlaceProps {
  place: WaitlistPlace
  placing: boolean
  copy: WaitlistCopy
  locale?: string
  /** Without it, sharing moves the demo's place up 100. */
  onShare?: (method: 'share' | 'email', link: string) => void
}

export function Place({ place, placing, copy, locale, onShare }: PlaceProps) {
  const [position, setPosition] = useState(place.position)
  const [copied, setCopied] = useState(false)
  const { ref: copyRef, render: copyRender } = useMorphButton()
  const link = place.referralLink
  const share = (method: 'share' | 'email') => (onShare ? onShare(method, `https://${link}`) : setPosition((p) => Math.max(1, p - 100)))

  return (
    <section aria-label={copy.placeLabel} className="rounded-2xl border border-line-subtle bg-canvas/70 youj-allow-glass p-5 shadow-sm backdrop-blur-md">
      <ContentSwap loading={placing} fallback={<PlaceSkeleton />} loadingLabel={copy.saving}>
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-1" role="status">
            <span className="text-ui-sm text-fg-muted">{copy.placeIntro}</span>
            <span className="text-5xl font-semibold tracking-tight text-accent tabular-nums">
              #<Counter mode="roll" value={position} from={position + 240} inView={false} locale={locale} format={{ useGrouping: true }} />
            </span>
          </div>
          <p className="text-ui-sm text-fg-muted">{copy.shareHint}</p>
          <div className="flex w-full items-center gap-2 rounded-xl border border-line bg-canvas py-1 ps-4 pe-1">
            <span className="min-w-0 flex-1 truncate text-start font-mono text-ui-sm">{link}</span>
            <Button
              ref={copyRef}
              render={copyRender}
              size="sm"
              variant="secondary"
              className="overflow-hidden"
              onClick={() => {
                void navigator.clipboard?.writeText(`https://${link}`).catch(() => {})
                setCopied(true)
                setTimeout(() => setCopied(false), 1800)
              }}
            >
              <MorphLabel value={copied ? 'copied' : 'copy'} contentClassName="gap-1.5">
                {copied ? (
                  <>
                    <CheckIcon trigger="mount" size={14} strokeWidth={2.5} /> {copy.copied}
                  </>
                ) : (
                  <>
                    <CopyIcon size={14} /> {copy.copyLink}
                  </>
                )}
              </MorphLabel>
            </Button>
          </div>
          <div className="flex w-full gap-2 max-sm:flex-col">
            <Button variant="outline" className="flex-1" onClick={() => share('share')}>
              <ShareIcon size={16} /> {copy.share}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => share('email')}>
              <MailIcon size={16} /> {copy.emailFriend}
            </Button>
          </div>
        </div>
      </ContentSwap>
    </section>
  )
}
