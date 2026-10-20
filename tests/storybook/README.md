# Storybook suites

Two Playwright suites run against the built Storybook (`storybook-static`), locally and in CI (`.github/workflows/ci.yml`). Every story opens on its final frame: reduced motion is on, so entrances render finished and loops hold still. The page's clock starts at a fixed date and runs while the story loads, fonts arrive and the network goes quiet, then jumps a minute ahead and stops, after two more seconds of frames. So a story that fakes a fetch or delays a state is always caught at the same moment, and `Math.random` is seeded so jittery demos repeat too.

```bash
pnpm build-storybook        # both suites read the build
pnpm test:visual            # screenshots vs the committed baselines
pnpm test:visual:update     # accept a visual change: rewrite the baselines, review the PNGs, commit
pnpm test:a11y              # axe over every story, light and dark, plus RTL; target size over the UI stories
```

## Visual

- Baselines live in `__screenshots__/<story-id>.png`, 1200×800 in the dark theme.
- Screenshots differ between macOS and Linux, and slightly between CPU architectures, so `test:visual` and `test:visual:update` run inside the official Playwright Linux image (`mcr.microsoft.com/playwright:v<version>-noble`) on amd64, exactly as CI does. You need Docker running; Apple Silicon emulates amd64, so a full run takes about a minute. When you bump `@playwright/test`, bump the image tag in `ci.yml` too, and re-render the baselines.
- The set covers the hero stories and the UI component stories, apart from Playground and Reduced Motion stories (every shot is taken with motion reduced) and the shader backgrounds (half a megabyte of film grain each, and they shift with Chromium updates; review those in Storybook). A new hero story fails until you run `test:visual:update` and commit its PNG.
- `YOUJ_VISUAL=all pnpm test:visual` screenshots every story, e.g. to grow the set.
- In CI, a failure uploads the HTML report, with expected, actual and diff images, as the `visual-report` artifact.
- No Docker? Re-render the baselines in CI instead of on macOS: `gh workflow run visual-baselines.yml --ref <branch>` runs `test:visual:update` in the same image and uploads the `visual-baselines` artifact. Apply it with `rm -rf tests/storybook/__screenshots__ && gh run download <run-id> -n visual-baselines -D tests/storybook/__screenshots__`, review the PNGs and commit.

## Accessibility

- axe runs the way Storybook's a11y addon does: default rules on `<body>` (so page-level rules like a main landmark or an h1 are skipped), minus `region`, without Storybook's chrome, and with each story's own `parameters.a11y` (context excludes, disabled rules, `test: 'off'`) read from the preview. What passes in the Storybook panel passes here.
- A right-to-left pass runs axe again, in light, over every UI, Blocks and Examples story with the toolbar's Direction set to RTL: `dir="rtl"`, `lang="ar"`, Base UI's DirectionProvider and the Arabic labels (`locale="ar"`). Those are the stories whose accessible names, logical-property layout and direction-aware keys change; icons, pieces, players, primitives and foundations draw the same both ways and carry no built-in copy, so they'd add a third to the run for nothing new, and contrast doesn't change with direction. Keys read `"<story-id> (light, rtl)"`.
- `target-size.spec.ts` checks WCAG 2.5.8 (24×24 px, or the spacing exception) on every UI story by hit-testing 12px either side of each target's centre, so pseudo-element hit areas count (axe's own `target-size` rule reads boxes only, and is off by default). Accepted findings go in `a11y-known.json` as `"<story-id> (target)": ["target-size"]`.
- `a11y-known.json` lists findings accepted for now, as `"<story-id> (<theme>)": [rule ids]`. A finding that isn't listed fails the run. When a listed one stops occurring, the report notes "now pass: remove from a11y-known.json", so delete its entry. The notes are annotations, which the list reporter doesn't print: run with `--reporter=list,json` (and `PLAYWRIGHT_JSON_OUTPUT_NAME=<file>`) to read them. The entries left are scrollable regions that keyboards can't reach (Marquee, Parallax) and icon tabs outside a tablist (Icons in context › Communication).

## Skipping a story

Tag a story that can't render in the static build with `ci-skip`, and say why next to the tag:

```ts
export const Tasks: Story = {
  // Rolldown drops Reorder's initialisers in production builds.
  tags: ['ci-skip'],
}
```

Both suites leave it out. Everything else must render: a story that shows Storybook's error screen fails with the error.
