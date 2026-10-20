import { screen, waitFor } from '@testing-library/react'
import { renderFull, renderReduced } from '@youj/core/test-utils'
import { Collapse } from './collapse'

const panel = () => document.getElementById('details')

test('shows its content when open and passes attributes through for aria-controls', () => {
  renderReduced(
    <Collapse id="details" open>
      <p>Build logs</p>
    </Collapse>,
  )
  expect(screen.getByText('Build logs')).toBeInTheDocument()
  expect(panel()).not.toHaveAttribute('inert')
})

test('unmounts when closed; reduced motion does it at once', () => {
  const { rerender } = renderReduced(
    <Collapse id="details" open>
      <p>Build logs</p>
    </Collapse>,
  )
  rerender(
    <Collapse id="details" open={false}>
      <p>Build logs</p>
    </Collapse>,
  )
  expect(screen.queryByText('Build logs')).not.toBeInTheDocument()
})

test('with motion, closing keeps the content mounted and inert until it has collapsed', async () => {
  const { rerender } = renderFull(
    <Collapse id="details" open>
      <p>Build logs</p>
    </Collapse>,
  )
  rerender(
    <Collapse id="details" open={false}>
      <p>Build logs</p>
    </Collapse>,
  )
  expect(panel()).toHaveAttribute('inert')
  expect(panel()).toHaveClass('overflow-hidden')
  // The content stays visible while it collapses; it is only hidden once collapsed.
  await new Promise((r) => setTimeout(r, 60))
  expect(panel()!.style.visibility).not.toBe('hidden')
  await waitFor(() => expect(screen.queryByText('Build logs')).not.toBeInTheDocument(), { timeout: 2000 })
})

test('a panel that mounts open later clips while it grows', () => {
  const { rerender } = renderFull(
    <Collapse id="details" open={false}>
      <p>Build logs</p>
    </Collapse>,
  )
  rerender(
    <Collapse id="details" open>
      <p>Build logs</p>
    </Collapse>,
  )
  expect(panel()).toHaveClass('overflow-hidden')
})

test('keepMounted leaves closed content in the DOM but out of reach', async () => {
  renderReduced(
    <Collapse id="details" open={false} keepMounted>
      <input aria-label="Filter" />
    </Collapse>,
  )
  expect(panel()).toHaveAttribute('inert')
  await waitFor(() => expect(panel()!.style.visibility).toBe('hidden'))
  expect(panel()!.style.height).toBe('0px')
})

test('clips while it opens and stops clipping once open, so focus rings are not cut', async () => {
  const { rerender } = renderFull(
    <Collapse id="details" open={false} keepMounted>
      <p>Build logs</p>
    </Collapse>,
  )
  rerender(
    <Collapse id="details" open keepMounted>
      <p>Build logs</p>
    </Collapse>,
  )
  expect(panel()).toHaveClass('overflow-hidden')
  expect(panel()).not.toHaveAttribute('inert')
  await waitFor(() => expect(panel()).not.toHaveClass('overflow-hidden'), { timeout: 2000 })
  expect(panel()!.style.visibility).toBe('visible')
})

test('starts open without animating or clipping', () => {
  renderFull(
    <Collapse id="details" open>
      <p>Build logs</p>
    </Collapse>,
  )
  expect(panel()).not.toHaveClass('overflow-hidden')
  expect(panel()!.style.height).toBe('auto')
})
