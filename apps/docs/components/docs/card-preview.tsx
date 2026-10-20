'use client'

import { Component, lazy, Suspense, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { useInView } from 'motion/react'

/** A demo that fails on its own shouldn't take the index page down with it: the card keeps its blank stage. */
class Quiet extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/** The largest scale a demo is shown at: three-fifths, laid out as if on a full preview stage. */
const SCALE = 0.6

/**
 * An index card's picture: the page's own live demo, scaled down whole to fit
 * the card. It loads when the card nears the screen, and it's a picture, not
 * a control: inert and hidden from assistive tech, since the card is the link.
 */
export function CardPreview({ name }: { name: string }) {
  const stage = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const near = useInView(stage, { once: true, margin: '240px 0px' })
  const [scale, setScale] = useState(SCALE)
  // The examples index (every demo's loader) is its own chunk, fetched when a card first nears the screen, not with the page.
  const Example = useMemo(
    // Resolve to the demo's own module: each entry is already lazy, and a lazy can't resolve to another lazy.
    () => (near ? lazy(() => import('@/examples').then(({ examples }) => examples[name]!.preload() as Promise<{ default: ComponentType }>)) : null),
    [near, name],
  )

  useLayoutEffect(() => {
    const box = stage.current
    const inner = content.current
    if (!box || !inner) return
    // Layout sizes, so the scale itself never feeds back into the measurement.
    const fit = () => setScale(Math.min(SCALE, box.clientHeight / Math.max(1, inner.offsetHeight)))
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(inner)
    observer.observe(box)
    return () => observer.disconnect()
  }, [near])

  return (
    <div ref={stage} aria-hidden inert className="pointer-events-none absolute inset-0 overflow-hidden">
      {near && Example && (
        <div
          ref={content}
          className="absolute top-1/2 left-1/2 flex items-center justify-center p-8"
          style={{ width: `${100 / SCALE}%`, transform: `translate(-50%, -50%) scale(${scale})` }}
        >
          <Quiet>
            <Suspense>
              <Example />
            </Suspense>
          </Quiet>
        </div>
      )}
    </div>
  )
}
