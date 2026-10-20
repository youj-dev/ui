import { render, screen, waitFor } from '@testing-library/react'

/* Button fetches its spinner on demand. The test setup loads it once for every
 * other test; here a fresh copy of the module shows the path an app takes
 * before that chunk arrives. */
async function freshButton() {
  vi.resetModules()
  return (await import('./button')).Button
}

describe('Button, before its spinner arrives', () => {
  test('a loading button announces the wait at once, and its spinner follows', async () => {
    const Button = await freshButton()
    render(<Button loading>Deploying</Button>)
    expect(screen.getByRole('status')).toHaveTextContent('Loading')
    await waitFor(() => expect(document.querySelector('[data-slot=spinner]')).toBeInTheDocument())
  })
})
