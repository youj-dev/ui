'use client'

import { TextSplit, type RevealVariant, type SplitBy } from '@youj/motion'

const MODES: { by: SplitBy; variant: RevealVariant; text: string; className: string }[] = [
  { by: 'chars', variant: 'rise', text: 'Instant rollbacks', className: 'text-2xl font-semibold tracking-tight text-fg' },
  { by: 'words', variant: 'blur-in', text: 'Word by word, into focus', className: 'text-2xl font-semibold tracking-tight text-fg' },
  {
    by: 'lines',
    variant: 'wipe-right',
    text: 'Line mode groups words by where they actually wrapped, and measures again when the container resizes or web fonts finish loading.',
    className: 'text-base leading-relaxed text-fg-muted',
  },
]

export default function TextSplitModes() {
  return (
    <div className="w-full max-w-xl space-y-8">
      {MODES.map(({ by, variant, text, className }) => (
        <div key={by}>
          <p className="mb-2 font-mono text-xs text-fg-muted">
            by=&quot;{by}&quot; · {variant}
          </p>
          <TextSplit as="p" by={by} variant={variant} inView={false} className={className}>
            {text}
          </TextSplit>
        </div>
      ))}
    </div>
  )
}
