import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cssToObject, presetClassPattern, presetUtilities, usesPresetClass } from './presets.mjs'

/* How registry items find out they need youj-presets, and how the presets
 * reach an app's stylesheet through shadcn's `css` field. */

const pattern = presetClassPattern()

test('the presets are read from presets.css', () => {
  expect(presetUtilities()).toEqual(expect.arrayContaining(['yj-pop', 'yj-tooltip', 'yj-sheet-end', 'yj-toast-content', 'yj-duration-fast']))
})

test('a preset class in a class list, a cn() call or behind a variant counts', () => {
  expect(usesPresetClass(`<div className="yj-pop origin-(--transform-origin)" />`, pattern)).toBe(true)
  expect(usesPresetClass(`cn('rounded-md yj-dialog', className)`, pattern)).toBe(true)
  expect(usesPresetClass('const c = `border yj-sheet-right`', pattern)).toBe(true)
  expect(usesPresetClass(`<Panel className="data-open:yj-collapse" />`, pattern)).toBe(true)
  expect(usesPresetClass(`<Panel className="!yj-duration-fast" />`, pattern)).toBe(true)
})

test('lookalikes, variables, keys and comments do not', () => {
  expect(usesPresetClass(`<div className="yj-popover-list" />`, pattern)).toBe(false)
  expect(usesPresetClass(`<div className="duration-(--yj-duration-fast)" />`, pattern)).toBe(false)
  expect(usesPresetClass(`<Collapse key="yj-collapse" />`, pattern)).toBe(false)
  expect(usesPresetClass(`// yj-pop comes from the popover\n/* yj-fade */\nconst a = 1`, pattern)).toBe(false)
  expect(usesPresetClass(`fetch('https://example.com/yj-pop')`, pattern)).toBe(false)
  // Tailwind can't see a class built at runtime either, so components spell them out.
  expect(usesPresetClass('const c = `yj-sheet-${side}`', pattern)).toBe(false)
})

test('nested CSS becomes the object shadcn writes back out', () => {
  const css = `
    /* dropped */
    @utility yj-demo {
      --yj-in: calc(
        var(--yj-duration-fast) * var(--yj-motion, 1)
      );
      transition:
        opacity var(--yj-in) var(--ease-enter),
        transform var(--yj-in) var(--ease-enter);
      @apply yj-base;
      &::after { content: '  '; }
      &[data-starting-style],
      &[data-ending-style]:not([data-swipe-direction]) { opacity: 0; }
    }`
  expect(cssToObject(css)).toEqual({
    '@utility yj-demo': {
      '--yj-in': 'calc(var(--yj-duration-fast) * var(--yj-motion, 1))',
      transition: 'opacity var(--yj-in) var(--ease-enter), transform var(--yj-in) var(--ease-enter)',
      '@apply yj-base': {},
      '&::after': { content: "'  '" },
      '&[data-starting-style], &[data-ending-style]:not([data-swipe-direction])': { opacity: '0' },
    },
  })
})

test('a key the object could not hold twice is an error', () => {
  expect(() => cssToObject(`@utility a { opacity: 0; opacity: 1; }`)).toThrow(/"opacity" appears twice/)
})

test('every preset converts', () => {
  const css = cssToObject(readFileSync(join(import.meta.dirname, '../src/styles/presets.css'), 'utf8'))
  expect(Object.keys(css)).toEqual(presetUtilities().map((name) => `@utility ${name}`))
  expect(css['@utility yj-pop']['&[data-instant]']).toEqual({ 'transition-duration': '0s' })
})
