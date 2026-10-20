// The motion components under MotionFeatures: core's features.test.tsx covers the boundary itself.
import { useEffect, useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'

/* The test setup preloads Motion's features for every other test. Here a fresh
 * copy of the modules shows what an app sees before the chunk arrives. */
async function fresh() {
  vi.resetModules()
  const [motion, features, provider] = await Promise.all([
    import('motion/react'),
    import('@youj/core/lib/youj/features'),
    import('@youj/core/lib/youj/provider'),
  ])
  return { m: motion.m, AnimatePresence: motion.AnimatePresence, LazyMotion: motion.LazyMotion, domMax: motion.domMax, ...features, YoujProvider: provider.YoujProvider }
}

describe('motion components under MotionFeatures', () => {
  test('the blocks that render initial={false} presences pass a late change through to their content', async () => {
    const { m, MotionFeatures, preloadMotionFeatures } = await fresh()
    const [{ ContentSwap }, { Collapse }] = await Promise.all([import('../components/youj/transitions/content-swap'), import('../components/youj/transitions/collapse')])
    function Fader({ id }: { id: string }) {
      const [on, setOn] = useState(false)
      useEffect(() => setOn(true), [])
      return <m.div data-testid={id} initial={{ opacity: 0 }} animate={{ opacity: on ? 1 : 0.5 }} transition={{ type: false }} />
    }
    render(
      <MotionFeatures>
        <ContentSwap loading={false} fallback={null}>
          <Fader id="swap" />
        </ContentSwap>
        <Collapse open>
          <Fader id="collapse" />
        </Collapse>
      </MotionFeatures>,
    )
    // The change is made on mount, before the chunk lands; wait for the chunk itself, not a timer.
    await preloadMotionFeatures()
    await waitFor(() => {
      expect(screen.getByTestId('swap')).toHaveStyle({ opacity: '1' })
      expect(screen.getByTestId('collapse')).toHaveStyle({ opacity: '1' })
    })
  })

  test("the library's components render inside an app's strict LazyMotion (no full motion components)", async () => {
    const { LazyMotion, domMax } = await fresh()
    const [{ Collapse }, { MorphLabel }, { AsyncFeedback }, { SlidingIndicator }] = await Promise.all([
      import('../components/youj/transitions/collapse'),
      import('../components/youj/transitions/morph-label'),
      import('../components/youj/effects/async-feedback'),
      import('../components/youj/transitions/sliding-indicator'),
    ])
    expect(() =>
      render(
        <LazyMotion features={domMax} strict>
          <Collapse open>panel</Collapse>
          <MorphLabel value="a">label</MorphLabel>
          <AsyncFeedback state="pending">Save</AsyncFeedback>
          <AsyncFeedback state="success">Save</AsyncFeedback>
          <div role="tablist">
            <SlidingIndicator />
          </div>
        </LazyMotion>,
      ),
    ).not.toThrow()
    expect(screen.getByText('panel')).toBeInTheDocument()
  })
})
