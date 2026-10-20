import { fixedSizeAllowed, scalingViolations } from './scaling-sizes.mjs'

const rules = (line) => scalingViolations(line).map(({ rule, token }) => `${rule.split(' (')[0]}: ${token}`)

describe('scaling sizes', () => {
  test('flags arbitrary rem, text sizes and room in px', () => {
    expect(rules(`'max-w-[46rem] text-[0.6875rem] h-[52px] md:w-[320px]'`)).toEqual([
      'arbitrary rem size: max-w-[46rem]',
      'arbitrary text size: text-[0.6875rem]',
      'arbitrary px size: h-[52px]',
      'arbitrary px size: md:w-[320px]',
    ])
    expect(rules(`'grid-cols-[3.25rem_1fr] text-[length:13px]'`)).toEqual(['arbitrary rem size: grid-cols-[3.25rem_1fr]', 'arbitrary text size: text-[length:13px]'])
  })

  test('leaves tokens, hairlines, rings, shadows, blur and offsets alone', () => {
    expect(
      rules(
        `'p-[calc(var(--spacing)*(5_-_var(--ui--compact,0)))] border-[1.5px] ring-[3px] shadow-[0_8px_24px_var(--shadow)] blur-[12px] translate-y-[6px] -translate-x-[4px] rounded-[calc(var(--radius-xl)-1px)] top-[2px] w-[--spacing(18)] gap-(--card-spacing) w-[30%]'`,
      ),
    ).toEqual([])
  })

  test('is escaped on the line or the line above by a fixed-size allow', () => {
    expect(fixedSizeAllowed(`'h-[52px]', // youj-allow: fixed size, the logo's box`)).toBe(true)
    expect(fixedSizeAllowed(`<div className="h-[52px]">`, `  {/* youj-allow: fixed size, the QR code's grid */}`)).toBe(true)
    expect(fixedSizeAllowed(`'h-[52px]'`, `// youj-allow: raw color`)).toBe(false)
  })
})
