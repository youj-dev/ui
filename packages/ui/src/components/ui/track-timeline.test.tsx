import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { TrackTimeline, formatClipTime, type TimelineClip, type TimelineTrack } from './track-timeline'

const flat = (seconds: number, level = 0.5) => Array.from({ length: seconds * 10 }, () => level)
const TRACKS: TimelineTrack[] = [
  { id: 'keys', name: 'Keys', peaks: flat(40) },
  { id: 'drums', name: 'Drums', peaks: flat(40, 0.9) },
]
const CLIPS: TimelineClip[] = [
  { id: 'intro', track: 'keys', name: 'intro', start: 0, end: 8 },
  { id: 'verse', track: 'keys', name: 'verse', start: 10, end: 18, offset: 10 },
  { id: 'fill', track: 'drums', name: 'fill', start: 20, end: 24, offset: 20 },
]

/** A controlled timeline, as an app runs it, reporting what changes. */
function Harness({ onTracks, playing, position = 5 }: { onTracks?: (id: string, change: object) => void; playing?: boolean; position?: number }) {
  const [clips, setClips] = useState(CLIPS)
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <>
      <TrackTimeline tracks={TRACKS} clips={clips} onClipsChange={setClips} onTrackChange={onTracks} duration={40} value={selected} onValueChange={setSelected} position={position} playing={playing} label="Song" />
      <output data-testid="clips">{clips.map((c) => `${c.id}:${c.start}-${c.end}`).join(' ')}</output>
    </>
  )
}

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const clip = (name: RegExp) => screen.getByRole('button', { name })
const state = () => screen.getByTestId('clips').textContent

describe('TrackTimeline', () => {
  test('formats times with their tenths, in the locale’s digits', () => {
    expect(formatClipTime(12.5)).toBe('0:12.5')
    expect(formatClipTime(64)).toBe('1:04.0')
    expect(formatClipTime(12.5, 'de-DE')).toBe('0:12,5')
  })

  test('names each clip by its name, range and track, and the playhead by where it is', () => {
    reduced(<Harness />)
    expect(screen.getByRole('group', { name: 'Song' })).toBeInTheDocument()
    expect(clip(/^verse, 0:10\.0 to 0:18\.0, Keys$/)).toHaveAccessibleDescription(/Arrow keys move the clip/)
    expect(screen.getByRole('slider', { name: 'Playhead' })).toHaveAttribute('aria-valuetext', '0:05.0 of 0:40.0')
    expect(screen.getByRole('group', { name: 'Drums' })).toBeInTheDocument()
  })

  test('arrows move the focused clip by the step, and Shift ten times as far, stopping at a snap point', () => {
    reduced(<Harness />)
    fireEvent.focus(clip(/^verse/))
    fireEvent.keyDown(clip(/^verse/), { key: 'ArrowRight' })
    expect(state()).toContain('verse:10.5-18.5')
    // Ten times as far is five seconds, but the drums' fill starts at 20 on the way: the end stops there.
    fireEvent.keyDown(clip(/^verse/), { key: 'ArrowRight', shiftKey: true })
    expect(state()).toContain('verse:12-20')
    expect(screen.getAllByRole('status').map((s) => s.textContent)).toContain('0:12.0 to 0:20.0')
  })

  test('a clip never moves into its neighbour on the same track', () => {
    reduced(<Harness />)
    fireEvent.focus(clip(/^verse/))
    for (let i = 0; i < 4; i++) fireEvent.keyDown(clip(/^verse/), { key: 'ArrowLeft', shiftKey: true })
    expect(state()).toContain('verse:8-16')
  })

  test('the selected clip’s edges trim it from the keyboard, and never past its source', () => {
    reduced(<Harness />)
    fireEvent.focus(clip(/^fill/))
    expect(clip(/^fill/)).toHaveAttribute('aria-pressed', 'true')
    const end = screen.getByRole('slider', { name: 'End of fill' })
    fireEvent.keyDown(end, { key: 'ArrowLeft' })
    expect(state()).toContain('fill:20-23.5')
    const start = screen.getByRole('slider', { name: 'Start of fill' })
    fireEvent.keyDown(start, { key: 'ArrowRight' })
    expect(state()).toContain('fill:20.5-23.5')
    // The fill's source runs to 40s: its end stops there, however far it's pulled.
    for (let i = 0; i < 6; i++) fireEvent.keyDown(screen.getByRole('slider', { name: 'End of fill' }), { key: 'ArrowRight', shiftKey: true })
    expect(state()).toContain('fill:20.5-40')
  })

  test('mute and solo report the track’s change', () => {
    const changes: [string, object][] = []
    reduced(<Harness onTracks={(id, change) => changes.push([id, change])} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mute Drums' }))
    fireEvent.click(screen.getByRole('button', { name: 'Solo Keys' }))
    expect(changes).toEqual([
      ['drums', { muted: true }],
      ['keys', { solo: true }],
    ])
  })

  test('a solo quiets the other tracks, and the meters read the playhead only while playing', () => {
    const lit = () => [...document.querySelectorAll('[data-slot=track-timeline-meter]')].map((m) => [...m.children].filter((c) => !c.className.includes('bg-well')).length)
    const { rerender } = reduced(<Harness position={5} />)
    expect(lit()).toEqual([0, 0])
    rerender(
      <YoujProvider reducedMotion="always">
        <Harness position={5} playing />
      </YoujProvider>,
    )
    // Keys plays its intro at 5s; the drums have nothing there.
    expect(lit()[0]).toBeGreaterThan(0)
    expect(lit()[1]).toBe(0)
  })

  test('zoom widens the clips, and the lane keeps time left to right under RTL', () => {
    reduced(
      <DirectionProvider direction="rtl">
        <Harness />
      </DirectionProvider>,
    )
    const width = () => parseFloat(clip(/^verse/).style.width)
    const before = width()
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    expect(width()).toBeGreaterThan(before)
    expect(document.querySelector('[data-slot=track-timeline-lane]')).toHaveAttribute('dir', 'ltr')
    expect(parseFloat(clip(/^intro/).style.left)).toBeLessThan(parseFloat(clip(/^verse/).style.left))
  })

  test('Escape lets go of the selected clip, and its edges go with it', () => {
    reduced(<Harness />)
    fireEvent.focus(clip(/^verse/))
    expect(screen.getByRole('slider', { name: 'Start of verse' })).toBeInTheDocument()
    fireEvent.keyDown(clip(/^verse/), { key: 'Escape' })
    expect(clip(/^verse/)).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('slider', { name: 'Start of verse' })).toBeNull()
  })
})
