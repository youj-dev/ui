/* Test kit for the entrance looks. jsdom has no layout, canvas, Web Animations or Path2D, so this gives each in a
 * minimal form: elements get their box from a `data-box="x,y,w,h"` attribute, a canvas gets a context that counts
 * what is drawn on it, `animate` returns a recording stand-in, and animation frames wait in a queue the test can
 * drain. The looks themselves are checked in Chromium; these tests hold what they promise on any clock. */

export interface FakeAnimation {
  el: Element
  frames: Keyframe[]
  opts: KeyframeAnimationOptions
  cancelled: boolean
  paused: boolean
  startTime: number | null
  currentTime: number | null
  cancel(): void
  pause(): void
}

export interface Env {
  animations: FakeAnimation[]
  frames: FrameRequestCallback[]
  /** Calls made on every fake canvas context, by method name. */
  draws: Map<string, number>
  restore(): void
}

export function installEntranceEnv(): Env {
  const env: Env = { animations: [], frames: [], draws: new Map(), restore: () => {} }
  const originals: Array<() => void> = []
  const patch = <T extends object, K extends keyof T>(target: T, key: K, value: T[K]) => {
    const had = Object.hasOwn(target, key)
    const before = target[key]
    Object.defineProperty(target, key, { configurable: true, writable: true, value })
    originals.push(() => {
      if (had) Object.defineProperty(target, key, { configurable: true, writable: true, value: before })
      else delete target[key]
    })
  }

  patch(Element.prototype, 'animate', function (this: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) {
    const a: FakeAnimation = {
      el: this,
      frames,
      opts,
      cancelled: false,
      paused: false,
      startTime: null,
      currentTime: null,
      cancel() {
        this.cancelled = true
      },
      pause() {
        this.paused = true
      },
    }
    env.animations.push(a)
    return a as unknown as Animation
  } as unknown as Element['animate'])
  patch(Element.prototype, 'getAnimations', (() => []) as unknown as Element['getAnimations'])

  const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => env.frames.push(cb))
  const caf = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})

  // Layout: an element's box is its data-box; a text range's box is its parent element's.
  const box = (el: Element | null) => {
    const [x = 0, y = 0, w = 0, h = 0] = (el?.getAttribute('data-box') ?? '').split(',').map(Number)
    return { x, y, left: x, top: y, width: w, height: h, right: x + w, bottom: y + h, toJSON() {} } as DOMRect
  }
  const rect = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    return box(this)
  })
  patch(Range.prototype, 'getClientRects', function (this: Range) {
    const parent = this.commonAncestorContainer instanceof Element ? this.commonAncestorContainer : this.commonAncestorContainer.parentElement
    const r = box(parent)
    return (r.width ? [r] : []) as unknown as DOMRectList
  } as Range['getClientRects'])
  patch(Range.prototype, 'getBoundingClientRect', function (this: Range) {
    const parent = this.commonAncestorContainer instanceof Element ? this.commonAncestorContainer : this.commonAncestorContainer.parentElement
    return box(parent)
  })

  // Canvas: one context per canvas that counts its calls and answers the few reads a look makes.
  const contexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>()
  const fake = (canvas: HTMLCanvasElement) => {
    const store: Record<string | symbol, unknown> = { canvas }
    const fns = new Map<string | symbol, unknown>()
    return new Proxy(store, {
      get(_, prop) {
        if (prop in store) return store[prop]
        if (prop === 'measureText') return (s: string) => ({ width: String(s).length * 6 })
        if (prop === 'getImageData') return () => ({ data: new Uint8ClampedArray([200, 120, 40, 255]) })
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => ({ addColorStop() {} })
        if (prop === 'createPattern') return () => ({ setTransform() {} })
        if (prop === 'isPointInPath') return () => false
        if (!fns.has(prop)) {
          fns.set(prop, (...args: unknown[]) => {
            void args
            env.draws.set(String(prop), (env.draws.get(String(prop)) ?? 0) + 1)
          })
        }
        return fns.get(prop)
      },
      set(_, prop, value) {
        store[prop] = value
        return true
      },
    }) as unknown as CanvasRenderingContext2D
  }
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    if (!contexts.has(this)) contexts.set(this, fake(this))
    return contexts.get(this) as never
  })

  // Shapes an icon or chart is traced from.
  // (functions, not classes: `new` on a function that returns an object gives that object, here one that answers any method)
  const anything = <T extends object>(base: T, answer: (prop: string, self: T) => unknown) =>
    new Proxy(base, { get: (t, prop, self) => (prop in t ? (t as never)[prop] : answer(String(prop), self as T)) })
  const FakePath2D = function () {
    return anything({}, () => () => {})
  }
  const FakeMatrix = function () {
    return anything({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, (prop, self) => (prop.endsWith('Self') ? () => self : () => ({ x: 0, y: 0, z: 0, w: 1 })))
  }
  class FakePoint {
    constructor(
      public x = 0,
      public y = 0,
      public z = 0,
    ) {}
  }
  patch(globalThis, 'Path2D', FakePath2D as unknown as typeof Path2D)
  patch(globalThis, 'DOMPoint', FakePoint as unknown as typeof DOMPoint)
  patch(globalThis, 'DOMMatrix', FakeMatrix as unknown as typeof DOMMatrix)
  patch(SVGElement.prototype, 'getScreenCTM' as keyof SVGElement, (() => ({})) as never)
  patch(SVGElement.prototype, 'getTotalLength' as keyof SVGElement, (() => 20) as never)

  env.restore = () => {
    raf.mockRestore()
    caf.mockRestore()
    rect.mockRestore()
    getContext.mockRestore()
    while (originals.length) originals.pop()!()
    document.body.innerHTML = ''
    document.head.querySelectorAll('style').forEach((s) => s.remove())
  }
  return env
}

/** A small dashboard with every kind of part a look reads: a surface, headings, paragraphs, a button, a field, a
 *  list of rows, a rule, an icon, a chart and an image. Returns the demo element, attached to the page. */
export function richDemo({ rtl = false } = {}) {
  const host = document.createElement('div')
  host.innerHTML = `
<section data-box="0,0,480,380" ${rtl ? 'dir="rtl"' : ''} style="background-color:rgb(255,255,255);padding:16px;border:1px solid rgb(200,200,200);border-radius:12px;box-shadow:0 1px 2px rgb(0,0,0);display:flex;gap:8px">
  <header data-box="16,16,448,48" data-slot="header" style="display:flex">
    <h2 data-box="16,16,200,24" style="font-size:20px;line-height:24px">Dashboard</h2>
    <button data-box="380,16,84,28" style="background-color:rgb(0,100,200);color:rgb(255,255,255);border-radius:6px">New</button>
  </header>
  <p data-box="16,72,300,40" style="font-size:14px;line-height:20px;color:rgb(90,90,90)">Welcome back, here is what changed today.</p>
  <input data-box="16,120,300,32" aria-label="Search" style="border:1px solid rgb(200,200,200);border-radius:6px;padding:4px 8px">
  <ul data-box="16,164,448,120" style="border:1px solid rgb(220,220,220)">
    <li data-box="16,164,448,40"><span data-box="24,172,120,20">Row one</span></li>
    <li data-box="16,204,448,40"><span data-box="24,212,120,20">Row two</span></li>
    <li data-box="16,244,448,40"><span data-box="24,252,120,20">Row three</span></li>
  </ul>
  <hr data-box="16,290,448,1">
  <svg data-box="16,300,24,24"><path d="M0 0L10 10" stroke="black"></path><circle cx="5" cy="5" r="3"></circle></svg>
  <svg data-box="60,300,200,60"><rect x="0" y="0" width="20" height="40"></rect><rect x="30" y="10" width="20" height="30"></rect></svg>
  <img data-box="300,300,80,50" alt="">
  <div data-box="400,300,32,32" style="background-color:rgb(0,100,200);border-radius:16px"></div>
  <div data-box="16,330,200,24" style="font-size:12px;text-transform:uppercase;letter-spacing:1px">Updated just now</div>
</section>`
  document.body.append(host)
  return { host, node: host.firstElementChild as HTMLElement }
}
