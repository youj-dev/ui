# @youj/core

> Alpha (0.x): APIs can change between minor versions. See [Versioning](https://www.youj.dev/docs/versioning).

The contract every Youj package builds on: motion tokens for durations, eases and springs, `YoujProvider` (speed, reduced motion, theme, labels, sound) and its hooks, the theme presets and `defineTheme`, the language packs, and the token stylesheet. [`@youj/motion`](https://www.npmjs.com/package/@youj/motion), [`@youj/loaders`](https://www.npmjs.com/package/@youj/loaders), [`@youj/react`](https://www.npmjs.com/package/@youj/react), [`@youj/icons`](https://www.npmjs.com/package/@youj/icons), [`@youj/illustrations`](https://www.npmjs.com/package/@youj/illustrations) and [`@youj/sound`](https://www.npmjs.com/package/@youj/sound) all run on it, as a peer: an app has one copy.

## Install

```bash
pnpm add @youj/core motion@^13.4.4 react react-dom
```

```css
@import 'tailwindcss';
@import '@youj/core/styles.css';
```

Needs React 19 and Tailwind CSS v4. Using `@youj/react` or `@youj/motion`? Import their stylesheet instead; it brings this one.

## Use

```tsx
import { YoujProvider, basalt } from '@youj/core'

export function App({ children }: { children: React.ReactNode }) {
  return <YoujProvider theme={basalt}>{children}</YoujProvider>
}
```

Language packs are `@youj/core/locales/<code>` (`<YoujProvider labels={de}>`).

## Docs

[www.youj.dev/docs/theming](https://www.youj.dev/docs/theming)

MIT licensed.
