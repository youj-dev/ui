import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { AuthShell } from '../auth/shell'
import { Login } from '../auth/login'
import { MarketingCta } from '../marketing/cta'
import { EmptyStates, NoProjects } from './empty-states'
import { Onboarding } from './onboarding'
import { FirstSource } from './first-source'

/* Every block with an illustration slot: a fitting scene by default, another
 * by id, your own node as given, and `null` for the block's plainer look. */

const reduced = (ui: ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const scenes = (container: HTMLElement) => [...container.querySelectorAll('[data-illustration]')].map((el) => el.getAttribute('data-illustration'))

describe('illustration slots', () => {
  test('each block opens on a scene that fits it', () => {
    expect(scenes(reduced(<AuthShell variant="split">form</AuthShell>).container)).toEqual(['deploy'])
    expect(scenes(reduced(<MarketingCta />).container)).toEqual(['deploy'])
    expect(scenes(reduced(<Onboarding />).container)).toEqual(['team'])
    expect(scenes(reduced(<EmptyStates />).container)).toEqual(['empty', 'search', 'security', 'cloud'])
    // The warehouse keeps its own floor, which follows the chosen source.
    const { container } = reduced(<FirstSource />)
    expect(container.querySelector('[data-slot=first-source-floor]')).toBeInTheDocument()
    expect(scenes(container)).toEqual([])
  })

  test('an id swaps the scene', () => {
    expect(scenes(reduced(<AuthShell variant="split" illustration="security">form</AuthShell>).container)).toEqual(['security'])
    expect(scenes(reduced(<Login layout="split" illustration="team" />).container)).toEqual(['team'])
    expect(scenes(reduced(<MarketingCta illustration="cloud" />).container)).toEqual(['cloud'])
    expect(scenes(reduced(<Onboarding illustration="success" />).container)).toEqual(['success'])
    expect(scenes(reduced(<EmptyStates illustration="mail" />).container)).toEqual(['mail', 'mail', 'mail', 'mail'])
    const { container } = reduced(<FirstSource illustration="pipeline" />)
    expect(scenes(container)).toEqual(['pipeline'])
    expect(container.querySelector('[data-slot=first-source-floor]')).not.toBeInTheDocument()
  })

  test('an id that names no scene falls back to the block’s own, as a stale link would', () => {
    expect(scenes(reduced(<MarketingCta illustration={'retired-scene' as never} />).container)).toEqual(['deploy'])
  })

  test('your own node is drawn as given', () => {
    const { getByTestId, container } = reduced(<MarketingCta illustration={<img data-testid="art" alt="" />} />)
    expect(getByTestId('art')).toBeInTheDocument()
    expect(scenes(container)).toEqual([])
  })

  test('null leaves the plainer look: the icon, the gradient, no picture', () => {
    const empty = reduced(<NoProjects illustration={null} />).container
    expect(scenes(empty)).toEqual([])
    expect(empty.querySelector('[data-slot=empty-icon][data-variant=icon]')).toBeInTheDocument()
    expect(scenes(reduced(<AuthShell variant="split" illustration={null}>form</AuthShell>).container)).toEqual([])
    expect(scenes(reduced(<Onboarding illustration={null} />).container)).toEqual([])
    const warehouse = reduced(<FirstSource illustration={null} />).container
    expect(scenes(warehouse)).toEqual([])
    expect(warehouse.querySelector('[data-slot=first-source-floor]')).not.toBeInTheDocument()
  })

  test('the card layout has no art panel, so it draws no scene', () => {
    expect(scenes(reduced(<AuthShell illustration="security">form</AuthShell>).container)).toEqual([])
  })

  test('scenes are pictures: aria-hidden, with the words beside them', () => {
    const { container } = reduced(<EmptyStates />)
    for (const svg of container.querySelectorAll('[data-illustration]')) expect(svg).toHaveAttribute('aria-hidden', 'true')
  })
})
