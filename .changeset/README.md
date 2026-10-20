# Changesets

Each file here describes one change to the packages (`@youj/core`, `@youj/motion`, `@youj/loaders`, `@youj/sound`, `@youj/icons`, `@youj/react`, the `@youj/cli` CLI and the `@youj/mcp` server) and how much it bumps them. Add one with `pnpm changeset` in the pull request that makes the change. `pnpm version-packages` turns the pending changesets into version bumps and changelog entries. See `RELEASING.md` at the repository root.

The packages are a fixed group: they always release together at the same version, so an app can match them exactly, and the CLI installs the kit at its own version.
