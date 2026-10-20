import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ChapterPlayer } from './chapter-player'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const chapters = () => within(screen.getByRole('heading', { name: 'Chapters' }).closest('section')!)

describe('ChapterPlayer', () => {
  test('shows the episode, the chapter playing, the clock and the wave to scrub', () => {
    reduced(<ChapterPlayer />)
    expect(screen.getByRole('heading', { level: 2, name: 'The quiet shift' })).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('12:34')
    expect(screen.getByRole('slider', { name: 'Seek' })).toHaveAttribute('aria-valuetext', '12:34 of 42:10, Night shift')
    expect(chapters().getByRole('button', { name: /Night shift/ })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByText('−29:36')).toBeInTheDocument()
  })

  test('play runs the clock at the chosen speed, and pause stops it', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] })
    try {
      reduced(<ChapterPlayer />)
      fireEvent.click(screen.getByRole('button', { name: 'Play' }))
      await act(async () => vi.advanceTimersByTime(4000))
      expect(screen.getByRole('timer')).toHaveTextContent('12:38')
      // The Slider's edge-aligned thumb stays visibility:hidden in jsdom until measured, like the other blocks' sliders.
      const speed = screen.getAllByRole('slider', { hidden: true }).find((el) => el.getAttribute('aria-label') === 'Speed')!
      expect(speed).toHaveAttribute('aria-valuetext', '1.0×')
      fireEvent.keyDown(speed, { key: 'End' })
      await act(async () => vi.advanceTimersByTime(4000))
      expect(screen.getByRole('timer')).toHaveTextContent('12:46')
      fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
      await act(async () => vi.advanceTimersByTime(4000))
      expect(screen.getByRole('timer')).toHaveTextContent('12:46')
    } finally {
      vi.useRealTimers()
    }
  })

  test('the skip pills and the chapter rows move the playhead', async () => {
    const user = userEvent.setup()
    reduced(<ChapterPlayer />)
    await user.click(screen.getByRole('button', { name: 'Forward 30 seconds' }))
    expect(screen.getByRole('timer')).toHaveTextContent('13:04')
    await user.click(screen.getByRole('button', { name: 'Back 15 seconds' }))
    expect(screen.getByRole('timer')).toHaveTextContent('12:49')
    await user.click(chapters().getByRole('button', { name: /Listener mail/ }))
    expect(screen.getByRole('timer')).toHaveTextContent('35:50')
    expect(chapters().getByRole('button', { name: /Listener mail/ })).toHaveAttribute('aria-current', 'true')
  })

  test('Clip brackets half a minute from the playhead and shares it', async () => {
    const user = userEvent.setup()
    const shared: [number, number][] = []
    reduced(<ChapterPlayer onShareClip={(range) => void shared.push(range)} />)
    await user.click(screen.getByRole('button', { name: 'Clip' }))
    expect(screen.getByRole('button', { name: 'Clip' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('slider', { name: 'Clip start' })).toHaveAttribute('aria-valuetext', '12:34 of 42:10')
    expect(screen.getByRole('slider', { name: 'Clip end' })).toHaveAttribute('aria-valuetext', '13:07 of 42:10')
    await user.click(await screen.findByRole('button', { name: 'Share 12:34–13:07' }))
    await waitFor(() => expect(shared).toEqual([[754, 787]]))
    await waitFor(() => expect(screen.getAllByRole('status').map((s) => s.textContent)).toContain('Link to 12:34–13:07 copied'))
  })

  test('Cancel drops the clip and brings the playhead back', async () => {
    const user = userEvent.setup()
    reduced(<ChapterPlayer />)
    await user.click(screen.getByRole('button', { name: 'Clip' }))
    await user.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('slider', { name: 'Seek' })).toBeInTheDocument()
    expect(screen.queryByRole('slider', { name: 'Clip start' })).toBeNull()
  })

  test('embedded, it is a section named by an h2 with h3 sections', () => {
    reduced(<ChapterPlayer embedded />)
    expect(screen.getByRole('heading', { level: 2, name: 'The quiet shift' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Chapters' })).toBeInTheDocument()
  })

  test('your media, chapters and words drive the content', () => {
    reduced(
      <ChapterPlayer
        media={{
          series: 'Organic Chemistry 201',
          author: 'Prof. Whitfield',
          part: 14,
          title: 'Reaction mechanisms',
          length: 600,
          chapters: [
            { start: 0, title: 'Recap' },
            { start: 240, title: 'SN1 versus SN2' },
          ],
          peaks: [0.4, 0.6, 0.5, 0.7],
        }}
        start={250}
        copy={{ subtitle: (series, part) => `${series} · Lecture ${part}`, chapters: 'Topics', chapterCount: (n) => `${n} topics`, byline: (author) => `by ${author}` }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Reaction mechanisms' })).toBeInTheDocument()
    expect(screen.getByText('Organic Chemistry 201 · Lecture 14')).toBeInTheDocument()
    expect(screen.getByText('by Prof. Whitfield')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Topics' })).toBeInTheDocument()
    expect(screen.getByText('2 topics')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /SN1 versus SN2/ })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('timer')).toHaveTextContent('4:10')
    // No date and no part: nothing about them is shown.
    expect(screen.queryByText(/Sep/)).toBeNull()
  })

  test('media without a part or a date shows only its series in the subtitle', () => {
    reduced(<ChapterPlayer media={{ series: 'Audiobook', author: 'Ines Calder', title: 'The Salt Road', length: 7200, chapters: [{ start: 0, title: 'Prologue' }], peaks: [0.5, 0.6] }} start={0} />)
    expect(screen.getByText('Audiobook')).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('0:00')
    expect(screen.getByText('−2:00:00')).toBeInTheDocument()
  })

  test('with no media it shows the empty state instead of the player', () => {
    reduced(<ChapterPlayer media={null} />)
    expect(screen.getByText('Nothing to play')).toBeInTheDocument()
    expect(screen.queryByRole('slider', { name: 'Seek' })).toBeNull()
    expect(screen.queryByRole('timer')).toBeNull()
  })

  test('your empty node replaces the default message', () => {
    reduced(<ChapterPlayer media={null} empty={<p>Pick a recording</p>} />)
    expect(screen.getByText('Pick a recording')).toBeInTheDocument()
    expect(screen.queryByText('Nothing to play')).toBeNull()
  })

  test('an error shows its message and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<ChapterPlayer error="Couldn’t load the recording." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the recording.')).toBeInTheDocument()
    expect(screen.queryByRole('slider', { name: 'Seek' })).toBeNull()
    expect(screen.queryByText('The quiet shift')).toBeNull()
    expect(screen.queryByText(/left/)).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('loading holds the place without the player, the chapters or the demo figures', () => {
    reduced(<ChapterPlayer loading />)
    expect(screen.getAllByText('Loading the recording').length).toBeGreaterThan(0)
    expect(screen.queryByRole('slider', { name: 'Seek' })).toBeNull()
    expect(screen.queryByRole('timer')).toBeNull()
    expect(screen.queryByText(/29:36/)).toBeNull()
  })
})
