# apps/docs

The public docs site (Next.js 16, Fumadocs, built from the Youj kit). Workspace rules are in the root `CLAUDE.md`; this file adds the site's.

- **Read first:** `README.md` (setup, scripts), `CONTRIBUTING.md` (adding pages and block docs, budgets), `docs/architecture.md` (how it's built), `docs/hosting.md` (build modes and URLs).
- **Check:** `pnpm -F docs verify` (typecheck and tests) while working; `pnpm -F docs build:static --mode staging --budgets` once at the end when a change can affect page weight or the export. In the main checkout never delete `.next/cache`.
- **Everything is static.** Pages, the search index and the registry are prerendered; Cloudflare serves the export in `out/`. Vercel-only routes are `*.vercel.ts(x)`, static-only ones `*.static.ts(x)`; don't delete either set unasked.
- **Budgets:** `scripts/budgets.json` holds the page-weight and JS limits. A change that grows a page must fit them; don't raise a limit without a reason in its `note`. A client component with a big prop ships it twice (HTML and payload): publish it as a static route and fetch it, as the Code tabs do.
- **Server components** can't import the `@youj/react` barrel; use `components/ui/button-link.tsx` and `components/client.ts`.
- **Pages:** one folder of `content/docs`, named in its `meta.json`. Every shipped component and block has a docs page; `test/parity.test.ts` enforces it. A block is a `<BlockStory>` on its family's page, not a page of its own.
- **MDX never spells the repository URL:** write `[text](repo:issues/new)` (`lib/repo.ts`).
- **Generated files** (`generated/`, `public/r/`, `out/`) are not committed; `pnpm -F docs generate` rebuilds them.
- **Media:** promo videos are hosted outside the repo and maintainers upload them; there are no screenshots.
- **Copy:** US spelling, plain and short. Docs never show `npx shadcn add` or `@/components/ui/...` as the way to use Youj.
- **Deploys:** maintainers deploy; a contribution doesn't.
