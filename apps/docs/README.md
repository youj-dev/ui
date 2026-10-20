# youj docs

The public site for Youj: guides, live previews, generated props tables, the icon, illustration, miniature and loader explorers, Create, and the hosted shadcn registry at `/r/<name>.json`. Storybook stays the internal review tool; this is the shop window.

Built with Next.js 16 (App Router), Fumadocs for the content pipeline, and the Youj kit itself for the chrome. Every page, the search index and the registry are prerendered; production ships as a static export on Cloudflare.

```bash
pnpm install
pnpm -F docs dev        # generate, then next dev at http://localhost:3100
```

Node 22.22 or later. The first start runs `pnpm generate`, so it takes a moment.

## Where things are

| Path | What |
| --- | --- |
| `content/docs/**/*.mdx` | The docs pages; sidebar order is each folder's `meta.json` |
| `app/`, `components/` | Routes and the site's own components |
| `examples/` | Component demos, registered in `examples/index.tsx` |
| `lib/` | Site logic, budgets' helpers, static-host rules |
| `scripts/` | Generators, build scripts, budgets (`scripts/budgets.json`) and audits |
| `test/` | Guards: parity, links, repository URL |
| `worker/`, `cloudflare.config.ts`, `wrangler.config.ts` | The Cloudflare Worker and its config |
| `docs/` | Contributor docs: [hosting](docs/hosting.md) and [architecture](docs/architecture.md) |

## Scripts

Run as `pnpm -F docs <script>`.

| Script | What |
| --- | --- |
| `dev` / `start` | `generate` then `next dev`, or `next start`, on :3100 |
| `generate` | Props, registry, icons, loaders, search art and demo files (`generated/`, `public/r`) |
| `build` | `generate`, `next build`, then the page-weight and JS budgets (the server build) |
| `build:static` | The static export into `out/` (`--mode staging\|production`, `--budgets` to run the budgets on it) |
| `weight` / `js-budget` | Page-weight and JS budgets on an existing build |
| `typecheck` / `test` / `verify` | Types, Vitest, both |
| `theme-audit <url>` | Drives every block through every preset (needs a running server) |
| `stage-heights` | Measures demo heights into `lib/stage-heights.json` (needs a running server) |
| `miniatures:thumbs` | Miniature thumbnails (needs a running server) |
| `favicons` | The site's tab icons from the brand geometry |
| `media:upload`, `registry:archive` | Maintainer-only: publish approved promo media and archive a registry version |
| `cf:*` | Maintainer-only: the Cloudflare Worker build, dry-run deploy, local run and releases |

## Guides

- [CONTRIBUTING.md](CONTRIBUTING.md): set up, add a page or a block's docs, budgets, the static build.
- [docs/hosting.md](docs/hosting.md): the builds (static export, server build), site and repository URLs, media.
- [docs/architecture.md](docs/architecture.md): how the shell, theming, previews, Create and the registry are built.
- `CLAUDE.md`: the rules for agents working here.
