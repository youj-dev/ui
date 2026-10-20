import { cn } from './cn'

test('text-ui sizes are font sizes: a colour beside one keeps both, a later size replaces it', () => {
  expect(cn('text-ui-sm', 'text-fg-muted')).toBe('text-ui-sm text-fg-muted')
  expect(cn('text-ui text-fg-muted', 'text-ui-lg')).toBe('text-fg-muted text-ui-lg')
  expect(cn('text-ui-xs', 'text-sm')).toBe('text-sm')
})

