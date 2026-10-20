import { act, fireEvent, render } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import type { YoujIconComponent } from '../components/youj/icons'

/* Contract tests shared by the icon files: a file lists its icons and the paths
 * each morph lands on, and these run the same behaviour checks over them. */

const full = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="never">{children}</YoujProvider>
const reduced = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="always">{children}</YoujProvider>
const svgOf = (c: HTMLElement) => c.querySelector('svg')!
const pathsOf = (c: HTMLElement) => [...svgOf(c).querySelectorAll('path')].filter((p) => !p.closest('mask, clipPath')).map((p) => p.getAttribute('d'))
const nextFrame = () => act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))))

export type Morph = { to: string[]; from: string[] }

/** State icons name their two states, and a controlled `active` wins over hover. */
export function describeStateLabels(states: [YoujIconComponent, [string, string]][]) {
  test.each(states.map(([I, s]) => [I.meta.name, I, s] as const))('%s names its two states and follows a controlled active over hover', (_, Icon, labels) => {
    expect(Icon.meta.states).toEqual(labels)
    const { container, rerender } = render(<Icon active={false} />, { wrapper: full })
    const svg = svgOf(container)
    fireEvent.pointerEnter(svg)
    expect(svg).toHaveAttribute('data-state', 'rest')
    rerender(<Icon active />)
    expect(svg).toHaveAttribute('data-state', 'active')
  })
}

/** Morphing icons mount on their end shape when controlled, and switch instantly under reduced motion. */
export function describeMorphs(morphs: [YoujIconComponent, Morph][]) {
  const rows = morphs.map(([I, m]) => [I.meta.name, I, m] as const)

  test.each(rows)('%s mounts straight into its end shape when controlled', (_, Icon, { to, from }) => {
    const d = pathsOf(render(<Icon active />, { wrapper: full }).container)
    for (const path of to) expect(d).toContain(path)
    for (const path of from) expect(d).not.toContain(path)
  })

  test.each(rows)('%s switches instantly under reduced motion', async (_, Icon, { to, from }) => {
    const { container, rerender } = render(<Icon active={false} />, { wrapper: reduced })
    for (const path of from) expect(pathsOf(container)).toContain(path)
    rerender(<Icon active />)
    await nextFrame()
    for (const path of to) expect(pathsOf(container)).toContain(path)
  })
}
