# Security policy

Youj is a UI kit, so most of what it ships runs in your app's browser, and some of it (the CLI and the MCP server) runs on your machine. This page says which versions get fixes, how to report a vulnerability, what happens after you do, and what the code does and doesn't do.

## Supported versions

The packages version together, as one fixed group, and they're pre-1.0. Fixes land in the latest minor release only; there are no backports to older minors.

| Version | Supported |
| --- | --- |
| Latest `0.x` minor | Yes |
| Older `0.x` minors | No: upgrade to the latest |

## Reporting a vulnerability

Please don't open a public issue, discussion or pull request for a vulnerability.

Report it privately by email to [support@youj.dev](mailto:support@youj.dev), with "Security" in the subject. Only the maintainer reads it. Once the repository is public you can also use GitHub's private vulnerability reporting: [Report a vulnerability](https://github.com/youj-dev/ui/security/advisories/new) on `youj-dev/ui`, which only the maintainer can see.

A useful report has:

- the package and version (`npx @youj/cli doctor` prints them),
- what an attacker can do, and under which conditions,
- the smallest reproduction you can make: a repository, a sandbox or the steps.

## What to expect

1. **Acknowledgement.** The report is read and acknowledged on the advisory.
2. **Assessment.** We confirm the issue and its impact with you, in the advisory's private thread.
3. **Fix and release.** The fix is developed privately and shipped in a new release of the latest minor.
4. **Disclosure.** The advisory is published once the release is out, crediting you unless you'd rather not be named. A CVE is requested through GitHub where one applies.

There's no fixed response time, and no promise of one.

## Scope

In scope:

- the published packages: `@youj/core`, `@youj/react`, `@youj/motion`, `@youj/icons`, `@youj/illustrations`, `@youj/loaders`, `@youj/miniatures` and `@youj/sound`;
- the CLI, `youj`;
- the MCP server, `@youj/mcp`, including the hosted one at `https://mcp.youj.dev`;
- the registry output: the JSON items served at `https://www.youj.dev/r` and the source they copy into your app.

Out of scope:

- vulnerabilities in third-party dependencies (Base UI, Motion, TanStack, the shadcn CLI and the rest). Please report those upstream; once there's a fixed version, an issue here asking us to move to it is welcome;
- the docs site itself, unless the problem reaches the registry output, Create's exported code or the packages;
- the Figma plugin, which is a private development tool and isn't published.

## Supply chain

- **Releases** are published by the Release workflow in GitHub Actions (`.github/workflows/release.yml`). It only runs when a maintainer starts it by hand, never on a merge, and it installs from the lockfile and runs `pnpm verify` and the consumer smoke tests before it publishes.
- **No install scripts.** No package has a `preinstall`, `install` or `postinstall` script, so installing Youj runs no code of ours.
- **Few dependencies.** `@youj/core` depends on `clsx` and `tailwind-merge`; the other packages build on `@youj/core` and take React, Motion and (for `@youj/react`) Base UI as peer dependencies. `@youj/react` adds `@youj/icons`, TanStack Table and Virtual, `class-variance-authority` and `react-resizable-panels`. Heavier libraries (recharts, react-hook-form, date-fns, react-day-picker, embla-carousel-react, cmdk and the Lottie player) are optional peer dependencies, installed only by the apps that use them. The CLI depends on `@clack/prompts` alone, and the MCP server has no runtime dependencies: what it needs is bundled in.
- **Provenance.** Packages published to npm carry npm provenance, which links each version to the public workflow run and commit that built it. Check it on the package's npm page or with `npm audit signatures`.
- **Lockfile.** `pnpm-lock.yaml` is committed, and CI and releases install with `--frozen-lockfile`.
- **Licence.** The code is [MIT licensed](LICENSE) (the brand marks belong to their owners; [Credits and licenses](https://www.youj.dev/docs/contributing#brand-marks) lists them), and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) carries the licences of the work it builds on.

## What the tools do on your machine

**The CLI (`youj`)** sends no telemetry. It fetches registry items itself, from `https://www.youj.dev/r/v<version>/` (or `YOUJ_REGISTRY_URL` when you set it), and runs your package manager to install packages from npm or your configured registry. For some steps it also runs the shadcn CLI (`shadcn@4.21.0`, through `npx`, `pnpm dlx` or `bunx`), and those tools follow their own policies. It writes only to your project, except `youj mcp`, which can add the MCP server to an editor's settings in your home directory.

**The MCP server (`@youj/mcp`)**, run locally, sends no telemetry and makes no network requests. It talks to your editor over stdio and answers from an index bundled with its version. Its setup checks read files inside the directory it runs in (links that lead outside are refused) and never write.

**The hosted MCP server (`https://mcp.youj.dev`)** runs the same server on Cloudflare. Your editor sends it your queries, and Cloudflare keeps standard request logs. Run `npx @youj/cli mcp` instead to keep everything on your machine.

**Sound (`@youj/sound`)** is local. The built-in packs' audio is part of the package, so nothing is fetched from a third party, and the player and the pack only load, as chunks of your own app, once you give `YoujProvider` a `sound` pack. A custom pack loads the files you point it at.

**The components** make no network requests of their own and collect nothing. The Lottie player loads the animation files you give it, and its runtime (an optional peer, from LottieFiles) fetches its WebAssembly from a public CDN unless you configure them otherwise.
