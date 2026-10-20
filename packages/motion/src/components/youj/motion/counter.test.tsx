import { Counter } from './counter'
import { StrictMode } from 'react'
import { render, waitFor } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { installObservers, renderReduced } from '@youj/core/test-utils'

beforeAll(installObservers)

const visual = (el: HTMLElement) => el.querySelector('[aria-hidden]')!.textContent

test.each([
  [1234.5, { style: 'currency', currency: 'USD' }, '$1,234.50'],
  [0.427, { style: 'percent', maximumFractionDigits: 1 }, '42.7%'],
  [1_250_000, { notation: 'compact', maximumFractionDigits: 1 }, '1.3M'],
  [98765, undefined, '98,765'],
] as const)('formats %s as %s in both modes', (value, format, expected) => {
  for (const mode of ['tween', 'roll'] as const) {
    const { container, unmount } = renderReduced(<Counter value={value} format={format} locale="en-US" mode={mode} />)
    const root = container.querySelector('[data-slot="counter"]') as HTMLElement
    expect(document.querySelector('.sr-only')!.textContent).toBe(expected)
    if (mode === 'tween') expect(visual(root)).toBe(expected)
    else {
      // Roll columns: non-digits are static; each digit column lands on its digit.
      const digits = root.querySelectorAll('[data-column]')
      expect(digits.length).toBe(expected.replace(/\D/g, '').length)
    }
    unmount()
  }
})

test('a rolling number keeps its digits in reading order on an RTL page', () => {
  const { container } = renderReduced(
    <div dir="rtl">
      <Counter value={17} mode="roll" locale="en-US" />
    </div>,
  )
  expect(container.querySelector('[data-slot="counter"] [aria-hidden]')).toHaveAttribute('dir', 'ltr')
})

test('reduced motion shows new values immediately', () => {
  const { rerender, container } = renderReduced(<Counter value={10} locale="en-US" />)
  rerender(<Counter value={2048} locale="en-US" />)
  expect(document.querySelector('.sr-only')!.textContent).toBe('2,048')
  expect(container.querySelector('[aria-hidden]')!.textContent).toBe('2,048')
})

test('keeps a size and a colour passed together (the text-ui scale merges as font sizes)', () => {
  const { container } = renderReduced(<Counter value={42} className="text-ui-sm text-fg-muted" />)
  expect(container.querySelector('[data-slot="counter"]')).toHaveClass('text-ui-sm', 'text-fg-muted')
})

test('names itself and each character by its Intl part, so a style can set units and cents apart', () => {
  const { container } = renderReduced(<Counter mode="roll" value={1234.5} format={{ style: 'currency', currency: 'USD' }} />)
  const root = container.querySelector('[data-slot="counter"]')!
  expect(root).toHaveAttribute('data-format', 'currency')
  const parts = [...root.querySelectorAll('[data-part]')].map((el) => el.getAttribute('data-part'))
  expect(parts).toEqual(['currency', 'integer', 'group', 'integer', 'integer', 'integer', 'decimal', 'fraction', 'fraction'])
  // Assistive tech still reads the whole figure.
  expect(root.querySelector('.sr-only')!.textContent).toBe('$1,234.50')
})

/** The digit each column shows: the glyph at full opacity on its wheel. */
const shown = (root: Element) =>
  [...root.querySelectorAll<HTMLElement>('[data-wheel]')].map((wheel) => [...wheel.children].find((g) => (g as HTMLElement).style.opacity === '1')?.textContent ?? '?').join('')

describe('rolling numbers in every script', () => {
  test('digits of another numbering system roll to their place, and no React key repeats', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = renderReduced(
      <div dir="rtl">
        <Counter mode="roll" value={12842} locale="ar-u-nu-arab" />
      </div>,
    )
    const root = container.querySelector('[data-slot="counter"]')!
    expect(root.querySelector('.sr-only')!.textContent).toBe('١٢٬٨٤٢')
    // One column per digit, each on its digit.
    expect(shown(root)).toBe('١٢٨٤٢')
    // The wheel holds the same script the number is written in.
    expect(root.querySelector('[data-wheel]')!.textContent).toBe('٠١٢٣٤٥٦٧٨٩')
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })

  test('identical neighbouring symbols (the ll of "milliseconds") keep distinct keys', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderReduced(<Counter mode="roll" value={184} locale="en-US" format={{ style: 'unit', unit: 'millisecond', unitDisplay: 'long' }} />)
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })
})

describe('the roll', () => {
  /* Slowed right down, so a test can look at a wheel mid-turn. */
  const slow = (value: number, extra: Partial<Parameters<typeof Counter>[0]> = {}) => (
    <YoujProvider reducedMotion="never" timeScale={30}>
      <Counter mode="roll" value={value} locale="en-US" inView={false} {...extra} />
    </YoujProvider>
  )
  const glyph = (wheel: Element, digit: string) => [...wheel.children].find((g) => g.textContent === digit) as HTMLElement
  const y = (el: HTMLElement) => Number(/translateY\((-?[\d.]+)%\)/.exec(el.style.transform)?.[1] ?? NaN)

  test('going up, 9 wraps forward to 0: the 0 rises from below and nothing turns back through 8', async () => {
    const { container, rerender } = render(slow(9, { from: 9 }))
    rerender(slow(10, { from: 9 }))
    await waitFor(
      () => {
        const ones = [...container.querySelectorAll('[data-wheel]')].at(-1)!
        expect(y(glyph(ones, '0'))).toBeGreaterThan(0)
        expect(y(glyph(ones, '0'))).toBeLessThan(100)
        expect(glyph(ones, '8').style.opacity).toBe('0')
      },
      { timeout: 3000 },
    )
  })

  test('under StrictMode, columns that arrive with the value still come to rest on its digits', async () => {
    const fast = (value: number) => (
      <StrictMode>
        <YoujProvider reducedMotion="never">
          <Counter mode="roll" value={value} from={0} locale="en-US" inView={false} />
        </YoujProvider>
      </StrictMode>
    )
    const { container, rerender } = render(fast(0))
    rerender(fast(121))
    await waitFor(() => {
      const rested = [...container.querySelectorAll('[data-wheel]')].map((w) => [...w.children].find((g) => (g as HTMLElement).style.opacity === '1')?.textContent)
      expect(rested).toEqual(['1', '2', '1'])
    })
  })

  test('going down, 0 wraps back to 9: the 9 drops in from above and 1 stays out of sight', async () => {
    const { container, rerender } = render(slow(10, { from: 10 }))
    rerender(slow(9, { from: 10 }))
    const ones = [...container.querySelectorAll('[data-wheel]')].at(-1)!
    // Slowed 30x, the wheel is mid-turn for seconds: poll until it is, rather than sleeping until it should be.
    await waitFor(() => {
      expect(y(glyph(ones, '9'))).toBeLessThan(0)
      expect(y(glyph(ones, '9'))).toBeGreaterThan(-100)
      expect(glyph(ones, '1').style.opacity).toBe('0')
    })
  })

  test('with a cycle, 00 → 59 is one step back, on a tens wheel of six', async () => {
    const two = { minimumIntegerDigits: 2 }
    const { container, rerender } = render(slow(0, { from: 0, cycle: 60, format: two }))
    const [tens, ones] = [...container.querySelectorAll('[data-wheel]')]
    expect(tens!.textContent).toBe('012345')
    expect(ones!.textContent).toBe('0123456789')
    rerender(slow(59, { from: 0, cycle: 60, format: two }))
    // Both turn back one step: 5 and 9 come down from above.
    await waitFor(() => {
      expect(y(glyph(tens!, '5'))).toBeLessThan(0)
      expect(y(glyph(ones!, '9'))).toBeLessThan(0)
      expect(glyph(ones!, '1').style.opacity).toBe('0')
    })
  })

  test('a turning wheel blurs with its speed and is sharp again at rest', async () => {
    const quick = (value: number) => (
      <YoujProvider reducedMotion="never" timeScale={0.2}>
        <Counter mode="roll" value={value} from={0} locale="en-US" inView={false} />
      </YoujProvider>
    )
    const { container, rerender } = render(quick(0))
    rerender(quick(9))
    const wheel = container.querySelector<HTMLElement>('[data-wheel]')!
    await waitFor(() => expect(wheel.style.filter).toMatch(/blur/))
    await waitFor(() => expect(shown(container)).toBe('9'))
    await waitFor(() => expect(wheel.style.filter).toBe('none'))
  })

  test('a column that appears opens its width, and one that goes closes it before it leaves', async () => {
    const at = (value: number) => (
      <YoujProvider reducedMotion="never" timeScale={0.2}>
        <Counter mode="roll" value={value} from={999} locale="en-US" inView={false} />
      </YoujProvider>
    )
    const { container, rerender } = render(at(999))
    const cells = () => [...container.querySelectorAll<HTMLElement>('[aria-hidden] > [data-part]')]
    expect(cells()).toHaveLength(3)
    rerender(at(1000))
    // "1" and "," arrive clipped and closed, then open on the spring.
    const [one, comma] = cells()
    expect(one!.style.overflow).toBe('clip')
    expect(comma!.dataset.part).toBe('group')
    expect(comma!.style.width).toBe('0px')
    await waitFor(() => expect(one!.style.overflow).toBe(''))
    rerender(at(999))
    // Still there while they close…
    expect(cells()).toHaveLength(5)
    // …then gone.
    await waitFor(() => expect(cells()).toHaveLength(3))
  })

  test('reduced motion lands every digit at once and adds and drops columns without animating', () => {
    const { container, rerender } = renderReduced(<Counter mode="roll" value={999} locale="en-US" />)
    rerender(<Counter mode="roll" value={1000} locale="en-US" />)
    expect(shown(container)).toBe('1000')
    expect(container.querySelector<HTMLElement>('[data-part]')!.style.width).toBe('')
    rerender(<Counter mode="roll" value={7} locale="en-US" />)
    expect(container.querySelectorAll('[data-column]')).toHaveLength(1)
    expect(shown(container)).toBe('7')
  })

  test('the row fades out at its top and bottom edges instead of cutting digits off', () => {
    const { container } = renderReduced(<Counter mode="roll" value={42} locale="en-US" />)
    const row = container.querySelector<HTMLElement>('[data-slot="counter"] > [aria-hidden]')!
    // (jsdom drops mask-image; the browser check is the story.) The fade sits in padding the negative margin gives back, so the line box doesn't grow.
    expect(row.style.paddingBlock).toBe('0.16em')
    expect(row.style.marginBlock).toBe('-0.16em')
  })
})
