# @youj/figma

A Figma development plugin that builds the Youj kit from the code: variables for every theme and mode, text and effect styles, every icon as a component, the isometric illustrations as static vectors, the foundations pages and a component set for every component in packages/ui in either component look (Classic, the default, or Bezel), bound to the variables so they re-theme. A new file is built in Classic on Basalt, dark. Private, never published; it lives here so the kit is regenerated from the same sources as the packages.

## Run it (about a minute)

1. From the repo root, once: `pnpm install`.
2. Build the plugin: `pnpm -F @youj/figma build`. It writes `packages/figma/dist/code.js` (the kit's data is inlined; the plugin never touches the network).
3. In **Figma desktop**, create a new design file in your **Drafts**.
4. **Plugins → Development → Import plugin from manifest…** and pick `packages/figma/manifest.json`. You only do this once.
5. **Plugins → Development → Youj kit → Build or update the kit.** A panel lists each step as it runs. A clean build closes it and lands you on the cover. If a step fails, the build carries on with the next, the page it was drawing says what failed, and the panel stays open with the problems (**Copy report** copies the whole build report).

**Re-running:** run the same command again after pulling code changes (rebuild first with `pnpm -F @youj/figma build`). Nothing is duplicated: variables, styles, icons and component sets are updated in place by the id the kit stamps on them, and the documentation pages are redrawn. If the run stops for any reason, the pages it didn't reach say so, and running it again finishes them.

**If something goes wrong:** the panel lists the failing step and **Copy report** copies the whole report; the cover repeats it; **Plugins → Development → Show/Hide console** has the stack traces. A failed step never blocks the others (a failed page gets a notice); a failed step the others need (fonts, variables, styles, pages) skips them and says why.

Development plugins run only in the **desktop app**; in the browser there is no *Import plugin from manifest…*. The docs site offers the same plugin as a zip (`/downloads/youj-figma-plugin.zip`, built from this package on every docs build).

To draw the components in the other look: **Plugins → Development → Youj kit → Look → Bezel** (or **Classic (default)**). It rebuilds the kit in that look, redrawing each set in place (same nodes, so instances stay linked), and later builds keep it. The look is a file-wide choice, as `look` is a provider-wide one in code, rather than a variant property: a `Look` variant would double every set and map to no prop.

To see another theme: **Plugins → Development → Youj kit → Theme → Terminal · Dark** (or any preset and mode). The presets are exactly the ten that ship: Basalt (the default, first), Graphite, Terminal, Brutal, and the six that match the docs' backdrops (Meadow, Sandstone, Cinnabar, Umber, Seaglass, Heather). Ten is the most a Professional file holds as modes of one collection, so the internal Iris and Linen stay out. Their colours are per mode: the contract's `{ light, dark }` accent and status values and each preset's chart palette (`role/chart-1…5`) resolve per theme and mode into the Theme collection's raw values, and the Color collection's Light and Dark modes alias them. `test/data.test.ts` checks the chart palettes reach the variables exactly as the contract gives them.

## What you get

| Page | What's on it |
| --- | --- |
| Cover | The logo (the lettered word in the ink, no badge, each letter its own vector bound to `role/fg`, the j’s square tittle in the brand’s yellow in dark and blue in light, whatever the theme) on its construction grid, what the kit holds, and a report of this build: the plan it detected, the style, the collections it made, any font fallback, anything worth a look |
| Colour | Every theme in light and dark with real component instances inside, then the roles as a table, every swatch bound to its variable |
| Type | The text styles: the UI scale as a size × weight matrix, the Youj Display steps, headings, body and mono |
| Spacing & radius | Spacing bars bound to their variables, radius and control heights per theme, elevation and focus |
| Motion | Durations, easing curves, spring responses and staggers for the three personalities, drawn from the same maths Motion runs |
| Icons | Every icon as a component named `Icon/<category>/<name>`; the ones that switch states are sets with a `State` property (`State=menu`, `State=close`) |
| Illustrations | Every isometric scene as a static vector, by the registry's categories, each in Basalt light and dark side by side. They're drawings (a scene paints from CSS custom properties Figma doesn't have), captured through the docs explorer's own SVG export, so they don't re-theme |
| Components | A component set per component, with labelled variant grids, in the chosen style. Actions: Button, Toggle, Toggle group. Forms: Input, Textarea, Select trigger, Field (label, input, help, error), Checkbox, Radio and Radio group, Switch, Slider. Display: Badge, Avatar, Kbd, Separator, Skeleton, Progress, Alert, Banner, Card, Table row. Overlays: Tooltip, Popover, Dropdown menu (open, with Menu/Item), Dialog, Toast. Navigation: Tabs, Pagination, Breadcrumb, Sidebar item. Data: Data grid (a representative frame: toolbar with view tabs, search and Filter, head row, rows at compact, comfortable and spacious heights with a selected row, pager; its cells are Checkbox, Badge and Button instances). Meters: Gauge, Segmented meter, Limit meter, Share bar, Treemap and Histogram range (static examples), Filter chips. The catalog (every other component in packages/ui, drawn by batch from `src/plugin/components/catalog.ts`): inputs (Native select, Button group, Segmented control, Capsule and Theme toggles, Async button, Inline confirm, Input group, Input OTP, Number, Password and Phone inputs, Rating, Choice card, Form, Slide to confirm); pickers (Calendar, Date, Date range and Time pickers, Combobox, Multi-select, Tag input, Wheel picker, Scrub number field, Color and Color opacity fields, Gradient slider, File and Avatar upload, Signature pad, Currency swap, Multi-language input); overlays and menus (Accordion, Collapsible, Hover card, Alert dialog, Sheet, Drawer, Context menu, Menubar, Command and Command palette, Navigation and Mega menus, Notification center, Account menu, Workspace switcher, Share and Export dialogs, Session timeout, Tour, Radial menu, Action island); layout and navigation (Spinner, Empty, Aspect ratio, Typography, Scroll area, Resizable, Countdown, Stepper, Anchor nav, App header, Bottom tab bar, Item pager, Wizard, Toolbar, the Capsule family, Presentation, Carousel, Tree view, Sortable list, Kanban, Action list, Property list, Inspector panel); data and charts (Chart, Sparkline, Stat card and pill, Data table, Timeline, Progress, Breakdown and Contribution lists, Unit, Waffle, Radar and Hierarchy charts, Flow graph, Dot map, Route and Seat maps, Calendar heatmap, Diff bar, Diff viewer, Code block, Hatched bar, Forecast band, Distribution strip, Level matrix, History strip, Proposal card, Avatar stack, Chat, Filter builder, Import mapper); instruments and media (Refill, Allocation and Lane meters, Segmented and Share rings, Progress path, Day rail and ring, Time lanes, Rollout ruler, Stage rail, Severity timeline, Slot grid, Dial, Hours dial, Activity rings, World clock, Track timeline, Waveform scrubber, Audio recorder, Voice orb, Image compare and accordion, Annotated image, Live cursors, Whiteboard). Charts, meters and big composites are static examples (a fixed dataset, at rest); gradients and hatching are flat tints, since Figma can’t bind gradient stops to variables. |
| Blocks | Eight cards, sections and screens captured from Storybook at 1440px in Basalt dark and Bezel, for reference, grouped by level: the marketing hero and pricing, Login, Dashboard shell, Customers with the data grid, Agent trace, Service health and Model compare |

**Variables**

| Collection | Modes | Holds |
| --- | --- | --- |
| Theme | Basalt, Graphite, Terminal, Brutal, Meadow, Sandstone, Cinnabar, Umber, Seaglass, Heather | Radius, control heights, density, font families, and the raw colours each mode resolves to (`light/…`, `dark/…`, hidden from pickers) |
| Color | Light, Dark | The names to use: `role/canvas`, `role/fg-muted`, `role/accent`, `role/accent-text`… Each is an alias, into Theme or into another Color variable, so Figma shows the same graph as youj.css (`role/focus` → `role/accent`) |
| Scale | one | Spacing (`space/4` is `p-4`), the type scale, the focus ring, the icon stroke |
| Motion | Precise, Calm, Lively | Durations, easing curves, springs and staggers, for reference |

Every variable carries the CSS it mirrors as its code syntax (`var(--background)`) and where its value comes from as its description.

**Styles:** text styles in Inter and JetBrains Mono, Basalt's families (`UI/base/Medium` is `text-ui font-medium`; `Bezel/Eyebrow` and `Bezel/Title` are bezel.css's two voices; `Display/xl` to `Display/subheading` are the docs site's type-display-xl to type-subheading steps in Youj Display, the brand face from `packages/brand-font`, one weight, drawn at the size a desktop width gives. Youj Display isn't a Figma font until it's installed from `packages/brand-font/fonts/youj-display.otf`; without it the Display styles fall back to Geist, with a note on the cover), with sizes and line heights bound to Scale; effect styles `Shadow/xs` to `Shadow/lg`, `Focus/ring`, `Focus/field` and `Focus/field invalid`, `Bezel/raised` and `Bezel/key`, each layer's colour bound to a Color variable so elevation follows the theme and mode.

**Bezel:** the style's colours (`role/well`, `role/key` and `role/control` are roles; `bezel/raised`, `bezel/band`, the card's `bezel/section-1…4`, the badge tints… are its private ones) are Color variables resolved per theme and mode from bezel.css's helpers and inline mixes; its shapes (`bezel/pill`, `bezel/field-radius`, `bezel/menu-row-radius`) are Theme numbers from its formulas. Each component file draws bezel.css's recipe for it when the build is in Bezel (`src/plugin/components/bezel.ts` lists the recipes drawn, drift-guarded).

**Components** use auto layout throughout. Fills, strokes, text, height, padding, gap and radius are bound to variables; text and the button's icon are component properties; variant values are the code's props (`Variant=outline, Size=sm, State=hover`).

Motion lives in code. Icons are drawn in their rest pose and state icons in both states; component states are drawn at rest. Storybook and the docs site play the motion.

## Plans and what they change

Figma caps the modes a variable collection can have by plan. At the time of writing (September 2026):

| Plan | Modes per collection | Pages per file | Libraries |
| --- | --- | --- | --- |
| Starter (free) | 1 | 3 in team files, unlimited in drafts | No |
| Professional | 10 | Unlimited | Yes |
| Organization | 20 | Unlimited | Yes |
| Enterprise | Unlimited, with extended collections | Unlimited | Yes |

The plugin doesn't need to know your plan. It probes the cap first (adding modes to a scratch collection until Figma refuses, then removing it) and lays the same names out to fit:

- **Enough modes (Professional and up):** the four collections above. Pick a frame's Theme and Color modes in the Appearance panel and everything inside re-themes; the Colour page shows every theme live.
- **One mode (Starter):** each theme becomes its own single-mode collection (`Theme · Graphite`, `Theme · Terminal`, …) and Motion likewise. `Theme` and `Color` become single-mode interfaces that alias the theme and mode in use, so components bind to exactly the same names. **Youj kit → Theme → …** re-points them and the whole file re-themes. The Colour page binds each panel straight to its theme's collection, so every preset still shows correctly.
- **Three pages (a Starter team file):** the kit folds into Youj (cover and foundations side by side), Icons (with Illustrations) and Components (with Blocks). Drafts have no page limit.

The cover's build report says which layout it used. Moving the file to a paid plan and running the plugin again folds the per-theme collections back into modes; nothing is duplicated.

**What a paid plan adds:** themes as real modes on any frame (no command needed), publishing the kit as a team library so other files can use the components and variables, and Dev Mode, where the code syntax on every variable reads as the CSS custom property.

## After the code changes

Run `pnpm -F @youj/figma build`, then the plugin again (the **Rebuild the Youj kit** button on the file's properties panel does the same). It updates in place:

- Variables, styles, icons and components are found by the plugin data the kit stamps on them, and updated. Their ids don't change, so instances in your designs stay linked and keep their property values (labels, swaps, toggles).
- Tokens and icons removed from the code are removed from the kit.
- The documentation sheets are redrawn on every run. Keep your own work on other pages, or next to the sheets.
- A layer override inside an instance (rather than a property value) can reset when its component is redrawn. Customise instances through their properties.

## How it's built

- `src/data` is the data step, run at build time: the colours come from the theme derivation (`derive.ts`) and youj.css's role block, resolved per theme and mode with the ui package's token maths; radius and control heights are evaluated from ui.css's formulas over each theme's contract; spacing and the type scale from Tailwind's theme and ui.css; motion from `tokens.ts`; the logo from `docs/brand/logo.ts`. Icons are rendered by React exactly as the docs render them at rest, cleaned by the docs' `static-svg.ts`, then flattened: transforms baked into absolute path data, SVG masks and clip paths turned into explicit Figma luminance and alpha masks (Figma's SVG import drops SVG masks), zero-length dots turned into discs.
- `src/plugin` is the plugin: variables, styles, pages, icons, sheets and components, all idempotent. `run.ts` runs the build as steps (`steps.ts`): each step is isolated, a failed one leaves a notice on its page and the build goes on, pages carry an "isn't built yet" notice until they're drawn, and the run ends with a census of every page (logged to the console, empty pages reported). `panel.ts` is the progress panel.
- Fallbacks never stop a build: fonts fall back style by style and family by family (Inter and JetBrains Mono, then Roboto and Roboto Mono, then what the file has), with a note on the cover; any refusal to add a mode is read as the plan's mode cap and any refusal to add a page at three pages as the page cap, whatever Figma's wording; code syntax is optional.
- `scripts/build.ts` bundles `src/plugin/main.ts` into one ES2017 script with the kit inlined; `scripts/blocks.ts` captures the reference blocks.

## Development

```bash
pnpm -F @youj/figma verify    # typecheck (Node and plugin configs) and tests
pnpm -F @youj/figma build     # dist/code.js
pnpm storybook                      # then, in another terminal:
pnpm -F @youj/figma blocks          # recapture assets/blocks in Basalt dark (default http://localhost:6006)
pnpm -F @youj/figma illustrations   # re-export assets/illustrations (Basalt light and dark, svgo-shrunk) from the Storybook gallery
# icons need no capture: the build renders them from the registry every time
```

The tests run the plugin against a fake `figma` global (`test/fake-figma.ts`) that enforces the rules real plugins trip on: fonts loaded before text edits and text layout changes, HUG only on auto layout and FILL only inside it, the dynamic-page async APIs, plan limits on modes and pages, strict paint and effect shapes, Figma's variable naming rules and bindable fields, baseline alignment only in rows, `findAll` reaching into instances. `test/integrity.test.ts` builds on every plan and checks the result: each page holds its sheet and nothing stranded, every component set has well-formed variants, every bound variable resolves, every text node is in a loaded font, nothing is zero-size or off the canvas; then `test/failures.test.ts` injects failures (an API that throws, an unloadable font, differently worded plan errors, a run that stops half way) and checks the build carries on and says so. The other tests cover the data step, the plan-limit fallback, in-place updates (a second run leaves the file unchanged and your instances linked), and run the bundled `code.js` itself in a sandbox for both plans. Drift guards fail when a component's class strings change in `packages/ui`, so its drawing here gets updated too.

To look at the kit without Figma, render the fake build to HTML and PNG (an approximation of Figma's renderer, good enough for layout and themes):

```bash
PREVIEW_DIR=/tmp/kit pnpm -F @youj/figma exec vitest run test/preview.test.ts
PREVIEW_PLAN=starter PREVIEW_THEME=terminal:dark PREVIEW_DIR=/tmp/kit-terminal pnpm -F @youj/figma exec vitest run test/preview.test.ts
PREVIEW_STYLE=classic PREVIEW_THEME=graphite:light PREVIEW_DIR=/tmp/kit-classic pnpm -F @youj/figma exec vitest run test/preview.test.ts
```

## Roadmap (level 2)

- **New components**, following the same pattern: an entry in one of the catalog batches (`src/plugin/components/catalog.ts`), drawn from its class strings with a drift guard. Every component in packages/ui is drawn today (`test/parity-baseline.json` lists none).
- **Illustrations per preset:** re-capture for another preset by changing `PRESET` in `scripts/illustrations.ts`, or draw each scene from tokens instead of static colours.
- **Slots** (Figma's slot properties) for Card content and Dialog bodies, once they're stable in the plugin API.
- **Code Connect**, on plans with Dev Mode: map each component set to its React component and props, so Dev Mode shows real `<Button variant="outline">` code. The variant values already match the props.
- **Library publishing** on a paid plan: publish the kit and use the variables and components from product files.
- **Theme fonts:** bind the text styles' families to the `font/sans` and `font/mono` variables, so Terminal sets in JetBrains Mono and Graphite in Inter, once the style weights can follow the family too.
