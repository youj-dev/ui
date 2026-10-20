import type { ReactElement } from 'react'
import {
  AsyncFeedback,
  Collapse,
  ContentSwap,
  Counter,
  Marquee,
  MorphLabel,
  Reveal,
  ScrambleText,
  SlidingIndicator,
  Stagger,
  TextEffect,
  TextSplit,
} from '../index'
import { YoujProvider } from '@youj/core'
import { MeshGradient } from '../backgrounds'
import { LiquidGlass, ShimmerButton } from '../interactions'

/* Rendered on a server by scripts/ssr-render.mjs and hydrated in jsdom by
 * ssr.test.tsx. Each case is a component whose markup differs under reduced
 * motion, or that reads the browser: those are the ones that can mismatch. */
export const cases: Record<string, () => ReactElement> = {
  'TextSplit words': () => <TextSplit inView={false}>Deploys that land where you meant them</TextSplit>,
  'TextSplit chars, masked': () => (
    <TextSplit by="chars" mask inView={false}>
      youj
    </TextSplit>
  ),
  'TextSplit lines': () => <TextSplit by="lines">Preview every change on a real URL, then promote it.</TextSplit>,
  'Reveal on mount': () => (
    <Reveal inView={false} variant="rise">
      <p>Changelog 2.4</p>
    </Reveal>
  ),
  'Reveal in view': () => <Reveal variant="wipe-up">Scrolled into view</Reveal>,
  Stagger: () => (
    <Stagger inView={false}>
      <span>One</span>
      <span>Two</span>
      <span>Three</span>
    </Stagger>
  ),
  Counter: () => <Counter value={1280} from={0} format={{ style: 'currency', currency: 'EUR' }} locale="en-GB" />,
  'Counter roll': () => <Counter value={42} mode="roll" />,
  ScrambleText: () => <ScrambleText>Decoding</ScrambleText>,
  'TextEffect split-flap': () => <TextEffect effect="split-flap" text="GATE 12" inView={false} />,
  'TextEffect terminal': () => <TextEffect effect="terminal" text="pnpm build" prompt="$ " inView={false} />,
  'TextEffect blur-in in view': () => <TextEffect text="Ship it" />,
  Marquee: () => (
    <Marquee>
      <span>Linear</span>
      <span>Vercel</span>
      <span>Raycast</span>
    </Marquee>
  ),
  'AsyncFeedback pending': () => (
    <button type="button">
      <AsyncFeedback state="pending">Save</AsyncFeedback>
    </button>
  ),
  'ContentSwap loading': () => (
    <ContentSwap loading fallback={<div>Skeleton</div>} loadingLabel="Loading invoices">
      <p>Invoices</p>
    </ContentSwap>
  ),
  'Collapse open': () => (
    <Collapse open>
      <p>Filters</p>
    </Collapse>
  ),
  MorphLabel: () => <MorphLabel value="copy">Copy</MorphLabel>,
  SlidingIndicator: () => (
    <div role="tablist" className="relative isolate flex">
      <button type="button" role="tab" aria-selected>
        Overview
      </button>
      <button type="button" role="tab" aria-selected={false}>
        Activity
      </button>
      <SlidingIndicator />
    </div>
  ),
  ShimmerButton: () => <ShimmerButton>Try Pro</ShimmerButton>,
  LiquidGlass: () => (
    <LiquidGlass className="rounded-full">
      <button type="button">Join</button>
    </LiquidGlass>
  ),
  MeshGradient: () => <MeshGradient />,
  'Forced reduced motion': () => (
    <YoujProvider reducedMotion="always">
      <TextSplit inView={false}>Always still</TextSplit>
      <Reveal inView={false}>Final frame</Reveal>
    </YoujProvider>
  ),
}
