'use client'

import { useEffect, useRef, useState } from 'react'
import { useYouj } from '@youj/core'
import { LottiePlayer } from '@youj/motion/players'

type Phase = 'idle' | 'processing' | 'paid'

// The loader's slots follow the button's ink: token names, or any CSS color.
const ON_BUTTON = { accent: 'canvas', fg: 'canvas', line: 'color-mix(in oklab, var(--color-canvas) 30%, transparent)' }

export default function LottiePlayerDemo() {
  const k = useYouj()
  const [phase, setPhase] = useState<Phase>('idle')
  const view = useRef<HTMLElement | null>(null)
  const shown = useRef(phase)

  // Stands in for the payment request. Timed in tokens, so it follows the Speed control.
  useEffect(() => {
    if (phase !== 'processing') return
    const timer = setTimeout(() => setPhase('paid'), k.ms('deliberate') * 3)
    return () => clearTimeout(timer)
  }, [phase, k])

  // When the focused control leaves with its view, keep keyboard focus in the card.
  useEffect(() => {
    if (shown.current === phase) return
    shown.current = phase
    if (document.activeElement === document.body) view.current?.focus()
  }, [phase])

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5 text-sm">
        <span className="font-medium text-fg">Checkout</span>
        <span className="font-mono text-xs text-fg-muted">ORD-20418</span>
      </div>
      {phase === 'paid' ? (
        <div ref={(node) => void (view.current = node)} tabIndex={-1} className="flex flex-col items-center px-6 pt-6 pb-7 text-center outline-none">
          {/* Controlled: it plays once when it mounts, and holds its last frame. */}
          <LottiePlayer src="/samples/success-check.json" playing label="Payment confirmed" className="size-20" />
          <p className="mt-3 text-base font-semibold tracking-tight text-fg">Payment confirmed</p>
          <p className="mt-1 text-sm text-fg-muted">$148.00 charged to Visa ending 4242</p>
          <button
            type="button"
            onClick={() => setPhase('idle')}
            className="mt-5 rounded text-xs font-medium text-fg-muted underline-offset-4 hover:text-fg hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Start over
          </button>
        </div>
      ) : (
        <div className="px-5 pt-4 pb-5 text-sm">
          <dl className="space-y-2.5">
            <div className="flex justify-between">
              <dt className="text-fg-muted">Pro plan, annual</dt>
              <dd className="text-fg">$144.00</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-fg-muted">Tax</dt>
              <dd className="text-fg">$4.00</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2.5 font-medium">
              <dt className="text-fg">Total</dt>
              <dd className="text-fg">$148.00</dd>
            </div>
          </dl>
          <button
            ref={(node) => void (view.current = node)}
            type="button"
            aria-disabled={phase === 'processing'}
            onClick={() => phase === 'idle' && setPhase('processing')}
            className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-fg font-medium text-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
          >
            {phase === 'processing' ? (
              <>
                <LottiePlayer src="/samples/upload-progress.json" autoplay loop slots={ON_BUTTON} className="size-6" />
                Processing
              </>
            ) : (
              'Pay $148.00'
            )}
          </button>
        </div>
      )}
      <p role="status" className="sr-only">
        {phase === 'processing' ? 'Processing payment' : phase === 'paid' ? 'Payment confirmed' : ''}
      </p>
    </div>
  )
}
