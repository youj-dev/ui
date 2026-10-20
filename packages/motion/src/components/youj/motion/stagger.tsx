'use client'

import {
  Children,
  isValidElement,
  useMemo,
  useRef,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { useInView } from 'motion/react'
import { useSettledEntrances } from './settled'
import { useYouj, useMotionBudget } from '@youj/core/lib/youj/provider'
import { staggerScale } from '@youj/core/lib/youj/budget'
import { resolveInView } from '@youj/core/lib/youj/in-view'
import type { InView } from '@youj/core/lib/youj/vocabulary'
import type { StaggerToken } from '@youj/core/lib/youj/tokens'
import { Reveal, StaggerItemContext, type RevealTag, type RevealVariant } from './reveal'

export type StaggerOrder = 'start' | 'end' | 'center' | 'random'

/** Deterministic PRNG so 'random' order matches between server and client. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The step index each child waits for, by position. */
export function staggerRanks(count: number, order: StaggerOrder, seed = 1): number[] {
  const indices = Array.from({ length: count }, (_, i) => i)
  switch (order) {
    case 'start':
      return indices
    case 'end':
      return indices.map((i) => count - 1 - i)
    case 'center':
      return indices.map((i) => Math.floor(Math.abs(i - (count - 1) / 2)))
    case 'random': {
      const rand = mulberry32(seed)
      const perm = [...indices]
      for (let i = perm.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1))
        ;[perm[i], perm[j]] = [perm[j]!, perm[i]!]
      }
      return perm
    }
  }
}

type InViewOptions = NonNullable<Parameters<typeof useInView>[1]>

export interface StaggerProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType
  /** Tag for the Reveal wrapper around children that aren't already a Reveal. */
  itemAs?: RevealTag
  itemClassName?: string
  /** Variant for wrapped children. Reveal children keep their own. */
  variant?: RevealVariant
  step?: StaggerToken
  order?: StaggerOrder
  /** Seed for 'random' order. */
  seed?: number
  /** Initial delay, in `step`s. */
  delay?: number
  /** When it plays: `false` on mount; `true` (the default) when scrolled into view, once, at 20% visible; or `{ once, amount, margin }`. */
  inView?: InView
  children?: ReactNode
}

/**
 * Plays its children in sequence when it enters view. Reveal children are
 * orchestrated directly; anything else is wrapped in a Reveal.
 */
export function Stagger({
  as: Tag = 'div',
  itemAs = 'div',
  itemClassName,
  variant = 'rise',
  step = 'base',
  order = 'start',
  seed = 1,
  delay = 0,
  inView: inViewProp,
  children,
  ...rest
}: StaggerProps) {
  const k = useYouj()
  const ref = useRef<HTMLElement>(null)
  const when = resolveInView(inViewProp, { amount: 0.2 })
  const inView = useInView(ref, { once: when.once, amount: when.amount, margin: when.margin as InViewOptions['margin'] })
  const items = Children.toArray(children)
  const ranks = useMemo(() => staggerRanks(items.length, order, seed), [items.length, order, seed])
  const visible = useSettledEntrances() || !when.onView || inView
  // The whole spread stays within the deliberate token, and a low motion
  // budget compresses long sequences so they land in a few steps.
  const scale = staggerScale(Math.max(0, ...ranks), useMotionBudget().tier, k.stagger(step), k.duration('deliberate'))

  return (
    <Tag ref={ref} {...rest}>
      {items.map((child, i) => (
        <StaggerItemContext.Provider
          key={isValidElement(child) && child.key != null ? child.key : i}
          value={{ visible, delay: (delay + ranks[i]! * scale) * k.stagger(step) }}
        >
          {isValidElement(child) && child.type === Reveal ? (
            child
          ) : (
            <Reveal as={itemAs} variant={variant} className={itemClassName}>
              {child}
            </Reveal>
          )}
        </StaggerItemContext.Provider>
      ))}
    </Tag>
  )
}
