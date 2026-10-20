# Touch mode

Youj is two experiences, not one experience squeezed. On a pointer, a picker is a popover that grows out of its trigger. On a phone, it is a bottom sheet that rises where the thumb already is. This document is the contract for how a component does that. It is also the brief for adding the next one.

## The principle

**Responsive** changes layout with the *width of the viewport*. **Touch mode** changes presentation and behaviour with *how the thing is operated*. They are independent: a wide tablet is touch; a narrow desktop window is not. Never use a breakpoint to decide how an overlay opens, how big a hit target is, or whether a hover hint exists.

A touch component:

1. **Presents natively.** Menus, pickers and selects are bottom sheets (grab handle, 48px rows, dismissed by pulling down). Dialogs rise from the bottom. Nothing anchored to a trigger, because a finger covers the trigger.
2. **Is operated by a thumb.** Targets are at least 44px (48px for list rows), type is 16px in fields, press has a visible state (`active:`), nothing relies on hover.
3. **Drops what has no meaning there.** Keyboard-shortcut hints, hover tooltips, hover-reveal actions: gone or replaced (a visible label, a tap).
4. **Keeps everything else.** The same Base UI primitive drives both presentations, so roles, focus order, typeahead, `aria-*`, controlled/uncontrolled state and events do not change. Only placement, surface and dismissal gesture do.
5. **Moves like the platform.** Drag follows the finger, a flick leaves faster than a slow drag, a short drag springs back, the scrim thins as the sheet leaves. This is where Youj's motion tokens earn their keep: use `yj-sheet-*`, `yj-backdrop` and `useYouj()`; never raw durations.

## What exists (the foundation)

| Piece | Where | What it does |
|---|---|---|
| `device` on `YoujProvider` / `ThemeScope` | `packages/core/src/lib/youj/provider.tsx`, `device.ts` | `auto` (follow the primary pointer, `(pointer: coarse)`), or force `touch` / `pointer` for a subtree and everything it portals. Writes `data-yj-device`. |
| `useDevice()` / `useDeviceSetting()` | motion | `'touch' \| 'pointer'` for what a component should do when it opens. Server and hydration render say `pointer`; the client corrects on mount, so use it for behaviour at open time, not for markup that is on the page at load. |
| `touch:` and `fine:` variants | `packages/ui/src/styles/ui.css` | Tailwind variants: the hardware's coarse/fine pointer **or** a forced device. Use these in `src/components/ui/**`; never `pointer-coarse:` / `pointer-fine:` (they ignore a forced device). Blocks and examples keep Tailwind's built-ins (they must not depend on a newer ui.css). |
| `--yj-touch` and the `h-control*` sizes | `ui.css` | +8px on every control, and the default control at least 44px (`max(…, --yj-touch × 2.75rem)`, so exactly 44px at the default density, and its Bezel corner scales with it), for a coarse pointer or a forced `touch` scope (re-derived at the `[data-yj-device]` scope, like a theme or scaling scope). It is the one input that sizes controls for touch: a `scaling` below 100% never shrinks them there (the factor is at least `--yj-touch`), and a forced `touch` scope holds a scaling scope inside it at 100%, as a phone does. `density` (panel room) is independent; sheets read it for their padding, while sheet rows stay 48px. xs and sm controls keep the +8px look (visually smaller) and reach a 44px target with `touch:yj-hit`: an invisible centered `::after` at least 44px each way (the host must be positioned). Buttons, toolbar links and data-grid page buttons use it; new dense controls (icon buttons in rows, chips) should too. Fields (`input`, `select`) can't take a pseudo-element and stay at their size. |
| `usePortalContainer()` / `portalContainer` | motion | Where a subtree's overlays render, so a desktop preview of touch mode keeps sheets inside a phone-sized frame. Pass `container={container ?? usePortalContainer()}` to a Base UI `Portal`. |
| Sheet presentation | `packages/ui/src/components/ui/presentation.tsx` | `useSheetPresentation(presentation)`, `SheetLayer` (drag-to-dismiss), `SheetHandle`, `sheetPositionerClass`, `sheetPopupClass`, `sheetScrimClass`, `sheetRowClass`, `sheetLabelClass`. |
| Reference conversions | `dropdown-menu.tsx`, `select.tsx` | Read these first. They are the pattern. |

## Converting an overlay to touch mode: the recipe

Every Base UI overlay in this package has the same shape: `Portal` → `Positioner` → `Popup`. The sheet branch keeps all three (so Base UI keeps managing focus, roles and dismissal) and changes only classes and one wrapper.

```tsx
const sheet = useSheetPresentation(presentation)          // 'auto' | 'sheet' | 'popover'
if (sheet) {
  return (
    <X.Portal container={container ?? portalContainer} {...scope}>
      <SheetLayer>                                         {/* drag; owns no box */}
        <X.Backdrop data-sheet-scrim="" className={sheetScrimClass} />
        <X.Positioner className={sheetPositionerClass}>    {/* floating-ui's inline style loses to the ! classes */}
          <X.Popup data-sheet-popup="" className={cn(sheetPopupClass, className)}>
            <SheetHandle />
            …the same children…
          </X.Popup>
        </X.Positioner>
      </SheetLayer>
    </X.Portal>
  )
}
/* …the existing popover branch, untouched… */
```

Checklist for each converted component:

- **`presentation?: 'auto' | 'sheet' | 'popover'`** prop on the content part, default `'auto'`. `auto` is touch → sheet. A consumer can keep the popover on touch or force the sheet.
- **Consumer classNames tuned for the popover must not break the sheet** (`w-56`, `min-w-…`). `sheetPopupClass` makes width win with `!`. Check yours does.
- **Rows** get `sheetRowClass` (48px, `ps-3`, `text-base`, `active:` press). Keep each row's own end padding (trailing checks and chevrons sit in it). **Group captions** get `sheetLabelClass`.
- **Shortcut hints and hover-only chrome** get `touch:hidden` (or `touch:opacity-100` for a hover-reveal action that must be reachable).
- **No new timing.** Use `yj-sheet-bottom`, `yj-backdrop`, `yj-duration-*`. Reduced motion must still work: the sheet appears instantly and a drag still tracks the finger.
- **Dismissal** is the one the primitive has (Escape, outside press) plus pull-down. `SheetLayer` dismisses by sending the Escape the keyboard would, so focus returns to the trigger.
- **A closed Base UI popup can stay mounted** (Select does, as a popover too): the Positioner is `hidden` then. Don't override `display` on it.
- **Keyboard-bearing sheets** (a search field inside a Combobox, Command): the on-screen keyboard covers the bottom of a bottom sheet. Size the sheet from `window.visualViewport` (height and offsetTop), never `100vh`, and keep the input visible. Note what you did.
- **Nested overlays** (a submenu): for now a nested sheet stacks above its parent. Native would push within one sheet; that is a follow-up, not a blocker.
- **Tests** in `<name>.test.tsx`: the sheet branch renders under `device="touch"` (wrap in `YoujProvider device="touch"`) with the handle, scrim and `data-sheet-popup`; `presentation="popover"` keeps the popover on touch; the popover branch is unchanged under `device="pointer"`; interaction still works (select an item, state and events fire).
- **Stories** `Touch` (wrapped in `YoujProvider device="touch"` with the viewport set to a phone via Storybook's viewport or a fixed-width decorator) beside the existing ones.
- **Docs**: the component's page in `apps/docs/content/docs/components/**` gets a short "Touch" section (what it is on touch, the `presentation` prop). Keep the docs' voice: plain, no hype, American spelling.
- Then `pnpm -F @youj/react generate`, `typecheck`, `lint:tokens`, `lint:structure`, `test`.

## How to look at it

Everything must be seen in a real browser with touch emulation, not only in jsdom:

```
pnpm storybook            # root, :6006 (already running in a session may be reused)
```

Drive it with Playwright's iPhone profile (`devices['iPhone 14']`: touch, `isMobile`, DPR 3, `pointer: coarse`), Chromium at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (see CLAUDE.md for no `playwright install`). Open `http://localhost:6006/iframe.html?id=<story-id>&viewMode=story`, tap with `page.touchscreen.tap`, and drag with CDP `Input.dispatchTouchEvent`. Story ids come from `http://localhost:6006/index.json`. Verify: the sheet appears at the bottom with the handle, rows are ≥48px, a long pull dismisses and focus returns to the trigger, a short pull springs back, and a scrolled list scrolls instead of dismissing.

## What is deliberately not done yet

- Detents (half / full sheet) and a sheet that grows with a keyboard.
- Push navigation inside one sheet for submenus.
- Haptics (the Vibration API is Android-only and the web has no equivalent on iOS).
- Per-component desktop-vs-tablet nuance: on an iPad, native menus are popovers. `presentation="popover"` is the escape hatch today; a width-aware `auto` is a candidate.
