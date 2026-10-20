# Working on @youj/loaders

What it is: loading animations, 228 polite status loaders. Each one is a file that draws a scene on one shared ticker, built on `@youj/core`. The kit (`LoaderRoot`, the props, the engine) is the package's `.` entry; every loader is its own entry, `@youj/loaders/<id>` (`LoaderVortex` from `@youj/loaders/vortex`), and installs on its own with `npx @youj/cli add loader-<id>`. What it does for users is in [README.md](README.md).

Nothing here imports `@youj/motion`, icons or scenes: loaders depend on core only. The motion rules in [packages/motion/CONTRIBUTING.md](../motion/CONTRIBUTING.md) apply (tokens from the provider, semantic colors, reduced motion, token lint).

## House rules

What typically drifts here. The root [Principles](../../CONTRIBUTING.md#principles) apply too.

- Depend on `@youj/core` only. No motion, icons or illustrations.
- A loader is a polite status indicator: provider timing, semantic colors, a designed reduced-motion state (`lint:tokens` checks colors and durations).
- Naming is fixed: `loader-<id>`, `Loader<Id>`, `yj-<id>`, story `Visuals/Loaders/<Category>/<Title>`. Each loader is its own entry.
- Draw on the shared ticker (the kit in the `.` entry); do not start a loop of your own.
- `loaders:generate` writes the entries and registry items; `loaders:check` fails when they are stale. Only `registry/loaders.json` (the kit item) is hand-written.

## Layout

`src/` mirrors the path `youj add` installs to (`components/youj/loaders/<category>/<id>.tsx`), so copied files keep their relative imports. Core is imported by source path (`@youj/core/lib/youj/provider`); the build points it at core's entry and the registry at the app's `@/lib/youj/…`.

`registry/loaders.json` (the `loader-kit` item) is hand-written. Everything else in `registry/` is generated.

## Adding a loader

`src/components/youj/loaders/LOADERS.md` is the guide: layout, template, contract and tests. In short, add `<category>/<id>.tsx` and its story, then run `pnpm -F @youj/loaders loaders:generate`.

Never edit what it writes: `registry/loaders-<category>.json` and the loaders' entries in `package.json` `exports` and `publishConfig.exports` (tsdown builds exactly those). `verify` fails until they are current.

## Commands

`pnpm -F @youj/loaders typecheck|test|lint:tokens|loaders:generate|loaders:check|registry:check|verify`. `verify` runs the typecheck, token lint, `loaders:check`, the registry closure and the tests.

## Rules

- **Names:** the registry item is `loader-<id>`, the component `Loader<Id>`, the class `yj-<id>`, the story title `Visuals/Loaders/<Category>/<Title>`.
- Loaders are polite status indicators, so they follow the motion rules: provider timing, semantic colors, a designed reduced-motion state.
