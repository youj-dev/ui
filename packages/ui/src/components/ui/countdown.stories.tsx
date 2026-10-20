import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { Countdown } from './countdown'

const meta: Meta<typeof Countdown> = {
  title: 'UI/Data display/Countdown',
  component: Countdown,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Days, hours, minutes and seconds to a moment, in tabular figures under their unit names. It ticks on the second boundary, so zero lands exactly on `to`. A changed digit rolls down into its slot as the old one falls away; when several change at once they go right to left in a short cascade. Server and hydration renders hold zeros, since the time is read only in the browser. Screen readers hear a polite, coarse summary (“6 days, 4 hours left”) at most once a minute. `onComplete` fires once when time runs out. Reduced motion: digits change in place.',
      },
    },
  },
  args: { to: Date.now() + (6 * 24 + 4) * 3_600_000 + 12 * 60_000 + 45_000 },
}
export default meta
type Story = StoryObj<typeof Countdown>

export const Default: Story = {}

/** Just over two minutes out: watch the minute roll over, each changed digit cascading from the right. */
export const FinalMinutes: Story = {
  args: { to: Date.now() + 2 * 60_000 + 3_000 },
}

function Finish() {
  const [to, setTo] = useState(() => Date.now() + 5_000)
  const [done, setDone] = useState(false)
  return (
    <div className="flex flex-col items-center gap-6">
      <Countdown to={to} onComplete={() => setDone(true)} />
      <p role="status" className="h-5 text-ui text-fg-muted">
        {done ? 'Time’s up. onComplete fired.' : ''}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setDone(false)
          setTo(Date.now() + 5_000)
        }}
      >
        Restart
      </Button>
    </div>
  )
}

/** Five seconds, then the finished state: the digits settle to muted zeros and `onComplete` fires once. */
export const Complete: Story = { render: () => <Finish /> }

/** The digits and unit names follow the locale, here German. */
export const Localized: Story = {
  args: { locale: 'de-DE' },
}

/** Size comes from the font size: pass a text class. */
export const Compact: Story = {
  args: { className: 'gap-1.5 text-2xl sm:gap-2 sm:text-2xl' },
}
