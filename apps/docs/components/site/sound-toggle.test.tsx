import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSound } from '@youj/core'
import { SITE_SOUND_KEY } from '@/lib/site-sound'
import { SiteSound } from './site-sound'
import { SoundToggle } from './sound-toggle'

/* The site's sound: off by default, remembered, in step across tabs, and
 * @youj/sound only once it's on. The lazy module is the real one; the mock
 * only records that it was fetched. */

const fetched = vi.hoisted(() => vi.fn())
vi.mock('@/components/site/site-sound-on', async (importOriginal) => {
  fetched()
  return importOriginal()
})

/** A component on the page: whether a cue it emits has anywhere to go. */
function Listener() {
  const sound = useSound()
  return <output data-testid="bus">{sound.enabled && !sound.muted ? 'listening' : 'silent'}</output>
}

const site = () =>
  render(
    <SiteSound>
      <SoundToggle />
      <Listener />
    </SiteSound>,
  )
const toggle = () => screen.getByRole('button', { name: 'Sound' })
const bus = () => screen.getByTestId('bus')

beforeEach(() => localStorage.clear())

test('is off by default: not pressed, nothing sound-related fetched, nothing listening on the bus', async () => {
  site()
  expect(toggle()).toHaveAttribute('aria-pressed', 'false')
  // The tip shows the state for sight; the name stays "Sound" and aria-pressed carries the state.
  expect(screen.getByText('Sound off')).toHaveAttribute('aria-hidden', 'true')
  await act(() => new Promise((resolve) => setTimeout(resolve, 20)))
  expect(fetched).not.toHaveBeenCalled()
  expect(bus()).toHaveTextContent('silent')
})

test('a press turns it on: pressed, remembered, @youj/sound fetched and its provider listening to the page; another press turns it off', async () => {
  const user = userEvent.setup()
  site()
  await user.click(toggle())
  expect(toggle()).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByText('Sound on')).toBeInTheDocument()
  expect(localStorage.getItem(SITE_SOUND_KEY)).toBe('on')
  await waitFor(() => expect(fetched).toHaveBeenCalledTimes(1))
  await waitFor(() => expect(bus()).toHaveTextContent('listening'))

  await user.click(toggle())
  expect(toggle()).toHaveAttribute('aria-pressed', 'false')
  expect(localStorage.getItem(SITE_SOUND_KEY)).toBeNull()
  expect(bus()).toHaveTextContent('silent')
})

test('works from the keyboard', async () => {
  const user = userEvent.setup()
  site()
  await user.tab()
  expect(toggle()).toHaveFocus()
  await user.keyboard('{Enter}')
  expect(toggle()).toHaveAttribute('aria-pressed', 'true')
  await user.keyboard(' ')
  expect(toggle()).toHaveAttribute('aria-pressed', 'false')
})

test('a stored choice is back on the next visit, and a change in another tab follows here', async () => {
  localStorage.setItem(SITE_SOUND_KEY, 'on')
  site()
  expect(toggle()).toHaveAttribute('aria-pressed', 'true')
  await waitFor(() => expect(bus()).toHaveTextContent('listening'))

  localStorage.removeItem(SITE_SOUND_KEY)
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key: SITE_SOUND_KEY, newValue: null }))
  })
  expect(toggle()).toHaveAttribute('aria-pressed', 'false')
  expect(bus()).toHaveTextContent('silent')
})

test('turning sound on and off never remounts the page under it', async () => {
  let mounts = 0
  render(
    <SiteSound>
      <SoundToggle />
      <span ref={(node) => void (node && mounts++)}>page</span>
      <Listener />
    </SiteSound>,
  )
  fireEvent.click(toggle())
  await waitFor(() => expect(bus()).toHaveTextContent('listening'))
  fireEvent.click(toggle())
  expect(bus()).toHaveTextContent('silent')
  expect(mounts).toBe(1)
})

test('with storage blocked, the choice holds for the page’s life', () => {
  const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  site()
  fireEvent.click(toggle())
  expect(toggle()).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(toggle())
  expect(toggle()).toHaveAttribute('aria-pressed', 'false')
  get.mockRestore()
  set.mockRestore()
})
