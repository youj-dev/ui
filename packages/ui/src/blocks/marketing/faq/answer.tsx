'use client'

import type { ElementType } from 'react'
import { m } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { ArrowRightIcon, CheckIcon, LinkIcon, ThumbsDownIcon, ThumbsUpIcon } from '@youj/icons'
import { AsyncButton } from '../../../components/ui/async-button'
import { Button } from '../../../components/ui/button'
import type { FaqCopy, FaqCta } from './data'

/* Under an open answer: "Was this helpful?" with Yes and No (the answer waits on the app's `onFeedback`, then thanks
 * you; No hands you to a person), and Copy link, which copies the answer's deep link and morphs to Copied. The thanks
 * rises in where the question was; under reduced motion it's simply there. */

export type FaqFeedback = 'sending' | 'yes' | 'no'

interface AnswerFooterProps {
  copy: FaqCopy
  feedback?: FaqFeedback
  onFeedback: (helpful: boolean) => void
  /** The deep link to copy; none hides Copy link. */
  link?: () => string
  cta: FaqCta | null
  Link: ElementType
}

export function AnswerFooter({ copy, feedback, onFeedback, link, cta, Link }: AnswerFooterProps) {
  const k = useYouj()
  const done = feedback === 'yes' || feedback === 'no'
  return (
    <div className="mt-3 -mb-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <MotionFeatures>
        {done ? (
          <m.p
            key={feedback}
            role="status"
            className="flex min-h-control-xs items-center gap-1.5 text-ui-sm text-fg-muted"
            initial={k.reduced ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={k.tween('base', 'enter')}
          >
            {feedback === 'yes' ? (
              <>
                <CheckIcon size={14} className="text-success" />
                {copy.thanks}
              </>
            ) : (
              <>
                {copy.sorry}
                {cta && (
                  <Link
                    href={cta.href}
                    onClick={cta.onClick}
                    className="group/ask inline-flex items-center gap-1 font-medium text-fg"
                  >
                    {copy.askPerson}
                    <ArrowRightIcon
                      size={12}
                      className="transition-transform yj-duration-fast ease-standard group-hover/ask:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/ask:-translate-x-0.5"
                    />
                  </Link>
                )}
              </>
            )}
          </m.p>
        ) : (
          <div role="group" aria-label={copy.helpful} className="flex items-center gap-1">
            <span aria-hidden className="me-1.5 text-ui-sm text-fg-muted">
              {copy.helpful}
            </span>
            <Button variant="ghost" size="xs" disabled={feedback === 'sending'} onClick={() => onFeedback(true)}>
              <ThumbsUpIcon />
              {copy.yes}
            </Button>
            <Button variant="ghost" size="xs" disabled={feedback === 'sending'} onClick={() => onFeedback(false)}>
              <ThumbsDownIcon />
              {copy.no}
            </Button>
          </div>
        )}
      </MotionFeatures>
      {link && (
        <AsyncButton
          variant="ghost"
          size="xs"
          onAction={() => navigator.clipboard.writeText(link())}
          successLabel={copy.copied}
          errorLabel={copy.copyFailed}
          className="text-fg-muted"
        >
          <LinkIcon />
          {copy.copyLink}
        </AsyncButton>
      )}
    </div>
  )
}
