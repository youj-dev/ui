'use client'

import { useEffect, useRef, useState } from 'react'
import { useYouj } from '@youj/core'
import { SignaturePad, type SignatureValue } from '@youj/react'
import { usePlaying } from '@/components/landing/use-loop'
import { Demo, useInUse } from './demo'

type Point = [x: number, y: number, pressure: number]

/** A signature in the pad's units (fractions of its width; it's three times as wide as tall): a looped hand, then a flourish under it. */
function signature(): Point[][] {
  const hand: Point[] = []
  const w = Math.PI * 2 * 5.5
  for (let i = 0; i <= 110; i++) {
    const t = i / 110
    hand.push([
      0.1 + 0.56 * t - 0.022 * Math.sin(w * t),
      0.17 - 0.07 * Math.sin(w * t + 0.6) * (0.55 + 0.45 * Math.sin(Math.PI * t)),
      0.45 + 0.35 * Math.sin(w * t * 0.5) ** 2,
    ])
  }
  const flourish: Point[] = []
  for (let i = 0; i <= 36; i++) {
    const t = i / 36
    flourish.push([0.46 + 0.42 * t, 0.27 - 0.035 * Math.sin(Math.PI * t), 0.7 - 0.4 * t])
  }
  return [hand, flourish]
}

const STROKES = signature()
const TOTAL = STROKES.reduce((n, s) => n + s.length, 0)
const FULL: SignatureValue = { kind: 'drawn', strokes: STROKES }

/** The first `n` points of the signature, stroke by stroke. */
function upTo(n: number): SignatureValue {
  const strokes: Point[][] = []
  for (const stroke of STROKES) {
    if (n <= 0) break
    strokes.push(stroke.slice(0, n))
    n -= stroke.length
  }
  return { kind: 'drawn', strokes }
}

/**
 * The pad signs itself while nobody's using it: the hand draws in, Accept locks it and the line turns to the success
 * ink with its tick, then it clears and signs again. Point at it, touch it or focus it and it's a clean pad of yours;
 * what you sign stays. Reduced motion shows it signed.
 */
export default function SignatureTile() {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  const playing = usePlaying(root)
  const inUse = useInUse(root)
  const [value, setValue] = useState<SignatureValue | null>(() => (k.reduced ? FULL : null))
  const [locked, setLocked] = useState(k.reduced)
  /** The pad holds the demo's signature, not someone's own. */
  const [demo, setDemo] = useState(true)

  // Someone takes over: the demo's signature makes way for a clean pad.
  useEffect(() => {
    if (!inUse || !demo) return
    setValue(null)
    setLocked(false)
    setDemo(false)
  }, [inUse, demo])

  // Nobody's signed and nobody's here: the demo again.
  useEffect(() => {
    if (!inUse && !demo && !value) setDemo(true)
  }, [inUse, demo, value])

  useEffect(() => {
    if (!playing || inUse || !demo) return
    let n = 0
    let timer: ReturnType<typeof setTimeout>
    const draw = () => {
      n += 3
      setValue(upTo(n))
      if (n < TOTAL) timer = setTimeout(draw, 33)
      else timer = setTimeout(accept, k.ms('slow'))
    }
    const accept = () => {
      setLocked(true)
      timer = setTimeout(clear, k.ms('deliberate') * 6)
    }
    const clear = () => {
      setLocked(false)
      setValue(null)
      timer = setTimeout(draw, k.ms('deliberate') * 2)
    }
    timer = setTimeout(clear, k.ms('deliberate'))
    return () => clearTimeout(timer)
  }, [playing, inUse, demo, k])

  return (
    <Demo>
      <div ref={root} className="w-full max-w-[22rem]">
        <SignaturePad
          value={value}
          onValueChange={(next) => {
            setDemo(false)
            setValue(next)
          }}
          locked={locked}
          onLockedChange={setLocked}
          onAccept={() => new Promise((resolve) => setTimeout(resolve, 700))}
          typeInstead={false}
          aspectRatio={2.4}
          className="[&_[data-slot=signature-pad-footer]]:pb-4"
          label="Signature"
        />
      </div>
    </Demo>
  )
}
