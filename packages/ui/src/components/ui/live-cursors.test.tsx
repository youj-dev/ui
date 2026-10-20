import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { LiveCursors, type LiveCursorPosition, type LiveCursorUser, PresenceAvatars, useLiveCursorsInput } from './live-cursors'

const WIDTH = 800
const HEIGHT = 400

/** jsdom lays nothing out: give every element the surface's size. */
function sizeElements() {
  const width = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(WIDTH)
  const height = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(HEIGHT)
  return () => {
    width.mockRestore()
    height.mockRestore()
  }
}

/** Frames run only when the test steps them, `ms` apart. */
function manualFrames() {
  let queue: FrameRequestCallback[] = []
  let now = 0
  const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    queue.push(cb)
    return queue.length
  })
  const caf = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  const clock = vi.spyOn(performance, 'now').mockImplementation(() => now)
  return {
    step(frames: number, ms = 16) {
      for (let i = 0; i < frames; i++) {
        now += ms
        const run = queue
        queue = []
        act(() => {
          for (const cb of run) cb(now)
        })
      }
    },
    pending: () => queue.length,
    restore() {
      raf.mockRestore()
      caf.mockRestore()
      clock.mockRestore()
    },
  }
}

const cursor = (name: string) => cursors().find((el) => el.querySelector('[data-slot=live-cursor-name]')?.textContent === name)!
const cursors = () => [...document.querySelectorAll<HTMLElement>('[data-slot=live-cursor]')]
const at = (el: HTMLElement) => {
  const m = /translate3d\(([-\d.]+)px, ([-\d.]+)px/.exec(el.style.transform)
  return m ? [Number(m[1]), Number(m[2])] : undefined
}

const team: LiveCursorUser[] = [
  { id: 'ada', name: 'Ada', x: 0.25, y: 0.5, status: 'editing' },
  { id: 'grace', name: 'Grace', x: 0.75, y: 0.25, message: 'On it', status: 'viewing' },
  { id: 'lin', name: 'Lin' },
]

let unsize: () => void
beforeEach(() => {
  unsize = sizeElements()
})
afterEach(() => unsize())

describe('LiveCursors', () => {
  test('draws a hidden cursor with a name for each placed person, and none for someone whose pointer is elsewhere', () => {
    render(
      <LiveCursors users={team}>
        <p>Canvas</p>
      </LiveCursors>,
    )
    expect(screen.getByText('Canvas')).toBeInTheDocument()
    expect(cursors()).toHaveLength(2)
    expect(document.querySelector('[data-slot=live-cursors-overlay]')).toHaveAttribute('aria-hidden', 'true')
    expect(cursor('Ada')).toHaveTextContent('Ada')
    expect(cursor('Grace').querySelector('[data-slot=live-cursor-message]')).toHaveTextContent('On it')
    expect(screen.queryByText('Lin')).toBeNull()
  })

  test('places a cursor by fractions of the surface, so any screen size agrees', () => {
    render(<LiveCursors users={team} />)
    expect(at(cursor('Ada'))).toEqual([200, 200])
    expect(at(cursor('Grace'))).toEqual([600, 100])
  })

  test('colors each person from the chart palette by id, the same on every render, unless they bring their own', () => {
    const { rerender } = render(<LiveCursors users={team} />)
    const color = cursor('Ada').style.getPropertyValue('--ui--live-cursor')
    expect(color).toMatch(/^var\(--color-chart-[1-5]\)$/)
    rerender(<LiveCursors users={[{ id: 'ada', name: 'Ada', x: 0.9, y: 0.9 }]} />)
    expect(cursor('Ada').style.getPropertyValue('--ui--live-cursor')).toBe(color)
    rerender(<LiveCursors users={[{ id: 'ada', name: 'Ada', x: 0.9, y: 0.9, color: 'var(--color-accent)' }]} />)
    expect(cursor('Ada').style.getPropertyValue('--ui--live-cursor')).toBe('var(--color-accent)')
  })

  test('springs between sparse updates on one loop, and stops once every cursor rests', () => {
    const frames = manualFrames()
    try {
      const { rerender } = render(<LiveCursors users={team} />)
      rerender(<LiveCursors users={[{ ...team[0]!, x: 0.75 }, { ...team[1]!, y: 0.75 }]} />)
      expect(at(cursor('Ada'))).toEqual([200, 200])
      frames.step(3)
      const [x] = at(cursor('Ada'))!
      expect(x).toBeGreaterThan(200)
      expect(x).toBeLessThan(600)
      expect(frames.pending()).toBe(1)
      frames.step(120)
      expect(at(cursor('Ada'))).toEqual([600, 200])
      expect(at(cursor('Grace'))).toEqual([600, 300])
      expect(frames.pending()).toBe(0)
    } finally {
      frames.restore()
    }
  })

  test('with reduced motion a cursor jumps to each update', () => {
    const { rerender } = render(
      <YoujProvider reducedMotion="always">
        <LiveCursors users={team} />
      </YoujProvider>,
    )
    rerender(
      <YoujProvider reducedMotion="always">
        <LiveCursors users={[{ ...team[0]!, x: 0.5, y: 0.1 }]} />
      </YoujProvider>,
    )
    expect(at(cursor('Ada'))).toEqual([400, 40])
  })

  test('fades a cursor that stops moving, and wakes it when it moves or speaks', () => {
    vi.useFakeTimers()
    try {
      const { rerender } = render(<LiveCursors users={team} idleAfter={3000} />)
      act(() => vi.advanceTimersByTime(2900))
      expect(cursor('Ada')).not.toHaveAttribute('data-yj-idle')
      act(() => vi.advanceTimersByTime(200))
      expect(cursor('Ada')).toHaveAttribute('data-yj-idle')
      expect(cursor('Grace')).toHaveAttribute('data-yj-idle')
      rerender(<LiveCursors users={[{ ...team[0]!, x: 0.3 }, { ...team[1]!, message: 'Done' }]} idleAfter={3000} />)
      expect(cursor('Ada')).not.toHaveAttribute('data-yj-idle')
      expect(cursor('Grace')).not.toHaveAttribute('data-yj-idle')
    } finally {
      vi.useRealTimers()
    }
  })

  test('draws selections as rectangles in the person’s color', () => {
    render(<LiveCursors users={[{ id: 'ada', name: 'Ada', x: 0.1, y: 0.1, selection: [{ x: 0.1, y: 0.2, width: 0.3, height: 0.4 }] }]} />)
    const rect = document.querySelector<HTMLElement>('[data-slot=live-cursor-selection]')!
    expect(rect.style.top).toBe('20%')
    expect(rect.style.width).toBe('30%')
    expect(rect.style.height).toBe('40%')
    expect(rect.style.getPropertyValue('--ui--live-cursor')).toBe(cursor('Ada').style.getPropertyValue('--ui--live-cursor'))
  })

  test('announces who joined and who left, but not who was there already', async () => {
    const { rerender } = render(<LiveCursors users={team} />)
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('')
    rerender(<LiveCursors users={[team[0]!, { id: 'joan', name: 'Joan' }, { id: 'kenji', name: 'Kenji' }]} />)
    expect(await screen.findByText('Joan and Kenji joined. Grace and Lin left')).toBe(status)
  })

  test('says nothing with announce off', async () => {
    const { rerender } = render(<LiveCursors users={team} announce={false} />)
    rerender(<LiveCursors users={[team[0]!]} announce={false} />)
    // youj-allow: sleep — proving nothing is announced has no condition to wait for, only time to give it.
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(screen.getByRole('status')).toHaveTextContent('')
  })

  test('eases the view after the followed person once they leave its middle, and stays put while they are inside it', async () => {
    let anchorX = 200
    const frames = manualFrames()
    const rect = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      if (this.getAttribute('data-slot') === 'live-cursors-follow-anchor') return { left: anchorX, top: 150, width: 0, height: 0, right: anchorX, bottom: 150, x: anchorX, y: 150, toJSON: () => ({}) } as DOMRect
      return { left: 0, top: 0, width: 400, height: 300, right: 400, bottom: 300, x: 0, y: 0, toJSON: () => ({}) } as DOMRect
    })
    try {
      render(
        <div data-testid="view" style={{ overflow: 'auto' }}>
          <LiveCursors users={team} following="ada" />
        </div>,
      )
      const view = screen.getByTestId('view')
      for (const [key, value] of Object.entries({ scrollWidth: 2000, clientWidth: 400, scrollHeight: 1000, clientHeight: 300 })) Object.defineProperty(view, key, { configurable: true, value })
      // jsdom doesn't scroll, so the view keeps what the camera writes.
      const at = { left: 0, top: 0 }
      Object.defineProperty(view, 'scrollLeft', { configurable: true, get: () => at.left, set: (v: number) => void (at.left = v) })
      Object.defineProperty(view, 'scrollTop', { configurable: true, get: () => at.top, set: (v: number) => void (at.top = v) })
      // Inside the middle of the view: the camera holds still.
      frames.step(5)
      expect(view.scrollLeft).toBe(0)
      // Near the right edge (90px past the calm zone): it eases after them over several frames, never the whole way in one.
      anchorX = 390
      frames.step(1)
      expect(view.scrollLeft).toBeGreaterThan(0)
      expect(view.scrollLeft).toBeLessThan(90)
      frames.step(30)
      expect(view.scrollLeft).toBeGreaterThan(60)
    } finally {
      rect.mockRestore()
      frames.restore()
    }
  })
})

function Input({ onMove }: { onMove: (position: LiveCursorPosition | null) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useLiveCursorsInput(ref, onMove, { throttle: 100 })
  return <div ref={ref} data-testid="surface" />
}

describe('useLiveCursorsInput', () => {
  test('reports the pointer as fractions of the surface, throttled, with the last move landing, and null on leave', () => {
    vi.useFakeTimers()
    const onMove = vi.fn()
    try {
      render(<Input onMove={onMove} />)
      const surface = screen.getByTestId('surface')
      vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue({ left: 100, top: 50, width: 400, height: 200, right: 500, bottom: 250, x: 100, y: 50, toJSON: () => ({}) })
      fireEvent.pointerMove(surface, { clientX: 300, clientY: 150 })
      expect(onMove).toHaveBeenLastCalledWith({ x: 0.5, y: 0.5 })
      fireEvent.pointerMove(surface, { clientX: 320, clientY: 150 })
      fireEvent.pointerMove(surface, { clientX: 900, clientY: 0 })
      expect(onMove).toHaveBeenCalledTimes(1)
      act(() => vi.advanceTimersByTime(100))
      expect(onMove).toHaveBeenCalledTimes(2)
      expect(onMove).toHaveBeenLastCalledWith({ x: 1, y: 0 })
      fireEvent.pointerLeave(surface)
      expect(onMove).toHaveBeenLastCalledWith(null)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('PresenceAvatars', () => {
  test('a named group of who is here, with "+N" past max', () => {
    render(<PresenceAvatars users={[...team, { id: 'joan', name: 'Joan' }]} max={2} />)
    const group = screen.getByRole('group', { name: 'People here' })
    expect(group.querySelectorAll('[data-slot=presence-avatar]')).toHaveLength(2)
    expect(screen.getByRole('img', { name: '2 more' })).toHaveTextContent('+2')
  })

  test('without follow handlers, each avatar names the person and what they are doing', () => {
    render(<PresenceAvatars users={team} />)
    expect(screen.getByRole('img', { name: 'Ada, Editing' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Grace, Viewing' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Lin' })).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  test('pressing an avatar follows that person, pressing it again stops, and following is announced', async () => {
    const user = userEvent.setup()
    const onFollowingChange = vi.fn()
    render(<PresenceAvatars users={team} defaultFollowing={null} onFollowingChange={onFollowingChange} />)
    const ada = screen.getByRole('button', { name: 'Follow Ada' })
    expect(ada).toHaveAttribute('aria-pressed', 'false')
    await user.click(ada)
    expect(ada).toHaveAttribute('aria-pressed', 'true')
    expect(onFollowingChange).toHaveBeenLastCalledWith('ada')
    expect(await screen.findByText('Following Ada')).toHaveAttribute('role', 'status')
    await user.click(screen.getByRole('button', { name: 'Follow Grace' }))
    expect(onFollowingChange).toHaveBeenLastCalledWith('grace')
    expect(ada).toHaveAttribute('aria-pressed', 'false')
    await user.click(screen.getByRole('button', { name: 'Follow Grace' }))
    expect(onFollowingChange).toHaveBeenLastCalledWith(null)
  })

  test('a followed person who leaves is no longer followed', () => {
    const { rerender } = render(<PresenceAvatars users={team} following="grace" onFollowingChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Follow Grace' })).toHaveAttribute('aria-pressed', 'true')
    rerender(<PresenceAvatars users={[team[0]!]} following="grace" onFollowingChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Follow Ada' })).toHaveAttribute('aria-pressed', 'false')
  })
})
