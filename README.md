<p align="center">
  <a href="https://www.youj.dev"><img src="apps/docs/public/icons/site-light.svg" width="64" height="64" alt="Youj" /></a>
</p>

<h1 align="center">Youj</h1>

<p align="center">
  <strong>UI components, in motion.</strong><br />
  Accessible React components, animated icons, illustrations and themes that move together.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@youj/react"><img src="https://img.shields.io/npm/v/@youj/react?label=npm&color=f5a623" alt="npm version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license" /></a>
  <a href="https://www.youj.dev/docs/versioning"><img src="https://img.shields.io/badge/status-alpha-orange" alt="Alpha" /></a>
</p>

https://github.com/user-attachments/assets/c5c88aa8-58a6-41aa-b962-5a9c3f522bfe

<p align="center">
  <a href="https://www.youj.dev/docs"><strong>Docs</strong></a> ·
  <a href="https://www.youj.dev/docs/components">Components</a> ·
  <a href="https://www.youj.dev/docs/blocks">Blocks</a> ·
  <a href="https://www.youj.dev/icons">Icons</a> ·
  <a href="https://www.youj.dev/docs/mcp">MCP</a> ·
  <a href="https://www.youj.dev/docs/figma">Figma</a>
</p>

> [!NOTE]
> **Youj is in alpha (0.x).** APIs can change between minor versions. See the [versioning policy](https://www.youj.dev/docs/versioning).

## Why Youj

- **Motion is a system, not a sprinkle.** Every duration, spring and loop reads the same tokens. One provider sets the theme, the speed and reduced motion for the whole app.
- **Accessible by default.** Built on [shadcn/ui](https://ui.shadcn.com) and [Base UI](https://base-ui.com), with full keyboard and screen-reader support, and a designed reduced-motion state for every animation.
- **Install it or own it.** Use the npm packages, or copy any piece into your app as source and make it yours.
- **Ready for AI tools.** An MCP server lets your coding assistant find, read and install Youj.

## Quick start

```bash
npx @youj/cli init
```

`init` detects Next.js, Vite, React Router or Astro, sets up Tailwind v4 if needed, asks for a theme and a motion personality, and wraps your app in `YoujProvider`. Every edit is shown as a diff first.

Then use a component:

```tsx
import { AsyncButton } from '@youj/react'

export function Save() {
  return (
    <AsyncButton onAction={save} pendingLabel="Saving…" successLabel="Saved">
      Save changes
    </AsyncButton>
  )
}
```

Or copy one in as source:

```bash
npx @youj/cli add button
```

Requires React 19, Tailwind CSS v4 and Node.js 22+. The packages are ESM only. [Installation](https://www.youj.dev/docs/installation) covers the manual route and the shadcn registry.

## What's inside

| | |
| --- | --- |
| 🧩 **[Components](https://www.youj.dev/docs/components)** | Accessible components, simple and composite, animated through the motion tokens |
| 🧱 **[Blocks](https://www.youj.dev/docs/blocks)** | Copy-in cards, sections and screens, and app frames built in Create |
| ✨ **[Icons](https://www.youj.dev/docs/icons)** | Original animated icons with state morphs, plus `YoujIcon` to animate Lucide |
| 🎨 **[Illustrations](https://www.youj.dev/docs/illustrations)** | Isometric scenes drawn from your theme |
| ⏳ **[Loaders](https://www.youj.dev/docs/loaders)** and **[miniatures](https://www.youj.dev/docs/miniatures)** | Loading animations, and interactive isometric objects |
| 🌀 **[Motion](https://www.youj.dev/docs/motion)** | Primitives, transitions, effects, interactions, WebGL backgrounds and a Lottie player |
| 🌗 **[Themes](https://www.youj.dev/docs/theming)** | Presets and two [looks](https://www.youj.dev/docs/looks), tuned for light and dark and checked against WCAG AA |
| 🔊 **[Sound](https://www.youj.dev/docs/sound)** | Optional interface sounds, cued as motion starts. Nothing downloads until you turn it on |
| 🤖 **[CLI](https://www.youj.dev/docs/cli) and [MCP](https://www.youj.dev/docs/mcp)** | `npx @youj/cli` to set up and add items, and an MCP server for AI coding tools |
| 🖌️ **[Figma](https://www.youj.dev/docs/figma)** | A plugin that builds the kit in your file from the real tokens |

The docs are also served as Markdown for machines: [`/llms.txt`](https://www.youj.dev/llms.txt) and [`/llms-full.txt`](https://www.youj.dev/llms-full.txt).

<details>
<summary><strong>Packages</strong></summary>

| Package | What |
| --- | --- |
| [`@youj/core`](packages/core) | The base the others build on: motion tokens, the provider, themes, labels and locales, hooks |
| [`@youj/react`](packages/ui) | Components and blocks on shadcn and Base UI, animated through motion |
| [`@youj/motion`](packages/motion) | Motion primitives, transitions, effects, interactions, backgrounds and the Lottie player |
| [`@youj/loaders`](packages/loaders) | The loading animations, one entry each |
| [`@youj/icons`](packages/icons) | The animated icon set and its engine |
| [`@youj/illustrations`](packages/illustrations) | The isometric kit and the illustration scenes |
| [`@youj/miniatures`](packages/miniatures) | Interactive isometric objects, one entry each; React is the only dependency |
| [`@youj/sound`](packages/sound) | Designed interface sounds for the components' cues |
| [`youj`](packages/cli) | The CLI: `init`, `add`, `create`, `doctor`, `mcp` |
| [`@youj/mcp`](packages/mcp) | MCP server for AI coding tools |
| [`@youj/figma`](packages/figma) | The Figma plugin (not published) |
| [`apps/docs`](apps/docs) | [www.youj.dev](https://www.youj.dev), and the hosted registry at `/r` |

</details>

## Contributing

Bug reports, fixes and language packs are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first; the [contributing guide](https://www.youj.dev/docs/contributing) covers the layout, the conventions and the checks a change passes. Report vulnerabilities privately, as [SECURITY.md](SECURITY.md) describes. Ideas and questions go in [Discussions](https://github.com/youj-dev/ui/discussions).

<details>
<summary><strong>Develop locally</strong></summary>

You need Node.js 22.22 or later and pnpm 10.

```bash
pnpm install
pnpm storybook        # every package, http://localhost:6006
pnpm -F docs dev      # the docs site, http://localhost:3100
pnpm verify           # typecheck, lint, generated files and tests, every package
```

Each package's `CONTRIBUTING.md` holds its rules. [RELEASING.md](RELEASING.md) covers versioning and publishing, and [CHANGELOG.md](CHANGELOG.md) lists the releases.

</details>

## License

[MIT](LICENSE). The Youj Display font (`packages/brand-font`) is under the [SIL Open Font License 1.1](packages/brand-font/OFL.txt), with the Reserved Font Name "Youj Display". Youj builds on [shadcn/ui](https://github.com/shadcn-ui/ui), [Base UI](https://github.com/mui/base-ui) and [Motion](https://github.com/motiondivision/motion). The docs explorer also offers [Lucide](https://github.com/lucide-icons/lucide) icons: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) lists each with its license, and [Credits and licenses](https://www.youj.dev/docs/contributing#credits-and-licenses) says what each one gave. Third-party brand marks in the icons and blocks belong to their owners and are not covered by the MIT license.
