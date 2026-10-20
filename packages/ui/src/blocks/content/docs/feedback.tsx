'use client'

import { useState } from 'react'
import { MorphLabel } from '@youj/motion'
import { CheckIcon, ThumbsDownIcon, ThumbsUpIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import type { DocsCopy } from './data'

export function Feedback({ copy, onVote }: { copy: DocsCopy; onVote?: (vote: 'yes' | 'no') => void }) {
  const [vote, setVote] = useState<'yes' | 'no'>()
  const cast = (next: 'yes' | 'no') => {
    setVote(next)
    onVote?.(next)
  }
  return (
    <div className="flex min-h-control items-center text-ui text-fg-muted">
      <MorphLabel value={vote ? 'thanks' : 'ask'} contentClassName="gap-3">
        {vote ? (
          <span className="inline-flex items-center gap-2 text-fg">
            <CheckIcon size={15} trigger="mount" strokeWidth={2} className="text-success" />
            {vote === 'yes' ? copy.thanksYes : copy.thanksNo}
          </span>
        ) : (
          <>
            {copy.helpful}
            <Button variant="outline" size="sm" onClick={() => cast('yes')}>
              <ThumbsUpIcon size={14} /> {copy.yes}
            </Button>
            <Button variant="outline" size="sm" onClick={() => cast('no')}>
              <ThumbsDownIcon size={14} /> {copy.no}
            </Button>
          </>
        )}
      </MorphLabel>
      <span role="status" className="sr-only">
        {vote ? copy.feedbackSent : ''}
      </span>
    </div>
  )
}
