# @youj/icons

> Alpha (0.x): APIs can change between minor versions. See [Versioning](https://www.youj.dev/docs/versioning).

Original animated icons and static brand marks for React. Use `IconSwap` to transition between icons, or `createIcon`, `useIconState` and the draw helpers to build your own. If you already use Lucide, `YoujIcon` adds animation to those icons; install `lucide-react` separately for that integration.

```bash
pnpm add @youj/icons @youj/core motion@^13.4.4 react react-dom
```

The icons run on `@youj/core`'s provider and tokens. Import the tokens, then this package's sheet, after Tailwind in the same file. With `@youj/react`, its `styles.css` already brings both, so you add nothing.

```css
@import 'tailwindcss';
@import '@youj/core/styles.css';
@import '@youj/icons/styles.css';
```

```tsx
import { YoujProvider } from '@youj/core'
import { CheckIcon } from '@youj/icons'

export function Saved() {
  return (
    <YoujProvider>
      <CheckIcon trigger="mount" />
    </YoujProvider>
  )
}
```

Importing one icon bundles only that icon. The icons follow the provider's time scale and reduced-motion setting, so wrap the app (or the part that uses them) in `YoujProvider`. The docs site's Icons page has the full set and the trigger model.

## Contributing

Working on this package itself: [CONTRIBUTING.md](https://github.com/youj-dev/ui/blob/main/packages/icons/CONTRIBUTING.md) in the repository.
