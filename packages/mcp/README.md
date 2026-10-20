# @youj/mcp

> Alpha (0.x): APIs can change between minor versions. See [Versioning](https://www.youj.dev/docs/versioning).

The Youj MCP server. It lets AI coding tools (Claude Code, Cursor, VS Code, Windsurf, Codex, Gemini CLI, Zed or any other MCP client) find, understand and install Youj: components, blocks, hooks, animated icons and their morphs, brand marks, isometric illustrations, tokens, themes and motion.

Connect to the hosted server, public and read-only, with nothing to install:

```bash
claude mcp add --transport http youj https://mcp.youj.dev
```

Other clients take `https://mcp.youj.dev` as a remote server's URL; the [MCP docs](https://www.youj.dev/docs/mcp#connect) have the config for each.

Or run it yourself, to inspect your own project or work offline:

```bash
npx @youj/cli mcp          # adds it to your editor's config
npx -y @youj/mcp      # runs it over stdio
```

Run locally, it answers from an index bundled with the package, so it describes the version it ships with.

| Tool | What |
| --- | --- |
| `search` | By meaning, across components, blocks, icons, illustration scenes (by name, category and tag), hooks and docs; each result names the tool to call next and its exact import (with the install command) or `npx @youj/cli add` |
| `list_components` / `list_loaders` / `list_miniatures` | Every component by category (filter by `kind` or `category`), every loading animation, every interactive miniature |
| `get_component` | Purpose and alternatives, install, usage, props, motion tokens, reduced motion, accessibility |
| `search_icons` / `get_icon` | Icons by meaning (synonyms, typos), filtered by static, morph or swap; triggers and the accessible button pattern |
| `suggest_icon_morph` | "play → pause": a state icon choreographed for the pair, else an IconSwap with the fitting transition |
| `list_blocks` / `get_block` | Summaries, components used, the install command, and the files as `npx @youj/cli add` writes them (`blocks/app/customers.tsx`), with the import that uses them and the package imports of what they use; source a page at a time |
| `list_illustrations` | The ready-made scenes by category, with ids and tags; one scene is `get_component("illustration-coffee")`. Also points to the illustration builder and the copy-in `illustration-kit` |
| `get_illustration_guide` | How to compose a new scene in the illustration builder's JSON format: the volume and grid, every part type, prism and lathe preset, shade, variant and base (read from the builder's own model), composition rules that read at small sizes, and three of the builder's templates as worked examples |
| `draw_illustration` | A scene in that format, checked by the builder's model (an invalid one returns every problem with its fix), as a component for the project's route (on the package, the builder's `BuiltScene` from `@youj/illustrations/builder`; on the registry, the builder's own code export over the copied-in kit), the file to write, the install command and a builder link to see, tweak and export it |
| `get_tokens` / `create_theme` | A preset's tokens (Basalt by default); a theme from a brand colour over a preset (Basalt unless another is named), checked for contrast, applied dark and in a component style (`style: classic \| bezel`, classic by default) |
| `motion_guidance` | An interaction ("list reorders") to the piece that already does it |
| `get_project_info` | Read local framework, package manager, install route, Youj/React/Tailwind versions and setup warnings; optional `cwd` (defaults to the server's working directory) |
| `get_add_command` | Exact install command and imports for component, block or illustration scene names (`illustration-coffee`), using the project's route and package manager, including optional peers |
| `setup` | `npx @youj/cli init`, the manual route (Basalt, dark and classic by default; bezel with `look`), and doctor-style checks on a pasted package.json or stylesheet |

The project tools are read-only and keep reads inside `cwd`, including symlink targets. Hoisted packages outside it are not inspected; declared ranges are labelled separately from installed versions. Registry configuration takes precedence when both routes are present. Package commands omit dependencies already declared or installed. Blocks, templates, illustration scenes and the illustration kit are copied in with `npx @youj/cli add`, and every answer follows the docs policy: import from `@youj/react`, copy in only with that CLI (`test/policy.test.ts` sweeps the answers for shadcn commands and repository paths).

Resources: `youj://docs/{slug}` (every docs page as Markdown), `youj://components`, `youj://tokens`. Prompts: `build-screen`, `brand-theme`.

## Contributing

Working on this package itself: [CONTRIBUTING.md](https://github.com/youj-dev/ui/blob/main/packages/mcp/CONTRIBUTING.md) in the repository.
