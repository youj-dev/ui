# @youj/react

> Alpha (0.x): APIs can change between minor versions. See [Versioning](https://www.youj.dev/docs/versioning).

Accessible React components, built on shadcn/ui and Base UI, that move together with animated icons, illustrations and themes. Every duration and spring is a token, so one provider sets the theme, the speed and reduced motion for the whole app.

- Simple and composite components: inputs, navigation, overlays, charts, a chat kit and a data table kit, with keyboard support and visible focus throughout.
- Theme presets (Basalt by default) and two looks (Classic, the default, and Bezel), each tuned for light and dark, with contrast checked.
- Blocks (cards, sections, screens, frames) to copy in, among them complete data tables (a virtualised data grid, a spreadsheet, a live log stream), and animated illustrations for empty states and heroes.

## Install

The quickest route sets everything up for you:

```bash
npx @youj/cli init
```

Or by hand, in an app with React 19 and Tailwind CSS v4:

```bash
pnpm add @youj/react @youj/core @youj/motion @youj/icons
```

```css
@import 'tailwindcss';
@import '@youj/react/styles.css';
```

`@youj/core` (the provider, themes and tokens) and `@youj/motion` (the motion components) are peer dependencies: list them in your app, so there's one copy of `YoujProvider`. Some components use optional peer dependencies (`recharts`, `react-hook-form`, `cmdk`...) and import from their own entry, such as `@youj/react/chart`. `npx @youj/cli add <component>` installs what a component needs.

## Use

```tsx
import { Button } from '@youj/react'
import { basalt, YoujProvider } from '@youj/core'

export function App() {
  return (
    <YoujProvider theme={basalt}>
      <Button>Save changes</Button>
    </YoujProvider>
  )
}
```

The provider is optional: without it, components run at normal speed and follow the system's reduced-motion setting.

## Docs

Live previews, props and motion notes for every component are at [www.youj.dev](https://www.youj.dev/docs/components). See also [Installation](https://www.youj.dev/docs/installation), [Theming](https://www.youj.dev/docs/theming) and the [blocks](https://www.youj.dev/docs/blocks/activity-and-conversations).

MIT licensed. Third-party credits are in [THIRD_PARTY_NOTICES.md](https://github.com/youj-dev/ui/blob/main/THIRD_PARTY_NOTICES.md).
