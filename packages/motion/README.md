# @youj/motion

> Alpha (0.x): APIs can change between minor versions. See [Versioning](https://www.youj.dev/docs/versioning).

The motion components of Youj, built on [`@youj/core`](https://www.npmjs.com/package/@youj/core)'s tokens and provider (durations, eases and springs, one provider for speed and reduced motion). Use it on its own, or through [`@youj/react`](https://www.npmjs.com/package/@youj/react), whose components move through it.

- Motion primitives (Reveal, Stagger, TextSplit, Counter, Marquee, Parallax, Tilt, Magnetic...), transitions (SlidingIndicator, MorphLabel, Collapse...), effects, interactions such as Dock and PageTransition, and WebGL backgrounds. Speed and reduced motion from the provider reach all of them.
- Lottie player at `@youj/motion/players` (its runtime is an optional peer, needed only there).
- The tokens, the provider, the theme presets and `defineTheme` are `@youj/core`; the animated icons are [`@youj/icons`](https://www.npmjs.com/package/@youj/icons), the isometric scenes [`@youj/illustrations`](https://www.npmjs.com/package/@youj/illustrations) and the loading animations [`@youj/loaders`](https://www.npmjs.com/package/@youj/loaders): packages of their own, none built on this one.

## Install

```bash
pnpm add @youj/core @youj/motion motion@^13.4.4 react react-dom
```

```css
@import 'tailwindcss';
@import '@youj/motion/styles.css';
```

Needs React 19 and Tailwind CSS v4. Already using `@youj/react`? It lists this package as a peer, so it is the same install.

## Use

```tsx
import { YoujProvider } from '@youj/core'
import { Reveal } from '@youj/motion'

export function Hero() {
  return (
    <YoujProvider>
      <Reveal>
        <h1>Hello, motion</h1>
      </Reveal>
    </YoujProvider>
  )
}
```

Set `timeScale` or `reducedMotion` on the provider and every animation below it follows, portals included.

## Docs

Every component has a live preview and a page at [www.youj.dev/docs/motion](https://www.youj.dev/docs/motion). Start with the [motion principles](https://www.youj.dev/docs/motion/principles).

MIT licensed.
