# Working on the youj CLI

What it is: the setup CLI (`npx @youj/cli`): `init`, `add`, `create`, `doctor` and `mcp`. What it does for users is in [README.md](README.md).

## House rules

What typically drifts here. The root [Principles](../../CONTRIBUTING.md#principles) apply too.

- The CLI imports no Youj package by name; it fetches Youj code from the registry (`pnpm check:imports`). It reads core and ui source by relative path only for what it needs at run time.
- File edits in `codemods.ts` are careful string edits anchored on one landmark each, so code the CLI does not own keeps its formatting. Cover each with a snapshot against a fixture app.
- Test with `test/fixtures` and a fake package manager. Never run a real install or touch the network in tests.
- Changing what a command writes is a golden-file change: update the snapshots on purpose and say why in the pull request.
- Rebuild before trying `node dist/cli.mjs` (`pnpm -F @youj/cli build`); the tests fail on a stale `dist/`.
- Keep the registry shape in sync with `apps/docs` (`/r`) and `packages/ui/entries.json`. If an item name or entry changes, update the CLI and the docs together.

## Layout

```
src/cli.ts           argument parsing, the help text and dispatch; one file per command beside it (init.ts, add.ts, create.ts, doctor.ts, mcp.ts)
src/codemods.ts      the file edits `init` makes
test/                tests per command; test/fixtures/ has a starter app per framework
```

## Adding a command or an edit

- **A command:** add its file in `src/`, dispatch it and write its help text in `src/cli.ts`, and test it in `test/`.
- **A file edit `init` makes:** add it to `src/codemods.ts` as a careful string edit anchored on one landmark, and snapshot it through the fixtures (see "Working on it").

## The registry it talks to

Built items name their registry dependencies by URL, on the docs site's origin (`apps/docs/lib/site.ts`: the deployment's, or production's in a local build). The CLI fetches every Youj dependency from the registry in use whatever origin it names (`registry.ts`), so a registry served from anywhere works. On the registry, with a registry of your own or a token, it hands shadcn local copies of the items whose dependencies point at each other, since shadcn would fetch the named origin, and without the token.

**A private registry.** For a registry that answers only with a bearer token (a self-hosted one, say), set `YOUJ_REGISTRY_TOKEN` (in the shell or the app's `.env.local`) and the CLI sends `Authorization: Bearer <token>` on its own registry fetches, and only to that registry. `init --mode registry` writes the header into `components.json` for shadcn, as a reference to the variable, never the token itself:

```json
{
  "registries": {
    "@youj": {
      "url": "https://registry.example.com/r/{name}.json",
      "headers": { "Authorization": "Bearer ${YOUJ_REGISTRY_TOKEN}" }
    }
  }
}
```

shadcn fills `${YOUJ_REGISTRY_TOKEN}` in from the environment or `.env.local` and stops with an error when it's missing. `add` fetches every item itself with the token, so it works in an app without the namespace too. The public registry at www.youj.dev needs no token.

## Working on it

`src/` holds the commands; `codemods.ts` holds the file edits, which are careful string edits anchored on one landmark each (no AST printer, so `npx` stays small and code the CLI doesn't own keeps its formatting). `test/fixtures/` has a starter app per framework; the tests run `init` against copies of them with a fake package manager and snapshot every edited file.

## Commands

```bash
pnpm -F @youj/cli typecheck|test|build|verify
```

`verify` typechecks, rebuilds `dist/` and runs the tests. `dist/` is gitignored, so a checkout can hold a build older than `src/` and `node dist/cli.mjs` then runs old behaviour; the tests fail when `dist/cli.mjs` is older than `src/`, so run `pnpm -F @youj/cli build` (or `verify`) before trying the CLI from a checkout.

To try `init --mode registry`, `add` or `create` against the registry in your checkout, build it with `NEXT_PUBLIC_SITE_URL` set to the origin you'll serve it from (so its dependency URLs point local, not at production), serve it, and point the CLI there:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:4000 node apps/docs/scripts/registry.ts
node scripts/serve-static.mjs apps/docs/public 4000
YOUJ_REGISTRY_URL=http://localhost:4000/r npx @youj/cli add sidebar
```

See RELEASING.md for rehearsing the npm packages the same way.

## Rules

The CLI's `src/` imports no Youj package by name (it fetches Youj code from the registry); `pnpm check:imports` fails if it does. It does read `packages/core` and `packages/ui` source by relative path (the theme, look and frame-file modules, `entries.json`), because the build bundles them; keep those paths to what the CLI needs at run time.
