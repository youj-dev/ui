/* Key names and the page's own keys: what `press()` accepts, how hints print
 * keys, and which keystrokes belong to something else on the page and must
 * never reach a miniature. A key is a `KeyboardEvent.key` value, optionally
 * with Shift (`shift+w`, which a few figures bind to the reverse of `w`). */

const NAMES: Record<string, string> = {
  space: ' ',
  spacebar: ' ',
  enter: 'Enter',
  return: 'Enter',
  esc: 'Escape',
  escape: 'Escape',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  tab: 'Tab',
  backspace: 'Backspace',
  delete: 'Delete',
}

const SHIFT = /^shift\+(?=.)/i

/** A key as `KeyboardEvent.key`: `'space'` → `' '`, `'up'` → `'ArrowUp'`, `'C'` → `'c'`, `'Shift+W'` → `'shift+w'`. */
export function normalizeKey(key: string): string {
  if (SHIFT.test(key)) return `shift+${normalizeKey(key.replace(SHIFT, ''))}`
  if (key === ' ') return key
  const named = NAMES[key.toLowerCase()]
  if (named) return named
  return key.length === 1 ? key.toLowerCase() : key
}

/** The KeyboardEvent a normalized key stands for: `shift+w` is `W` with Shift held. */
export function keyEvent(key: string): { key: string; code: string; shiftKey: boolean } {
  const shiftKey = key.startsWith('shift+')
  const base = shiftKey ? key.slice('shift+'.length) : key
  const typed = shiftKey && base.length === 1 ? base.toUpperCase() : base
  return { key: typed, code: codeOf(base), shiftKey }
}

/** The `KeyboardEvent.code` a US keyboard reports for a key. */
export function codeOf(key: string): string {
  if (key === ' ') return 'Space'
  if (/^[a-z]$/i.test(key)) return `Key${key.toUpperCase()}`
  if (/^[0-9]$/.test(key)) return `Digit${key}`
  return key
}

/** How `aria-keyshortcuts` names a key. */
export const shortcutName = (key: string): string =>
  key.startsWith('shift+') ? `Shift+${shortcutName(key.slice('shift+'.length))}` : key === ' ' ? 'Space' : key.length === 1 ? key.toUpperCase() : key

const TYPING = 'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role=textbox],[role=searchbox],[role=combobox]'
const ACTIVATES = 'button,a[href],summary,[role=button],[role=link],[role=checkbox],[role=switch],[role=menuitem],[role=menuitemcheckbox],[role=menuitemradio],[role=option],[role=tab],[role=radio],[role=treeitem]'
const ARROWS = '[role=slider],[role=spinbutton],[role=scrollbar],[role=listbox],[role=menu],[role=menubar],[role=radiogroup],[role=tablist],[role=tree],[role=treegrid],[role=grid]'

/** Whether a keystroke aimed at `target` (outside the miniature) is the page's: typing, or a control's own Space/Enter/arrows. */
export function belongsToPage(key: string, target: EventTarget | null): boolean {
  const el = target as Element | null
  if (!el || typeof el.closest !== 'function') return false
  if (el.closest(TYPING)) return true
  if ((key === ' ' || key === 'Enter') && el.closest(ACTIVATES)) return true
  return key.startsWith('Arrow') && el.closest(ARROWS) !== null
}
