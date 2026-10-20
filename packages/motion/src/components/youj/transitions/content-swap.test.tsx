import { screen, waitFor } from '@testing-library/react'
import { installObservers, renderFull, renderReduced } from '@youj/core/test-utils'
import { ContentSwap } from './content-swap'

beforeAll(installObservers)

const skeleton = <div data-testid="skeleton" />

test('shows the fallback while loading, hidden from assistive tech, and marks the region busy', () => {
  renderReduced(
    <ContentSwap data-testid="swap" loading fallback={skeleton}>
      <p>Invoices</p>
    </ContentSwap>,
  )
  expect(screen.getByTestId('skeleton').parentElement).toHaveAttribute('aria-hidden', 'true')
  expect(screen.queryByText('Invoices')).not.toBeInTheDocument()
  expect(screen.getByTestId('swap')).toHaveAttribute('aria-busy', 'true')
})

test('reduced motion swaps to the content at once and clears busy', () => {
  const { rerender } = renderReduced(
    <ContentSwap data-testid="swap" loading fallback={skeleton}>
      <p>Invoices</p>
    </ContentSwap>,
  )
  rerender(
    <ContentSwap data-testid="swap" loading={false} fallback={skeleton}>
      <p>Invoices</p>
    </ContentSwap>,
  )
  expect(screen.getByText('Invoices')).toBeInTheDocument()
  expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
  expect(screen.getByTestId('swap')).not.toHaveAttribute('aria-busy')
})

test('with motion the fallback fades out while the content resolves in, then leaves', async () => {
  const { rerender } = renderFull(
    <ContentSwap data-testid="swap" loading fallback={skeleton}>
      <p>Invoices</p>
    </ContentSwap>,
  )
  rerender(
    <ContentSwap data-testid="swap" loading={false} fallback={skeleton}>
      <p>Invoices</p>
    </ContentSwap>,
  )
  expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  expect(screen.getByText('Invoices').parentElement!.style.opacity).toBe('0')
  await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument(), { timeout: 2000 })
})

test('it works in both directions: a refetch brings the fallback back', () => {
  const { rerender } = renderReduced(
    <ContentSwap data-testid="swap" loading={false} fallback={skeleton}>
      <p>Invoices</p>
    </ContentSwap>,
  )
  rerender(
    <ContentSwap data-testid="swap" loading fallback={skeleton}>
      <p>Invoices</p>
    </ContentSwap>,
  )
  expect(screen.getByTestId('skeleton')).toBeInTheDocument()
})

test('an optional label is announced while loading', () => {
  const { rerender } = renderReduced(
    <ContentSwap loading fallback={skeleton} loadingLabel="Loading invoices">
      <p>Invoices</p>
    </ContentSwap>,
  )
  expect(screen.getByRole('status')).toHaveTextContent('Loading invoices')
  rerender(
    <ContentSwap loading={false} fallback={skeleton} loadingLabel="Loading invoices">
      <p>Invoices</p>
    </ContentSwap>,
  )
  expect(screen.getByRole('status')).toHaveTextContent('')
})

test('leaves no pinned height behind when there is nothing to morph', () => {
  const { rerender } = renderFull(
    <ContentSwap data-testid="swap" loading fallback={skeleton}>
      <p>Invoices</p>
    </ContentSwap>,
  )
  rerender(
    <ContentSwap data-testid="swap" loading={false} fallback={skeleton}>
      <p>Invoices</p>
    </ContentSwap>,
  )
  const box = screen.getByTestId('swap')
  expect(box.style.height).toBe('')
  expect(box.style.overflow).toBe('')
})
