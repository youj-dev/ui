import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { CardPreview } from './card-preview'

let inView = false
vi.mock('motion/react', () => ({ useInView: () => inView }))
// Shaped like the real index: each entry is already lazy, with a preload that resolves to its module.
vi.mock('@/examples', async () => {
  const { lazy } = await import('react')
  const load = () => Promise.resolve({ default: () => <p data-testid="probe">demo</p> })
  return { examples: { 'test/probe': Object.assign(lazy(load), { preload: load }) } }
})

describe('CardPreview', () => {
  it('draws nothing until its card nears the screen', () => {
    inView = false
    render(<CardPreview name="test/probe" />)
    expect(screen.queryByTestId('probe')).not.toBeInTheDocument()
  })

  it('loads the examples index and draws the demo once its card is near', async () => {
    inView = true
    render(<CardPreview name="test/probe" />)
    expect(await screen.findByTestId('probe')).toBeInTheDocument()
  })

  it('keeps a blank stage for a demo that is not registered, without taking the page down', async () => {
    inView = true
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(<CardPreview name="test/missing" />)
    await vi.waitFor(() => expect(quiet).toHaveBeenCalled())
    expect(container.querySelector('[aria-hidden]')).toBeInTheDocument()
    expect(screen.queryByTestId('probe')).not.toBeInTheDocument()
    quiet.mockRestore()
  })

  it('imports the examples index only when a card is near, so it stays out of the page’s JavaScript', () => {
    const source = readFileSync(join(process.cwd(), 'components/docs/card-preview.tsx'), 'utf8')
    expect(source).not.toMatch(/^import [^']* from '@\/examples'/m)
    expect(source).toMatch(/import\('@\/examples'\)/)
  })
})
