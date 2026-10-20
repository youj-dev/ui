import { render } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import { PageArt } from './page-art'
import { PAGE_ARTS } from '@/lib/page-art'

// The scenes are a chunk of their own on the site (components/mdx-lazy.tsx); here they render in place.
vi.mock('@/components/mdx-lazy', async () => ({ PageArtScenes: (await import('./page-art-scenes')).PageArtScenes }))

const moving = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="never">{ui}</YoujProvider>)
const still = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('PageArt', () => {
  it.each(PAGE_ARTS)('draws %s: a band with at least one scene in it', (art) => {
    const { container } = moving(<PageArt art={art} />)
    const band = container.querySelector(`[data-page-art="${art}"]`)!
    expect(band).toBeInTheDocument()
    expect(band.querySelectorAll('[data-slot="iso-scene"]').length).toBeGreaterThan(0)
  })

  it('is a picture: hidden from assistive tech, with nothing in it to focus or name', () => {
    const { container } = moving(<PageArt art="ai" />)
    const band = container.querySelector('[data-page-art]')!
    expect(band).toHaveAttribute('aria-hidden', 'true')
    expect(band).toHaveAttribute('inert')
    expect(band.querySelector('[role="img"], title, a, button, [tabindex]')).toBeNull()
  })

  it('keeps its height whatever it draws, so the text under it never moves', () => {
    const { container } = moving(<PageArt art="installation" />)
    expect(container.querySelector('[data-page-art]')).toHaveClass('h-38', 'sm:h-46', 'overflow-hidden')
  })

  it('holds a route’s particle still while the band is off screen', () => {
    const { container } = moving(<PageArt art="cli" />)
    const runner = container.querySelector<HTMLElement>('[data-page-art] .particle')!.parentElement!
    expect(runner.style.animationName || runner.style.animation).toContain('page-art-run')
    expect(runner.style.animationPlayState).toBe('paused')
  })

  it('draws every scene finished under reduced motion, and the particle rests where it arrives', () => {
    const { container } = still(<PageArt art="cli" />)
    const pieces = [...container.querySelectorAll<SVGGElement>('[data-slot="iso-scene"] > g')]
    expect(pieces.length).toBeGreaterThan(0)
    expect(pieces.filter((g) => g.style.opacity === '0')).toEqual([])
    const runner = container.querySelector<HTMLElement>('[data-page-art] .particle')!.parentElement!
    expect(runner.style.animation).toBe('')
  })
})
