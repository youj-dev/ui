# Third-party notices

The Youj icon set is original work. Lucide icons are only used through `YoujIcon`/`IconSwap`, under Lucide's ISC licence. A geometric originality test (`packages/icons/src/components/youj/icons/originality.test.ts`) compares every Youj icon with lucide-react's on each test run.

The Youj Display font (`packages/brand-font`, served by the docs site) is original work under the SIL Open Font License 1.1 ([`OFL.txt`](packages/brand-font/OFL.txt)), not the MIT licence; its Reserved Font Name is "Youj Display".

The Youj sounds (`@youj/sound`) are original work under the MIT licence: every sound is synthesised by the package's own render script (`packages/sound/scripts`) from seeded generators, and none is a sample or comes from a third-party sound pack. The render uses [FFmpeg](https://ffmpeg.org) with LAME only to encode the MP3s; neither is a dependency of any package or shipped with one.

Third-party brand marks. Every mark below is a trademark of its owner, shown only to identify the asset or service it names, with no endorsement implied. None is covered by the MIT licence.

| Mark | Owner | Where it appears | Source |
|---|---|---|---|
| GitHub, X, LinkedIn, Discord, Figma (`brand-*` icons) | GitHub, X Corp., LinkedIn, Discord, Figma | `@youj/icons` (`BrandGithubIcon` and the rest), the Icons docs page and the brand stories | Each owner's official brand asset, per its guidelines (linked in the comment at the top of each icon file) |
| Google "G" and button colors | Google | The auth blocks' "Continue with Google" button (`packages/ui/src/blocks/auth/shell/google-mark.tsx`) | Google's Sign in with Google branding guidelines |
| Bitcoin, Ethereum, Solana, USDC | their respective projects and issuers | Currency Swap demo (`apps/docs/examples/currency-swap/demo.tsx`) and stories (`packages/ui/src/components/ui/currency-swap.stories.tsx`) | [Simple Icons](https://simpleicons.org) (CC0 1.0). USDC is shown with Circle's mark, its issuer, since Simple Icons has no USDC coin |
| GitHub, GitLab, Slack, PagerDuty, Datadog, Sentry, Postgres, Redis, Okta, Auth0, Mixpanel, PostHog | their owners | Marketing integrations block demo data (`packages/ui/src/blocks/marketing/integrations/data.tsx`, in the registry item), the SaaS starter home and the Showcase docs page | [Simple Icons](https://simpleicons.org) (CC0 for the artwork) |
| Claude, Gemini, v0, Cursor, OpenAI | Anthropic, Google, Vercel, Anysphere, OpenAI | The docs site page menu's "Open in" items (`apps/docs/components/site/brand-marks.tsx`), docs only | [Simple Icons](https://simpleicons.org) (CC0 for the artwork) |

Coin logos are trademarks of their respective owners and are shown only to identify the assets in a demo.

Card names in the payment forms (Visa, Mastercard, Amex and others) are plain text labels, not logos.

Photographs. The repository holds a few photographs from [Unsplash](https://unsplash.com). They are **not** covered by the MIT licence: they're used under the [Unsplash License](https://unsplash.com/license), which allows use, including commercial, without permission or credit, but not selling the photos as they are or compiling them into a similar or competing service. They are docs-site assets only; no package ships them, and `youj add` copies none of them into an app. If you reuse one, the Unsplash License applies to it, not this repository's.

| Files | What | Credits |
|---|---|---|
| `apps/docs/public/blocks/products/*.webp` | The demo products of the commerce blocks (Product card, Studio render, Cart drawer) | Each file, source, photographer and change in [`apps/docs/public/blocks/products/CREDITS.md`](apps/docs/public/blocks/products/CREDITS.md) |
| `apps/docs/public/backdrops/*.webp` | The photographic backdrops behind the docs' block previews (Seaglass, Heather) | Each file, source and photographer in [`apps/docs/public/backdrops/CREDITS.md`](apps/docs/public/backdrops/CREDITS.md) |

Youj includes or derives from the following open-source work. Their
licences are reproduced by reference; each project's full licence text is in
its repository and in the installed package under `node_modules`. shadcn/ui's
MIT text, which wants its notice kept with every copy, ships in full in
`packages/ui/THIRD_PARTY_NOTICES.md` (in the `@youj/react` package) and
`youj add` writes it to `licenses/shadcn-ui.txt` in an app that gets copied code.

| Project | Used for | Licence | Copyright |
|---|---|---|---|
| [shadcn/ui](https://github.com/shadcn-ui/ui) | `@youj/react` components start from shadcn's `base-nova` sources | MIT | © 2023 shadcn |
| [Base UI](https://github.com/mui/base-ui) | Headless primitives behind `@youj/react` (dependency) | MIT | © MUI |
| [Motion](https://github.com/motiondivision/motion) | Animation runtime (peer dependency) | MIT | © Motion Division |
| [Lucide](https://github.com/lucide-icons/lucide) | `YoujIcon` / `IconSwap` animate lucide-react icons an app passes in (not a dependency of any package); the originality test and stories use it as a dev dependency | ISC | © Lucide Contributors |
| [TanStack Table](https://github.com/TanStack/table), [TanStack Virtual](https://github.com/TanStack/virtual) | the data table kit and the data table blocks (dependencies) | MIT | © Tanner Linsley |
| [cmdk](https://github.com/pacocoursey/cmdk) | Command and the components built on it (optional peer dependency) | MIT | © Paco Coursey |
| [react-day-picker](https://github.com/gpbl/react-day-picker) | Calendar and date pickers (optional peer dependency) | MIT | © Giampaolo Bellavite |
| [react-hook-form](https://github.com/react-hook-form/react-hook-form) | Form (optional peer dependency) | MIT | © their authors |
| [@hookform/resolvers](https://github.com/react-hook-form/resolvers), [zod](https://github.com/colinhacks/zod) | Schema validation in the Form examples and the auth and checkout blocks (registry dependencies of those blocks, not of the package) | MIT | © their authors |
| [dotLottie](https://github.com/LottieFiles/dotlottie-web) | Lottie player (optional peer dependency of `@youj/motion`) | MIT | © LottieFiles |
| [Recharts](https://github.com/recharts/recharts) | Chart (optional peer dependency) | MIT | © recharts group |
| [Embla Carousel](https://github.com/davidjerleke/embla-carousel) | Carousel (optional peer dependency) | MIT | © David Jerleke |
| [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) | Resizable (dependency) | MIT | © Brian Vaughn |
| [class-variance-authority](https://github.com/joe-bell/cva) | Component variants (dependency) | Apache-2.0 | © Joe Bell |
| [clsx](https://github.com/lukeed/clsx), [tailwind-merge](https://github.com/dcastil/tailwind-merge) | Class name helpers (dependencies) | MIT | © their authors |
| [date-fns](https://github.com/date-fns/date-fns) | Date formatting for pickers (optional peer dependency) | MIT | © Sasha Koss and Lesha Koss |
| [Clack](https://github.com/bombshell-dev/clack) (`@clack/prompts`, which brings `@clack/core`, `sisteransi`, `fast-string-width`, `fast-string-truncated-width` and `fast-wrap-ansi`) | Prompts in the `youj` CLI (a dependency of the CLI only) | MIT | © Nate Moore; © their authors |
| [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) (`@modelcontextprotocol/sdk`, bundled with `zod`, `zod-to-json-schema`, `ajv`, `ajv-formats`, `fast-deep-equal`, `fast-uri` and `json-schema-traverse`) | The `@youj/mcp` server (bundled into it; not a dependency of the kit) | MIT (the SDK, zod, ajv, ajv-formats, fast-deep-equal, json-schema-traverse), ISC (zod-to-json-schema), BSD-3-Clause (fast-uri) | © Anthropic, PBC; © their authors |
| [Remotion](https://github.com/remotion-dev/remotion) | Renders the promo film in `apps/promo` only; NOT a dependency of any published package | Remotion License (free for individuals and companies of up to 3 people; larger organisations need a company licence). Youj is made by one person, so the free licence applies (confirmed 2026-10-08) | © Remotion AG |
| [Sanzo Wada's *A Dictionary of Color Combinations*](https://en.wikipedia.org/wiki/Sanzo_Wada) (1933–34), as the community dataset [dictionary-of-colour-combinations](https://github.com/mattdesl/dictionary-of-colour-combinations) | The colours of the six Wada presets in `@youj/core` (Meadow, Sandstone, Cinnabar, Umber, Seaglass, Heather), the Atmosphere scenes in `@youj/motion` and the docs' backdrops. Only colour values are used, adjusted for contrast; none of the book's text or images | MIT (the dataset) | © 2020 Matt DesLauriers (the dataset) |
| [Natural Earth](https://www.naturalearthdata.com) 1:110m land | DotMap's land mask (`packages/ui/src/components/ui/dot-map.land.tsx`), a 3° grid derived once by `packages/ui/scripts/dot-map-land.mjs`; nothing geographic ships beyond that grid | Public domain | Made with Natural Earth |
| [Inter](https://github.com/rsms/inter), [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) | Fonts in docs, Storybook and the promo film only (not shipped in packages) | OFL-1.1 | © their authors |
| [Geist, Geist Mono](https://github.com/vercel/geist-font) | The two latin subsets are self-hosted and preloaded by the docs site (`apps/docs/public/fonts/geist-latin-v1.woff2`, `geist-mono-latin-v1.woff2`), with the licence text beside them (`apps/docs/public/fonts/OFL.txt`). Not shipped in any package | OFL-1.1 | © 2024 The Geist Project Authors |
| [IBM Plex Sans, Serif, Mono](https://github.com/IBM/plex), [Manrope](https://github.com/sharanda/manrope), [DM Sans, DM Mono](https://github.com/googlefonts/dm-fonts), [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans), [Outfit](https://github.com/Outfitio/Outfit-Fonts), [Space Grotesk](https://github.com/floriankarsten/space-grotesk), [Space Mono](https://github.com/googlefonts/spacemono), [Instrument Serif](https://github.com/Instrument/instrument-serif), [Fraunces](https://github.com/undercasetype/Fraunces), [Newsreader](https://github.com/productiontype/Newsreader), [Source Serif 4](https://github.com/adobe-fonts/source-serif), [Bricolage Grotesque](https://github.com/ateliertriay/bricolage) | The typeface catalogue of Create and the theme builder (docs/Storybook): their Latin subsets self-hosted by the docs site and loaded on demand (`apps/docs/public/fonts/create/`, with the licence text and copyright lines in `OFL.txt` beside them; Geist, see the row above), and set up by an export or `youj create` (next/font or a stylesheet import) in the app that chose them. No font files are shipped in any package | OFL-1.1 | © their authors |
