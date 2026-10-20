// Sizes that don't follow the UI scale (youj.css section 5). Inside a
// `data-yj-scaling` scope the spacing unit, the type scale, control heights and
// radii all scale; a Tailwind arbitrary value written in rem or px doesn't, so
// it stays at 100% while everything around it shrinks or grows. lint:tokens
// counts them per file against scaling-baseline.json, a ratchet: a file may
// lose them, never gain them. A size that must hold (a hairline offset, an
// asset's intrinsic box) is marked on its own line or the line above with
// `// youj-allow: fixed size, <reason>`.

/* Utilities whose px are crisp edges, not room: lines, rings, shadows, blur
 * and offsets in motion. */
const PX_EXEMPT = /^-?(?:border|ring|ring-offset|outline|outline-offset|shadow|inset-shadow|drop-shadow|divide|blur|backdrop-blur|translate|translate-x|translate-y|stroke|underline-offset|decoration)(?:-[a-z]+)?$/

/** Every `utility-[value]` in a line, with its variants stripped. */
function arbitraryValues(line) {
  const out = []
  for (const m of line.matchAll(/(?<![\w\]-])((?:[\w-]+:)*)(-?[a-z][\w-]*?)-\[([^\]\s"'`]+)\]/g)) out.push({ utility: m[2], value: m[3], token: m[0] })
  return out
}

/** The scaling violations on one line of source: `{ rule, token }`, one per arbitrary value at most. */
export function scalingViolations(line) {
  const found = []
  for (const { utility, value, token } of arbitraryValues(line)) {
    if (/^text$/.test(utility) && /^(?:length:)?-?[\d.]+(?:px|rem)$/.test(value)) found.push({ rule: 'arbitrary text size (use a text-ui*/text-* step)', token })
    else if (/\d(?:\.\d+)?rem(?![a-z])/.test(value)) found.push({ rule: 'arbitrary rem size (use a spacing step or --spacing())', token })
    else if (!PX_EXEMPT.test(utility) && /(?<![\w.])(?:[3-9]|[1-9]\d+)(?:\.\d+)?px(?![a-z])/.test(value)) found.push({ rule: 'arbitrary px size (use a spacing step or --spacing())', token })
  }
  return found
}

/** Whether a line (or the one above it) marks its sizes as deliberately fixed. */
export const fixedSizeAllowed = (line, previous = '') => /youj-allow: fixed size/.test(line) || /^\s*(?:\/\/|\{?\/\*)\s*youj-allow: fixed size/.test(previous)
