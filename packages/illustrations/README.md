# @youj/illustrations

> Alpha (0.x): APIs can change between minor versions. See [Versioning](https://www.youj.dev/docs/versioning).

Isometric illustrations for React, drawn in SVG from your theme's tokens: ready-made scenes that assemble as they come into view, and the kit they're built with (`IsoScene`, `IsoBox`, `IsoCylinder`, `IsoPlatform`, `IsoStack`, `IsoCallout`, `IsoFloor`, `IsoPiece` and the grid backdrops `DotGrid`, `LineGrid` and `IsoGrid`). `IllustrationStage` and the kit's other scene helpers are copy-in only, with `npx @youj/cli add illustration-kit`.

```bash
pnpm add @youj/illustrations @youj/core motion@^13.4.4 react react-dom
```

The scenes run on `@youj/core`'s provider and tokens. Import the tokens (`@youj/react/styles.css` if you use the components, else `@youj/core/styles.css`), then this package's sheet, after Tailwind in the same file:

```css
@import 'tailwindcss';
@import '@youj/react/styles.css';
@import '@youj/illustrations/styles.css';
```

```tsx
import { Illustration } from '@youj/illustrations'

export function NoInvoices() {
  return <Illustration scene="documents" title="No invoices yet" />
}
```

`npx @youj/cli add illustration-<id>` installs the package and adds the sheet in an app on the packages, or copies the scene's source in an app on the registry.

## Entries

- `@youj/illustrations`: the scenes (by id through `Illustration`, or each as a component), the registry of ids and categories, and the kit's exported parts (above).

## Contributing

Working on this package itself: [CONTRIBUTING.md](https://github.com/youj-dev/ui/blob/main/packages/illustrations/CONTRIBUTING.md) in the repository.
