import { fireEvent, render, screen } from '@testing-library/react'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { SoundCueContext } from '@youj/core/internal'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { formatTimecode, WaveformScrubber, type WaveformChapter } from './waveform-scrubber'

const LENGTH = 42 * 60 + 10
const CHAPTERS: WaveformChapter[] = [
  { start: 0, title: 'Cold open' },
  { start: 3 * 60 + 12, title: 'The brief' },
  { start: 9 * 60 + 40, title: 'Night shift' },
]
const PEAKS = Array.from({ length: LENGTH }, (_, i) => (i % 7) / 7)
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const bars = () => (document.querySelector('[data-slot=waveform-bars] path')!.getAttribute('d')!.match(/M/g) ?? []).length

describe('WaveformScrubber', () => {
  test('formats times as a clock reads them, in the locale’s digits', () => {
    expect(formatTimecode(42)).toBe('0:42')
    expect(formatTimecode(754)).toBe('12:34')
    expect(formatTimecode(3730)).toBe('1:02:10')
    expect(formatTimecode(754, 'ar-EG')).toBe('١٢:٣٤')
  })

  test('names the playhead and speaks where it is, with the chapter', () => {
    reduced(<WaveformScrubber peaks={PEAKS} duration={LENGTH} chapters={CHAPTERS} defaultValue={754} />)
    const seek = screen.getByRole('slider', { name: 'Seek' })
    expect(seek).toHaveAttribute('aria-valuetext', '12:34 of 42:10, Night shift')
    expect(document.querySelector('[data-slot=waveform-chapter][data-current]')).toHaveTextContent('Night shift')
    expect([...document.querySelectorAll('[data-slot=waveform-chapter-tick]')]).toHaveLength(2)
  })

  test('arrow keys step, Page Up steps ten times as far, and Home and End jump to the ends', () => {
    const seen: number[] = []
    reduced(<WaveformScrubber peaks={PEAKS} duration={LENGTH} defaultValue={100} onValueChange={(t) => seen.push(t)} />)
    const seek = screen.getByRole('slider', { name: 'Seek' })
    fireEvent.keyDown(seek, { key: 'ArrowRight' })
    fireEvent.keyDown(seek, { key: 'PageUp' })
    fireEvent.keyDown(seek, { key: 'Home' })
    fireEvent.keyDown(seek, { key: 'End' })
    expect(seen).toEqual([105, 155, 0, LENGTH])
  })

  test('scrubbing across a chapter start plays a tick, within a chapter nothing', () => {
    const cues: string[] = []
    reduced(
      <SoundCueContext.Provider value={(cue) => cues.push(cue)}>
        <WaveformScrubber peaks={PEAKS} duration={LENGTH} chapters={CHAPTERS} defaultValue={3 * 60 + 10} />
      </SoundCueContext.Provider>,
    )
    const seek = screen.getByRole('slider', { name: 'Seek' })
    fireEvent.keyDown(seek, { key: 'ArrowRight' })
    expect(cues).toEqual(['tick'])
    fireEvent.keyDown(seek, { key: 'ArrowRight' })
    expect(cues).toEqual(['tick'])
  })

  test('a clip becomes two handles, zoomed to a window round it, that move by the second', () => {
    const clips: [number, number][] = []
    reduced(<WaveformScrubber peaks={PEAKS} duration={LENGTH} chapters={CHAPTERS} clip={[754, 787]} onClipChange={(c) => clips.push(c)} />)
    expect(screen.queryByRole('slider', { name: 'Seek' })).toBeNull()
    const start = screen.getByRole('slider', { name: 'Clip start' })
    const end = screen.getByRole('slider', { name: 'Clip end' })
    expect(end).toHaveAttribute('aria-valuetext', '13:07 of 42:10')
    // The window: the clip's middle with at least a minute either side, from a whole second.
    expect(start).toHaveAttribute('min', String(Math.floor(770.5 - 66)))
    fireEvent.keyDown(end, { key: 'ArrowRight' })
    expect(clips.at(-1)).toEqual([754, 788])
    expect(document.querySelector('[data-slot=waveform-scrubber]')).toHaveAttribute('data-clipping')
  })

  test('draws a bar per slice and never more bars than there are samples', () => {
    const { unmount } = reduced(<WaveformScrubber peaks={PEAKS} duration={LENGTH} bars={80} />)
    expect(bars()).toBe(80)
    unmount()
    reduced(<WaveformScrubber peaks={PEAKS.slice(0, 30)} duration={LENGTH} bars={80} />)
    expect(bars()).toBe(30)
  })

  test('keeps time running left to right on an RTL page', () => {
    const seen: number[] = []
    reduced(
      <div dir="rtl">
        <DirectionProvider direction="rtl">
          <WaveformScrubber peaks={PEAKS} duration={LENGTH} defaultValue={100} onValueChange={(t) => seen.push(t)} />
        </DirectionProvider>
      </div>,
    )
    expect(document.querySelector('[data-slot=waveform-scrubber]')).toHaveAttribute('dir', 'ltr')
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Seek' }), { key: 'ArrowRight' })
    expect(seen).toEqual([105])
  })

  test('with motion the wave waits to rise until it is in view; reduced motion draws it in place', () => {
    const { unmount } = render(<WaveformScrubber peaks={PEAKS} duration={LENGTH} />)
    expect(document.querySelector('[data-slot=waveform-bars]')!.className).toContain('scale-y-[0.3]')
    unmount()
    reduced(<WaveformScrubber peaks={PEAKS} duration={LENGTH} />)
    expect(document.querySelector('[data-slot=waveform-bars]')!.className).not.toContain('scale-y-[0.3]')
  })

  test('speaks the provider’s language', () => {
    render(
      <YoujProvider reducedMotion="always" labels={{ waveformSeek: 'Wiedergabeposition', waveformPosition: (t, total, c) => `${t} von ${total}${c ? `, ${c}` : ''}` }}>
        <WaveformScrubber peaks={PEAKS} duration={LENGTH} chapters={CHAPTERS} defaultValue={754} />
      </YoujProvider>,
    )
    expect(screen.getByRole('slider', { name: 'Wiedergabeposition' })).toHaveAttribute('aria-valuetext', '12:34 von 42:10, Night shift')
  })
})
