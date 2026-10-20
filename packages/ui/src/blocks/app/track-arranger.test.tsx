import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { TrackArranger } from './track-arranger'
import { CLIPS, trim } from './track-arranger/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const clip = (name: RegExp) => screen.getByRole('button', { name })
const field = (name: string) => screen.getByRole('textbox', { name })

describe('track arranger trim', () => {
  test('never trims into the clip beside it, past its source, or under half a second', () => {
    const into = trim(CLIPS, 'loop-a2', 'end', 31, 48)
    expect(into.find((c) => c.id === 'loop-a2')!.end).toBe(30)
    const short = trim(CLIPS, 'fill', 'start', 32.4, 48)
    expect(short.find((c) => c.id === 'fill')).toMatchObject({ start: 32, offset: 32 })
    const early = trim(CLIPS, 'hum', 'start', 2, 48)
    // The hum's source runs from 8s before it, so its start can move earlier onto the empty lane.
    expect(early.find((c) => c.id === 'hum')).toMatchObject({ start: 2, offset: 2 })
  })
})

describe('TrackArranger block', () => {
  test('shows the sketch, the clock, the arrangement and the chorus in the inspector', () => {
    reduced(<TrackArranger />)
    expect(screen.getByRole('heading', { level: 2, name: 'Late platform' })).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('0:28.5')
    expect(screen.getByRole('group', { name: 'Arrangement' })).toBeInTheDocument()
    expect(clip(/^chorus idea, 0:26\.0 to 0:40\.0, Voice memo$/)).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { level: 3, name: 'Clip' })).toBeInTheDocument()
    expect(field('Start')).toHaveValue('26.0')
    expect(field('End')).toHaveValue('40.0')
    // The Slider's edge-aligned thumb stays visibility:hidden in jsdom until measured, like the other blocks' sliders.
    const gain = screen.getAllByRole('slider', { hidden: true }).find((el) => el.getAttribute('aria-label') === 'Gain')!
    expect(gain).toHaveAttribute('aria-valuetext', '+2.0 dB')
  })

  test('the inspector trims the selected clip, and the timeline follows', async () => {
    const user = userEvent.setup()
    reduced(<TrackArranger />)
    const end = field('End')
    await user.clear(end)
    await user.type(end, '36{Enter}')
    expect(clip(/^chorus idea, 0:26\.0 to 0:36\.0/)).toBeInTheDocument()
    expect(screen.getByText('0:10.0')).toBeInTheDocument()
  })

  test('selecting another clip moves the inspector to it; the arrows move it', () => {
    reduced(<TrackArranger />)
    fireEvent.focus(clip(/^strum/))
    expect(field('Start')).toHaveValue('24.0')
    fireEvent.keyDown(clip(/^strum/), { key: 'ArrowRight' })
    expect(field('Start')).toHaveValue('24.5')
  })

  test('play runs the clock, pause stops it, and the level strips read the tracks', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] })
    try {
      reduced(<TrackArranger />)
      fireEvent.click(screen.getByRole('button', { name: 'Play' }))
      await act(async () => vi.advanceTimersByTime(2000))
      expect(screen.getByRole('timer')).toHaveTextContent('0:30.5')
      const lit = [...document.querySelectorAll('[data-slot=track-timeline-meter]')].map((m) => [...m.children].filter((c) => !c.className.includes('bg-well')).length)
      expect(lit.every((n) => n > 0)).toBe(true)
      fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
      await act(async () => vi.advanceTimersByTime(2000))
      expect(screen.getByRole('timer')).toHaveTextContent('0:30.5')
      fireEvent.click(screen.getByRole('button', { name: 'Back to the start' }))
      expect(screen.getByRole('timer')).toHaveTextContent('0:00.0')
    } finally {
      vi.useRealTimers()
    }
  })

  test('muting a track greys its clips; Export mix hands over the arrangement and says so', async () => {
    const user = userEvent.setup()
    const exported: unknown[] = []
    reduced(<TrackArranger onExport={(clips, tracks) => void exported.push({ clips: clips.length, muted: tracks.filter((t) => t.muted).map((t) => t.id) })} />)
    await user.click(screen.getByRole('button', { name: 'Mute Beat' }))
    expect(clip(/^loop B/)).toHaveAttribute('data-muted', 'true')
    await user.click(screen.getByRole('button', { name: 'Export mix' }))
    await waitFor(() => expect(exported).toEqual([{ clips: CLIPS.length, muted: ['beat'] }]))
    await waitFor(() => expect(screen.getAllByRole('status').map((s) => s.textContent)).toContain('Mix exported'))
  })

  test('embedded, it is a section named by an h2 with the inspector under an h3', () => {
    reduced(<TrackArranger embedded defaultSelected={null} />)
    expect(screen.getByRole('region', { name: 'Late platform' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Clip' })).toBeInTheDocument()
    expect(screen.getByText('Select a clip to set its start, end and gain.')).toBeInTheDocument()
    expect(screen.queryByRole('main')).toBeNull()
  })

  test('your project, tracks and clips drive the lanes, and copy rewrites the words', () => {
    reduced(
      <TrackArranger
        project={{ title: 'Episode 43', length: 30, detail: '2 speakers' }}
        tracks={[
          { id: 'host', name: 'Host', caption: 'Mic 1', peaks: [0.3, 0.5, 0.4, 0.6] },
          { id: 'guest', name: 'Guest', caption: 'Mic 2', peaks: [0.2, 0.4, 0.3, 0.5] },
        ]}
        clips={[
          { id: 'intro', track: 'host', name: 'intro', start: 0, end: 10 },
          { id: 'answer', track: 'guest', name: 'answer', start: 10, end: 20 },
        ]}
        defaultSelected="answer"
        start={12}
        resolution={5}
        copy={{ subtitle: (detail) => `Episode edit · ${detail}`, timeline: 'Episode timeline', gain: 'Level' }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Episode 43' })).toBeInTheDocument()
    expect(screen.getByText('Episode edit · 2 speakers')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Episode timeline' })).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('0:12.0')
    expect(screen.getByRole('timer')).toHaveTextContent('/ 0:30.0')
    expect(clip(/^answer, 0:10\.0 to 0:20\.0, Guest$/)).toHaveAttribute('aria-pressed', 'true')
    expect(field('Start')).toHaveValue('10.0')
    expect(screen.getAllByRole('slider', { hidden: true }).some((el) => el.getAttribute('aria-label') === 'Level')).toBe(true)
  })

  test('a project with no detail has a plain subtitle', () => {
    reduced(<TrackArranger project={{ title: 'Quick idea', length: 48 }} defaultSelected={null} />)
    expect(screen.getByText('Sketch')).toBeInTheDocument()
  })

  test('with no tracks it shows the empty state instead of the lanes', () => {
    reduced(<TrackArranger tracks={[]} clips={[]} />)
    expect(screen.getByText('No tracks yet')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Arrangement' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Export mix' })).toBeDisabled()
  })

  test('your empty node replaces the default message', () => {
    reduced(<TrackArranger tracks={[]} clips={[]} empty={<p>Drop a file to start</p>} />)
    expect(screen.getByText('Drop a file to start')).toBeInTheDocument()
    expect(screen.queryByText('No tracks yet')).toBeNull()
  })

  test('an error shows its message and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<TrackArranger error="Couldn’t load the project." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the project.')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Arrangement' })).toBeNull()
    expect(screen.queryByText('Late platform')).toBeNull()
    expect(screen.queryByRole('timer')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('loading holds the place without the lanes, the clock or the demo project', () => {
    reduced(<TrackArranger loading />)
    expect(screen.getAllByText('Loading the arrangement').length).toBeGreaterThan(0)
    expect(screen.queryByRole('group', { name: 'Arrangement' })).toBeNull()
    expect(screen.queryByRole('timer')).toBeNull()
    expect(screen.queryByText('Late platform')).toBeNull()
  })
})
