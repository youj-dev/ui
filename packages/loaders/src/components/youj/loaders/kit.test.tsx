import { act, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { durations } from '@youj/core/lib/youj/tokens'
import { FIELD_SIZES, LoaderRoot, type LoaderLabelPosition, type LoaderSpec } from './kit'
import { LoaderCue, scene as cue } from './signal/cue'
import { LoaderJot } from './glyph/jot'
import { LoaderPrompt } from './interface/prompt'
import { LoaderGantry } from './interface/gantry'

/** The markup without its first <style> element (the kit's stylesheet). Test-only, not a sanitizer: it just keeps the stylesheet's class names out of what the assertions read. */
function withoutFirstStyle(html: string) {
  const start = html.indexOf('<style')
  const end = html.indexOf('</style>', start)
  return start < 0 || end < 0 ? html : html.slice(0, start) + html.slice(end + '</style>'.length)
}

/* The live frame, drawn into a stand-in 2D context (jsdom has no canvas):
 * every color it's painted with is recorded, so the first frame can be held
 * to the page's colors. */

function recordingContext() {
  const inks: string[] = []
  const ctx: Record<string, unknown> = {
    inks,
    globalAlpha: 1,
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    lineDashOffset: 0,
    // The palette reads a color back from a pixel: the last one filled, as a browser's canvas would.
    getImageData: () => {
      const [r = 0, g = 0, b = 0, a = 1] = (/rgba?\(([^)]+)\)/.exec(inks.at(-1) ?? '')?.[1] ?? '0, 0, 0, 0').split(',').map(Number)
      return { data: new Uint8ClampedArray([r, g, b, Math.round(a * 255)]) }
    },
  }
  for (const key of ['fillStyle', 'strokeStyle'])
    Object.defineProperty(ctx, key, {
      get: () => inks.at(-1) ?? '#000000',
      set: (value: string) => inks.push(value),
    })
  for (const method of ['setTransform', 'clearRect', 'beginPath', 'moveTo', 'lineTo', 'closePath', 'stroke', 'fill', 'arc', 'fillRect', 'setLineDash']) ctx[method] = () => {}
  return ctx as { inks: string[] }
}

/** The theme roles, as the tones probe reads them. */
const CHART_2 = 'rgb(220, 60, 140)'
const SUCCESS = 'rgb(40, 170, 100)'

describe('the loader kit', () => {
  const original = window.getComputedStyle
  let ctx: ReturnType<typeof recordingContext>
  beforeEach(() => {
    ctx = recordingContext()
    HTMLCanvasElement.prototype.getContext = (() => ctx) as never
    globalThis.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    } as never
    // The page's colors, as the probe reads them: the ink, the accent, the paper and the scheme.
    // The page's colors, as the probe reads them: the secondary color the root sets (--yj-anim-accent, from `accentColor`), else the theme's accent.
    const accent = (el: Element) => (el.closest('.yj-anim') as HTMLElement | null)?.style.getPropertyValue('--yj-anim-accent') || 'rgb(230, 90, 20)'
    // The extra tones, as the tones probe reads them: a color the root sets as is, else the ink or the accent it stands in for.
    const tone = (el: Element, name: string) => {
      const css = (el.closest('.yj-anim') as HTMLElement | null)?.style.getPropertyValue(`--yj-anim-${name}`) ?? ''
      if (css.startsWith('rgb')) return css
      if (css.startsWith('oklch(from')) return CHART_2
      if (css === 'var(--color-success)') return SUCCESS
      return css.includes('--yj-anim-accent') ? accent(el) : 'rgb(240, 240, 242)'
    }
    window.getComputedStyle = ((el: Element) =>
      el.classList.contains('yj-anim__probe')
        ? { color: accent(el), backgroundColor: 'rgb(16, 16, 18)', opacity: '1' }
        : el.classList.contains('yj-anim__tones')
          ? { borderTopColor: tone(el, 'c1'), borderRightColor: tone(el, 'c2'), borderBottomColor: tone(el, 'c3'), borderLeftColor: tone(el, 'c4') }
          : { color: 'rgb(240, 240, 242)' }) as never
  })
  afterEach(() => {
    window.getComputedStyle = original
  })

  it('draws every frame by default, and at most `fps` a second when capped', () => {
    let draws = 0
    ;(ctx as unknown as Record<string, unknown>).clearRect = () => void draws++
    const clock = frames()
    const { unmount } = render(
      <YoujProvider>
        <LoaderCue label={null} />
      </YoujProvider>,
    )
    draws = 0
    clock.run(60)
    expect(draws).toBe(60)
    unmount()
    const capped = render(
      <YoujProvider>
        <LoaderCue label={null} fps={30} />
      </YoujProvider>,
    )
    draws = 0
    clock.run(60)
    // Every other 16 ms frame on a 60 Hz screen.
    expect(draws).toBe(30)
    capped.unmount()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('draws its first frame in the page’s colors, never the canvas’s default black', () => {
    render(
      <YoujProvider reducedMotion="never">
        <LoaderCue />
      </YoujProvider>,
    )
    expect(ctx.inks.length).toBeGreaterThan(0)
    expect(ctx.inks).not.toContain('currentColor')
    expect(ctx.inks).toContain('rgb(240, 240, 242)')
  })

  it('paints its accent in the secondary color: the theme’s accent by default, `accentColor` when set, the primary untouched', () => {
    const { unmount } = render(
      <YoujProvider reducedMotion="never">
        <LoaderCue />
      </YoujProvider>,
    )
    expect(ctx.inks).toContain('rgb(230, 90, 20)')
    unmount()
    ctx.inks.length = 0
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <LoaderCue accentColor="rgb(20, 200, 90)" />
      </YoujProvider>,
    )
    expect(container.querySelector<HTMLElement>('[data-yj-loader]')!.style.getPropertyValue('--yj-anim-accent')).toBe('rgb(20, 200, 90)')
    expect(ctx.inks).toContain('rgb(20, 200, 90)')
    expect(ctx.inks).not.toContain('rgb(230, 90, 20)')
    expect(ctx.inks).toContain('rgb(240, 240, 242)')
  })

  it('lights an accent face from the secondary color too: one opaque fill mixed from it and the paper', () => {
    render(
      <YoujProvider reducedMotion="never">
        <LoaderJot accentColor="rgb(20, 200, 90)" />
      </YoujProvider>,
    )
    // Jot's tittle is a lit cube in the accent: its faces are premixed between the paper (16, 16, 18) and the green.
    const fills = ctx.inks.filter((ink) => ink.startsWith('rgba(')).map((ink) => ink.match(/[\d.]+/g)!.map(Number))
    const green = fills.filter(([r, g, b]) => g! > r! + 40 && g! > b! + 30)
    expect(green.length).toBeGreaterThan(0)
    for (const [, , , a] of green) expect(a).toBe(1)
    // And none from the theme's orange.
    expect(fills.some(([r, g, b]) => r! > g! + 60 && r! > b! + 100)).toBe(false)
  })

  it('colors its parts in the theme’s roles with `colors="theme"`: one derived from the accent, a status ink', () => {
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <LoaderPrompt colors="theme" />
      </YoujProvider>,
    )
    const root = container.querySelector<HTMLElement>('[data-yj-loader]')!
    // Prompt's chevron (c1) takes the first theme role and its check (c2) success; it draws with no others.
    expect(root.style.getPropertyValue('--yj-anim-c1')).toMatch(/^oklch\(from var\(--yj-anim-accent, var\(--color-accent\)\)/)
    expect(root.style.getPropertyValue('--yj-anim-c2')).toBe('var(--color-success)')
    expect(root.style.getPropertyValue('--yj-anim-c3')).toBe('')
    expect(ctx.inks).toContain(CHART_2)
    expect(ctx.inks).toContain(SUCCESS)
    // The ink and the accent stay where they were: the text and the caret.
    expect(ctx.inks).toContain('rgb(230, 90, 20)')
    expect(ctx.inks).toContain('rgb(240, 240, 242)')
  })

  it('paints its parts in `colors`, in order, any left out keeping its theme role', () => {
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <LoaderPrompt colors={['rgb(20, 200, 90)']} />
      </YoujProvider>,
    )
    const root = container.querySelector<HTMLElement>('[data-yj-loader]')!
    expect(root.style.getPropertyValue('--yj-anim-c1')).toBe('rgb(20, 200, 90)')
    expect(root.style.getPropertyValue('--yj-anim-c2')).toBe('var(--color-success)')
    expect(ctx.inks).toContain('rgb(20, 200, 90)')
    expect(ctx.inks).not.toContain(CHART_2)
  })

  it('is its two colors exactly without `colors`: each part goes back to the ink or the accent it stands in for', () => {
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <LoaderPrompt />
      </YoujProvider>,
    )
    const root = container.querySelector<HTMLElement>('[data-yj-loader]')!
    expect(root.style.getPropertyValue('--yj-anim-c1')).toBe('var(--yj-anim-ink)')
    expect(root.style.getPropertyValue('--yj-anim-c2')).toBe('var(--yj-anim-accent, var(--color-accent))')
    expect(container.querySelector('.yj-anim__tones')).toBeNull()
    expect(new Set(ctx.inks.filter((ink) => ink.startsWith('rgb('))).size).toBe(2)
    expect(ctx.inks).toContain('rgb(230, 90, 20)')
    expect(ctx.inks).toContain('rgb(240, 240, 242)')
  })

  it('ignores `colors` on a loader without colored parts', () => {
    // A spec that names no parts: what it draws in an extra tone is the ink.
    const plain: LoaderSpec = { id: 'plain', scene: cue, sizes: FIELD_SIZES, aspect: 1 }
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <LoaderRoot spec={plain} props={{ colors: ['rgb(20, 200, 90)'] }} />
      </YoujProvider>,
    )
    const root = container.querySelector<HTMLElement>('[data-yj-loader]')!
    expect(root.style.getPropertyValue('--yj-anim-c1')).toBe('')
    expect(container.querySelector('.yj-anim__tones')).toBeNull()
    expect(ctx.inks).not.toContain('rgb(20, 200, 90)')
  })

  it('lights a colored part’s faces as the accent’s, and a mono one’s as the ink’s it stands in for', () => {
    const faces = () => ctx.inks.filter((ink) => ink.startsWith('rgba(')).map((ink) => ink.match(/[\d.]+/g)!.map(Number))
    const { unmount } = render(
      <YoujProvider reducedMotion="never">
        <LoaderGantry />
      </YoujProvider>,
    )
    // Without colors, the machine's faces are the ink's grays between the paper (16) and the ink (240).
    expect(faces().length).toBeGreaterThan(0)
    for (const [r, g, b] of faces()) expect(Math.max(r!, g!, b!) - Math.min(r!, g!, b!)).toBeLessThan(4)
    unmount()
    ctx.inks.length = 0
    render(
      <YoujProvider reducedMotion="never">
        <LoaderGantry colors={['rgb(20, 200, 90)']} />
      </YoujProvider>,
    )
    // Colored, they hold the green, at least half of it over the dark paper, a little more where lit.
    const green = faces().filter(([r, g, b]) => g! > r! + 40 && g! > b! + 30)
    expect(green.length).toBeGreaterThan(0)
    for (const [, g] of green) expect(g).toBeGreaterThanOrEqual(Math.round(16 + (200 - 16) * 0.5))
  })

  it('paints a lit face as one opaque color, mixed from the ink and the paper', () => {
    render(
      <YoujProvider reducedMotion="never">
        <LoaderJot />
      </YoujProvider>,
    )
    // Jot is a lit solid j: its faces are premixed fills, each opaque and between the paper (16) and the ink (240).
    const faces = ctx.inks.filter((ink) => ink.startsWith('rgba(')).map((ink) => ink.match(/[\d.]+/g)!.map(Number))
    expect(faces.length).toBeGreaterThan(0)
    for (const [r, , , a] of faces) {
      expect(a).toBe(1)
      expect(r).toBeGreaterThan(16)
      expect(r).toBeLessThan(240)
    }
  })
})

/* The shown label: where it sits, how it moves on the drawing's clock, and
 * what assistive technology hears. The shared ticker is driven by hand, a
 * frame of 16ms at a time, so every moment of the loop can be named. */

/** One loop of Cue, in ms, at the precise tempo and speed 1. */
const LOOP = cue.beats * durations.deliberate

function frames() {
  let now = 0
  let id = 0
  let count = 0
  const due = new Map<number, FrameRequestCallback>()
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    due.set(++id, cb)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (handle: number) => due.delete(handle))
  return {
    /** Runs `n` frames. */
    run(n: number) {
      act(() => {
        for (let i = 0; i < n; i++) {
          now += 16
          count++
          const callbacks = [...due.values()]
          due.clear()
          for (const cb of callbacks) cb(now)
        }
      })
    },
    /** Where in the loop a drawing at `speed` is now. */
    phase: (speed = 1) => (cue.still + (count * 16 * speed) / LOOP) % 1,
    /** Frames from now until a drawing at `speed` reaches `t` of the loop, `loops` more loops on. */
    until: (t: number, loops = 0, speed = 1) => {
      const at = (cue.still + (count * 16 * speed) / LOOP) % 1
      return Math.round(((((t - at + 1) % 1) + loops) * LOOP) / 16 / speed)
    },
  }
}

describe('the shown label', () => {
  beforeEach(() => {
    // jsdom draws no canvas: the frame is skipped, the ticker and the label run.
    HTMLCanvasElement.prototype.getContext = (() => null) as never
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const FLOW: Record<LoaderLabelPosition, string> = { bottom: 'column', top: 'column-reverse', start: 'row-reverse', end: 'row' }

  it('sits centred under the drawing by default, and over it or beside it, at the start or end of the line, on request', () => {
    const { container, rerender } = render(<LoaderCue showLabel />)
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute('data-label-position', 'bottom')
    expect(getComputedStyle(root).flexDirection).toBe('column')
    expect(getComputedStyle(root).alignItems).toBe('center')
    for (const position of ['top', 'start', 'end', 'bottom'] as const) {
      rerender(<LoaderCue showLabel labelPosition={position} />)
      expect(root).toHaveAttribute('data-label-position', position)
      // Logical: a row follows the writing direction, so start and end swap sides under RTL.
      expect(getComputedStyle(root).flexDirection).toBe(FLOW[position])
    }
    // Hidden, the label takes no place at all.
    rerender(<LoaderCue labelPosition="top" />)
    expect(root).not.toHaveAttribute('data-label-position')
    expect(container.querySelector('.yj-anim__label')).toBeNull()
  })

  it('is a picture of the words: aria-hidden, while the status keeps the plain label as its name and its announcement', () => {
    frames()
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <LoaderCue label="Syncing files" showLabel labelEffect="type" />
      </YoujProvider>,
    )
    const status = screen.getByRole('status', { name: 'Syncing files' })
    expect(status).toHaveAttribute('aria-live', 'polite')
    const shown = container.querySelector('.yj-anim__label')!
    expect(shown).toHaveAttribute('aria-hidden', 'true')
    expect(shown.querySelector('.yj-anim__caret')).not.toBeNull()
    // What a screen reader reads of the status is the label once, never the drawn letters.
    const announced = [...status.querySelectorAll(':scope > :not([aria-hidden])')].map((el) => el.textContent).join('')
    expect(announced).toBe('Syncing files')
  })

  it('renders static on the server, and hydrates to the same HTML before its effect starts', async () => {
    const tree = (
      <YoujProvider reducedMotion="never">
        <LoaderCue label="Loading" showLabel labelEffect="type" />
      </YoujProvider>
    )
    const html = renderToString(tree)
    // The markup, without the kit's stylesheet (which names every class).
    const markup = withoutFirstStyle(html)
    expect(markup).toContain('<span aria-hidden="true" class="yj-anim__label"><span class="yj-anim__text">Loading</span></span>')
    expect(markup).not.toContain('yj-anim__caret')
    expect(markup).not.toContain('data-effect')
    const host = document.createElement('div')
    host.innerHTML = html
    document.body.append(host)
    const mismatches: unknown[] = []
    frames()
    let root: ReturnType<typeof hydrateRoot> | undefined
    await act(async () => {
      root = hydrateRoot(host, tree, { onRecoverableError: (error) => mismatches.push(error) })
    })
    expect(mismatches).toEqual([])
    // Hydrated, the label joins the drawing's clock.
    expect(host.querySelector('.yj-anim__label')).toHaveAttribute('data-effect', 'type')
    act(() => root?.unmount())
    host.remove()
  })

  it('holds still under reduced motion: the whole label, no light and no caret, however long it waits', () => {
    const clock = frames()
    const { container } = render(
      <YoujProvider reducedMotion="always">
        <LoaderCue label="Loading" showLabel labelEffect="type" />
        <LoaderCue label="Loading" showLabel />
      </YoujProvider>,
    )
    clock.run(clock.until(0.5, 1))
    for (const label of container.querySelectorAll('.yj-anim__label')) {
      expect(label).not.toHaveAttribute('data-effect')
      expect(label.querySelector('.yj-anim__caret')).toBeNull()
      expect(label.querySelector('.yj-anim__text')).toHaveTextContent('Loading')
      expect(label.querySelector('.yj-anim__text')!.getAttribute('style')).toBeNull()
    }
  })

  it('pulses on the drawing’s clock: its light moves with the shared ticker, at the drawing’s speed, and holds when it holds', () => {
    const clock = frames()
    const tree = (paused: boolean) => (
      <YoujProvider reducedMotion="never">
        <LoaderCue label="Loading" showLabel paused={paused} />
        <LoaderCue label="Loading" showLabel speed={2} paused={paused} />
      </YoujProvider>
    )
    const { container, rerender } = render(tree(false))
    const [slow, fast] = [...container.querySelectorAll<HTMLElement>('.yj-anim__text')]
    const light = (el: HTMLElement) => el.style.getPropertyValue('--yj-anim-band')
    // Mid-loop, it holds its rest (the light off the word) until a moment that looks the same: no jump as it joins.
    expect(light(slow!)).toBe('1.0000')
    // A quarter into the next loop at twice the speed: the light is crossing the word.
    const steps = clock.until(0.25, 0, 2)
    clock.run(steps)
    expect(clock.phase(2)).toBeCloseTo(0.25, 2)
    const crossing = light(fast!)
    expect(Number(crossing)).toBeGreaterThan(0.02)
    expect(Number(crossing)).toBeLessThan(0.98)
    // Twice as long at speed 1 is the same moment of the loop, so the same light.
    clock.run(steps)
    expect(light(slow!)).toBe(crossing)
    // Paused, the drawing and its label hold the frame.
    rerender(tree(true))
    const held = [light(slow!), light(fast!)]
    clock.run(40)
    expect([light(slow!), light(fast!)]).toEqual(held)
  })

  describe('typed', () => {
    // Laid out as a browser would: 10px a letter, left to right.
    const LETTER = 10
    const box = (left: number, width: number) => ({ left, right: left + width, width, top: 0, bottom: 14, height: 14, x: left, y: 0, toJSON: () => ({}) }) as DOMRect
    const offsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')!
    const elementBox = HTMLElement.prototype.getBoundingClientRect
    beforeEach(() => {
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        get(this: HTMLElement) {
          return this.classList.contains('yj-anim__text') ? LETTER * (this.textContent?.length ?? 0) : 0
        },
      })
      HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
        return box(0, this.classList.contains('yj-anim__text') ? LETTER * (this.textContent?.length ?? 0) : 0)
      }
      Range.prototype.getBoundingClientRect = function (this: Range) {
        return box(LETTER * this.startOffset, LETTER * (this.endOffset - this.startOffset))
      }
    })
    afterEach(() => {
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', offsetWidth)
      HTMLElement.prototype.getBoundingClientRect = elementBox
      delete (Range.prototype as Partial<Range>).getBoundingClientRect
    })

    /** How many letters show: where the clip cuts, in letters. */
    const letters = (text: HTMLElement, n: number) => {
      const clip = text.style.clipPath
      if (!clip) return n
      if (clip === 'inset(50%)') return 0
      return Math.round((n * LETTER - Number(/^inset\(-1em ([\d.]+)px/.exec(clip)![1])) / LETTER)
    }

    it('types the word within a loop, a letter at a time, holds it with a blinking caret, and clears it into an empty seam', () => {
      const clock = frames()
      const { container } = render(
        <YoujProvider reducedMotion="never">
          <LoaderCue label="Loading" showLabel labelEffect="type" />
        </YoujProvider>,
      )
      const text = container.querySelector<HTMLElement>('.yj-anim__text')!
      const caret = container.querySelector<HTMLElement>('.yj-anim__caret')!
      // Before the loop comes round, the word stands whole, the caret after it.
      expect(letters(text, 7)).toBe(7)
      expect(caret.style.transform).toMatch(/^translateX\(70\.\d+px\)$/)
      // One whole loop from just past the seam, a frame at a time.
      clock.run(clock.until(0.005, 1))
      const loop: { t: number; shown: number; lit: string }[] = []
      for (let i = 0; i < Math.round(LOOP / 16); i++) {
        clock.run(1)
        loop.push({ t: clock.phase(), shown: letters(text, 7), lit: caret.style.opacity })
      }
      // At the seam the line is empty, the caret lit and home.
      for (const s of loop.filter((s) => s.t < 0.03 || s.t > 0.97)) expect(s).toMatchObject({ shown: 0, lit: '1' })
      // Typed one letter at a time, every count in turn, and whole well before the loop is half done.
      const full = loop.findIndex((s) => s.shown === 7)
      const counts = loop.slice(0, full + 1).map((s) => s.shown)
      expect(counts.filter((c, i) => c !== counts[i - 1])).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
      expect(loop[full]!.t).toBeLessThan(0.5)
      // Held whole while the caret blinks, then cleared, never growing again, back to empty before the seam.
      const held = loop.slice(full).findIndex((s) => s.shown < 7) + full
      expect(loop.slice(full, held).some((s) => s.lit === '0')).toBe(true)
      const clearing = loop.slice(held).map((s) => s.shown)
      expect(clearing.every((c, i) => i === 0 || c <= clearing[i - 1]!)).toBe(true)
      expect(clearing.at(-1)).toBe(0)
    })

    it('loops cleanly: a moment of one loop looks the same in the next', () => {
      const clock = frames()
      const { container } = render(
        <YoujProvider reducedMotion="never">
          <LoaderCue label="Loading" showLabel labelEffect="type" />
        </YoujProvider>,
      )
      const text = container.querySelector<HTMLElement>('.yj-anim__text')!
      clock.run(clock.until(0.2, 1))
      const first = [text.style.clipPath, letters(text, 7)]
      clock.run(Math.round(LOOP / 16))
      expect([text.style.clipPath, letters(text, 7)]).toEqual(first)
      expect(first[1]).toBeGreaterThan(0)
      expect(first[1]).toBeLessThan(7)
    })
  })
})

/* Several labels: one shows at a time, the next taking over at the seam,
 * one every `labelEvery` loops, on the drawing's clock; the status says the
 * first and only now and then a later one. */

/** The label that shows: the run left visible (the first, until they turn). */
const shownRun = (root: ParentNode) => {
  const runs = [...root.querySelectorAll<HTMLElement>('.yj-anim__label > .yj-anim__text')]
  return runs.findIndex((run, i) => (run.style.visibility || (i ? 'hidden' : 'visible')) === 'visible')
}

describe('several labels', () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = (() => null) as never
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const STEPS = ['Loading', 'Generating results', 'Almost there']

  it('renders the first on the server and through hydration, every label in one cell so the width never changes', async () => {
    const tree = (
      <YoujProvider reducedMotion="never">
        <LoaderCue label={STEPS} showLabel labelEffect="slide" />
      </YoujProvider>
    )
    const html = renderToString(tree)
    const markup = withoutFirstStyle(html)
    // The status names the first; the drawn label holds all three, the first showing (the kit's CSS hides the rest, in place).
    expect(markup).toMatch(/class="yj-anim__sr">Loading<\/span>/)
    expect(markup).toContain(
      '<span aria-hidden="true" class="yj-anim__label"><span class="yj-anim__text">Loading</span><span class="yj-anim__text">Generating results</span><span class="yj-anim__text">Almost there</span></span>',
    )
    expect(html).toContain('.yj-anim__text ~ .yj-anim__text { visibility: hidden; }')
    expect(html).toContain('grid-area: 1 / 1')
    const host = document.createElement('div')
    host.innerHTML = html
    document.body.append(host)
    const mismatches: unknown[] = []
    frames()
    let root: ReturnType<typeof hydrateRoot> | undefined
    await act(async () => {
      root = hydrateRoot(host, tree, { onRecoverableError: (error) => mismatches.push(error) })
    })
    expect(mismatches).toEqual([])
    expect(shownRun(host)).toBe(0)
    act(() => root?.unmount())
    host.remove()
  })

  it('turns to the next at each seam, round and round, and holds the turn while paused', () => {
    const clock = frames()
    const tree = (paused: boolean) => (
      <YoujProvider reducedMotion="never">
        <LoaderCue label={STEPS} showLabel labelEffect="none" paused={paused} />
      </YoujProvider>
    )
    const { container, rerender } = render(tree(false))
    expect(shownRun(container)).toBe(0)
    // Mid-loop, then mid-loop of each loop after: the first finishes its loop, then each takes one of its own, and the first comes round again.
    clock.run(clock.until(0.5))
    const seen = [shownRun(container)]
    for (let loop = 0; loop < 5; loop++) {
      clock.run(clock.until(0.5, 1))
      seen.push(shownRun(container))
    }
    expect(seen).toEqual([0, 1, 2, 0, 1, 2])
    rerender(tree(true))
    clock.run(Math.round((LOOP * 3) / 16))
    expect(shownRun(container)).toBe(2)
  })

  it('gives each label `labelEvery` loops', () => {
    const clock = frames()
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <LoaderCue label={['A', 'B']} labelEvery={3} showLabel labelEffect="none" />
      </YoujProvider>,
    )
    clock.run(clock.until(0.5))
    const seen = [shownRun(container)]
    for (let loop = 0; loop < 7; loop++) {
      clock.run(clock.until(0.5, 1))
      seen.push(shownRun(container))
    }
    expect(seen).toEqual([0, 0, 0, 1, 1, 1, 0, 0])
  })

  it('changes only at the seam, at the drawing’s speed', () => {
    const clock = frames()
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <LoaderCue label={STEPS} showLabel labelEffect="none" speed={2} />
      </YoujProvider>,
    )
    // Just before the seam at twice the speed, then just after it.
    clock.run(clock.until(0.97, 0, 2))
    expect(shownRun(container)).toBe(0)
    clock.run(clock.until(0.03, 0, 2))
    expect(shownRun(container)).toBe(1)
  })

  it('says the first label, then a later one only as it shows, in order, once each and at least ten seconds apart, then stays quiet', () => {
    const clock = frames()
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <LoaderCue label={STEPS} showLabel labelEffect="none" />
      </YoujProvider>,
    )
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveAccessibleName('Loading')
    const said: { text: string; at: number }[] = [{ text: 'Loading', at: 0 }]
    let turns = 0
    let shown = 0
    // A minute, a frame at a time: the shown label turns every loop (3.36s), the status far less often.
    for (let f = 1; f <= 3750; f++) {
      clock.run(1)
      const text = container.querySelector('.yj-anim__sr')!.textContent!
      if (text !== said.at(-1)!.text) said.push({ text, at: f * 16 })
      const run = shownRun(container)
      if (run !== shown) {
        turns++
        shown = run
      }
    }
    expect(turns).toBeGreaterThan(15)
    expect(said.map((s) => s.text)).toEqual(STEPS)
    for (let i = 1; i < said.length; i++) expect(said[i]!.at - said[i - 1]!.at).toBeGreaterThanOrEqual(10_000)
    // What's said is the status's name too.
    expect(status).toHaveAccessibleName('Almost there')
  })

  it('takes the labels in turn for the status even when none is shown', () => {
    const clock = frames()
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <LoaderCue label={['A', 'B']} />
      </YoujProvider>,
    )
    expect(container.querySelector('.yj-anim__label')).toBeNull()
    clock.run(Math.round(12_000 / 16))
    // Ten seconds in, B comes round again (it first showed too soon to be said).
    clock.run(clock.until(0.5, 1))
    expect(screen.getByRole('status')).toHaveAccessibleName('B')
  })

  it('says new labels at once: a change of the prop is a change of state', () => {
    const clock = frames()
    const tree = (label: string[]) => (
      <YoujProvider reducedMotion="never">
        <LoaderCue label={label} showLabel labelEffect="none" />
      </YoujProvider>
    )
    const { container, rerender } = render(tree(STEPS))
    clock.run(clock.until(0.5, 1))
    expect(shownRun(container)).toBe(1)
    rerender(tree(['Uploading', 'Processing']))
    expect(screen.getByRole('status')).toHaveAccessibleName('Uploading')
    expect(shownRun(container)).toBe(0)
  })

  it('keeps its turn through a new array of the same words, as a literal in a parent’s render makes', () => {
    const clock = frames()
    const tree = () => (
      <YoujProvider reducedMotion="never">
        <LoaderCue label={[...STEPS]} showLabel labelEffect="none" />
      </YoujProvider>
    )
    const { container, rerender } = render(tree())
    clock.run(clock.until(0.5, 1))
    const turn = shownRun(container)
    expect(turn).toBeGreaterThan(0)
    rerender(tree())
    expect(shownRun(container)).toBe(turn)
  })

  it('drops blank labels, and falls back to the default when none is left', () => {
    const { container, rerender } = render(<LoaderCue label={['Saving', ' ', '']} showLabel />)
    expect(container.querySelectorAll('.yj-anim__label > .yj-anim__text')).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveAccessibleName('Saving')
    rerender(<LoaderCue label={['', ' ']} showLabel />)
    expect(screen.getByRole('status')).toHaveAccessibleName('Loading')
  })

  it('shows the first, still, under reduced motion, and the status keeps it, however long the wait', () => {
    const clock = frames()
    const { container } = render(
      <YoujProvider reducedMotion="always">
        {(['pulse', 'wave', 'type', 'scramble', 'slide', 'none'] as const).map((effect) => (
          <LoaderCue key={effect} label={STEPS} showLabel labelEffect={effect} />
        ))}
      </YoujProvider>,
    )
    clock.run(Math.round(30_000 / 16))
    for (const label of container.querySelectorAll('.yj-anim__label')) {
      expect(label).not.toHaveAttribute('data-effect')
      expect(label.querySelector('.yj-anim__caret, .yj-anim__glyphs')).toBeNull()
      for (const run of label.querySelectorAll('.yj-anim__text')) expect(run.getAttribute('style')).toBeNull()
    }
    for (const status of screen.getAllByRole('status')) expect(status).toHaveAccessibleName('Loading')
  })
})

/* The new effects, laid out as a browser would: 10px a letter, left to
 * right, or (in a right-to-left label) right to left. */

const LETTER = 10
const rect = (left: number, width: number) => ({ left, right: left + width, width, top: 0, bottom: 14, height: 14, x: left, y: 0, toJSON: () => ({}) }) as DOMRect

function layOut() {
  const offsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')!
  const elementBox = HTMLElement.prototype.getBoundingClientRect
  const textLength = (el: HTMLElement) => (el.classList.contains('yj-anim__text') ? LETTER * (el.textContent?.length ?? 0) : 0)
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = (() => null) as never
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return textLength(this)
      },
    })
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      return rect(0, textLength(this))
    }
    // A letter's box: from the left in a left-to-right run, from the right in a right-to-left one.
    Range.prototype.getBoundingClientRect = function (this: Range) {
      const run = this.startContainer.parentElement!
      const width = textLength(run)
      const size = LETTER * (this.endOffset - this.startOffset)
      return run.closest('[dir=rtl]') ? rect(width - LETTER * this.endOffset, size) : rect(LETTER * this.startOffset, size)
    }
  })
  afterEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', offsetWidth)
    HTMLElement.prototype.getBoundingClientRect = elementBox
    delete (Range.prototype as Partial<Range>).getBoundingClientRect
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })
}

/** How a left-to-right run of `n` letters is clipped: the letters it shows, from…to, or null for none. */
function clipped(run: HTMLElement, n: number): [number, number] | null {
  const clip = run.style.clipPath
  if (!clip) return [0, n]
  if (clip === 'inset(50%)') return null
  const [, right, left] = /^inset\(-1em (-1em|[\d.]+px) -1em (-1em|[\d.]+px)\)$/.exec(clip)!
  const px = (v: string) => (v === '-1em' ? null : Number(v.replace('px', '')))
  const l = px(left!)
  const r = px(right!)
  return [l === null ? 0 : Math.round(l / LETTER), r === null ? n : Math.round((n * LETTER - r) / LETTER)]
}

describe('scramble', () => {
  layOut()

  it('resolves the word out of noise, first letter to last, holds it, then breaks it back into noise that clears before the seam', () => {
    const clock = frames()
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <LoaderCue label="Loading" showLabel labelEffect="scramble" />
      </YoujProvider>,
    )
    const label = container.querySelector('.yj-anim__label')!
    expect(label).toHaveAttribute('data-effect', 'scramble')
    const run = label.querySelector<HTMLElement>('.yj-anim__text')!
    // Static until it joins: the whole word.
    expect(run.style.clipPath).toBe('')
    clock.run(clock.until(0.002, 1))
    const loop: { t: number; real: [number, number] | null; noise: string[] }[] = []
    for (let i = 0; i < Math.round(LOOP / 16); i++) {
      clock.run(1)
      const glyphs = [...label.querySelectorAll<HTMLElement>('.yj-anim__glyphs > span')]
      loop.push({ t: clock.phase(), real: clipped(run, 7), noise: glyphs.map((g) => g.textContent ?? '') })
    }
    // The seam falls on an empty line: no letter and no noise.
    for (const s of loop.filter((s) => s.t < 0.03 || s.t > 0.97)) {
      expect(s.real).toBeNull()
      expect(s.noise.join('')).toBe('')
    }
    // Resolving: a prefix of the word is itself, and noise stands where the rest will be, never the letter it hides.
    const resolving = loop.filter((s) => s.t > 0.13 && s.t < 0.27)
    expect(resolving.length).toBeGreaterThan(5)
    for (const s of resolving) {
      expect(s.real?.[0] ?? 0).toBe(0)
      const resolved = s.real?.[1] ?? 0
      s.noise.forEach((glyph, k) => {
        if (k < resolved) expect(glyph).toBe('')
        else if (glyph) expect(glyph).not.toBe('Loading'[k])
      })
    }
    const counts = loop.filter((s, i) => s.t < 0.5 && i < loop.length / 2).map((s) => s.real?.[1] ?? 0)
    expect(counts.filter((c, i) => c !== counts[i - 1])).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    // Held whole, then broken from the first letter, the rest still itself.
    const held = loop.filter((s) => s.t > 0.55 && s.t < 0.78)
    for (const s of held) {
      expect(s.real).toEqual([0, 7])
      expect(s.noise.join('')).toBe('')
    }
    const breaking = loop.filter((s) => s.t > 0.82 && s.t < 0.86)
    expect(breaking.some((s) => s.real && s.real[0] > 0 && s.real[1] === 7 && s.noise.join('').length > 0)).toBe(true)
  })

  it('is a pure function of the loop: the same moment draws the same noise, at any speed, and holds while paused', () => {
    const clock = frames()
    const tree = (paused: boolean) => (
      <YoujProvider reducedMotion="never">
        <LoaderCue label="Loading" showLabel labelEffect="scramble" paused={paused} />
        <LoaderCue label="Loading" showLabel labelEffect="scramble" speed={2} paused={paused} />
      </YoujProvider>
    )
    const { container, rerender } = render(tree(false))
    const [slow, fast] = [...container.querySelectorAll('.yj-anim__label')]
    const look = (label: Element) => [
      label.querySelector<HTMLElement>('.yj-anim__text')!.style.clipPath,
      [...label.querySelectorAll('.yj-anim__glyphs > span')].map((g) => g.textContent).join('|'),
    ]
    const steps = clock.until(0.2, 0, 2)
    clock.run(steps)
    const fastLook = look(fast!)
    expect(fastLook[1]).not.toBe('')
    // Twice as long at speed 1 is the same moment of the loop.
    clock.run(steps)
    expect(look(slow!)).toEqual(fastLook)
    rerender(tree(true))
    const held = [look(slow!), look(fast!)]
    clock.run(30)
    expect([look(slow!), look(fast!)]).toEqual(held)
  })

  it('resolves right to left in a right-to-left script, each glyph in its letter’s place', () => {
    const clock = frames()
    const { container } = render(
      <div dir="rtl">
        <YoujProvider reducedMotion="never">
          <LoaderCue label="טוען" showLabel labelEffect="scramble" />
        </YoujProvider>
      </div>,
    )
    const label = container.querySelector('.yj-anim__label')!
    const run = label.querySelector<HTMLElement>('.yj-anim__text')!
    clock.run(clock.until(0.2, 1))
    // The first letters (on the right) are themselves: the clip cuts from the left.
    expect(run.style.clipPath).toMatch(/^inset\(-1em -1em -1em [\d.]+px\)$/)
    const glyphs = [...label.querySelectorAll<HTMLElement>('.yj-anim__glyphs > span')]
    expect(glyphs.map((g) => parseFloat(g.style.left))).toEqual([30, 20, 10, 0])
  })

  it('draws no noise in a joined script: Arabic resolves as a plain reveal, its letters whole', () => {
    const clock = frames()
    const { container } = render(
      <div dir="rtl">
        <YoujProvider reducedMotion="never">
          <LoaderCue label="جارٍ التحميل" showLabel labelEffect="scramble" />
        </YoujProvider>
      </div>,
    )
    const label = container.querySelector('.yj-anim__label')!
    const run = label.querySelector<HTMLElement>('.yj-anim__text')!
    const clips = new Set<string>()
    clock.run(clock.until(0.002, 1))
    for (let i = 0; i < Math.round(LOOP / 16); i++) {
      clock.run(1)
      clips.add(run.style.clipPath)
      expect(label.querySelectorAll('.yj-anim__glyphs > span')).toHaveLength(0)
    }
    expect(clips.size).toBeGreaterThan(4)
    expect(clips).toContain('')
    expect(clips).toContain('inset(50%)')
  })
})

describe('wave', () => {
  layOut()

  /** Each letter's lift, in em (negative is up), and its opacity. */
  const letters = (label: Element) =>
    [...label.querySelectorAll<HTMLElement>('.yj-anim__glyphs > span')].map((g) => ({
      text: g.textContent,
      y: Number(/translateY\((-?[\d.]+)em\)/.exec(g.style.transform)?.[1] ?? 0),
      o: g.style.opacity ? Number(g.style.opacity) : 1,
    }))

  it('lifts the letters in a wave that travels from the first to the last, then rests, each letter drawn where it sits', () => {
    const clock = frames()
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <LoaderCue label="Loading" showLabel labelEffect="wave" />
      </YoujProvider>,
    )
    const label = container.querySelector('.yj-anim__label')!
    const run = label.querySelector<HTMLElement>('.yj-anim__text')!
    clock.run(clock.until(0.78, 0))
    // Joined at rest: the letters, in place, draw the word; the run keeps its place.
    expect(letters(label).map((l) => l.text).join('')).toBe('Loading')
    expect(letters(label).every((l) => l.y === 0 && l.o === 1)).toBe(true)
    expect([...label.querySelectorAll<HTMLElement>('.yj-anim__glyphs > span')].map((g) => parseFloat(g.style.left))).toEqual([0, 10, 20, 30, 40, 50, 60])
    expect(run.style.opacity).toBe('0')
    // Where the crest is at each moment: the highest letter.
    const crest: number[] = []
    for (const t of [0.25, 0.32, 0.4, 0.48, 0.56]) {
      clock.run(clock.until(t))
      const lifts = letters(label).map((l) => l.y)
      expect(Math.min(...lifts)).toBeLessThan(-0.05)
      expect(Math.min(...lifts)).toBeGreaterThanOrEqual(-0.2)
      crest.push(lifts.indexOf(Math.min(...lifts)))
    }
    expect(crest).toEqual([...crest].sort((a, b) => a - b))
    expect(crest.at(-1)).toBeGreaterThan(crest[0]!)
    clock.run(clock.until(0.8))
    expect(letters(label).every((l) => l.y === 0)).toBe(true)
  })

  it('lifts the old letters away before the seam and brings the new ones up into place after it', () => {
    const clock = frames()
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <LoaderCue label={['Loading', 'Almost']} showLabel labelEffect="wave" />
      </YoujProvider>,
    )
    const label = container.querySelector('.yj-anim__label')!
    clock.run(clock.until(0.78, 0))
    clock.run(clock.until(0.9))
    const leaving = letters(label)
    expect(leaving.map((l) => l.text).join('')).toBe('Loading')
    // The first letters go first.
    expect(leaving[0]!.y).toBeLessThan(leaving.at(-1)!.y)
    expect(leaving[0]!.o).toBeLessThan(1)
    clock.run(clock.until(0.04))
    const arriving = letters(label)
    expect(arriving.map((l) => l.text).join('')).toBe('Almost')
    expect(arriving.every((l) => l.y >= 0)).toBe(true)
    expect(arriving[0]!.y).toBeLessThan(arriving.at(-1)!.y)
    clock.run(clock.until(0.78))
    expect(letters(label).every((l) => l.y === 0 && l.o === 1)).toBe(true)
  })

  it('travels from the right in a right-to-left script, first letter first', () => {
    const clock = frames()
    const { container } = render(
      <div dir="rtl">
        <YoujProvider reducedMotion="never">
          <LoaderCue label="טוען" showLabel labelEffect="wave" />
        </YoujProvider>
      </div>,
    )
    const label = container.querySelector('.yj-anim__label')!
    clock.run(clock.until(0.78, 0))
    clock.run(clock.until(0.3, 0))
    const spans = [...label.querySelectorAll<HTMLElement>('.yj-anim__glyphs > span')]
    expect(spans.map((g) => parseFloat(g.style.left))).toEqual([30, 20, 10, 0])
    const lifts = letters(label).map((l) => l.y)
    // The first letter (rightmost) rises before the last.
    expect(lifts[0]!).toBeLessThan(lifts[3]!)
  })

  it('keeps a joined script whole: Arabic takes the light through the word instead', () => {
    const clock = frames()
    const { container } = render(
      <div dir="rtl">
        <YoujProvider reducedMotion="never">
          <LoaderCue label="جارٍ التحميل" showLabel labelEffect="wave" />
        </YoujProvider>
      </div>,
    )
    const label = container.querySelector('.yj-anim__label')!
    const run = label.querySelector<HTMLElement>('.yj-anim__text')!
    clock.run(clock.until(0.3, 1))
    expect(label.querySelectorAll('.yj-anim__glyphs > span')).toHaveLength(0)
    expect(run.style.opacity).toBe('')
    const band = Number(run.style.getPropertyValue('--yj-anim-band'))
    expect(band).toBeGreaterThan(0.02)
    expect(band).toBeLessThan(0.98)
  })
})

describe('slide', () => {
  layOut()

  const place = (run: HTMLElement) => ({
    y: Number(/translateY\((-?[\d.]+)em\)/.exec(run.style.transform)?.[1] ?? 0),
    o: run.style.opacity ? Number(run.style.opacity) : 1,
    shown: run.style.visibility !== 'hidden',
  })

  it('rolls the line up at the seam: the old label rises out as the new one rises in, as one strip, then rests', () => {
    const clock = frames()
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <LoaderCue label={['Loading', 'Almost there']} showLabel labelEffect="slide" />
      </YoujProvider>,
    )
    const [first, second] = [...container.querySelectorAll<HTMLElement>('.yj-anim__label > .yj-anim__text')]
    clock.run(clock.until(0.99))
    expect(place(first!)).toMatchObject({ y: 0, o: 1, shown: true })
    const rolls: { a: ReturnType<typeof place>; b: ReturnType<typeof place> }[] = []
    for (let i = 0; i < Math.round((LOOP * 0.17) / 16); i++) {
      clock.run(1)
      rolls.push({ a: place(first!), b: place(second!) })
    }
    const mid = rolls.find((r) => r.a.shown && r.b.shown && r.a.y < -0.2 && r.b.y > 0.2)
    expect(mid).toBeDefined()
    // One strip: the old is exactly a roll's height above where the new one is.
    expect(mid!.b.y - mid!.a.y).toBeCloseTo(1.5, 2)
    // Up only: the new label never moves down.
    const ys = rolls.filter((r) => r.b.shown).map((r) => r.b.y)
    expect(ys.every((y, i) => i === 0 || y <= ys[i - 1]! + 1e-9)).toBe(true)
    expect(rolls.at(-1)).toMatchObject({ a: { shown: false }, b: { y: 0, o: 1, shown: true } })
  })

  it('rolls one label over to itself once a loop', () => {
    const clock = frames()
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <LoaderCue label="Loading" showLabel labelEffect="slide" />
      </YoujProvider>,
    )
    const run = container.querySelector<HTMLElement>('.yj-anim__label > .yj-anim__text')!
    clock.run(clock.until(0.04, 1))
    expect(place(run).y).toBeLessThan(0)
    clock.run(clock.until(0.11))
    expect(place(run).y).toBeGreaterThan(0)
    clock.run(clock.until(0.5))
    expect(place(run)).toMatchObject({ y: 0, o: 1 })
  })

  it('masks its roll to the line, with soft edges that never touch a still label', () => {
    const html = renderToString(<LoaderCue showLabel labelEffect="slide" />)
    expect(html).toMatch(
      /\.yj-anim__label\[data-effect='slide'\] \{ padding-block: 0\.3em; margin-block: -0\.3em; [^}]*mask-image: linear-gradient\(transparent, black 0\.3em, black calc\(100% - 0\.3em\), transparent\)/,
    )
  })
})

describe('the secondary color, in the still frame and the label', () => {
  /** The kit's stylesheet, as React put it in the document's head. */
  const kitCss = () => [...document.head.querySelectorAll('style')].map((s) => s.textContent ?? '').find((css) => css.includes('.yj-anim__probe')) ?? ''

  it('fills the still frame’s accent marks and accent faces from it, and leaves the default to the theme', () => {
    const { container, rerender } = render(
      <YoujProvider reducedMotion="always">
        <LoaderJot />
      </YoujProvider>,
    )
    const root = () => container.querySelector<HTMLElement>('[data-yj-loader]')!
    expect(root().style.getPropertyValue('--yj-anim-accent')).toBe('')
    expect(kitCss()).toContain('.yj-anim__art .yj-anim__accent { fill: var(--yj-anim-accent, var(--color-accent)); }')
    expect(kitCss()).toContain('color: var(--yj-anim-accent, var(--color-accent)); background-color')
    rerender(
      <YoujProvider reducedMotion="always">
        <LoaderJot accentColor="var(--color-success)" color="var(--color-fg-muted)" />
      </YoujProvider>,
    )
    expect(root().style.getPropertyValue('--yj-anim-accent')).toBe('var(--color-success)')
    expect(root().style.getPropertyValue('--yj-anim-ink')).toBe('var(--color-fg-muted)')
    // Jot's tittle is lit faces in the accent: mixed from the secondary color and the paper.
    const faces = [...container.querySelectorAll<SVGPathElement>('svg path[style]')].map((p) => p.getAttribute('style') ?? '')
    expect(faces.some((f) => f.includes('color-mix(in srgb, var(--yj-anim-accent, var(--color-accent))'))).toBe(true)
  })

  it('fills the still frame’s colored parts from --yj-anim-c1…c4, and draws its two colors alone without `colors`', () => {
    const { container, rerender } = render(
      <YoujProvider reducedMotion="always">
        <LoaderGantry colors="theme" />
      </YoujProvider>,
    )
    expect(kitCss()).toContain('.yj-anim__art .yj-anim__c1 { fill: var(--yj-anim-c1); }')
    expect(kitCss()).toContain(".yj-anim__art :is(line, path[fill='none']).yj-anim__c2 { fill: none; stroke: var(--yj-anim-c2); }")
    const faces = () => [...container.querySelectorAll<SVGPathElement>('svg path[style]')].map((p) => p.getAttribute('style') ?? '')
    // Colored: the machine's faces hold its color, lit as the accent's.
    expect(faces().some((f) => /color-mix\(in srgb, var\(--yj-anim-c1\) calc\(\d/.test(f))).toBe(true)
    expect(container.querySelector('svg .yj-anim__c2')).not.toBeNull()
    rerender(
      <YoujProvider reducedMotion="always">
        <LoaderGantry />
      </YoujProvider>,
    )
    // Mono: the ink's faces, shaded for the scheme, and no part's color anywhere.
    expect(faces().some((f) => f.includes('color-mix(in srgb, currentColor calc((var(--yj-dark, 1)'))).toBe(true)
    expect(container.querySelector('svg')!.innerHTML).not.toContain('yj-anim-c')
  })

  it('lights the label’s pulse and type’s caret with it', () => {
    render(<LoaderCue showLabel />)
    expect(kitCss()).toContain('--yj-anim-glint: color-mix(in oklab, currentColor 82%, var(--yj-anim-accent, var(--color-accent)));')
    expect(kitCss()).toMatch(/\.yj-anim__caret \{[^}]*background: var\(--yj-anim-accent, var\(--color-accent\)\);/)
  })
})

describe('type, between labels', () => {
  // Laid out as a browser lays the label out: every run in one cell as wide as the widest, each centred in it, 10px a letter.
  const offsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')!
  const elementBox = HTMLElement.prototype.getBoundingClientRect
  const cell = (run: HTMLElement) => Math.max(...[...run.parentElement!.querySelectorAll('.yj-anim__text')].map((r) => LETTER * (r.textContent?.length ?? 0)))
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = (() => null) as never
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return this.classList.contains('yj-anim__text') ? cell(this) : 0
      },
    })
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      return rect(0, this.classList.contains('yj-anim__text') ? cell(this) : 0)
    }
    Range.prototype.getBoundingClientRect = function (this: Range) {
      const run = this.startContainer.parentElement!
      const start = (cell(run) - LETTER * (run.textContent?.length ?? 0)) / 2
      return rect(start + LETTER * this.startOffset, LETTER * (this.endOffset - this.startOffset))
    }
  })
  afterEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', offsetWidth)
    HTMLElement.prototype.getBoundingClientRect = elementBox
    delete (Range.prototype as Partial<Range>).getBoundingClientRect
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('glides the caret on the empty line from where one label starts to where the next does, each way', () => {
    const clock = frames()
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <LoaderCue label={['Loading', 'Almost there']} showLabel labelEffect="type" />
      </YoujProvider>,
    )
    const caret = container.querySelector<HTMLElement>('.yj-anim__caret')!
    const x = () => Number(/translateX\((-?[\d.]+)px\)/.exec(caret.style.transform)![1])
    // Centred in a 120px cell, "Loading" starts at 25px and "Almost there" at 0: twice round, there and back.
    for (const [from, to] of [
      [25, 0],
      [0, 25],
    ] as const) {
      clock.run(clock.until(0.935))
      const glide: number[] = []
      for (let i = 0; i < Math.round((LOOP * 0.108) / 16); i++) {
        clock.run(1)
        glide.push(x())
      }
      // From the one's start to the other's, never back, and home before the next label types.
      expect(Math.abs(glide[0]! - from)).toBeLessThan(1.5)
      expect(Math.abs(glide.at(-1)! - to)).toBeLessThan(1.5)
      expect(glide.every((v, i) => i === 0 || (from > to ? v <= glide[i - 1]! + 1e-6 : v >= glide[i - 1]! - 1e-6))).toBe(true)
      expect(new Set(glide.map((v) => v.toFixed(1))).size).toBeGreaterThan(5)
    }
  })
})

describe('each new effect, on the drawing’s clock', () => {
  layOut()

  /** Everything an effect paints, as one string: each run's and each letter's inline style, and the letters' text. */
  const look = (label: Element) =>
    [...label.querySelectorAll<HTMLElement>('.yj-anim__text, .yj-anim__glyphs > span')].map((el) => `${el.textContent}|${el.getAttribute('style') ?? ''}`).join('\n')

  for (const effect of ['wave', 'scramble', 'slide'] as const) {
    it(`${effect}: the same moment of the loop looks the same at any speed, and a paused drawing holds its label`, () => {
      const clock = frames()
      const tree = (paused: boolean) => (
        <YoujProvider reducedMotion="never">
          <LoaderCue label={['Loading', 'Almost there']} showLabel labelEffect={effect} paused={paused} />
          <LoaderCue label={['Loading', 'Almost there']} showLabel labelEffect={effect} speed={2} paused={paused} />
        </YoujProvider>
      )
      const { container, rerender } = render(tree(false))
      const [slow, fast] = [...container.querySelectorAll('.yj-anim__label')]
      // A moment the effect is moving, a seam and a bit into the next loop: twice as fast gets there in half the frames.
      const at = { wave: 0.4, scramble: 0.2, slide: 0.07 }[effect]
      const steps = clock.until(at, 1, 2)
      clock.run(steps)
      const moving = look(fast!)
      clock.run(steps)
      expect(look(slow!)).toBe(moving)
      expect(moving).toMatch(/translateY|clip-path|opacity/)
      rerender(tree(true))
      const held = [look(slow!), look(fast!)]
      clock.run(60)
      expect([look(slow!), look(fast!)]).toEqual(held)
    })
  }
})
