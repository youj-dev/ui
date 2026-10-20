/* The director's hands: what a person does to an app, as the DOM events a
 * browser would send. Scenes call these from useAction, at exact frames, and
 * never reach into a component. Coordinates are the stage's CSS px, which
 * are the page's client coordinates (the stage sits at the page's origin). */

const POINTER = { pointerId: 1, pointerType: 'mouse', isPrimary: true, width: 1, height: 1, pressure: 0 }

/** The element a pointer at (x, y) is over. */
export function under(x: number, y: number): Element | null {
  return document.elementFromPoint(x, y)
}

function fire(target: EventTarget, type: string, x: number, y: number, init: MouseEventInit & PointerEventInit = {}) {
  const base = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, screenX: x, screenY: y, view: window, ...init }
  const event = type.startsWith('pointer') ? new PointerEvent(type, { ...POINTER, ...base }) : new MouseEvent(type, base)
  target.dispatchEvent(event)
}

/** What the pointer was last over, for the boundary events a browser sends when that changes. */
let hovered: Element | null = null

const chain = (el: Element | null) => {
  const all: Element[] = []
  for (let node = el; node; node = node.parentElement) all.push(node)
  return all
}

/** The pointer moves to (x, y): out of what it left and over what it reached, then pointer and mouse moves. */
export function moveTo(x: number, y: number, buttons = 0) {
  const target = under(x, y) ?? document.body
  if (target !== hovered) {
    const was = hovered
    const left = chain(was).filter((el) => !el.contains(target))
    const entered = chain(target).filter((el) => !was || !el.contains(was))
    if (was?.isConnected) {
      fire(was, 'pointerout', x, y, { buttons, relatedTarget: target })
      fire(was, 'mouseout', x, y, { buttons, relatedTarget: target })
      for (const el of left) {
        el.dispatchEvent(new PointerEvent('pointerleave', { ...POINTER, clientX: x, clientY: y, relatedTarget: target }))
        el.dispatchEvent(new MouseEvent('mouseleave', { clientX: x, clientY: y, relatedTarget: target }))
      }
    }
    fire(target, 'pointerover', x, y, { buttons, relatedTarget: was })
    fire(target, 'mouseover', x, y, { buttons, relatedTarget: was })
    for (const el of entered.reverse()) {
      el.dispatchEvent(new PointerEvent('pointerenter', { ...POINTER, clientX: x, clientY: y, relatedTarget: was }))
      el.dispatchEvent(new MouseEvent('mouseenter', { clientX: x, clientY: y, relatedTarget: was }))
    }
    hovered = target
  }
  fire(target, 'pointermove', x, y, { buttons, pressure: buttons ? 0.5 : 0 })
  fire(target, 'mousemove', x, y, { buttons })
}

/** The button goes down at (x, y); what's under it takes focus, as a real press gives it. */
export function pressAt(x: number, y: number) {
  const target = under(x, y) ?? document.body
  fire(target, 'pointerdown', x, y, { button: 0, buttons: 1, pressure: 0.5 })
  fire(target, 'mousedown', x, y, { button: 0, buttons: 1 })
  const focusable = (target as HTMLElement).closest?.<HTMLElement>('button, a[href], input, textarea, select, [tabindex]')
  focusable?.focus({ preventScroll: true })
  return target
}

/** The button comes up at (x, y), and a click lands if it went down on the same thing. */
export function releaseAt(x: number, y: number, pressed?: Element | null) {
  const target = under(x, y) ?? document.body
  fire(target, 'pointerup', x, y, { button: 0, buttons: 0 })
  fire(target, 'mouseup', x, y, { button: 0, buttons: 0 })
  if (!pressed || pressed === target || pressed.contains(target) || target.contains(pressed)) fire(target, 'click', x, y, { button: 0, detail: 1 })
}

/* A pointer the film presses is not one the browser knows is down, so
 * capturing it can throw; a capture changes nothing for events sent straight
 * to an element, as drag() sends them. */
const capture = Element.prototype.setPointerCapture
Element.prototype.setPointerCapture = function (id: number) {
  try {
    capture.call(this, id)
  } catch {
    // Not a pointer the browser has down.
  }
}

/**
 * A drag worked straight on `el`, as a captured pointer is: down at `at`
 * (stage px), then moved `dx` along from there, in the element's own px (so
 * a scaled app moves as far as its own layout says), then released there.
 */
export function drag(el: HTMLElement, at: { x: number; y: number }) {
  let x = at.x
  fire(el, 'pointerdown', at.x, at.y, { button: 0, buttons: 1, pressure: 0.5 })
  return {
    el,
    move: (dx: number) => {
      x = at.x + dx
      fire(el, 'pointermove', x, at.y, { buttons: 1, pressure: 0.5 })
    },
    release: () => fire(el, 'pointerup', x, at.y, { button: 0, buttons: 0 }),
  }
}

/** Presses a key on whatever has focus (or `target`). */
export function key(name: string, target: EventTarget | null = document.activeElement ?? document.body, init: KeyboardEventInit = {}) {
  const t = target ?? document.body
  t.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }))
  t.dispatchEvent(new KeyboardEvent('keyup', { key: name, bubbles: true, cancelable: true, ...init }))
}

const setters = {
  input: Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!,
  textarea: Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!,
}

/** The field now reads `value`, as if typed: the native value, then the input event React listens for. */
export function typeInto(field: HTMLInputElement | HTMLTextAreaElement | null | undefined, value: string) {
  if (!field || field.value === value) return
  const set = field instanceof HTMLTextAreaElement ? setters.textarea : setters.input
  set.call(field, value)
  field.dispatchEvent(new InputEvent('input', { bubbles: true, data: value.slice(-1), inputType: 'insertText' }))
}

/** The centre of an element, in stage px. */
export function centreOf(el: Element | null | undefined): { x: number; y: number } | null {
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}
