# Hosting and builds

How the docs site is configured and built. See [README.md](../README.md) for setup.

## Builds

| Build | Command | What it is |
| --- | --- | --- |
| Static export | `pnpm -F docs build:static --mode staging\|production --budgets` | The site as plain files in `out/`, served by Cloudflare Workers assets plus a small Worker |
| Server build | `pnpm generate && next build` (`vercel.json`), or `pnpm -F docs build` with the budgets | A Next.js server build; its Vercel-only routes are the `*.vercel.ts(x)` files |
| CI | `pnpm -F docs build:static --mode staging --budgets`, then `pnpm -F docs test` (it scans `out/`) | GitHub Actions on every push and pull request; deploys nothing |

Maintainers deploy the site; a contribution only has to pass the CI build and `pnpm -F docs verify`.

The release workflow also runs `pnpm -F docs build` (the server build with the budgets) as a check before publishing packages.

## Site URL

Install commands and the registry's cross-item URLs come from one place, `lib/site.ts`:

1. `NEXT_PUBLIC_SITE_URL`, when set.
2. On Vercel, the project's production domain (`VERCEL_PROJECT_PRODUCTION_URL`), so previews and production publish the same, stable registry URLs.
3. Otherwise `http://localhost:3100` (local dev only: the published registry's `homepage` and its cross-item URLs name `https://www.youj.dev` unless one of the two above is set).

The apex `www.youj.dev` only redirects, so either source naming it gives `https://www.youj.dev`: the sitemap, the RSS feed, the canonical links, the Markdown twins and "Open in Claude/ChatGPT" all name `www`.

## Repository URL

Every link to the source repository (GitHub, issues, discussions, releases, files like LICENSE and CONTRIBUTING.md, the private vulnerability report) is built in `lib/repo.ts`, on the site, in the `.md` twins and `/llms.txt`, and in the static export alike:

| Variable | Default | What |
|---|---|---|
| `NEXT_PUBLIC_YOUJ_REPO_URL` | the GitHub repository URL (default in `lib/repo.ts`) | The repository's https URL. A trailing slash is trimmed; anything else that isn't an https URL with a path fails the build. |
| `NEXT_PUBLIC_YOUJ_REPO_BRANCH` | `main` | The branch file links point at. |

MDX never spells the URL out: write `[open an issue](repo:issues/new)` or `[CONTRIBUTING.md](repo:file/CONTRIBUTING.md)` (a file on the branch). `source.config.ts` and `lib/markdown.ts` resolve them, `/security` retargets SECURITY.md's links, and `test/repo-url.test.ts` fails on a hard-coded repository URL anywhere else in the app. The published packages' `repository`/`bugs` fields and READMEs aren't covered: change those by hand when the repository moves.

## The static build

- **`pnpm -F docs build:static --mode staging|production`** (`scripts/build-static.ts`; production without a mode) sets `YOUJ_STATIC_EXPORT=1` and `NEXT_PUBLIC_SITE_URL` to the mode's origin, so the sitemap, canonical links and install commands follow the environment (a staging build is `noindex`, `lib/site.ts`'s `isCanonicalSite`). `next.config.mjs` turns to `output: 'export'` into `out/` (gitignored). The Vercel-only routes are named `*.vercel.ts(x)` and the static-only ones `*.static.ts(x)`; `pageExtensions` picks one set per build. `--budgets` also runs `page-weight.ts` and `js-budget.ts` on that same build. The build keeps `.next/cache` (Turbopack's persistent cache), so a repeat build recompiles only what changed. The script then moves the Markdown twins to `/docs/<slug>.md`, writes `_headers` and `_redirects`, and checks Workers' limits (20,000 files, 25 MiB each).
- **The rules** (`lib/static-host.ts`) come from the lists `next.config.mjs` serves: `lib/headers.mjs` and `lib/redirects.mjs`. Cloudflare applies `_headers` and `_redirects` only to files it serves straight from the assets, so the Worker applies the same rules to what it serves, and to the route handlers' content types (`/api/search`, the feed, the zip, `/r`). `lib/static-host.test.ts` fails if they drift from `next.config`.
- **The Worker** (`worker/index.ts`) runs first on everything except the build's JS and CSS and media and font files (`RUN_WORKER_FIRST`). The same test scans `out/` and fails if anything but JS, CSS, media or fonts would skip the Worker.
- **Config:** `cloudflare.config.ts` and `wrangler.config.ts`. The `cf` scripts in `package.json` set `CF_SEND_TELEMETRY=false`. Don't run `cf init` or a bare `cf build`/`cf dev` here: they would reconfigure the project with npm.
- **Analytics:** none by default. If `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` is set when running `build:static`, the static build adds Cloudflare Web Analytics' beacon (`components/site/cf-analytics.tsx`); the Vercel build never does.

## Media

Promo videos and their posters are served from `https://media.youj.dev` (override with `NEXT_PUBLIC_MEDIA_URL`). They are not in the repository or in `out/`. A build trusts `lib/media.json` and never calls the network: a video plays only when every source and its poster is listed there. Maintainers publish new films; a contribution doesn't change `media.json`.

## Deploying the server build to Vercel

1. Import the repository into Vercel.
2. Set **Root Directory** to `apps/docs` and keep **Include files outside the Root Directory in the Build Step** on: the build reads `packages/*` for the registry, the props and the source it compiles.
3. Leave the install command on its default; pnpm installs the whole workspace from inside `apps/docs`.
4. The build command comes from `vercel.json` (`pnpm generate && next build`). It doesn't run the page-weight or JS budgets; `pnpm -F docs build` does.
5. Optionally set `NEXT_PUBLIC_SITE_URL` to the public domain if it isn't the Vercel production domain.
6. Node.js 22.22 or later (`engines` in `package.json`): the build scripts are TypeScript, run directly by Node.
