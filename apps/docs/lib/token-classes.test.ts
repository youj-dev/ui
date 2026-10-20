import { tokenClasses, tokenClassesMarkdown } from './token-classes'

test('lists the role classes and the classes the tokens add, read from the source', () => {
  const all = tokenClasses().flatMap((group) => group.classes)
  for (const name of ['bg-chrome', 'text-on-accent', 'border-line-control', 'ring-focus', 'bg-chart-1', 'rounded-button', 'rounded-field-area', 'h-control-sm', 'text-ui-xs', 'shadow-sm-soft']) expect(all).toContain(name)
  expect(all.filter((name) => name.includes('line-height') || name === 'rounded-md' || name.startsWith('('))).toEqual([])
  expect(new Set(all).size).toBe(all.length)
})

test('the Markdown export carries every class', () => {
  const markdown = tokenClassesMarkdown()
  expect(markdown).toContain('- **Surfaces:** `bg-canvas` `bg-surface`')
  expect(markdown).toContain('`rounded-chip`')
})
