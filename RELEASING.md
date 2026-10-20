# Releasing

The workspace packages publish to the public npm registry under the `@youj` scope, and the CLI as `@youj/cli` (its command is `youj`). They version together, as a fixed group in [changesets](https://github.com/changesets/changesets), so the CLI installs the kit at its own version and an app keeps every Youj package on one version.

Youj is in **alpha (0.x)** until its API settles; then it goes to 1.0. Versions stay plain (0.1.0, not 0.1.0-alpha) and publish to `latest`, so `npm install @youj/react` works. What a version promises users, what counts as breaking and the stability labels are on the docs' [Versioning and stability](https://www.youj.dev/docs/versioning) page. This file is how to make a release that keeps that promise.

## The three commands you'll use most

```bash
pnpm changeset          # in every pull request that changes a package: the bump and one changelog line
pnpm api:update         # after an intended API change: refresh api/, the public API snapshot
pnpm version-packages   # when releasing: apply the changesets to versions and CHANGELOGs
```

## Packages

| Package | What |
| --- | --- |
| `@youj/core` | The base: motion tokens, `YoujProvider` and its hooks, themes, labels and locales, `cn`, the sound cue bus, the token stylesheet |
| `@youj/motion` | Motion primitives, transitions, effects, interactions, backgrounds, players |
| `@youj/loaders` | The loading animations, one entry per loader (`@youj/loaders/<id>`) |
| `@youj/icons` | The animated icons and their engine (`createIcon`, `IconSwap`, `useIconState`, `YoujIcon`), on core's provider and tokens |
| `@youj/illustrations` | The isometric kit, the scenes and, at `/builder`, the illustration builder's scene format and renderer |
| `@youj/miniatures` | The interactive isometric miniatures, one entry per miniature (`@youj/miniatures/<id>`); React is its only peer |
| `@youj/sound` | Interface sounds: the built-in packs for `YoujProvider`'s `sound` (Beacon, plus Halo, Rill, Glyph, Zephyr and Glass) and `definePack` with its built-in candidates, playing the cues the components emit on core's cue bus. Its audio is rendered by `pnpm -F @youj/sound render` (needs ffmpeg) and committed, so packing it needs neither |
| `@youj/react` | The components and their optional-peer entries; its stylesheet imports core's and the icons' |
| `@youj/cli` | The CLI: `npx @youj/cli init`, `add`, `create`, `doctor`, `mcp` |
| `@youj/mcp` | The MCP server for AI coding tools, `npx @youj/mcp`. Its index of the docs, components and icons is generated from this version, and its dependencies are bundled in |

The workspace packages carry their published names, so what's packed is what's published.

Each package exports only what it owns; nothing is re-exported across packages. Motion, loaders, icons, illustrations and sound build on core, and react on core, motion and icons, so an app imports each thing from the package that owns it (components from `@youj/react`, the provider from `@youj/core`, motion primitives from `@youj/motion`, icons from `@youj/icons`), and importing one icon bundles only that icon.

### Dependency contract

- **`@youj/core` is a peer** of motion, loaders, react, icons, sound and illustrations, and `@youj/motion` a peer of react (`workspace:*`, packed as the exact `<version>`); both are devDependencies for building and testing them. It owns `YoujProvider`'s React contexts, so an app must have exactly one copy: as a plain dependency, a routine update could nest a second one, and the provider would silently stop reaching components. The CLI installs it explicitly and `doctor` flags a missing, unlisted or duplicated copy.
- **`react` and `react-dom` are peers** everywhere (`^19`), never dependencies; so is `motion` (`^13.4.4 || ^14`: the workspace builds on 13.4.4, and a CI leg of the smoke test installs 14). The CLI installs `motion@^14`, and registry items name the newest alternative of a range, because an install command with `||` in it breaks in a Windows shell.
- **`tailwindcss: ^4` is a peer**: required by `@youj/react`, whose components are Tailwind classes, and optional for core, motion, icons and illustrations, where only the stylesheet needs it.
- **`@base-ui/react` is a peer of `@youj/react`, bounded to the minors it was tested on (`>=1.8.0 <1.10.0`)** because Field imports two Base UI internals (`internals/field-root-context`, `internals/labelable-provider`) that any minor may change. The repo itself builds on `~1.8.0` (a devDependency), and the smoke test's newest-versions leg installs 1.9. `packages/ui/src/components/ui/field-base-ui.test.tsx` guards their shape; widen the upper bound only after re-checking Field and passing both smoke legs. The CLI installs `@base-ui/react@~1.9.0`; copy-in registry items name `~1.8.0`, the version the source was written against.
- **Internal ranges are `workspace:*`**, which `pnpm pack` turns into the exact `<version>`: the kit releases together, so a package manager refuses a skewed install. `scripts/check-packages.mjs` (part of `pnpm verify`) packs every package and fails on a `workspace:` or non-exact `@youj/*` range, a missing peer, or `@youj/core` or `@youj/motion` as a dependency. `pnpm smoke` installs the tarballs in fresh apps and checks there's one copy of `@youj/core`.

### The registry's versions

The docs site serves the copy-in registry twice: `/r/v<version>/<name>.json`, this release's items (their registry dependencies name the same version), and `/r/<name>.json`, the latest alias that the shadcn directory lists (`apps/docs/scripts/registry.ts`). The CLI reads its own version's, so copied code matches the packages it installs and doesn't change with each deploy; `--latest` reads the alias. Items' npm `dependencies` carry the owning package's range (`motion@^13.4.4`, `@base-ui/react@~1.8.0`).

Each released version's registry files are archived once and restored into `public/r` on later builds, so every version's `/r/v<version>/` URLs keep working; maintainers handle the archive.

The workspace manifests stay `"private": true`, so `npm publish`, `pnpm publish` and `changeset publish` all refuse or skip them: only the release script publishes. It packs each package with pnpm (which builds it with tsdown, swaps `exports` to `dist/` through `publishConfig` and resolves `workspace:` ranges), drops scripts and devDependencies, and publishes the result. Versions already on the registry are skipped, so a rerun is safe. `.changeset/config.json` has `"access": "public"` and the fixed group ready, but changesets never publishes.

## 1. Describe each change

In every pull request that changes what a package's users get (code, types, styles, a registry item's source, the CLI's or the MCP's behavior):

```bash
pnpm changeset
```

**Before the first release** (while CHANGELOG.md says `## 0.1.0 (Unreleased)`) there are no changesets: the first publish is exactly 0.1.0, and the root CHANGELOG.md's 0.1.0 section describes everything. Add a line there instead. `pnpm check:changesets` fails on any pending changeset until that heading is dated, so a branch that brings one has to drop it when it merges.

Pick the packages it touches (the group releases together either way, but the changelog lists it under the ones you pick), the bump, and write one line for the changelog: what changed for the user, not how. Commit the file it creates in `.changeset/`. A change to the docs site alone, tests or tooling needs none.

**Which bump, while 0.x:**

| Bump | When | Examples |
| --- | --- | --- |
| `patch` | Fixes and additions: nothing a user does breaks | A bug fix; a new component, prop, value, token or icon; an accessibility fix; a refined color or motion within the same tokens; a deprecation (the old name still works) |
| `minor` | Anything breaking | Removing or renaming an export, a prop or a value; changing a default; renaming a CSS variable, token or `data-slot`; a control's size or layout changing; raising a peer's minimum; renaming a registry item or its file paths; removing something deprecated |
| `major` | Never while 0.x | `pnpm check:changesets` (part of `pnpm verify`) fails on one, because it would publish 1.0.0. Going to 1.0 is its own decision. |

After 1.0 the usual meaning returns: patch for fixes, minor for additions, major for breaking changes.

For a breaking change, start the changeset with **Breaking:**, then the migration in a sentence or a before and after. If an app is likely to hit it, also write an upgrade guide from [docs/upgrade-guides/_template.mdx](docs/upgrade-guides/_template.mdx).

**Deprecate first, wherever it's cheap.** Replacing rather than removing (a renamed prop, a renamed value)? Keep the old name working for at least one more minor release:

1. Mark it `@deprecated` in its JSDoc with the replacement and the removal version (`@deprecated Since 0.3.0: use \`variant\`. Removed in 0.5.0.`). The props table and the MCP show it.
2. Keep the old path working and delegating to the new one. There is no runtime warning helper: the JSDoc tag is the notice.
3. Say so in prose on its docs page with `<Deprecated name since removeIn>`.
4. The deprecating release is a patch; the removing release, a later minor, says **Breaking:**.

## 2. Keep the API snapshot current

`api/<package>.api.md` is the public API of each package: every entry point, every export, its signature as written (with the defaults a component destructures) and the props each component declares. `pnpm check:api` (part of `pnpm verify` and CI) fails when the code's API and the snapshot differ, and prints what changed.

When the change is intended:

```bash
pnpm api:update
git add api/
```

Read the diff in `api/` in review: a removed or changed line is a breaking change and needs a `minor` changeset; an added line is a `patch`. After merging several branches that each changed the API, run `pnpm api:update` once more on `main` and commit the result.

## 3. Prerelease on `next` (optional)

The alpha releases themselves (0.1.0, 0.2.0…) go on `latest`: there is no stable release to protect. `next` is only for a prerelease of a future version. Before a minor release with breaking changes, let testers try it on the `next` channel:

```bash
pnpm changeset pre enter next    # once: later versions become 0.5.0-next.0, -next.1…
pnpm version-packages            # 0.5.0-next.0, with CHANGELOG entries
# commit, then gate and publish as in steps 5 and 6, on the next channel:
YOUJ_NPM_TAG=next pnpm release --to npm
```

Testers install with `pnpm add @youj/react@next` (or `npx @youj/cli@next init`); everyone else stays on `latest`. Each further round is `pnpm version-packages` (→ `-next.1`) and the same publish. When it's ready:

```bash
pnpm changeset pre exit
pnpm version-packages            # 0.5.0
```

and release it as usual, on `latest`. The release script refuses a prerelease without `YOUJ_NPM_TAG=next`, and a release with it.

## 4. Version

On an up-to-date `main`, with the changesets merged:

```bash
pnpm version-packages
```

All packages move to the same new version, each package gets its `CHANGELOG.md` entries, and the changeset files are deleted. Then write the release up in the root [CHANGELOG.md](CHANGELOG.md) (the docs' `/changelog` page reads it): a `## 0.5.0 - 2026-11-02` heading, and **Breaking**, **Added**, **Changed** and **Fixed** sections, each breaking entry with its migration. Commit as "Release 0.5.0" and push.

## 5. Gate it

- **The docs site** is built and deployed by maintainers, separately from a release. Packages going to npm don't depend on it.
- **Anything going to npm** gets the full gate first, on the release commit, with nothing else running:

  ```bash
  npm_config_workspace_concurrency=1 pnpm verify   # every check, including check:api and check:changesets
  pnpm -F docs build                                # the site, its budgets and the registry
  pnpm smoke                  # the packed packages in fresh Next.js and Vite apps (newest peers; --motion <v> --base-ui <v> pin them)
  pnpm release:dry --to npm                         # build, pack and npm publish --dry-run
  ```

  The Release workflow runs `pnpm verify` itself before publishing.
- **The Figma kit** is rebuilt and checked on the same commit, because it draws from the code's tokens and class strings:

  ```bash
  pnpm -F @youj/figma verify       # parity with the components (variants, props, colour roles), the integrity build, the drift guards
  pnpm -F @youj/figma build        # the plugin bundle the docs site zips
  pnpm -F @youj/figma cover:docs   # only if verify says the docs' cover images are stale (the kit's counts moved)
  ```

  A new component or block needs no Figma work to release: `packages/figma/test/parity-baseline.json` lists what the kit doesn't draw yet, and it only shrinks. When a release draws one, remove it from the list; when it changes a drawn component's variants, update the drawing (`packages/figma/src/plugin/components`) to the same values.

## 6. Publish

One-time setup:

1. Own the `@youj` organisation on npmjs.com.
2. Name the copyright holder: `node scripts/set-license-holder.mjs "<Legal Name>"` sets the root and every package's LICENSE and the packages' `author`; `--check` confirms it.
3. Create an npm automation or granular token that can publish to both.
4. For GitHub Actions, store it as the `NPM_TOKEN` secret of a `release` environment (Settings → Environments, with yourself as required reviewer). The repository must be public for provenance.

Then release:

```bash
pnpm release:dry --to npm
NODE_AUTH_TOKEN=<npm token> pnpm release --to npm
pnpm changeset git-tag && git push --tags
```

Or from GitHub: **Actions → Release → Run workflow** with registry **npm** and channel **latest** (or **next** for a prerelease). It runs only from `main`, waits for a reviewer to approve the `release` environment, then runs the checks (including `pnpm check:changelog`, which needs a dated `## <version> - <date>` heading in CHANGELOG.md), the consumer smoke tests and the docs build, then the release, CLI first; leave **dry run** ticked to rehearse. From Actions the script adds `--provenance` automatically (the job has `id-token: write`); local publishes carry none.

Then deploy the docs site from the release commit, so the docs, the `/changelog` page and the registry at `/r` describe the version that's out. Keep the time between the npm publish and the docs deploy short: `npx @youj/cli add` reads the registry on the docs site.

The packages' `repository`, `bugs` and README links point at `https://github.com/youj-dev/ui`. If the repository has moved, set `YOUJ_REPO_URL` to its https URL for the release (and the dry run), and the published copies link there instead; the dry run prints the URL it used.

`--to npm` publishes scoped packages with public access, and unpublishing is limited after 72 hours, so rehearse first. A version, once published, can never be published again with different contents: a mistake is fixed by the next patch.

## Checklist

- [ ] Every user-facing change since the last release has a changeset; none says `major`.
- [ ] Breaking changes say **Breaking:** with a migration; the ones apps will hit have an upgrade guide.
- [ ] Anything removed was deprecated in an earlier release (unless it was experimental).
- [ ] `api/` is current (`pnpm check:api`), and every change in it has a changeset.
- [ ] `stability.json` is right: new items labeled, anything that moved up or down noted in the changelog.
- [ ] `pnpm version-packages` ran; the versions agree; the root CHANGELOG.md has the release written up.
- [ ] The full gate passed on the release commit (step 5).
- [ ] `pnpm release:dry --to npm` looks right: the versions, the channel, the files.
- [ ] Published on the right channel: `latest` for a release, `next` for a prerelease.
- [ ] Tags pushed (`pnpm changeset git-tag && git push --tags`).
- [ ] The docs site shipped from the release commit.
- [ ] A fresh `npx @youj/cli@<version> init` works in an empty app.
- [ ] `pnpm e2e:install` passes: a fresh Next.js and Vite app set up as the docs say, with every block, example, icon, illustration, loader, miniature and sound pack (about an hour, with the network; `scripts/e2e/install.mjs` lists what it accepts as known).

## Rehearsing locally

`YOUJ_NPM_REGISTRY` points the script at any other registry, for example a local [Verdaccio](https://verdaccio.org) to rehearse the whole install.  The CLI reads the same variable: `YOUJ_NPM_REGISTRY=<url> npx --registry <url> @youj/cli init` points the app's `@youj` scope there in its `.npmrc`, and `YOUJ_REGISTRY_URL` points `init --mode registry` and `add` at a locally built registry.

To rehearse that local registry, build it with `NEXT_PUBLIC_SITE_URL` set to the origin you'll serve it from, so the items' dependency URLs point there too (without it they name production's `https://www.youj.dev/r`), then serve `apps/docs/public` and point the CLI at it:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:4000 node apps/docs/scripts/registry.ts
node scripts/serve-static.mjs apps/docs/public 4000
# in the test app
YOUJ_REGISTRY_URL=http://localhost:4000/r npx @youj/cli add sidebar
```

Serve it statically rather than with `pnpm -F docs dev`, whose `generate` step rebuilds `public/r` without the variable. Run the registry script again without it when you're done.

## Installing in an app

The full guide is the docs site's Installation page. Public npm needs no registry setup or token: `npx @youj/cli init`, or by hand `pnpm add @youj/react @youj/core @youj/motion @youj/icons` and one stylesheet line after Tailwind:

```css
@import 'tailwindcss';
@import '@youj/react/styles.css';
```
