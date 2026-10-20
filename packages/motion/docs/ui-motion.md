# Motion for @youj/react

How `@youj/react` components move. Everything here comes from `@youj/motion`; UI code never hard-codes timing. Every block, effect and preset follows the Storybook **Speed** control, the OS `prefers-reduced-motion` setting and `<YoujProvider reducedMotion="always">`.

- Showroom: Storybook `Motion/Transitions/*` and `Motion/Effects/*`.
- Verified on real Base UI 1.8: Popover, Menu, Dialog, Tooltip, Drawer, Tabs, ToggleGroup, Accordion and Toast, including swipe gestures and portals.

## 1. Setup

### Imports

| Entry | What |
|---|---|
| `@youj/core` | tokens, `YoujProvider`, `useYouj`, `useYoujScope`, `useLabels`, `useSoundCue`, `MotionFeatures`, `cn` |
| `@youj/motion` | transitions, effects, primitives |
| `@youj/icons` | animated icons, `createIcon`, `YoujIcon`, `IconSwap`, `useIconState`, `useIconTrigger` and the morph helpers |
| `@youj/motion/interactions` | interactions (ShimmerBorder, SpotlightCard, Dock, PageTransition…) |
| `@youj/motion/backgrounds` | WebGL and canvas backgrounds (MeshGradient, Aurora…) |
| `@youj/motion/players` | Lottie player |
| `@youj/core/styles/youj.css` | tokens + Tailwind + the motion presets (§2) |

```ts
import { useYoujScope } from '@youj/core'
import { SlidingIndicator, MorphLabel, useMorphRoot } from '@youj/motion'
```

### Motion elements: `m`, inside `MotionFeatures`

Render Motion's `m.*` elements, never `motion.*` (token lint rejects the import): `motion` carries Motion's whole feature bundle into every app that imports the component. `m` animates under a `LazyMotion`, and `MotionFeatures` supplies one with the features loaded lazily in their own chunk. YoujProvider supplies `'animation'` for its tree; each component that renders `m` elements also wraps its output in `<MotionFeatures>`, which does nothing under a boundary that already has them, so the component still animates without a provider. Layout animations and drag (`layout`, `layoutId`, `useMorphRoot`, `drag`) need `<MotionFeatures features="max">` around the element. Until the chunk lands, `m` elements render their initial state. Content inside an `AnimatePresence initial={false}` child that may hold `m` elements goes in `<PresenceSettled>`: Motion skips a first animation there, and under lazy features "first" is when the chunk lands, so a change made in between (a Counter's first play) would be lost. Imperative `animate()` and `useAnimate()` pull Motion's engine in statically; prefer declarative `m` props or a plain Web Animation (`element.animate`, timing from `k.ms()` and `k.ease()`).

```tsx
import { m } from 'motion/react'
import { MotionFeatures } from '@youj/core'

return (
  <MotionFeatures>
    <m.span animate={{ opacity: on ? 1 : 0 }} transition={k.tween('fast')} />
  </MotionFeatures>
)
```

### Portals: spread `useYoujScope()` on every Portal

`YoujProvider` carries Speed and reduced motion to CSS through custom properties on its wrapper. A Base UI Portal renders into `<body>`, outside that wrapper. **Without the scope, portaled overlays ignore Speed and a provider's `reducedMotion="always"`.** Base UI Portals render a `<div>` and accept these props:

```tsx
const scope = useYoujScope()
<DialogPrimitive.Portal {...scope}>…</DialogPrimitive.Portal>
```

Call it inside the component that renders the Portal, so it's under the provider.

### The CSS side of reduced motion

| Hook | Where | Meaning |
|---|---|---|
| `--yj-motion` | `:root` (follows the OS), each provider wrapper, each scope | `1` = motion, `0` = reduced. Inherits, so the nearest provider wins. **Multiply durations by it.** |
| `--yj-time-scale` | same places | Speed. Already folded into every `--yj-duration-*`. |
| `data-yj-reduced` | provider wrapper / scope | Present when the provider **forces** reduced motion. SSR-safe, so it doesn't reflect the OS. Handy for `in-data-yj-reduced:animate-none`. |

For bespoke transitions (a chevron that rotates, a switch thumb, a hover colour), use the duration utilities. They are token × Speed × `--yj-motion`:

```tsx
<ChevronDown className="transition-transform yj-duration-base ease-standard data-panel-open:rotate-180" />
```

`yj-duration-instant | fast | base | slow | deliberate`. Don't write `duration-150`, and don't use `duration-(--yj-duration-fast)` for movement, since it ignores reduced motion.

**The CSS spring.** `--ease-spring` is the motion personality's `smooth` spring sampled into a `linear()` curve, and `--yj-duration-spring` the time it takes to settle (640ms in precise, × Speed). Use them for a transform that should land like a JS spring: `transition: transform calc(var(--yj-duration-spring) * var(--yj-motion, 1)) var(--ease-spring)`, with opacity on a short tween beside it (`yj-pop`, `yj-tooltip` and `yj-dialog` enter this way). It's a curve, not physics: a reversal mid-flight restarts the curve from where the element is, so keep it for entrances and releases, and use `k.spring()` where a value is retargeted often.

### The motion budget: `quality` and `useMotionBudget()`

`<YoujProvider quality="auto | high | low">` (default: the enclosing provider's, `auto` at the root). `useMotionBudget()` returns `{ quality, tier }`, where `tier` is `'high' | 'low'`. On `auto` the tier is `low` when any of these holds, and `high` otherwise:

- Data Saver is on (`navigator.connection.saveData`, the client side of the `Save-Data` header), or `prefers-reduced-data: reduce` matches.
- The device has 2 or fewer logical cores, or 2 GB or less of memory.
- A one-off probe, run once the page is idle and cached for the session, is slow: a fixed slice of JS takes more than 5 ms (about 2.5× an M2-class core), or idle frames take more than 34 ms.

Server and hydration renders see `high`. What the low tier changes:

| Piece | Low tier |
|---|---|
| WebGL / canvas backgrounds | DPR capped at 1, 30 fps. NoiseField drops its faintest octave. ParticleConstellation, FlowField and Swarm keep 60% of their particles. MagneticField and RipplePond widen their pitch (about 60% of the dots); WarpGrid samples each line more coarsely. |
| CursorFollower | Off (the native cursor stays). |
| Stagger, TextSplit | Sequences longer than 6 steps are compressed to 6. |

Reduced motion still wins over all of this. A new heavy piece should read `useMotionBudget().tier` and shed work on `low`, and it must not change anything on `high`.

### Built-in copy: `labels` and `useLabels()`

`<YoujProvider labels={{ close: 'Schließen', pageOf: (page, total) => … }}>` translates the text components render or announce: close buttons, screen-reader text, placeholders, empty states. The keys are the typed `YoujLabels` interface in core's `labels-types.ts`, and `labels-defaults.ts` holds the English (both in `packages/core/src/lib/youj/`). Text with values in it is a function key. Nested providers merge (inner keys win, the rest inherit), and ThemeScope keeps the enclosing labels.

`useLabels()` returns the merged labels (English without a provider). A component with its own prop keeps it and falls back to the label: `loadingLabel ?? labels.loading`. Call `useLabels()` unconditionally at the top of the component, never inside a `??` fallback. New user-facing text in a component gets a key (see "Adding a label" in `packages/core/CONTRIBUTING.md`): reuse a shared key (`close`, `cancel`, `remove(name)`, …) when the English and the meaning match, and add a new one otherwise.

### Sound cues: `useSoundCue()`

Components don't play sounds; they emit **cues**, and the provider's `sound` pack (from `@youj/sound`) decides what plays. Core holds the bus and the options (`packages/core/src/lib/youj/sound-scope.ts`, `sound-cue.ts`): `SoundCueContext`, `useSoundCue()` and the `soundCues` list. Without a `sound` on the provider, the context is null and a cue is dropped, so a component pays for a context read and nothing else; core, motion and UI never import the sound package. A component emits through `const cue = useSoundCue()`:

- **Call it where the motion starts:** a press on pointer down, a toggle in `onCheckedChange`, an overlay when its open state flips, an outcome in `onStateChange`. Only for a person's own action, or an arrival (a toast); never on mount, hover, focus or a programmatic change.
- **The cues:** `tap` (a press), `select` (a tab, segment or option chosen), `toggleOn` / `toggleOff`, `success`, `error`, `notify` (a toast arrives), `open` / `close` (a surface), `tick` (a detent: a slider or stepper step). Don't invent one per component; pick the one whose meaning fits.
- **Give the component `sound?: boolean`,** default true, so an instance can be silenced (`sound={false}`). It never needs a required prop.
- **Don't gate it yourself:** the cue carries whether motion is reduced where it happened, and the provider handles the rest: off, muted, reduced motion (unless the provider's `sound.whenReduced`), a hidden tab, no user gesture yet, cooldowns and the voice cap.
- **Sound is never the only signal:** it doubles a visible change and, where there is one, an announcement.

## 2. Overlay presets: `presets.css`

These are Tailwind `@utility` classes for Base UI's lifecycle. Base UI mounts with `[data-starting-style]`, removes it a frame later, sets `[data-ending-style]` on close and unmounts when `getAnimations()` settle. The presets use transitions, so a reversal mid-way continues from where the element is. They animate `transform` and `opacity` and leave the individual `translate` / `scale` properties to you, so shadcn's `-translate-x-1/2 -translate-y-1/2` centring keeps working. `[data-instant]` (keyboard opens, Escape closes, moving between grouped tooltips or menubar menus) makes them instant, as Base UI intends.

**Replace shadcn's tw-animate classes** (`data-open:animate-in`, `data-closed:animate-out`, `fade-in-0`, `zoom-in-95`, `slide-in-from-*`, `duration-*`) with the preset. Don't combine them.

| Utility | Put it on | Motion | Reduced |
|---|---|---|---|
| `yj-pop` | Popover / Menu / Select / Combobox / ContextMenu / PreviewCard `.Popup` | scale .96 → 1 from `--transform-origin` on the CSS spring, fade `fast` / `enter`; exit to .98 `instant` / `standard` | instant |
| `yj-tooltip` | Tooltip `.Popup` | scale .97 + 3px from the trigger side (RTL-aware) on the CSS spring + fade `fast`; `instant` out to .98 and half the travel | instant |
| `yj-dialog` | Dialog / AlertDialog `.Popup` (positioned) | rise 6px + scale .96 on the CSS spring, fade `base` / `enter`; exit to 3px + .98, `fast` / `standard`. The parent recedes behind a nested dialog: it sinks, shrinks and dims under a wash that keeps its text legible. | instant |
| `yj-backdrop` | any `.Backdrop` | fade `base`, exit `fast`; thins with a Drawer swipe | instant |
| `yj-sheet-{top,right,bottom,left,start,end}` | Dialog-as-sheet or Drawer `.Popup` | slides fully off its edge, `slow` / `enter` in, `base` / `exit` out; follows Drawer swipes. `start` / `end` flip under RTL. A panel inset from its edge sets `--yj-sheet-gap` to the inset so it clears it. | instant |
| `yj-toast` / `yj-toast-top` + `yj-toast-content` | Toast `.Root` / `.Content` | Base UI's stacked toasts: peek + shrink behind, spread on hover or focus, rise in, swipe out | instant (swipe still tracks the finger) |
| `yj-collapse` | Collapsible / Accordion `.Panel` | height 0 ↔ `--*-panel-height` (then `auto`) + fade, `base` / `standard` | instant |
| `yj-fade` | Tabs `.Panel`, item indicators, scroll arrows | fade `fast` | instant |

Every duration is `token × --yj-motion`, so a zero duration tells Base UI there's nothing to wait for and it unmounts at once.

### Popover / Menu / Select

```tsx
function PopoverContent({ className, sideOffset = 6, ...props }: PopoverPrimitive.Popup.Props & { sideOffset?: number }) {
  const scope = useYoujScope()
  return (
    <PopoverPrimitive.Portal {...scope}>
      <PopoverPrimitive.Positioner sideOffset={sideOffset} className="z-50">
        <PopoverPrimitive.Popup
          className={cn('yj-pop rounded-lg border bg-overlay p-4 text-fg shadow-md outline-none', className)}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}
```

Menu and Select are identical (`MenuPrimitive.Popup`, `SelectPrimitive.Popup`). `yj-pop` sets `transform-origin: var(--transform-origin)`, so you don't need `origin-(--transform-origin)`.

### Tooltip

```tsx
<TooltipPrimitive.Portal {...scope}>
  <TooltipPrimitive.Positioner sideOffset={6}>
    <TooltipPrimitive.Popup data-yj-tone="inverse" className="yj-tooltip rounded-md bg-inverse px-2 py-1 text-xs text-fg" />
  </TooltipPrimitive.Positioner>
</TooltipPrimitive.Portal>
```

Put triggers in a `Tooltip.Provider` so moving between them switches instantly (`data-instant`).

### Dialog / AlertDialog

```tsx
<DialogPrimitive.Portal {...scope}>
  <DialogPrimitive.Backdrop className="yj-backdrop fixed inset-0 z-50 bg-black/50" />
  <DialogPrimitive.Popup
    className="yj-dialog fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-overlay p-6"
  />
</DialogPrimitive.Portal>
```

Nested dialogs need nothing extra. The parent gets `[data-nested-dialog-open]` and `--nested-dialogs` from Base UI, and `yj-dialog` makes it recede a step: it moves down, scales .94 and dims under a wash (`::after`, black at 12%) rather than by opacity, so its text stays above 4.5:1 in both themes. Retune the wash with `--yj-dialog-dim`. The popup must be positioned (`relative` or `fixed`) to give the wash its box, and `yj-dialog` owns its `::after`. Base UI doesn't render the child's backdrop.

### Sheet (Dialog-based) and Drawer

```tsx
const side = { top: 'inset-x-0 top-0', right: 'inset-y-0 right-0 h-full w-3/4 sm:max-w-sm', bottom: 'inset-x-0 bottom-0', left: 'inset-y-0 left-0 h-full w-3/4 sm:max-w-sm' }
<DialogPrimitive.Portal {...scope}>
  <DialogPrimitive.Backdrop className="yj-backdrop fixed inset-0 z-50 bg-black/50" />
  <DialogPrimitive.Popup className={cn(`yj-sheet-${dir}`, 'fixed z-50 flex flex-col gap-4 bg-overlay', side[dir])} />
</DialogPrimitive.Portal>
```

Prefer `yj-sheet-start` / `yj-sheet-end` with `start-0` / `end-0` in RTL-aware layouts. Use full class names (`yj-sheet-right`, …) somewhere in source so Tailwind generates them, for example a lookup object, never a template string alone.

With **Base UI Drawer**, the same classes follow the finger (`--drawer-swipe-movement-*`), and a flick leaves faster (`--drawer-swipe-strength`). `yj-backdrop` thins with `--drawer-swipe-progress`:

```tsx
<DrawerPrimitive.Root swipeDirection="right">
  <DrawerPrimitive.Portal {...scope}>
    <DrawerPrimitive.Backdrop className="yj-backdrop fixed inset-0 bg-black/40" />
    <DrawerPrimitive.Viewport className="fixed inset-0 flex justify-end">
      <DrawerPrimitive.Popup className="yj-sheet-right h-full w-80 bg-overlay" />
    </DrawerPrimitive.Viewport>
  </DrawerPrimitive.Portal>
</DrawerPrimitive.Root>
```

### Toast

`yj-toast` owns the stack's geometry (`position: absolute`, full width, `bottom: 0`, height clamped to the front toast while collapsed) and all of its motion. `yj-toast-top` stacks against the top edge. The viewport only needs a position and a width. Tune spacing with `--yj-toast-gap` and `--yj-toast-peek` (both default `0.75rem`).

```tsx
function Toaster() {
  const { toasts } = ToastPrimitive.useToastManager()
  const scope = useYoujScope()
  return (
    <ToastPrimitive.Portal {...scope}>
      <ToastPrimitive.Viewport className="fixed right-4 bottom-4 z-50 w-[356px] max-w-[calc(100vw-2rem)]">
        {toasts.map((toast) => (
          <ToastPrimitive.Root key={toast.id} toast={toast} className="yj-toast rounded-lg border bg-overlay shadow-lg">
            <ToastPrimitive.Content className="yj-toast-content flex items-start gap-3 p-4">
              <ToastPrimitive.Title className="text-sm font-medium" />
              <ToastPrimitive.Description className="text-sm text-fg-muted" />
              <ToastPrimitive.Close aria-label="Dismiss" />
            </ToastPrimitive.Content>
          </ToastPrimitive.Root>
        ))}
      </ToastPrimitive.Viewport>
    </ToastPrimitive.Portal>
  )
}
```

The collapsed stack peeks (12px steps, 5% smaller each), and hovering or focusing the viewport spreads it with gaps. New toasts rise in from the edge, and swiped toasts leave in the swipe direction from where the finger let go. `yj-toast-content` hides the text of toasts behind the front one until the stack spreads.

### Collapsible / Accordion

```tsx
<AccordionPrimitive.Panel className="yj-collapse text-sm">
  <div className="pb-4">{children}</div>
</AccordionPrimitive.Panel>
```

The panel clips while it animates, so keep focus rings inside the padding (inner `div`). `hiddenUntilFound` works unchanged.

### Tabs panels, indicators

`yj-fade` on `Tabs.Panel`, `Checkbox.Indicator`, `Menu.CheckboxItemIndicator` and the like. For the tab highlight itself, use `SlidingIndicator` (§3), not `Tabs.Indicator`.

## 3. Blocks

### SlidingIndicator: tabs, segmented controls, toggle groups, nav

A highlight that glides to the selected item. Drop one into the group's container. It treats the container's other children as items and finds the selected one from attributes those items already carry: `aria-selected`, `aria-current`, `aria-pressed`, `aria-checked`, and Base UI's `data-active`, `data-pressed`, `data-checked` and `data-selected`. That means no wiring to Base UI state.

| Prop | Default | |
|---|---|---|
| `variant` | `'pill'` | `'pill'` fills the item (`rounded-md bg-selected`), `'underline'` is a bar on its bottom edge (`h-0.5 bg-fg`). Restyle with `className`. |
| `follow` | `'active'` | `'hover'` follows the pointer and keyboard focus and fades out when they leave (a nav hover pill). |
| `match` | ARIA + Base UI states | Your own selector, e.g. `".is-current"`. |
| `linger` | `false` | When nothing matches (or the pointer leaves, with `'hover'`), holds the highlight on its last item for the `fast` token before it fades, so crossing a gap, a separator or a group label glides on to the next item instead of blinking out. Menus want it. No hold under reduced motion. |

**The container must be `relative isolate`.** The indicator sits at `-z-1`, behind the items' text. It glides on the `smooth` spring (transform-only layout projection, with round corners mid-flight, and it retargets mid-glide with its velocity). Resizes, font loads, wrapping and RTL re-place it without animating. A move that follows a key press (arrows, Home/End, typeahead, Tab) jumps, so holding ArrowDown through a menu never trails behind focus; the pointer, Enter and Space keep the glide, and the indicator carries `data-instant` after a jump. Reduced motion makes it jump.

```tsx
// Tabs (shadcn TabsList)
<TabsPrimitive.List className="relative isolate inline-flex items-center gap-1 border-b">
  {children}
  <SlidingIndicator variant="underline" className="-mb-px" />
</TabsPrimitive.List>

// Segmented control (ToggleGroup, single)
<ToggleGroupPrimitive className="relative isolate inline-flex rounded-lg bg-well p-0.5">
  <SlidingIndicator className="rounded-md bg-key shadow-sm" />
  {items}
</ToggleGroupPrimitive>

// Nav: a hover pill over links with aria-current
<nav className="relative isolate flex gap-1">
  <SlidingIndicator follow="hover" />
  {links}
</nav>

// Menu (Base UI Menu.Popup): the highlighted row, or the row whose submenu is open
<MenuPrimitive.Popup className="yj-pop relative isolate …">
  {children}
  <SlidingIndicator
    match="[data-highlighted], [role=menu]:not(:has([data-highlighted])) [data-popup-open]"
    linger
    className="rounded-md bg-hover"
  />
</MenuPrimitive.Popup>
```

A group can hold two indicators, for example an active underline plus a hover pill. Each group owns its own, so they never fight.

### MorphLabel + useMorphRoot: async states, copy feedback, toggles

Content that crossfades between states while its box morphs to the new width. The outgoing label is popped out of layout and hidden from assistive tech, so a button's name is only ever the current label. The morph is transform-only (layout projection). The box and the label share the `snappy` spring, which is why the box needs `useMorphRoot`.

```tsx
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const morph = useMorphRoot(8) // the button's corner radius in px
  return (
    <ButtonPrimitive
      render={<m.button {...morph} />}
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true) }}
      className="relative inline-flex h-8 items-center overflow-hidden rounded-md border px-3 text-sm"
    >
      <MorphLabel value={copied ? 'copied' : 'copy'} contentClassName="gap-1.5">
        {copied ? <><CheckIcon trigger="mount" size={14} strokeWidth={2} /> Copied</> : <><Copy /> Copy</>}
      </MorphLabel>
    </ButtonPrimitive>
  )
}
```

- `value` keys the content: a new value crossfades, the same value re-renders in place.
- Give the box `overflow-hidden` so the outgoing label doesn't spill while it shrinks.
- `ref` is a stable inner span, for effects such as a shake.
- `rise`: the new state rises out of a blur (`0.3em`, on the `snappy` spring) while the old one lifts away on the `instant` token; opacity and blur stay tweens. For labels that read as a step forward ("Send" → "Sent").
- `mode="letters"` (plain-text children): the run of letters the old and new label share at the start or end (two or more) stays mounted and glides to its new place; the rest leave, and the new letters ripple in after a short handoff (`stagger` tokens, capped at six steps). "Copy" → "Copied" keeps "Cop", "Save" → "Saved" keeps all four. The accessible name stays the whole label. Non-text children fall back to the label swap.
- Reduced motion swaps instantly.

### Collapse: height-auto disclosure outside Base UI

```tsx
<button aria-expanded={open} aria-controls="filters" onClick={() => setOpen(!open)}>Filters</button>
<Collapse id="filters" open={open}>
  <FilterForm />
</Collapse>
```

| Prop | Default | |
|---|---|---|
| `open` | (required) | |
| `keepMounted` | `false` | Keep closed content mounted (hidden, inert), e.g. to keep form state. |
| `duration` | `'base'` | Duration token for the height. |

The height eases to and from `auto`, and the content fades out faster than it collapses. A reversal continues from the current height. It clips only while moving, and closed content is `inert` at once. Use `yj-collapse` for Base UI Collapsible/Accordion instead.

### ContentSwap: skeleton → content

```tsx
<Card>
  <ContentSwap loading={isLoading} fallback={<InvoicesSkeleton />} loadingLabel="Loading invoices">
    <InvoiceList invoices={data} />
  </ContentSwap>
</Card>
```

The skeleton drops away quickly. The content resolves into focus one stagger step later, with a 4px blur and rise, and ends on `filter: none`. The box morphs between the two heights, so the page below moves with it. It works both ways (refetch), and a swap mid-morph starts from the current height. The region is `aria-busy` while loading, the fallback is `aria-hidden`, and `loadingLabel` adds a polite status. Shape the skeleton like the content, and stop its pulse under reduced motion (`motion-reduce:animate-none in-data-yj-reduced:animate-none`).

### PresenceList + PresenceItem: lists and table rows

```tsx
<table className="w-full table-fixed border-separate border-spacing-0 text-sm">
  <TableHeader>…</TableHeader>
  <PresenceList as="tbody">
    {rows.map((row) => (
      <PresenceItem as="tr" key={row.id} className="bg-canvas hover:bg-hover">
        {row.cells.map((cell) => (
          <td key={cell.id} className="border-b [tr:last-child>&]:border-b-0 p-2">…</td>
        ))}
      </PresenceItem>
    ))}
  </PresenceList>
</table>
```

- **Enter:** the row takes its slot and fades down a few px while the rows below glide to make room.
- **Exit:** the row fades where it stands, keeping its space so column widths hold, and is inert at once. Then the rows below glide up.
- **Reorder:** rows glide to their new slots on the `smooth` spring.
- Movement is FLIP on translate only (`layout="position"`), so there's no scale distortion.
- Rows are measured against the list (a layout root), so the list moving (a toolbar appearing above, a re-centring card) doesn't make rows glide.
- Each list is scoped, and **memoized rows still animate**.
- Reduced motion applies changes instantly.

**Table rules.** These were researched and verified in Chromium:

1. `border-collapse: collapse` (Tailwind's preflight default for every `<table>`) paints borders on the table grid, not the row, so borders stay behind while rows move. Use **`border-separate border-spacing-0` and put dividers on the cells**. shadcn's `TableRow` `border-b` does nothing in separate mode.
2. Give rows a background (`bg-canvas`, or `bg-surface` in a card) so rows crossing during a re-sort occlude cleanly.
3. `popLayout` is avoided on purpose: an absolutely positioned `<tr>` loses table layout. So is height collapse, because rows can't be clipped.
4. Prefer fixed column widths (`table-fixed` or column sizing), so removing the widest row doesn't reflow every column mid-animation.
5. **Don't use it with a virtualizer** (TanStack Virtual positions rows itself).
6. For whole-page replacements (pagination), key the `tbody` by page so the swap isn't 20 exits and 20 enters.

Lists work the same way: `<PresenceList className="flex flex-col gap-1">` renders a `ul` of `PresenceItem` (`li`). `as` takes `ul | ol | tbody | div` for the list and `li | tr | div | article | section` for items.

## 4. Effects

### Spotlight: a pointer-tracked light for surfaces

```tsx
// A card that lights up under the pointer
<SpotlightSurface className="rounded-xl border bg-card">…</SpotlightSurface>

// One light shared across many: neighbours light at their nearest edges
<SpotlightGroup className="grid grid-cols-3 gap-3">
  {plans.map((p) => <SpotlightSurface key={p.id} className="rounded-xl border bg-card">…</SpotlightSurface>)}
</SpotlightGroup>

// Just the tracker: writes --yj-spot-x / --yj-spot-y onto [data-yj-spot-card] for your own CSS
const ref = useRef<HTMLDivElement>(null)
useSpotlight(ref)
```

Keyboard focus parks the light on the focused surface and glides it between surfaces. It's off for touch. Reduced motion drops tracking and shows a static accent border on hover and focus. `SpotlightCard` and `SpotlightGrid` in `/pieces` are these same effects with the card look.

### Shimmer: a travelling light on a border

```tsx
<Shimmer className="rounded-xl bg-surface">
  <SearchInput />
</Shimmer>

// On your own element (e.g. a Button or link)
const { rootProps, layers } = useShimmer({ idle: 'subtle', speed: 'base' })
<a {...rootProps} className={cn(rootProps.className, 'rounded-full px-3')}>{layers}<span className="relative z-2">Try Pro</span></a>
```

Options: `idle` (`subtle | visible | hidden`), `intensify` (on hover and focus), `speed` (`slow | base | fast`), `borderWidth`. It's a pure CSS loop and pauses offscreen and in hidden tabs. Under reduced motion the light is parked. The element gets a `--color-line` border.

### Async feedback: pending → success / error

```tsx
function AsyncButton({ onAction, children }: { onAction: () => Promise<unknown>; children: ReactNode }) {
  const { state, run } = useAsyncAction(onAction) // { resetAfter?, onStateChange? }
  const morph = useMorphRoot(6)
  const labels = { pendingLabel: 'Saving…', successLabel: 'Saved', errorLabel: 'Couldn’t save' }
  return (
    <>
      <ButtonPrimitive
        render={<m.button {...morph} />}
        onClick={run}
        aria-busy={state === 'pending' || undefined}
        data-state={state}
        className="relative overflow-hidden …"
      >
        <AsyncFeedback state={state} {...labels}>{children}</AsyncFeedback>
      </ButtonPrimitive>
      <AsyncAnnouncer state={state} {...labels} />
    </>
  )
}
```

- **`useAsyncAction`** guards re-entry synchronously (a double click can't start two actions), treats a synchronous throw as an error, returns to idle after `3 × deliberate` (or `resetAfter`), and never updates after unmount.
- **`AsyncFeedback`** swaps through MorphLabel: a spinner, then the drawn `CheckIcon` or a cross with its label. Errors shake with a decaying 4/3/2px amplitude. Success and error tint the surface (`tint={false}` to opt out, which needs a `relative overflow-hidden` parent). Replace marks with `icons={{ pending, success, error }}`.
- **`AsyncAnnouncer`** belongs outside the button, because a button flattens its content. Pending and success are announced politely, errors assertively.
- **Reduced motion:** a text label replaces the spinner, and swaps and tints are instant, with no shake.

In `@youj/react`, don't rebuild this for a button: AsyncButton is this, finished (§5).

## 5. Patterns in `@youj/react`

Behaviours built from the pieces above that UI components already ship. Reach for these before composing the parts again.

### Async buttons: `AsyncButton`

AsyncButton runs async work itself when it gets `onAction`: the label morphs to a spinner, then to a drawn check and `successLabel`, or shakes to a cross and `errorLabel`, and the box morphs to each width on the same spring. It is `useAsyncAction` + `AsyncFeedback` + `AsyncAnnouncer` inside `useMorphRoot`, as above.

```tsx
import { AsyncButton } from '@youj/react'

<AsyncButton onAction={() => saveSettings(values)} pendingLabel="Saving…" successLabel="Saved" errorLabel="Couldn’t save">
  Save changes
</AsyncButton>
```

| Prop | Default | |
|---|---|---|
| `onAction` | | The work. Resolve for success; reject or throw for error. A press while it runs (a double click) is ignored. |
| `pendingLabel` | none shown, "Working…" announced | Shown beside the spinner and announced. |
| `successLabel` / `errorLabel` | "Done" / "Failed" | Shown beside the mark and announced (errors assertively). |
| `resetAfter` | `3 × deliberate` | How long success or error holds before the label returns. |
| `onActionStateChange` | | Every state change: idle → pending → success \| error → idle. |

- While pending the button is `aria-busy` and blocks presses but keeps keyboard focus (Base UI's `focusableWhenDisabled`), so nobody is dropped onto `<body>` mid-action.
- Icon-only sizes (`icon`, `icon-sm`, …) keep their shape: the labels are announced, not shown.
- `onClick` still fires first; `event.preventDefault()` skips the action. `status` is the controlled alternative to `onAction`: pass one.
- Reduced motion: the pending label replaces the spinner and every swap is instant.

### Disclosure chevrons: `CollapsibleChevron`

The mark for anything that opens and closes: Youj's `ChevronDownIcon`, turned over by its `active` state on the icon's `snappy` spring. It finds the nearest ancestor with `aria-expanded` and follows it, so it needs no wiring in a Collapsible, an Accordion, a NavigationMenu trigger, a sidebar group or a trigger composed through `render`. It mounts already in its real state (no turn on first paint), and reduced motion flips it instantly.

```tsx
import { Collapsible, CollapsibleChevron, CollapsibleContent, CollapsibleTrigger } from '@youj/react'

<Collapsible>
  <CollapsibleTrigger className="flex items-center gap-2">
    Advanced settings
    <CollapsibleChevron size={14} className="ms-auto text-fg-muted" />
  </CollapsibleTrigger>
  <CollapsibleContent>…</CollapsibleContent>
</Collapsible>
```

Put it inside the trigger (it looks up, not across), and let the trigger own the accessible name: the chevron is decorative.

## 6. Checklist for a UI component

- Timing only from `useYouj()`, the presets or `yj-duration-*`.
- Every Base UI Portal gets `{...useYoujScope()}`.
- No hard-coded user-facing text: names, sr-only text and placeholders come from `useLabels()` (a prop may override).
- A control whose motion answers a press may emit its sound cue through `useSoundCue()`, with a `sound?: boolean` escape hatch.
- Test in Storybook with Speed ¼× (catches hard-coded durations and unscoped portals) and Motion: reduced.
- Test interruption: toggle open/closed mid-animation, and re-sort mid-glide.
