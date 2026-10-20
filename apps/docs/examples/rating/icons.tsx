'use client'

import { HeartIcon } from 'lucide-react'
import { Rating } from '@youj/react'

export default function RatingIcons() {
  return (
    <dl className="grid gap-5">
      <div className="grid gap-1.5">
        <dt className="text-ui-sm text-fg-muted">Hearts</dt>
        <dd>
          <Rating
            aria-label="How much did you love it?"
            icon={HeartIcon}
            unit="hearts"
            defaultValue={4}
            className="[&_[data-slot=rating-fill]]:text-danger"
          />
        </dd>
      </div>
      <div className="grid gap-1.5">
        <dt className="text-ui-sm text-fg-muted">A 10-point score</dt>
        <dd>
          <Rating aria-label="Score" max={10} size="sm" defaultValue={7} />
        </dd>
      </div>
      <div className="grid gap-1.5">
        <dt className="text-ui-sm text-fg-muted">Disabled</dt>
        <dd>
          <Rating aria-label="Rating" disabled defaultValue={3} />
        </dd>
      </div>
      <div className="grid gap-1.5">
        <dt className="text-ui-sm text-fg-muted">Right to left</dt>
        <dd dir="rtl">
          <Rating aria-label="Rating" allowHalf defaultValue={3.5} />
        </dd>
      </div>
    </dl>
  )
}
