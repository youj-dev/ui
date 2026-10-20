# Showroom

The shared shell behind /miniatures, /illustrations and /loaders, built any area (illustrations, icons, loaders…) can show its items the same way, one module at a time: a **hero** with one item live on a paper stage and its **panel** beside it, and under it an **explorer**: a sticky **viewfinder** strip over a **grid** of cards. Nothing here knows about objects; an area brings its items, what goes on the stage and what goes in the panel's slots.

```
ShowroomHero ─ viewfinder(orientation)          ┐ from lg a glass island on the plate's lower edge (presentation 'island') or a column beside the stage ('column'); a row under it on phones
             ─ search(placement)                │ a ShowroomSearch: a companion `ActionIsland` of one tile beside the island (its panel rises over the stage), a button at the row's end (a bottom sheet)
             ─ stage (any content)              │ plate (a Stage in its own light or dark), drafting grid, crop marks, glow
             ─ readout · view · toolbar         │ across the plate's top: a StageReadout at its start, Raw | In context at its middle, the toolbar (transport, view, tool, fullscreen, then keys and Copy code) at its end
             ─ header: eyebrow + links          │ the panel, top: what it is (above the stage on narrow screens)
                       name · byline            │
                       description · meta       │
             ─ children (PanelSections)         │ the panel, foot: its controls, then
             ─ actions (PanelActions)           ┘ Use it, the panel's width, on the plate's bottom edge
ShowroomExplorer ─ bar? (a ViewfinderBar, sticky under the header, for an area that keeps its viewfinder there)
                 ─ children: ShowroomGrid of ShowroomCards
```

Wrap the page in `TooltipProvider` (`@youj/react`): the toolbar, the strip and the step buttons all have tooltips.

## Files

| File | Exports |
|---|---|
| `hero.tsx` | `ShowroomHero`, `PanelLink`, `PanelSection`, `PanelRow`, `PanelNote`, `PanelActions`, `StageReadout`, `StageView` |
| `use-dialog.tsx` | Use it's parts, inside the site's large code modal: `UsePreview`, `RouteSwitch`, `UseSteps`, `UseStep`, `UseInstall`, `UseCode`, `PropsSheet`, `RegistrySource`, `Mono` |
| `viewfinder.tsx` | `ViewfinderStrip`, `ViewfinderBar`, `Viewfinder`, `ViewfinderOrientation` |
| `explorer.tsx` | `ShowroomExplorer`, `ShowroomGrid`, `ShowroomCard` |
| `stage-frames.tsx` | `useStageFrames`, `StageFrames` (for areas whose items run in an iframe) |
| `hooks.ts` | `useShowroomSelection`, `useArrowStepping`, `useRevealHero`, `useStageScheme`, `pick`, `writeParam`, `ownsArrows`, `Scheme` |
| `thumb.tsx` | `ShowroomItem`, `Thumbs`, `hasThumb` |
| `search.tsx` | `ShowroomSearch`, `SearchEntry`, `ShowroomSearchHandle` |
| `presentation.ts` | `ViewfinderPresentation` (`bar` · `column` · `island`), `DEFAULT_PRESENTATION` (island), `presentationOf` (reads `?strip=`); no directive, so a server module can take it |

## Items

```ts
interface ShowroomItem {
  id: string // also its value in the address
  label: string // tooltip, accessible name, card title
  thumbs?: { light: string | null; dark: string | null } // each falls back on the other; none draws an empty tile
  draw?: (square: boolean) => ReactNode // draws its own picture instead, in the page's theme (illustrations: a still scene)
}
```

Map the area's own records to these once (`useMemo`); the hero and the panel keep using the area's richer record.

## Hooks

- **`useShowroomSelection({ items, param, initial, fallback? })`** → `{ selected, index, item, prev, next, select }`. The item on show lives in `?<param>=<id>` (`replaceState`, so Back leaves the page); `initial` is what the server read from the address (render it server side so a link never flashes the fallback), an unknown name falls back (`fallback`, else the first) and is dropped from the address. `prev`/`next` go round; both are `undefined` for a single item.
- **`useArrowStepping({ prev, next, onStep })`**: ← and → anywhere on the page (mirrored in RTL), except in fields, groups that use arrows themselves (`ownsArrows`), the grid (`data-showroom-grid`) or with a modifier. A focused iframe takes its own keys.
- **`useRevealHero(heroRef, nameId)`** → `reveal()`: after a card's `select(id)`, glides the page up to the hero (jumps under reduced motion) and focuses the item's name. The same function for the page's life.
- **`useStageScheme(itemId)`** → `{ scheme, setScheme, mounted }`: the stage follows the site's light/dark live; `setScheme` overrides it for this item until the item or the site's theme changes. `mounted` is false until the site's theme is known (start loads after it).

## `ShowroomHero`

| Prop | |
|---|---|
| `eyebrow` | The area's name, the page's `h1` (`Miniatures`). |
| `links?` | Quiet links at the end of the area's name, to its other pages: `PanelLink`s (`Docs`, `Builder`). |
| `itemKey` | Re-keys the header's words so they fade in with each item. |
| `name`, `nameId` | The item's name, an `h2` with that id (labels the section; `useRevealHero` focuses it). |
| `itemClassName?` | Classes for the item's words (name, byline, description, meta): hidden while the page reads a link, say. |
| `announce` | Said politely on each change (`Fern, 3 of 62`). |
| `byline?` | The line under the name, its parts joined by a dot, the first strong: `[category, export]`, `[model, study]`. |
| `description?` | What it is: three lines on a phone, four from lg. Cut short, it ends in More, which lays the whole of it on a card exactly over the lines it continues (a popover; a sheet on touch), so reading it never moves the page. |
| `meta?` | One more line under the description: a spec. Not the tags: they're the search's words (`SearchEntry.tags`), matched, never pills. |
| `stage` | Anything, filling the plate: `<StageFrames>`, a component, a composition. Position it `absolute inset-0` or `size-full`. |
| `readout?` | What it's doing: a `StageReadout`, printed on the plate's top start corner level with the toolbar, in the stage's ink, truncating short of the toolbar whatever its width (a caption under the plate on a phone). A leaf of its own when it changes often (the miniatures' readout subscribes to what the miniature reports). |
| `scheme`, `onSchemeChange` | The stage's light/dark (from `useStageScheme`) and its toolbar switch. |
| `reduced`, `onReducedChange` | The stage's reduced motion and its toggle; the area decides what it means (the objects lab reloads its frame with `?reduced=1`; a React stage can wrap its content in `YoujProvider reducedMotion`). |
| `view?`, `onViewChange?` | **Raw \| In context**, for an area whose items have a context (loaders, illustrations; not miniatures): a segmented toggle of its own at the middle of the plate's top from sm, level with the readout and the toolbar, on the toolbar's chrome (its key glides on the kit's spring), moved toward the start only as far as it must to clear the toolbar; under the plate beside the readout on a phone. CSS alone. Raw is the default: the item alone on the paper. In context the area sets it in a realistic screen, the item as prominent as raw (a loader at its raw size, a scene drawn large): a big, minimal surface, never a busy page with the item a speck in it. |
| `transport?` | The area's playback (`IslandButton`s: Replay, Hold or Apart, a speed), leading the toolbar, a hairline before the view's controls. |
| `tool?` | One more icon for the stage's toolbar, an `IslandButton` from `components/explorer/island`, placed before Fullscreen. |
| `copy?` | The code Copy code copies (the import and the item as it's set on the page): an icon at the toolbar's end whose check and tooltip say Copied. |
| `keys?` | What can be pressed (the miniatures' key hints): one more icon in the toolbar's end group, before Copy code, a hairline after the view's controls: an `IslandButton` (`Keys`) that opens them, a popover (a sheet on touch). The keys work on the item without it, and the stage stays clear. |
| `toolbarLabel` | The toolbar's accessible name (`Fern: view`). |
| `viewfinder?` | `(orientation) => <ViewfinderStrip orientation={orientation} … />`: from lg a column beside the stage (`vertical`; it takes the stage's height, adds none) or an island (`island`), a row under the stage below lg. The server holds each place's room (CSS shows one per width); the browser draws only the one its width shows. |
| `presentation?` | `column` (default), `island` (the strip in a frosted pill centred on the plate's lower edge, a third of it on the paper, so the stage keeps the full width and its subject stays clear; the hero holds the room it hangs into) or `bar` (the hero draws none: the area puts a `ViewfinderBar` in its explorer, or under the hero). /miniatures and /illustrations read it from `?strip=`, island by default. |
| `search?` | `(placement) => <ShowroomSearch placement={placement} … />`: beside the island (`island`), or at the end of the row under the stage (`row`). With an island, the hero and its island make one screen (/miniatures and /illustrations have nothing under the hero). |
| `children` | The panel's controls: `PanelSection`s. |
| `actions?` | The panel's foot: `PanelActions`. |
| `ref` | The hero's section, for `useRevealHero`. |

Fullscreen takes the plate (toolbar included) where the browser allows it. While an iframe on the stage has focus, the plate wears a thin accent ring.

## The panel

Every area's panel is the same grammar, read top to bottom and tabbed through in that order: what it is, then what you do with it.

- **The header** (the hero draws it from `eyebrow`, `links`, `name`, `byline`, `description`, `meta`): information only, top-aligned with the plate. Navigation to the area's other pages is a quiet `PanelLink` here, never a button with an arrow among the controls.
- **The foot**: the area's controls (`children`), then its actions (`actions`), anchored to the plate's bottom edge, so stepping through items never moves them; only the header changes length, into the room between. No section folds open and no field grows into its neighbours: anything longer (a description, the props, the code, a list of labels) opens over the page, in a popover or the large code modal.
- **`PanelSection`** (`id`, `title`, `end?`): a titled group of controls (Theme; the loaders' Size & speed, Colors, Label), with a `PanelNote` or a control at its title's end. Its rows keep one pitch: a small step between rows, a larger one between sections.
- **`PanelRow`** (`label`, `value?`): a row on the panel's grid: its name (4.5rem), the control, its value at the end (a string reads left to right in any direction). Every row is the controls' height (`control-sm`: 32px, 40 on touch), a slider's as a menu's, so names and values share one baseline down the panel. Without a value the control takes the value's room too, so every boxed control ends on the same edge. Few options are segments (the kit's `SegmentedControl` at `sm`), many a menu (`Select` at `sm`), text one line (a longer edit in a popover laid over the row).
- **`PanelActions`** (`onUse(opener)`): the one action every area's panel has, **Use it**, the panel's whole width. It opens the area's Use it (below), lazily, on its first press; focus goes back to it (`returnFocus`). Copying the code is the stage toolbar's (`copy`).

## Use it

Every area's Use it is the site's large code modal (`components/ui/code-export-dialog.tsx`) filled the same way, from `use-dialog.tsx`, in its own chunk (nothing loads before the first press):

- **The head of the nav**: `UsePreview`, the item small and live on the stage's paper in the stage's light or dark (a loader as tuned, a scene floating, a miniature's picture: a second live miniature would cost more than it shows), over its name and byline.
- **Use it**, always first, the quick path in two `UseStep`s: 1 **Install**, `UseInstall` (the site's install field: the reader's package manager in its menu, the command in the code colors, copy), 2 **Put it on a page**, `UseCode` (the code in the site's code style; its ways to write it as tabs on its bar, its file and copy at the bar's end). Where an item can be copied in as well as installed, `RouteSwitch` (Package | Copy in) at the section's heading (`end`) switches both.
- Then the area's reference, in this order: **Download** where there are files (cards over the frame, on its background), **Props** (`PropsSheet`: the props data the page's server reads, `componentDoc(name)`, never a server-rendered table; a row reads down where the section is narrow), the area's own (**In a block**), **Source** (`RegistrySource`: the CLI's file from `/r/<item>.json`, code-shaped lines while it's read, a retry if it fails).
- A section fades in as it's opened (at once under reduced motion); the nav's arrows move between sections; Escape closes, and focus goes back to Use it.
- **`StageReadout`** (`label`, `value`, `state?`, `live?`, `loading?`): what the item is doing, as a value and a line on it with the particle lit while it's live; a group named for assistive tech, never announced.

## `StageFrames` (iframe stages)

`const stack = useStageFrames(mounted ? { key, src, title } : null)` then `stage={<StageFrames stack={stack} frameRef={frame} scheme={scheme} />}`. A new `key` loads a new frame on top and fades it in over the last one (at once under reduced motion), so the stage never flashes empty; at most three frames are kept through a run of changes. `stack.ready` is true once the current key's frame has loaded (read its document, apply a live scheme), and `frameRef` always points at the top frame.

## Explorer

```tsx
<ShowroomExplorer title="Illustrations" titleId="illo-explorer-title"
  bar={<ViewfinderBar label="Illustrations" noun="illustration" items={items} current={item.id} prev={prev} next={next} onSelect={select} />}>
  <ShowroomGrid id="illos" label={`${items.length} illustrations`} items={items}
    renderItem={(it, i) => <ShowroomCard item={it} current={it.id === item.id} eager={i < 10} meta={it.group} href={`?illustration=${it.id}`} onOpen={(id) => { select(id); reveal() }} />} />
</ShowroomExplorer>
```

- **`ViewfinderStrip`**: `items`, `current`, `onSelect`, `label` (the listbox's name), `prev`/`next` (disabled when undefined), `noun` (`The first illustration` when there's nowhere to go) and `orientation`: `horizontal` (Previous · row of square thumbnails · Next) or `vertical` (Up · column of 4:3 tiles filling its width, about eight in view · Down, filling the height it's given) or `island` (the docs examples' island: the kit's `ActionIsland` at its large size, its step buttons and its squares each an island tile's 44px; size it from outside, about nine squares in 46rem). It never changes the selection itself; it asks through `onSelect`.
- **`ViewfinderBar`**: the same strip, horizontal, in a glass bar sticky under the header across the hero's width (`ShowroomExplorer`'s `bar`).
- **`Viewfinder`** (inside them): an endless row of square thumbnails (or, `vertical`, a column of 4:3 tiles with the frame at its middle height, ↑/↓ stepping as well as ←/→) (three copies, the middle one a single-tab-stop listbox, the others hidden from assistive tech) under a fixed centred frame. A change springs the row to the nearest copy (critically damped, interruptible; at once under reduced motion and on first paint). Wheel, trackpad, mouse drag and touch scroll it freely, the frame dims, and 0.9 s after it rests it glides back. In the listbox, ←/→ step round, Home/End go to the ends, and focus follows the item on show. Only the tiles about a view's width either side of the frame carry their picture and tooltip (the same items in every copy, so a wrap changes nothing); the rest are bare tiles, and a change re-renders only the tiles it lights and unlights.
- **`ShowroomCard`**: `item`, `current` (accent border, `On stage`), `eager`, `meta` (caption word and accessible suffix), `href` (a modified click opens a tab) and `onOpen` (plain click). It's memoized: give it a stable `onOpen` (`useRevealHero`'s `reveal` and `useShowroomSelection`'s `select` are), so a pick re-renders two cards, not the grid. `ShowroomGrid` leaves a card far from the view unstyled and unpainted (`content-visibility: auto`); draw the grid after the hero (`useDeferredValue`), it's under the fold. It's the list's card (`.site-card`) around the thumbnail's stage, in both modes.

## Search

```tsx
<ShowroomSearch ref={search} placement={placement} noun="scene" plural="scenes" entries={entries} find={find} categories={categories} current={id} onSelect={select} />
```

- **`entries`**: every item as a `SearchEntry` (`item`, `meta` line, a few `tags`, `category` id), in the area's order. **`find(q)`**: the ids that match, best first (every id for an empty query): the area's own ranking (`indexIcons`/`searchIndex` from `components/icons/search`). **`categories`**: chips, any number on, each counting its matches for the query.
- A combobox over a listbox: the field keeps the focus, ↑/↓ move the active row round (`aria-activedescendant`; a pointer moving over a row makes it active), Enter or a click puts it on stage and closes, Escape closes, and focus goes back to the magnifier. `/` opens it from anywhere that isn't a field. It opens on the item on show until something is typed, without moving the page: the field takes the focus where it is (`preventScroll`) and only the list scrolls to the row (`listScroll`, never `scrollIntoView`, which scrolls the window too). `ref.open({ q, categories })` opens it on a search (a category picked elsewhere).
- The panel rises over the stage on a spring (a 2% overshoot, 550 ms) with a quick fade, and leaves quieter (a short fade, a few px); under reduced motion it appears. From the row it's the kit's bottom sheet, with the same list.

## Plugging in a new area

1. Make a page that reads the area's data. A prerendered public page (`app/miniatures`) passes `initial: null` and reads the address in a layout effect once in the browser (`components/miniatures/miniatures-showroom.tsx`).
2. In a client component: `items` → `useShowroomSelection` → `useArrowStepping` → `useRevealHero`, then render `ShowroomHero` (the stage and its readout, the panel's header slots, its `PanelSection`s and `PanelActions`, `viewfinder` and `search`) and, if the area lists its items under the hero, `ShowroomExplorer`, all inside `TooltipProvider`. `components/miniatures/` (a React stage: the real components, lazy per item, and a code modal of its own) is the reference; `stage-frames.tsx` remains for areas whose items run in an iframe.
3. Keep area logic (what the stage runs, the readout, keys) in the area's folder; add to this folder only what a second area needs too.
