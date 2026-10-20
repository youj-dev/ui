import { render } from '@testing-library/react'
import { loaderEntries } from '@/components/loaders/entries'
import { sceneCount } from '@/lib/catalog'
import { KitNames } from './kit-names'

test('lists every loader id, by category', () => {
  const { container } = render(<KitNames kit="loaders" />)
  const shown = [...container.querySelectorAll('td code')].map((code) => code.textContent)
  expect(shown.sort()).toEqual(loaderEntries().map((entry) => entry.id).sort())
})

test('lists every illustration scene id', () => {
  const { container } = render(<KitNames kit="illustrations" />)
  expect(container.querySelectorAll('td code')).toHaveLength(sceneCount())
})
