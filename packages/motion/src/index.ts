// @youj/motion: the motion components. Primitives, transitions and effects.
// Heavier areas have their own entries: '@youj/motion/interactions',
// '@youj/motion/backgrounds' and '@youj/motion/players'. Tokens, YoujProvider and themes are @youj/core.

// Transitions: reusable motion behaviors for UI components
export { SlidingIndicator, type SlidingIndicatorProps } from './components/youj/transitions/sliding-indicator'
export { MorphLabel, useMorphRoot, type MorphLabelProps, type MorphRootProps } from './components/youj/transitions/morph-label'
export { Collapse, type CollapseProps } from './components/youj/transitions/collapse'
export { ContentSwap, type ContentSwapProps } from './components/youj/transitions/content-swap'
export {
  PresenceList,
  PresenceItem,
  type PresenceListProps,
  type PresenceItemProps,
} from './components/youj/transitions/presence-list'

// Effects: the interactions' looks, for any surface
export {
  useSpotlight,
  SpotlightGroup,
  SpotlightSurface,
  type SpotlightGroupProps,
  type SpotlightSurfaceProps,
} from './components/youj/effects/spotlight'
export { Shimmer, useShimmer, type ShimmerOptions, type ShimmerProps } from './components/youj/effects/shimmer'
export {
  useAsyncAction,
  AsyncFeedback,
  AsyncAnnouncer,
  type AsyncState,
  type AsyncActionOptions,
  type AsyncFeedbackProps,
  type AsyncAnnouncerProps,
} from './components/youj/effects/async-feedback'
export { BlueprintEntrance, type BlueprintEntranceProps } from './components/youj/effects/blueprint/blueprint'
export { blueprint, type BlueprintOptions, type BlueprintRun, type BlueprintLabels, type BlueprintPhases } from './components/youj/effects/blueprint/engine'
export { GenerateEntrance, type GenerateEntranceProps } from './components/youj/effects/generate/generate'
export { generate, type GenerateOptions, type GenerateRun, type GeneratePhases } from './components/youj/effects/generate/engine'
export { InspectorEntrance, type InspectorEntranceProps } from './components/youj/effects/inspector/inspector'
export { inspector, type InspectorOptions } from './components/youj/effects/inspector/engine'
export { LayersEntrance, type LayersEntranceProps } from './components/youj/effects/layers/layers'
export { layers, type LayersOptions, type LayersLabels } from './components/youj/effects/layers/engine'
export { RenderPassesEntrance, type RenderPassesEntranceProps } from './components/youj/effects/passes/passes'
export { renderPasses, type RenderPassesOptions, type RenderPassesLabels } from './components/youj/effects/passes/engine'
export type { EntranceRun } from './components/youj/effects/entrance/run'
export { PrismEntrance, type PrismEntranceProps } from './components/youj/effects/prism/prism'
export { prism, type PrismOptions, type PrismRun, type PrismPhases } from './components/youj/effects/prism/engine'
export { TraceEntrance, type TraceEntranceProps } from './components/youj/effects/trace/trace'
export { trace, type TraceOptions, type TraceRun, type TracePhases } from './components/youj/effects/trace/engine'

// Primitives
export {
  Reveal,
  revealVariants,
  revealVariantNames,
  type RevealProps,
  type RevealVariant,
  type RevealTag,
  type RevealMotionOptions,
} from './components/youj/motion/reveal'
export { SettledEntrances } from './components/youj/motion/settled'
export { Stagger, staggerRanks, type StaggerProps, type StaggerOrder } from './components/youj/motion/stagger'
export { TextSplit, type TextSplitProps, type SplitBy } from './components/youj/motion/text-split'
export { ScrambleText, type ScrambleTextProps, type ScrambleTrigger } from './components/youj/motion/scramble-text'
export { Counter, type CounterProps } from './components/youj/motion/counter'
export { TextEffect, type TextEffectProps, type TextEffectName } from './components/youj/motion/text-effect'
export { Magnetic, MagneticInner, type MagneticProps, type MagneticInnerProps } from './components/youj/motion/magnetic'
export { Tilt, type TiltProps } from './components/youj/motion/tilt'
export { Marquee, type MarqueeProps, type MarqueeDirection } from './components/youj/motion/marquee'
export { Parallax, type ParallaxProps } from './components/youj/motion/parallax'
export { ScrollProgress, type ScrollProgressProps } from './components/youj/motion/scroll-progress'

