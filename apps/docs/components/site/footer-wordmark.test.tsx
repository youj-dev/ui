import { render } from '@testing-library/react'
import { FooterWordmark } from './footer-wordmark'

/* The page-scale word in the footer is drawn in the logo's lettering: the u
 * turned with the j's bends, the square o, the y on the j's tail, the j with
 * its square tittle. Written out here so a change to the shared letters
 * can't redraw the footer unnoticed. */
const LETTERS = [
  'M0 8.57H2.19V15.6C2.19 16.4 2.29 16.8 2.74 16.8H7.13C7.58 16.8 7.68 16.4 7.68 15.6V8.57H9.87V20.8C9.87 23.25 8.67 24 7.28 24H4.28V22.05H7.13C7.58 22.05 7.68 21.65 7.68 20.85V18.75H2.59C1.2 18.75 0 18 0 15.55Z',
  'M14.24 8.57H18.93C20.32 8.57 21.52 9.32 21.52 11.77V16.8C21.52 19.25 20.32 20 18.93 20H14.24C12.85 20 11.65 19.25 11.65 16.8V11.77C11.65 9.32 12.85 8.57 14.24 8.57ZM14.39 10.52C13.94 10.52 13.84 10.92 13.84 11.72V16.85C13.84 17.65 13.94 18.05 14.39 18.05H18.78C19.23 18.05 19.33 17.65 19.33 16.85V11.72C19.33 10.92 19.23 10.52 18.78 10.52Z',
  'M23.27 8.57H25.46V16.85C25.46 17.65 25.56 18.05 26.01 18.05H30.4C30.85 18.05 30.95 17.65 30.95 16.85V8.57H33.14V16.8C33.14 19.25 31.94 20 30.55 20H25.86C24.47 20 23.27 19.25 23.27 16.8Z',
  'M35.2 8.57H37.39V20.8C37.39 23.25 36.19 24 34.8 24H31.8V22.05H34.65C35.1 22.05 35.2 21.65 35.2 20.85Z',
]

describe('the footer wordmark', () => {
  it('draws the logo’s youj lettering, with the square tittle over the j as drawn', () => {
    const { container } = render(<FooterWordmark />)
    const svg = container.querySelector('svg[role=img]')!
    expect(svg).toHaveAttribute('aria-label', 'youj')
    expect(svg).toHaveAttribute('viewBox', '0 0 37.39 24')
    expect([...svg.querySelectorAll('path')].map((p) => p.getAttribute('d'))).toEqual(LETTERS)
    const tittle = svg.querySelector('rect')!
    expect(['x', 'y', 'width', 'height'].map((a) => tittle.getAttribute(a))).toEqual(['35.13', '4', '2.33', '2.33'])
    expect(tittle).toHaveClass('fill-accent')
  })

  it('is no badge: its letters are drawn in the line ink, set full width', () => {
    const { container } = render(<FooterWordmark />)
    expect(container.querySelector('mask')).toBeNull()
    expect(container.firstElementChild).toHaveClass('text-line-strong')
    expect(container.querySelector('svg')).toHaveClass('block', 'h-auto', 'w-full', '[&_.fill-fg]:fill-current')
    expect(container.querySelectorAll('svg .fill-fg path')).toHaveLength(LETTERS.length)
  })
})
