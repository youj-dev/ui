---
'@youj/cli': patch
'@youj/core': patch
'@youj/react': patch
---

Fixes from a red-team pass over the setup tool and the kit:
- **Copy-in types:** a copied `useLabels()` is typed as the package's is, so the frame blocks, `app-week-calendar`, the waveform scrubber, capsule player and track timeline, and `create --mode registry` pass `tsc` and `next build`. `add` puts back an import that shadcn pointed at a file of the same name in the dependencies it copies as well (`account-menu`'s `ColorMode`), and in a copy an earlier run left that way. `doctor` names real items in its fixes (`icon-settings`, not `settings`).
- **CLI:** a failed registry `init` leaves no `components.json` behind. An option a command doesn't take stops the run and names the nearest one (`--dryrun` is no longer a real run). `add` refuses what the other commands refuse (no `package.json`, a workspace root, React 18, a `--cwd` that isn't a folder) and takes `-c` for `--cwd`. `init` checks its files are writable before it installs anything, and a write that fails says so in one line. `doctor` accepts the `./youj.css` import `init` writes on the Pages Router, ignores `<YoujProvider` in a comment, and flags a setup that stopped partway.
- **Share dialog:** Tab leaves the open suggestions for the next control, where it used to drop focus to the page.
