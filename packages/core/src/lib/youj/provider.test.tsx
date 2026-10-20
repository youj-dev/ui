import { memo, type ComponentProps } from 'react'
import { createPortal } from 'react-dom'
import { renderToString } from 'react-dom/server'
import { act, render, screen } from '@testing-library/react'
import { DENSITIES, YoujProvider, SCALINGS, ThemeScope, useDirection, useYouj, useYoujLayout, useYoujScope, useYoujLook, useLocale, useTheme, type ReducedMotionSetting } from './provider'
import { isYoujLook, lookById, LOOKS } from './look'
import { brutal, graphite, terminal } from './theme/themes'

/** A controllable OS preference: `set(true)` flips it and fires `change` like a browser does. */
function mockOsReducedMotion(initial: boolean) {
  let matches = initial
  const listeners = new Set<() => void>()
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        get matches() {
          return matches
        },
        media: query,
        addEventListener: (_: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
      }) as unknown as MediaQueryList,
  )
  return {
    listeners,
    set(next: boolean) {
      matches = next
      act(() => listeners.forEach((listener) => listener()))
    },
  }
}

const reducedText = () => screen.getAllByRole('status').map((el) => el.textContent!.split('|')[2])

function Probe() {
  const k = useYouj()
  return <output>{`${k.ms('base')}|${k.duration('fast')}|${k.reduced}|${JSON.stringify(k.spring('snappy'))}`}</output>
}

test('durations and springs scale with the provider time scale', () => {
  render(
    <YoujProvider timeScale={2}>
      <Probe />
    </YoujProvider>,
  )
  const [ms, sec, reduced, spring] = screen.getByRole('status').textContent!.split('|')
  expect(ms).toBe('440')
  expect(sec).toBe('0.28')
  expect(reduced).toBe('false')
  // snappy is 0.2s at 1x, so 0.4s here, as physics: stiffness (2π / (0.4 × 1.2))², critically damped.
  const root = (2 * Math.PI) / (0.4 * 1.2)
  const physics = JSON.parse(spring!)
  expect(physics).toEqual({ type: 'spring', stiffness: expect.closeTo(root * root, 6), damping: expect.closeTo(2 * root, 6), mass: 1 })
})

test('reducedMotion="always" reports reduced regardless of OS setting', () => {
  render(
    <YoujProvider reducedMotion="always">
      <Probe />
    </YoujProvider>,
  )
  expect(screen.getByRole('status').textContent).toContain('|true|')
})

test('works without a provider at time scale 1', () => {
  render(<Probe />)
  expect(screen.getByRole('status').textContent!.startsWith('220|0.14|false')).toBe(true)
})

const wrapperOf = (container: HTMLElement) => container.firstElementChild as HTMLElement

test('the wrapper hands CSS the time scale, the motion factor and a forced-reduced marker', () => {
  const { container } = render(
    <YoujProvider timeScale={2} reducedMotion="always">
      <span />
    </YoujProvider>,
  )
  const wrapper = wrapperOf(container)
  expect(wrapper.style.display).toBe('contents')
  expect(wrapper.style.getPropertyValue('--yj-time-scale')).toBe('2')
  expect(wrapper.style.getPropertyValue('--yj-motion')).toBe('0')
  expect(wrapper).toHaveAttribute('data-yj-reduced', '')
})

test.each<[ReducedMotionSetting, string]>([
  ['never', '1'],
  ['user', 'var(--yj-os-motion)'],
])('reducedMotion="%s" sets --yj-motion to %s and no forced marker', (setting, factor) => {
  const { container } = render(
    <YoujProvider reducedMotion={setting}>
      <span />
    </YoujProvider>,
  )
  expect(wrapperOf(container).style.getPropertyValue('--yj-motion')).toBe(factor)
  expect(wrapperOf(container)).not.toHaveAttribute('data-yj-reduced')
})

function PortaledProbe() {
  return createPortal(<div data-testid="portaled" {...useYoujScope()} />, document.body)
}

test('useYoujScope carries the nearest provider onto content portaled outside it', () => {
  render(
    <YoujProvider timeScale={4} reducedMotion="never">
      <YoujProvider timeScale={0.5} reducedMotion="always">
        <PortaledProbe />
      </YoujProvider>
    </YoujProvider>,
  )
  const portaled = screen.getByTestId('portaled')
  expect(portaled.parentElement).toBe(document.body)
  expect(portaled).toHaveAttribute('data-yj-reduced', '')
  expect(portaled.style.getPropertyValue('--yj-time-scale')).toBe('0.5')
  expect(portaled.style.getPropertyValue('--yj-motion')).toBe('0')
})

test('every element given a time scale is one youj.css re-resolves the durations on', () => {
  // youj.css: `:root, [data-yj-motion], [data-yj-scope] { --yj-duration-*: … }`
  const scope = '[data-yj-scope]'
  const { container } = render(
    <YoujProvider timeScale={2}>
      <PortaledProbe />
    </YoujProvider>,
  )
  expect(wrapperOf(container).matches(scope)).toBe(true)
  expect(screen.getByTestId('portaled').matches(scope)).toBe(true)
  expect(renderToString(<YoujProvider timeScale={0.5}>x</YoujProvider>)).toContain('--yj-time-scale:0.5')
})

test('useYoujScope without a provider defers to the OS at time scale 1', () => {
  render(<PortaledProbe />)
  const portaled = screen.getByTestId('portaled')
  expect(portaled).not.toHaveAttribute('data-yj-reduced')
  expect(portaled).not.toHaveAttribute('data-yj-theme')
  expect(portaled).not.toHaveAttribute('data-yj-motion')
  expect(portaled.style.getPropertyValue('--yj-time-scale')).toBe('1')
  expect(portaled.style.getPropertyValue('--yj-motion')).toBe('var(--yj-os-motion)')
})

test('follows the OS reduced-motion setting live', () => {
  const os = mockOsReducedMotion(false)
  render(<Probe />)
  expect(reducedText()).toEqual(['false'])
  os.set(true)
  expect(reducedText()).toEqual(['true'])
  os.set(false)
  expect(reducedText()).toEqual(['false'])
})

test('reducedMotion="never" keeps motion on under an OS reduced-motion setting', () => {
  mockOsReducedMotion(true)
  render(
    <YoujProvider reducedMotion="never">
      <Probe />
    </YoujProvider>,
  )
  expect(reducedText()).toEqual(['false'])
})

test('every hook shares one media query listener, removed when the last one unmounts', () => {
  const os = mockOsReducedMotion(true)
  const { unmount } = render(
    <>
      <Probe />
      <Probe />
      <Probe />
    </>,
  )
  expect(reducedText()).toEqual(['true', 'true', 'true'])
  expect(os.listeners.size).toBe(1)
  unmount()
  expect(os.listeners.size).toBe(0)
})

/* ── Theming ─────────────────────────────────────────────────────────────── */

describe('theme', () => {
  // The OS-preference tests above leave a matchMedia spy behind.
  beforeEach(() => vi.restoreAllMocks())

  function Timing() {
    const k = useYouj()
    return <output>{`${k.motionPersonality}|${k.ms('base')}|${k.stagger('base')}|${JSON.stringify(k.spring('settle'))}|${k.ease('enter').join(',')}`}</output>
  }

  test('a provider theme marks its wrapper as a scope and carries the contract (nothing changes without one)', () => {
    const { container, rerender } = render(
      <YoujProvider>
        <span />
      </YoujProvider>,
    )
    expect(wrapperOf(container)).not.toHaveAttribute('data-yj-theme')
    expect(wrapperOf(container)).not.toHaveAttribute('data-yj-motion')

    rerender(
      <YoujProvider theme={terminal}>
        <span />
      </YoujProvider>,
    )
    const wrapper = wrapperOf(container)
    expect(wrapper).toHaveAttribute('data-yj-theme', 'terminal')
    expect(wrapper).toHaveAttribute('data-yj-motion', 'precise')
    expect(wrapper.style.getPropertyValue('--yj-neutral-hue')).toBe('285')
    // Terminal's accent is a pair, one per mode, each written as given.
    expect(wrapper.style.getPropertyValue('--yj-accent-light')).toBe(terminal.accent.light)
    expect(wrapper.style.getPropertyValue('--yj-accent-dark')).toBe(terminal.accent.dark)
    expect(wrapper.style.getPropertyValue('--yj-radius')).toBe('0rem')
    expect(wrapper.style.getPropertyValue('--yj-time-scale')).toBe('1')
  })

  test('a top-level provider’s theme also themes the document, and gives it back on unmount; a nested one doesn’t', () => {
    const root = document.documentElement
    root.setAttribute('data-yj-theme', 'basalt')
    const { rerender, unmount } = render(
      <YoujProvider theme={terminal}>
        <YoujProvider theme={brutal}>
          <span />
        </YoujProvider>
      </YoujProvider>,
    )
    expect(root).toHaveAttribute('data-yj-theme', 'terminal')
    expect(root.style.getPropertyValue('--yj-radius')).toBe('0rem')
    // The picker changes the theme: the page follows.
    rerender(
      <YoujProvider theme={graphite}>
        <span />
      </YoujProvider>,
    )
    expect(root).toHaveAttribute('data-yj-theme', 'graphite')
    unmount()
    expect(root).toHaveAttribute('data-yj-theme', 'basalt')
    expect(root.style.getPropertyValue('--yj-radius')).toBe('')
    root.removeAttribute('data-yj-theme')
  })

  test.each([
    ['precise', 220, 0.04, 0.3, '0.16,1,0.3,1'],
    ['calm', 300, 0.056, 0, '0.33,1,0.68,1'],
    ['lively', 190, 0.032, 0.4, '0.34,1.3,0.64,1'],
  ] as const)('useYouj follows the %s personality', (motionPersonality, base, stagger, bounce, enter) => {
    render(
      <YoujProvider theme={{ motionPersonality }}>
        <Timing />
      </YoujProvider>,
    )
    const [name, ms, step, spring, ease] = screen.getByRole('status').textContent!.split('|')
    const { stiffness, damping } = JSON.parse(spring!)
    // The damping ratio is 1 − bounce: the personality's bounce survives the conversion to physics.
    const ratio = Math.round((damping / (2 * Math.sqrt(stiffness))) * 1000) / 1000
    expect([name, Number(ms), Number(step), ratio, ease]).toEqual([motionPersonality, base, stagger, 1 - bounce, enter])
  })

  test('the time scale still scales a personality', () => {
    render(
      <YoujProvider timeScale={2} theme={{ motionPersonality: 'calm' }}>
        <Timing />
      </YoujProvider>,
    )
    expect(screen.getByRole('status').textContent!.split('|')[1]).toBe('600')
  })

  test('ThemeScope nests: it overrides only what it sets and keeps Speed and reduced motion', () => {
    function Probe() {
      const t = useTheme()
      const k = useYouj()
      return <output>{`${t.id}|${t.accent}|${t.radius}|${t.motionPersonality}|${k.timeScale}|${k.reduced}`}</output>
    }
    const { container } = render(
      <YoujProvider timeScale={4} reducedMotion="always" theme={brutal}>
        <ThemeScope theme={{ accent: '#ff5a1f', radius: 'sm' }}>
          <Probe />
        </ThemeScope>
      </YoujProvider>,
    )
    expect(screen.getByRole('status').textContent).toBe('brutal|#ff5a1f|sm|precise|4|true')
    const scope = container.querySelectorAll('[data-yj-theme]')[1] as HTMLElement
    expect(scope.style.getPropertyValue('--yj-accent')).toBe('#ff5a1f')
    expect(scope.style.getPropertyValue('--yj-neutral-hue')).toBe('285')
    expect(scope).toHaveAttribute('data-yj-motion', 'precise')
  })

  test('a preset nested in another replaces it: nothing it leaves unset leaks in from outside', () => {
    function Probe() {
      const t = useTheme()
      return <output>{`${t.id}|${t.success}|${t.radius}`}</output>
    }
    const { container } = render(
      <YoujProvider theme={terminal}>
        <ThemeScope theme={{ id: 'plain' }}>
          <Probe />
        </ThemeScope>
      </YoujProvider>,
    )
    // Terminal sets its own success color; this theme leaves it unset, so it must be the default, not Terminal's.
    expect(screen.getByRole('status').textContent).toBe('plain|undefined|xl')
    const scope = container.querySelector('[data-yj-theme="plain"]') as HTMLElement
    expect(scope.style.getPropertyValue('--yj-success')).toBe('initial')
    expect(scope.style.getPropertyValue('--yj-success-light')).toBe('initial')
    expect(scope.style.getPropertyValue('--yj-success-dark')).toBe('initial')
    expect(scope.style.getPropertyValue('--yj-neutral-hue')).toBe('285')
  })

  test('useTheme without a provider is Basalt, as youj.css paints it; an override applies over it, a preset replaces it', () => {
    function Probe() {
      const t = useTheme()
      return <output>{`${t.id}|${t.neutral.hue}|${t.radius}|${t.controlSize}|${t.motionPersonality}`}</output>
    }
    const { unmount } = render(<Probe />)
    expect(screen.getByRole('status').textContent).toBe('basalt|285|xl|default|precise')
    unmount()
    const { unmount: unmount2 } = render(
      <YoujProvider theme={{ radius: 'sm' }}>
        <Probe />
      </YoujProvider>,
    )
    expect(screen.getByRole('status').textContent).toBe('basalt|285|sm|default|precise')
    unmount2()
    render(
      <YoujProvider theme={graphite}>
        <Probe />
      </YoujProvider>,
    )
    expect(screen.getByRole('status').textContent).toBe('graphite|285|xl|default|precise')
  })

  test('portals carry the merged theme of the scope that opened them', () => {
    render(
      <YoujProvider theme={terminal}>
        <ThemeScope theme={{ accent: '#ff5a1f' }}>
          <PortaledProbe />
        </ThemeScope>
      </YoujProvider>,
    )
    const portaled = screen.getByTestId('portaled')
    expect(portaled.parentElement).toBe(document.body)
    expect(portaled).toHaveAttribute('data-yj-theme', 'terminal')
    expect(portaled).toHaveAttribute('data-yj-motion', 'precise')
    expect(portaled.style.getPropertyValue('--yj-accent')).toBe('#ff5a1f')
    expect(portaled.style.getPropertyValue('--yj-font-sans')).toContain('JetBrains Mono')
  })

  test('a CSS-only personality (data-yj-motion on an ancestor) reaches useYouj', () => {
    const host = document.createElement('div')
    host.setAttribute('data-yj-motion', 'lively')
    document.body.append(host)
    render(
      <YoujProvider>
        <Timing />
      </YoujProvider>,
      { container: host },
    )
    expect(screen.getByRole('status').textContent!.split('|')[0]).toBe('lively')
    host.remove()
  })

  test('renders the theme into the server HTML, so there is no flash', () => {
    const html = renderToString(
      <YoujProvider theme={terminal}>
        <p>hi</p>
      </YoujProvider>,
    )
    expect(html).toContain('data-yj-theme="terminal"')
    expect(html).toContain('data-yj-motion="precise"')
    expect(html).toContain('--yj-neutral-hue:285')
    expect(html).toContain('--yj-radius:0rem')
  })

  test('logs an error once in development when a theme fails its checks', () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {})
    const broken = { name: 'Provider broken', accent: 'blurple' }
    const { rerender } = render(
      <YoujProvider theme={broken}>
        <span />
      </YoujProvider>,
    )
    rerender(
      <YoujProvider theme={{ ...broken }}>
        <span />
      </YoujProvider>,
    )
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]![0]).toContain('Provider broken')
    warn.mockRestore()
  })
})

describe('style', () => {
  function StyleProbe() {
    return <output>{useYoujLook()}</output>
  }

  test('is classic by default: the root provider writes it for its subtree without being asked', () => {
    const { container } = render(
      <YoujProvider>
        <StyleProbe />
      </YoujProvider>,
    )
    expect(screen.getByRole('status').textContent).toBe('classic')
    expect(container.firstElementChild).toHaveAttribute('data-yj-look', 'classic')
    expect(container.querySelectorAll('[data-yj-look]')).toHaveLength(1)
  })

  test('is classic without any provider, where nothing is written', () => {
    const { container } = render(<StyleProbe />)
    expect(screen.getByRole('status').textContent).toBe('classic')
    expect(container.querySelector('[data-yj-look]')).toBeNull()
  })

  test('bezel is one prop away, and writes its attribute', () => {
    const { container } = render(
      <YoujProvider look="bezel">
        <StyleProbe />
      </YoujProvider>,
    )
    expect(screen.getByRole('status').textContent).toBe('bezel')
    expect(container.firstElementChild).toHaveAttribute('data-yj-look', 'bezel')
  })

  test('the provider writes data-yj-look for its subtree and useYoujLook reads it', () => {
    const { container } = render(
      <YoujProvider look="bezel">
        <StyleProbe />
      </YoujProvider>,
    )
    expect(container.firstElementChild).toHaveAttribute('data-yj-look', 'bezel')
    expect(screen.getByRole('status').textContent).toBe('bezel')
  })

  test('a nested provider inherits the style without re-declaring it, and can override it', () => {
    const { container } = render(
      <YoujProvider look="bezel">
        <YoujProvider timeScale={2}>
          <StyleProbe />
        </YoujProvider>
        <YoujProvider look="classic">
          <StyleProbe />
        </YoujProvider>
      </YoujProvider>,
    )
    expect(screen.getAllByRole('status').map((el) => el.textContent)).toEqual(['bezel', 'classic'])
    expect([...container.querySelectorAll('[data-yj-look]')].map((el) => el.getAttribute('data-yj-look'))).toEqual(['bezel', 'classic'])
  })

  test('ThemeScope sets a style for part of a page, with or without a theme', () => {
    const { container } = render(
      <YoujProvider look="classic">
        <ThemeScope look="bezel">
          <StyleProbe />
        </ThemeScope>
        <ThemeScope theme={brutal} look="bezel">
          <StyleProbe />
        </ThemeScope>
      </YoujProvider>,
    )
    const [, lookOnly, themed] = [...container.querySelectorAll('[data-yj-look]')]
    expect(screen.getAllByRole('status').map((el) => el.textContent)).toEqual(['bezel', 'bezel'])
    // A style-only scope re-themes nothing: no theme scope, no motion personality.
    expect(lookOnly).not.toHaveAttribute('data-yj-theme')
    expect(lookOnly).not.toHaveAttribute('data-yj-motion')
    expect(themed).toHaveAttribute('data-yj-theme', 'brutal')
  })

  test("a ThemeScope's theme brings its style's look; an override without one keeps the surrounding look", () => {
    const { unmount } = render(
      <YoujProvider look="classic">
        <ThemeScope theme={terminal}>
          <StyleProbe />
        </ThemeScope>
      </YoujProvider>,
    )
    expect(screen.getByRole('status').textContent).toBe('bezel')
    unmount()
    render(
      <YoujProvider look="classic">
        <ThemeScope theme={{ accent: '#ff5a1f' }}>
          <StyleProbe />
        </ThemeScope>
      </YoujProvider>,
    )
    expect(screen.getByRole('status').textContent).toBe('classic')
  })

  test('a ThemeScope at the root writes the default style, as a root provider does', () => {
    const { container } = render(
      <ThemeScope theme={terminal}>
        <StyleProbe />
      </ThemeScope>,
    )
    expect(screen.getByRole('status').textContent).toBe('bezel')
    expect(container.firstElementChild).toHaveAttribute('data-yj-look', 'bezel')
  })

  test('useYoujScope carries the nearest style onto portaled content', () => {
    render(
      <YoujProvider look="bezel">
        <ThemeScope theme={brutal}>
          <PortaledProbe />
        </ThemeScope>
      </YoujProvider>,
    )
    // Brutal's style is built in the classic look.
    expect(screen.getByTestId('portaled')).toHaveAttribute('data-yj-look', 'classic')
  })

  test('renders the same attribute on the server, the default included', () => {
    expect(renderToString(<YoujProvider look="bezel">x</YoujProvider>)).toContain('data-yj-look="bezel"')
    expect(renderToString(<YoujProvider>x</YoujProvider>)).toContain('data-yj-look="classic"')
  })

  test('lookById falls back to classic, and isYoujLook knows every style', () => {
    expect(lookById('nope').id).toBe('classic')
    expect(lookById('bezel').name).toBe('Bezel')
    expect(LOOKS.every(isYoujLook)).toBe(true)
    expect(isYoujLook('brutal')).toBe(false)
  })
})

describe('locale', () => {
  function Locale({ explicit }: { explicit?: string }) {
    return <output>{useLocale(explicit)}</output>
  }

  test('is en-US without a provider, not the runtime default, so server and browser agree', () => {
    expect(renderToString(<Locale />)).toContain('en-US')
  })

  test('comes from the nearest provider, inherits through nesting and loses to an explicit locale', () => {
    render(
      <YoujProvider locale="de-DE">
        <Locale />
        <YoujProvider timeScale={2}>
          <Locale />
          <Locale explicit="ja-JP" />
        </YoujProvider>
        <ThemeScope theme={brutal}>
          <Locale />
        </ThemeScope>
      </YoujProvider>,
    )
    expect(screen.getAllByRole('status').map((el) => el.textContent)).toEqual(['de-DE', 'de-DE', 'ja-JP', 'de-DE'])
  })
})

describe('re-renders', () => {
  /* Each hook reads its own slice of the settings, so a change re-renders only
   * what depends on it: the icons on a page (useYouj) sit still through a
   * theme, style, locale or label change. */
  const renders = { youj: 0, locale: 0, style: 0 }
  const Motion = memo(function Motion() {
    renders.youj++
    useYouj()
    return null
  })
  const Locale = memo(function Locale() {
    renders.locale++
    useLocale()
    return null
  })
  const Style = memo(function Style() {
    renders.style++
    useYoujLook()
    return null
  })
  const tree = (props: Omit<ComponentProps<typeof YoujProvider>, 'children'>) => (
    <YoujProvider {...props}>
      <Motion />
      <Locale />
      <Style />
      <ThemeScope theme={brutal}>
        <Motion />
      </ThemeScope>
    </YoujProvider>
  )
  const reset = () => Object.assign(renders, { youj: 0, locale: 0, style: 0 })
  // A color-only theme: a theme with its own personality changes the motion, and rightly re-renders.
  const accent = { accent: '#ff5a1f' }

  test('useYouj consumers ignore theme, look, locale and label changes', () => {
    const { rerender } = render(tree({}))
    reset()
    rerender(tree({ theme: accent }))
    rerender(tree({ theme: accent, look: 'classic' }))
    rerender(tree({ theme: accent, look: 'classic', locale: 'de-DE', labels: { close: 'Schließen' } }))
    expect(renders.youj).toBe(0)
  })

  test('a Speed or reduced-motion change reaches useYouj and nothing else', () => {
    const { rerender } = render(tree({}))
    reset()
    rerender(tree({ timeScale: 2 }))
    rerender(tree({ timeScale: 2, reducedMotion: 'always' }))
    expect(renders).toEqual({ youj: 4, locale: 0, style: 0 })
  })

  test('a locale change re-renders locale readers only', () => {
    const { rerender } = render(tree({}))
    reset()
    rerender(tree({ locale: 'fr-FR' }))
    expect(renders).toEqual({ youj: 0, locale: 1, style: 0 })
  })
})

describe('scaling', () => {
  const scales = (container: HTMLElement) => [...container.querySelectorAll('[data-yj-scaling]')].map((el) => el.getAttribute('data-yj-scaling'))

  test('is 100% by default: nothing is written, so every size stays as it was', () => {
    const { container } = render(
      <YoujProvider>
        <ThemeScope theme={brutal}>
          <PortaledProbe />
        </ThemeScope>
      </YoujProvider>,
    )
    expect(scales(container)).toEqual([])
    expect(screen.getByTestId('portaled')).not.toHaveAttribute('data-yj-scaling')
  })

  test('the provider writes the step as data-yj-scaling for its subtree, and a nested one inherits it without re-declaring', () => {
    const { container } = render(
      <YoujProvider scaling="90%">
        <YoujProvider timeScale={2}>x</YoujProvider>
        <YoujProvider scaling="100%">y</YoujProvider>
      </YoujProvider>,
    )
    // The nested provider without a scale writes none: the DOM carries the outer one down.
    expect(scales(container)).toEqual(['90', '100'])
  })

  test('ThemeScope scales part of a page, with or without a theme, and re-themes nothing on its own', () => {
    const { container } = render(
      <YoujProvider>
        <ThemeScope scaling="85%">a</ThemeScope>
        <ThemeScope theme={terminal} scaling="120%">
          b
        </ThemeScope>
      </YoujProvider>,
    )
    const [scaleOnly, themed] = [...container.querySelectorAll('[data-yj-scaling]')]
    expect(scaleOnly).toHaveAttribute('data-yj-scaling', '85')
    expect(scaleOnly).not.toHaveAttribute('data-yj-theme')
    expect(themed).toHaveAttribute('data-yj-scaling', '120')
    expect(themed).toHaveAttribute('data-yj-theme', 'terminal')
  })

  test('useYoujScope carries the nearest scale onto portaled content', () => {
    render(
      <YoujProvider scaling="75%">
        <ThemeScope theme={brutal}>
          <PortaledProbe />
        </ThemeScope>
      </YoujProvider>,
    )
    expect(screen.getByTestId('portaled')).toHaveAttribute('data-yj-scaling', '75')
  })

  test('renders the attribute on the server, so the first paint is at the right size', () => {
    expect(renderToString(<YoujProvider scaling="90%">x</YoujProvider>)).toContain('data-yj-scaling="90"')
    expect(renderToString(<ThemeScope scaling="110%">x</ThemeScope>)).toContain('data-yj-scaling="110"')
  })

  test('the steps run from 75% to 120%, with 100% among them', () => {
    expect(SCALINGS).toEqual(['75%', '80%', '85%', '90%', '95%', '100%', '110%', '120%'])
  })
})

describe('density', () => {
  const densities = (container: HTMLElement) => [...container.querySelectorAll('[data-yj-density]')].map((el) => el.getAttribute('data-yj-density'))

  test('is roomy by default: nothing is written, so every panel keeps its size', () => {
    const { container } = render(
      <YoujProvider>
        <ThemeScope theme={brutal}>
          <PortaledProbe />
        </ThemeScope>
      </YoujProvider>,
    )
    expect(densities(container)).toEqual([])
    expect(screen.getByTestId('portaled')).not.toHaveAttribute('data-yj-density')
  })

  test('the provider writes data-yj-density for its subtree; a nested one inherits it, and a roomy scope opts a section back out', () => {
    const { container } = render(
      <YoujProvider density="compact" scaling="90%">
        <YoujProvider timeScale={2}>x</YoujProvider>
        <ThemeScope density="roomy" scaling="100%">
          y
        </ThemeScope>
      </YoujProvider>,
    )
    expect(densities(container)).toEqual(['compact', 'roomy'])
    const roomy = container.querySelector('[data-yj-density="roomy"]')
    expect(roomy).toHaveAttribute('data-yj-scaling', '100')
    expect(roomy).not.toHaveAttribute('data-yj-theme')
  })

  test('useYoujScope carries the nearest density onto portaled content', () => {
    render(
      <YoujProvider density="compact">
        <ThemeScope theme={brutal}>
          <PortaledProbe />
        </ThemeScope>
      </YoujProvider>,
    )
    expect(screen.getByTestId('portaled')).toHaveAttribute('data-yj-density', 'compact')
  })

  test('renders the attribute on the server', () => {
    expect(renderToString(<YoujProvider density="compact">x</YoujProvider>)).toContain('data-yj-density="compact"')
    expect(renderToString(<ThemeScope density="roomy">x</ThemeScope>)).toContain('data-yj-density="roomy"')
    expect(DENSITIES).toEqual(['roomy', 'compact'])
  })

  test('useYoujLayout reads the nearest density and scale, roomy and 100% without one', () => {
    const Probe = ({ id }: { id: string }) => {
      const { density, scaling } = useYoujLayout()
      return <span data-testid={id}>{`${density} ${scaling}`}</span>
    }
    render(
      <>
        <Probe id="bare" />
        <YoujProvider density="compact" scaling="90%">
          <Probe id="app" />
          <ThemeScope density="roomy">
            <Probe id="marketing" />
          </ThemeScope>
        </YoujProvider>
      </>,
    )
    expect(screen.getByTestId('bare')).toHaveTextContent('roomy 100%')
    expect(screen.getByTestId('app')).toHaveTextContent('compact 90%')
    expect(screen.getByTestId('marketing')).toHaveTextContent('roomy 90%')
  })
})

describe('direction', () => {
  function DirectionProbe({ id = 'dir' }: { id?: string }) {
    return <span data-testid={id}>{useDirection()}</span>
  }
  afterEach(() => document.documentElement.removeAttribute('dir'))

  test('a provider writes its dir, and everything under it reads it', () => {
    const { container } = render(
      <YoujProvider dir="rtl">
        <DirectionProbe />
      </YoujProvider>,
    )
    expect(wrapperOf(container)).toHaveAttribute('dir', 'rtl')
    expect(screen.getByTestId('dir')).toHaveTextContent('rtl')
  })

  test.each(['ar', 'he-IL', 'fa', 'ur-PK', 'AR'])('a right-to-left locale (%s) implies dir="rtl"', (locale) => {
    const { container } = render(
      <YoujProvider locale={locale}>
        <DirectionProbe />
      </YoujProvider>,
    )
    expect(wrapperOf(container)).toHaveAttribute('dir', 'rtl')
    expect(screen.getByTestId('dir')).toHaveTextContent('rtl')
  })

  test('an explicit dir wins over a right-to-left locale', () => {
    const { container } = render(
      <YoujProvider locale="ar" dir="ltr">
        <DirectionProbe />
      </YoujProvider>,
    )
    expect(wrapperOf(container)).toHaveAttribute('dir', 'ltr')
  })

  test('a left-to-right locale writes no dir', () => {
    const { container } = render(
      <YoujProvider locale="en-US">
        <DirectionProbe />
      </YoujProvider>,
    )
    expect(wrapperOf(container)).not.toHaveAttribute('dir')
  })

  test('without one, it follows the document live and writes nothing', async () => {
    const { container } = render(
      <YoujProvider>
        <DirectionProbe />
      </YoujProvider>,
    )
    expect(wrapperOf(container)).not.toHaveAttribute('dir')
    expect(screen.getByTestId('dir')).toHaveTextContent('ltr')
    await act(async () => {
      document.documentElement.setAttribute('dir', 'rtl')
      await Promise.resolve()
    })
    expect(screen.getByTestId('dir')).toHaveTextContent('rtl')
  })

  test('nested providers and scopes inherit it and can override it', () => {
    render(
      <YoujProvider dir="rtl">
        <YoujProvider timeScale={2}>
          <DirectionProbe id="inherited" />
        </YoujProvider>
        <ThemeScope dir="ltr">
          <DirectionProbe id="scoped" />
        </ThemeScope>
      </YoujProvider>,
    )
    expect(screen.getByTestId('inherited')).toHaveTextContent('rtl')
    expect(screen.getByTestId('inherited').parentElement).not.toHaveAttribute('dir')
    expect(screen.getByTestId('scoped')).toHaveTextContent('ltr')
    expect(screen.getByTestId('scoped').parentElement).toHaveAttribute('dir', 'ltr')
  })

  test('portals carry the resolved direction, so overlays mirror with the scope that opened them', () => {
    render(
      <YoujProvider>
        <ThemeScope dir="rtl">
          <PortaledProbe />
        </ThemeScope>
      </YoujProvider>,
    )
    expect(screen.getByTestId('portaled')).toHaveAttribute('dir', 'rtl')
  })

  test('auto writes dir="auto" for the browser to resolve', () => {
    const { container } = render(
      <div dir="rtl">
        <YoujProvider dir="auto">
          <DirectionProbe />
        </YoujProvider>
      </div>,
    )
    expect(container.querySelector('[dir="auto"]')).not.toBeNull()
  })

  test('the server renders the provider’s dir, and ltr without one', () => {
    expect(renderToString(<YoujProvider dir="rtl"><DirectionProbe /></YoujProvider>)).toContain('dir="rtl"')
    expect(renderToString(<DirectionProbe />)).toContain('ltr')
  })
})
