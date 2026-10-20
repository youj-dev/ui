import { memo } from 'react'
import { screen, within } from '@testing-library/react'
import { renderFull, renderReduced } from '@youj/core/test-utils'
import { PresenceItem, PresenceList } from './presence-list'

const Items = ({ ids }: { ids: string[] }) => (
  <PresenceList aria-label="Items">
    {ids.map((id) => (
      <PresenceItem key={id}>{id}</PresenceItem>
    ))}
  </PresenceList>
)

const texts = () => within(screen.getByRole('list', { name: 'Items' })).getAllByRole('listitem').map((li) => li.textContent)

test('renders the list element with its items', () => {
  renderFull(<Items ids={['a', 'b']} />)
  expect(screen.getByRole('list', { name: 'Items' }).tagName).toBe('UL')
  expect(texts()).toEqual(['a', 'b'])
})

test('reduced motion adds, removes and reorders instantly', () => {
  const { rerender } = renderReduced(<Items ids={['a', 'b', 'c']} />)
  rerender(<Items ids={['c', 'a', 'd']} />)
  expect(texts()).toEqual(['c', 'a', 'd'])
})

test('with motion a removed item stays in its place, inert, while it fades out', () => {
  const { rerender } = renderFull(<Items ids={['a', 'b', 'c']} />)
  rerender(<Items ids={['a', 'c']} />)
  const leaving = screen.getByText('b')
  expect(texts()).toEqual(['a', 'b', 'c'])
  expect(leaving).toHaveAttribute('inert')
  expect(screen.getByText('a')).not.toHaveAttribute('inert')
})

test('new items enter from their initial pose; items present at first render start settled', () => {
  const { rerender } = renderFull(<Items ids={['a']} />)
  expect(screen.getByText('a').style.opacity).toBe('1')
  rerender(<Items ids={['a', 'b']} />)
  expect(screen.getByText('b').style.opacity).toBe('0')
})

test('initial also animates the first items in', () => {
  renderFull(
    <PresenceList initial>
      <PresenceItem key="a">a</PresenceItem>
    </PresenceList>,
  )
  expect(screen.getByText('a').style.opacity).toBe('0')
})

const Row = memo(function Row({ id }: { id: string }) {
  return (
    <PresenceItem as="tr">
      <td>{id}</td>
    </PresenceItem>
  )
})

test('renders valid table markup: tbody > tr > td, memoized rows included', () => {
  const ui = (ids: string[]) => (
    <table>
      <PresenceList as="tbody">
        {ids.map((id) => (
          <Row key={id} id={id} />
        ))}
      </PresenceList>
    </table>
  )
  const { rerender, container } = renderReduced(ui(['x', 'y']))
  rerender(ui(['y', 'x', 'z']))
  const rows = container.querySelectorAll('table > tbody > tr')
  expect([...rows].map((r) => r.textContent)).toEqual(['y', 'x', 'z'])
})
