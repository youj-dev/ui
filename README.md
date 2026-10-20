<p align="center">
  <a href="https://www.youj.dev"><img src="apps/docs/public/icons/site-light.svg" width="64" height="64" alt="Youj" /></a>
</p>

<h1 align="center">Youj</h1>

<p align="center">
  <strong>UI components, in motion.</strong><br />
  Accessible components, animated icons, illustrations and themes that move together.
</p>

<p align="center">
  <a href="https://www.youj.dev/docs">Docs</a> ·
  <a href="https://www.youj.dev/docs/components">Components</a> ·
  <a href="https://www.youj.dev/docs/blocks">Blocks</a> ·
  <a href="https://www.youj.dev/icons">Icons</a> ·
  <a href="https://www.youj.dev/docs/mcp">MCP</a> ·
  <a href="https://www.youj.dev/docs/figma">Figma</a>
</p>

> **Youj is in alpha (0.x).** APIs can change between minor versions; see the [versioning policy](https://www.youj.dev/docs/versioning).

---

Youj is a React UI library for interfaces that move. The components are built on [shadcn/ui](https://ui.shadcn.com) and [Base UI](https://base-ui.com): the same component APIs, re-skinned, with full keyboard and screen-reader support. Motion is a system of its own. Every duration, spring and loop reads the same tokens, so one provider sets the theme, the speed and reduced motion for the whole app, and every animation has a designed reduced-motion state.

Use it as npm packages, or copy the source into your app and own it.

## What's inside

| | |
| --- | --- |
| **Components** | Accessible components, simple and composite, on shadcn and Base UI, animated through the motion tokens |
| **Blocks** | Copy-in compositions: cards, sections and screens, and app frames built in Create |
| **Visuals** | Animated icons (original icons with state morphs, and `YoujIcon` to animate Lucide), isometric illustrations drawn from your theme, loaders, and miniatures (interactive isometric objects with keys and a readout) |
| **Motion** | `YoujProvider` and `useYouj` on the motion tokens, plus motion primitives, transitions, effects, interactions, WebGL backgrounds, and a Lottie player |
| **Themes** | Presets (Basalt is the default) and two looks, Classic and Bezel, tuned for light and dark with contrast checked against WCAG AA |
| **Sound** | Optional designed interface sounds that components cue as their motion starts. Nothing downloads until you turn it on |
| **CLI** | `npx youj` sets an app up and adds items to it |
| **MCP server** | Lets AI coding tools find, read and install Youj |
| **Figma kit** | A plugin that builds the kit in your file from the real tokens |

## Quick start

```bash
npx youj init
```

`init` detects Next.js, Vite, React Router or Astro and your package manager, installs Tailwind v4 if it is missing, asks for a theme and a motion personality, then installs the packages, adds the stylesheet and wraps your app in `YoujProvider`. Every edit is shown as a diff, and running it again changes nothing.

Use the components from the package:

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

Or copy one in as source and edit it:

```bash
npx youj add button
```

Youj needs React 19 and Tailwind CSS v4, and the packages are ESM only. `npx youj` needs Node.js 22 or later.

[Installation](https://www.youj.dev/docs/installation) covers the manual route and the shadcn registry, which is served per release at `https://www.youj.dev/r/v<version>/{name}.json` (what `npx youj` reads) and as the latest alias at `https://www.youj.dev/r/{name}.json`.

## Documentation

- [Components](https://www.youj.dev/docs/components), [choosing a level](https://www.youj.dev/docs/choosing-a-level) and the guide to [building a marketing site](https://www.youj.dev/docs/guides/build-a-marketing-site)
- [Icons](https://www.youj.dev/docs/icons), [illustrations](https://www.youj.dev/docs/illustrations), [loaders](https://www.youj.dev/docs/loaders), [miniatures](https://www.youj.dev/docs/miniatures), [motion](https://www.youj.dev/docs/motion) and [sound](https://www.youj.dev/docs/sound)
- [Theming](https://www.youj.dev/docs/theming) and [looks](https://www.youj.dev/docs/looks)
- [CLI](https://www.youj.dev/docs/cli), [AI and MCP](https://www.youj.dev/docs/mcp) and the [Figma kit](https://www.youj.dev/docs/figma)
- For machines, the docs are also served as Markdown: [`/llms.txt`](https://www.youj.dev/llms.txt) and [`/llms-full.txt`](https://www.youj.dev/llms-full.txt)

## Packages

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

## Contributing

Bug reports, fixes and language packs are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first; the [contributing guide](https://www.youj.dev/docs/contributing) covers the repository layout, the conventions and the checks a change passes. Report vulnerabilities privately, as [SECURITY.md](SECURITY.md) describes.

## Develop

You need Node.js 22.18 or later and pnpm 10.

```bash
pnpm install
pnpm storybook        # every package, http://localhost:6006
pnpm -F docs dev      # the docs site, http://localhost:3100
pnpm verify           # typecheck, lint, generated files and tests, every package
```

Each package's `CONTRIBUTING.md` holds its rules. [RELEASING.md](RELEASING.md) covers versioning and publishing; changes are described with [changesets](https://github.com/changesets/changesets), and [CHANGELOG.md](CHANGELOG.md) lists the releases.

## License

[MIT](LICENSE). The Youj Display font (`packages/brand-font`) is under the [SIL Open Font License 1.1](packages/brand-font/OFL.txt), with the Reserved Font Name "Youj Display". Youj builds on [shadcn/ui](https://github.com/shadcn-ui/ui), [Base UI](https://github.com/mui/base-ui) and [Motion](https://github.com/motiondivision/motion). The docs explorer also offers [Lucide](https://github.com/lucide-icons/lucide) icons: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) lists each with its license, and [Credits and licenses](https://www.youj.dev/docs/contributing#credits-and-licenses) says what each one gave. Third-party brand marks in the icons and blocks belong to their owners and are not covered by the MIT license.
