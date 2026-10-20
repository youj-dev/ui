# @youj/miniatures

> Alpha (0.x): APIs can change between minor versions. See [Versioning](https://www.youj.dev/docs/versioning).

Interactive isometric objects for React. A record turntable that plays, a server cabinet that fails over, an hourglass that doubles as a progress indicator: each is one import, drawn in SVG, with its own keys and readout, light and dark, reduced motion and, if you ask for it, quiet sound. React is the only dependency.

```bash
pnpm add @youj/miniatures
```

```tsx
import { MiniatureTurntable } from '@youj/miniatures/turntable'

export function Hero() {
  return <MiniatureTurntable size={420} stage />
}
```

`npx youj add miniature-<id>` does the same install and prints the import: miniatures are npm only, there's no source to copy in.

Each miniature is its own entry, so an app bundles only the ones it imports, plus the engine they share once (about 8 KB gzipped). Each miniature adds 7 to 13 KB gzipped (`pnpm -F @youj/miniatures size` measures them).

## Props

| Prop | Default | |
|---|---|---|
| `mode` | `'system'` | `'light'`, `'dark'`, or `'system'`: a `.dark`/`.light` class or `data-theme="dark"`/`"light"` on an ancestor, else the OS. |
| `size` | | The side of the square it's fitted into, in pixels or any CSS length. Without it, it fills its container's width at its own aspect ratio (and `className`/`style` can size it like any block). |
| `stage` | `false` | Paints its stage color behind it: warm paper, or warm charcoal in the dark. A figure's own modes repaint it (the server cabinet's lights-out darkens the room). |
| `interactive` | `true` | `false` draws it as a still picture (`role="img"`): no focus, no pointer, no keys. The ref still drives it. |
| `keyboard` | `'scoped'` | Where its keys work: `'scoped'`, `'global'` or `'off'` (see Keys). |
| `sound` | `false` | Lets it make its sounds. They start with the first click or key on it, never before. |
| `autoPlay` | `true` | `false` shows its first frame and keeps still until someone interacts with it or you call `play()`. For galleries of many. |
| `reducedMotion` | `'user'` | `'user'` follows `prefers-reduced-motion`; `'always'` and `'never'` force it. Reduced, every change jumps to its end. |
| `onStateChange` | | Called with the new snapshot after the readout changes. |
| `aria-label` | its name and model | Overrides the accessible name. |

Other HTML attributes (`className`, `style`, `id`, event handlers) go to the host `<div>`.

A miniature that is a progress indicator (`meta.progress`, the hourglass) also takes `progress` (a share from 0 to 1, or `null` for indeterminate) and `done`.

## The handle

```tsx
const ref = useRef<MiniatureTurntableHandle>(null)
<MiniatureTurntable ref={ref} />

ref.current.press('space')   // a key, as if pressed while it had focus: ' ', 'c', 'ArrowUp', 'up', 'shift+w'…
ref.current.getSnapshot()    // { readout, state, pressed }
ref.current.subscribe(fn)    // with getSnapshot, ready for useSyncExternalStore
ref.current.pause()          // hold its clock (and its sound); play() lets it run
```

A progress indicator's handle adds `setProgress(p | null)` and `done()`. To hold any miniature in one ref, type it `AnyMiniatureHandle`.

## Showing keys and the readout

The component is the drawing and its behaviour; a page presents its name, keys and readout from React. `@youj/miniatures` (the root import) is the catalogue: every miniature's metadata, with no drawing code, safe on a server.

```tsx
import { miniatures, type AnyMiniatureHandle, type MiniatureSnapshot } from '@youj/miniatures'
import { MiniatureTurntable, turntable } from '@youj/miniatures/turntable'

function Exhibit() {
  const ref = useRef<AnyMiniatureHandle>(null)
  const [snapshot, setSnapshot] = useState<MiniatureSnapshot>(turntable.initial)
  return (
    <figure>
      <MiniatureTurntable ref={ref} onStateChange={setSnapshot} stage />
      <figcaption>
        {turntable.name} · {snapshot.readout} · {snapshot.state}
        {turntable.keys.map((hint) => (
          <button key={hint.label} aria-pressed={hint.toggle ? snapshot.pressed[hint.keys[0]] : undefined} onClick={() => ref.current?.press(hint.keys[0])}>
            {hint.caps.join(' ')} {hint.label}
          </button>
        ))}
      </figcaption>
    </figure>
  )
}
```

Metadata: `id`, `name`, `model`, `maker`, `study`, `spec`, `label`, `description`, `keys` (each hint's `keys`, printed `caps`, `label`, and whether it's a `toggle`), `initial` (the first snapshot), `viewBox` and `progress`.

## Keys

A miniature never takes the page's keys. By default (`keyboard="scoped"`) its keys work while focus is inside it (Tab reaches it, and each of its parts), or while the pointer is over it and nothing else has focus. `"global"` takes them anywhere on the page except in text fields and on another control's own keys (Space and Enter on a button, arrows in a slider). `"off"` leaves only its parts' own Enter and Space and `press()`. It lists its keys in `aria-keyshortcuts`.

## Theming

Each miniature wears its own palette: light mode is a product drawing on warm paper; dark mode is a night studio, the same materials relit on a warm charcoal stage, with lights keeping their night brightness. `mode` picks one, or follows the page.

Every token a miniature's root declares yields to the same name with a `yjm-` prefix, set on any ancestor: `--yjm-accent` recolors its lit parts and focus ring, `--yjm-bg` its stage, `--yjm-wood` its walnut. Set them per mode the way your page does:

```css
.exhibit { --yjm-accent: #e5484d; }
.dark .exhibit { --yjm-accent: #ff6b6f; }
```

`palette` (the shared materials, light and dark), `stage` (the stage and caption colors) and `relight(hex, role)` (a material's dark value from its light one) are exported from the root for pages that match them.

Each miniature draws in its own shadow root: the page's CSS can't reach its drawing and its CSS can't reach the page, while the host element itself styles like any `<div>`.

## As a progress indicator

```tsx
import { MiniatureHourglass } from '@youj/miniatures/hourglass'

<MiniatureHourglass interactive={false} size={160} progress={uploaded / total} done={finished} aria-label="Uploading" />
```

Without `progress` it runs on its own (indeterminate), turning over when it runs out. With it, the sand settles to the share; `done` lets the last of it run through, turns the glass and makes it glow.

## Motion and sound

Reduced motion follows `reducedMotion`. A miniature only animates while on screen: offscreen, its clock holds (and its sound pauses), so a page of them costs nothing it doesn't show. Sound needs `sound` and a first click or key on the miniature; an `AudioContext` is never created before that.

## Server rendering

On the server a miniature renders its host: sized by its aspect ratio, named and described, so the page doesn't shift when it draws. It draws once mounted. The entries are client modules (`"use client"`); the root catalogue is not, so a server component can list miniatures.

## Provenance

The HTML prototypes these figures were ported from were drawn for this project; nothing is taken from third parties.

## Contributing

Working on this package: [CONTRIBUTING.md](https://github.com/youj-dev/ui/blob/main/packages/miniatures/CONTRIBUTING.md) in the repository.
