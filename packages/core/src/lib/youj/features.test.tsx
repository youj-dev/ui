import { StrictMode, useEffect, useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'

/* The test setup preloads Motion's features for every other test. Here a fresh
 * copy of the modules shows what an app sees before the chunk arrives. */
async function fresh() {
  vi.resetModules()
  const [motion, features, provider] = await Promise.all([
    import('motion/react'),
    import('./features'),
    import('./provider'),
  ])
  return { m: motion.m, AnimatePresence: motion.AnimatePresence, LazyMotion: motion.LazyMotion, domMax: motion.domMax, ...features, YoujProvider: provider.YoujProvider }
}

describe('MotionFeatures', () => {
  test('an m element outside any boundary renders its initial state and never animates', async () => {
    const { m } = await fresh()
    render(<m.div data-testid="box" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: false }} />)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.getByTestId('box')).toHaveStyle({ opacity: '0' })
  })

  test('without a provider, a boundary loads the features and the element animates once they arrive', async () => {
    const { m, MotionFeatures } = await fresh()
    render(
      <MotionFeatures>
        <m.div data-testid="box" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: false }} />
      </MotionFeatures>,
    )
    expect(screen.getByTestId('box')).toHaveStyle({ opacity: '0' })
    await waitFor(() => expect(screen.getByTestId('box')).toHaveStyle({ opacity: '1' }))
  })

  test('YoujProvider supplies the features to everything under it, in strict mode too', async () => {
    const { m, YoujProvider } = await fresh()
    render(
      <StrictMode>
        <YoujProvider>
          <m.div data-testid="box" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: false }} />
        </YoujProvider>
      </StrictMode>,
    )
    await waitFor(() => expect(screen.getByTestId('box')).toHaveStyle({ opacity: '1' }))
  })

  test('once loaded, a boundary mounted later animates from its first frame', async () => {
    const { m, MotionFeatures, preloadMotionFeatures } = await fresh()
    await preloadMotionFeatures()
    render(
      <MotionFeatures>
        <m.div data-testid="box" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: false }} />
      </MotionFeatures>,
    )
    await waitFor(() => expect(screen.getByTestId('box')).toHaveStyle({ opacity: '1' }))
  })

  test('under AnimatePresence initial={false}, a change made before the features arrive still animates', async () => {
    const { m, AnimatePresence, MotionFeatures, PresenceSettled } = await fresh()
    // Shows at once, then a mount effect asks for more: the request lands before the chunk does.
    function Fader() {
      const [on, setOn] = useState(false)
      useEffect(() => setOn(true), [])
      return <m.div data-testid="box" initial={{ opacity: 0 }} animate={{ opacity: on ? 1 : 0.5 }} transition={{ type: false }} />
    }
    render(
      <MotionFeatures>
        <AnimatePresence initial={false}>
          <div key="a">
            <PresenceSettled>
              <Fader />
            </PresenceSettled>
          </div>
        </AnimatePresence>
      </MotionFeatures>,
    )
    await waitFor(() => expect(screen.getByTestId('box')).toHaveStyle({ opacity: '1' }))
  })

  test('with the features loaded, PresenceSettled leaves the first render skipped', async () => {
    const { m, AnimatePresence, MotionFeatures, PresenceSettled, preloadMotionFeatures } = await fresh()
    await preloadMotionFeatures()
    render(
      <MotionFeatures>
        <AnimatePresence initial={false}>
          <div key="a">
            <PresenceSettled>
              <m.div data-testid="box" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 5 }} />
            </PresenceSettled>
          </div>
        </AnimatePresence>
      </MotionFeatures>,
    )
    // Present on the first render, so it starts settled instead of fading in over five seconds.
    expect(screen.getByTestId('box')).toHaveStyle({ opacity: '1' })
  })

  describe('motion={false}', () => {
    /** A fresh copy whose animation chunk is a counter, so a load shows. */
    async function counted() {
      const loads = { animation: 0, max: 0 }
      vi.resetModules()
      vi.doMock('./features-animation', () => (loads.animation++, { default: {} }))
      vi.doMock('./features-max', () => (loads.max++, { default: {} }))
      const [{ m }, { YoujProvider }, { MotionFeatures }] = await Promise.all([import('motion/react'), import('./provider'), import('./features')])
      return { m, YoujProvider, MotionFeatures, loads }
    }
    afterEach(() => {
      vi.doUnmock('./features-animation')
      vi.doUnmock('./features-max')
    })

    test('loads no chunk, not even for a component that asks for the layout features', async () => {
      const { m, YoujProvider, MotionFeatures, loads } = await counted()
      render(
        <YoujProvider motion={false}>
          <MotionFeatures features="max">
            <m.div data-testid="box" animate={{ opacity: 1 }} />
          </MotionFeatures>
        </YoujProvider>,
      )
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(loads).toEqual({ animation: 0, max: 0 })
    })

    test('the default provider does load the animation chunk (the control)', async () => {
      const { m, YoujProvider, loads } = await counted()
      render(
        <YoujProvider>
          <m.div animate={{ opacity: 1 }} />
        </YoujProvider>,
      )
      await waitFor(() => expect(loads.animation).toBe(1))
    })

    test('an element shows its animate target at once and follows it as it changes', async () => {
      const { m, YoujProvider } = await counted()
      const Box = ({ on }: { on: boolean }) => <m.div data-testid="box" initial={{ opacity: 0 }} animate={{ opacity: on ? 1 : 0.4 }} transition={{ duration: 5 }} />
      const view = render(
        <YoujProvider motion={false}>
          <Box on={false} />
        </YoujProvider>,
      )
      expect(screen.getByTestId('box')).toHaveStyle({ opacity: '0.4' })
      view.rerender(
        <YoujProvider motion={false}>
          <Box on />
        </YoujProvider>,
      )
      expect(screen.getByTestId('box')).toHaveStyle({ opacity: '1' })
    })

    test('it implies reduced motion, whatever reducedMotion says', async () => {
      const { YoujProvider } = await counted()
      const { useYouj } = await import('./provider')
      const Probe = () => <output>{String(useYouj().reduced)}</output>
      render(
        <YoujProvider motion={false} reducedMotion="never">
          <Probe />
        </YoujProvider>,
      )
      expect(screen.getByRole('status')).toHaveTextContent('true')
      expect(document.querySelector('[data-yj-reduced]')).not.toBeNull()
    })

    test('a nested provider inherits it, and motion turns it back on for its subtree', async () => {
      const { m, YoujProvider, loads } = await counted()
      render(
        <YoujProvider motion={false}>
          <YoujProvider>
            <m.div animate={{ opacity: 1 }} />
          </YoujProvider>
        </YoujProvider>,
      )
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(loads.animation).toBe(0)
      render(
        <YoujProvider motion={false}>
          <YoujProvider motion>
            <m.div animate={{ opacity: 1 }} />
          </YoujProvider>
        </YoujProvider>,
      )
      await waitFor(() => expect(loads.animation).toBe(1))
    })
  })
})
