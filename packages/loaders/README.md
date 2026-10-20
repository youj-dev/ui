# @youj/loaders

> Alpha (0.x): APIs can change between minor versions. See [Versioning](https://www.youj.dev/docs/versioning).

Loading animations for React: polite status loaders drawn from the theme's tokens on one shared ticker, only while on screen, with a still frame under reduced motion. Each loader is its own entry, so importing one bundles only that one.

```bash
pnpm add @youj/loaders @youj/core motion@^13.4.4 react react-dom
```

```tsx
import { YoujProvider } from '@youj/core'
import { LoaderTittle } from '@youj/loaders/tittle'

export function Syncing() {
  return (
    <YoujProvider>
      <LoaderTittle size="md" label="Syncing" showLabel />
    </YoujProvider>
  )
}
```

They take `size`, `color`, `accentColor`, `speed`, `label` (one or several), `showLabel`, `labelPosition`, `labelEffect` and `paused`. `@youj/loaders` itself exports the kit (`LoaderRoot`, the props types and the drawing engine) for building your own. To own the source instead, `npx youj add loader-<id>` copies a loader and the kit into your app. The docs site's Loaders page shows the whole set.
