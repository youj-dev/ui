import { cn } from './utils'

describe('cn knows the ui.css tokens', () => {
  test('a UI font size does not swallow a text colour', () => {
    expect(cn('text-fg-muted', 'text-ui')).toBe('text-fg-muted text-ui')
    expect(cn('text-ui', 'text-on-accent')).toBe('text-ui text-on-accent')
  })

  test('UI font sizes replace each other and the stock scale', () => {
    expect(cn('text-ui', 'text-ui-sm')).toBe('text-ui-sm')
    expect(cn('text-ui-lg', 'text-sm')).toBe('text-sm')
  })

  test('control heights conflict with other heights and sizes', () => {
    expect(cn('h-control', 'h-full')).toBe('h-full')
    expect(cn('size-control', 'size-control-xs')).toBe('size-control-xs')
    expect(cn('min-h-control-sm', 'min-h-0')).toBe('min-h-0')
  })

  test('unknown youj utilities pass through untouched', () => {
    expect(cn('focus-ring', 'focus-field', 'reduced:transition-none')).toBe('focus-ring focus-field reduced:transition-none')
  })
})
