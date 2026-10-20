import type { ReactNode } from 'react'
import { Eyebrow } from '@youj/react/components/ui/typography'
import { KICKER } from '../format'

/** A numbered figure of the memo: its number in small caps, a title that states the finding, and a note on how to read it. */
export function FigureHead({ number, title, note }: { number: string; title: ReactNode; note?: ReactNode }) {
  return (
    <header className="flex flex-col gap-1.5">
      <Eyebrow render={<p aria-hidden />} className={KICKER}>
        {number}
      </Eyebrow>
      <h2 className="text-xl leading-snug font-semibold tracking-tight text-balance text-fg">{title}</h2>
      {note && <p className="text-ui-lg leading-relaxed text-pretty text-fg-muted">{note}</p>}
    </header>
  )
}
