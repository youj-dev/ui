import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { preloadMotionFeatures } from '@youj/core'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ReactionGroup, type ReactionGroupItem } from './reaction-group'

const meta: Meta<typeof ReactionGroup> = {
  title: 'UI/Primitives/Reaction group',
  component: ReactionGroup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Emoji reactions under a comment, a message or a post: a pill per emoji with how many reacted, pressed when you’re one of them, and a button that offers emoji to react with. A press adds yours or takes it away at once; `onReact` can return a promise, and if it rejects the press is undone and the reason shows under the row. Hover, focus or a long press names who reacted. Turning one on pops its emoji and rolls its count, and pills join, leave and make room as they change.',
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'default'] },
    disabled: { control: 'boolean' },
  },
  args: { size: 'default', disabled: false },
}
export default meta
type Story = StoryObj<typeof ReactionGroup>

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const REACTIONS: ReactionGroupItem[] = [
  { emoji: '👍', count: 4, reacted: true, by: ['Mara Okafor', 'Theo Lindqvist', 'Priya Raman'] },
  { emoji: '🎉', count: 2, by: ['Mara Okafor', 'Jonas Weber'] },
  { emoji: '👀', count: 1, by: ['Theo Lindqvist'] },
]

/** Every prop as a control. Saving takes a moment, so the pill shows busy while it runs. */
export const Playground: Story = {
  render: (args) => <ReactionGroup {...args} defaultValue={REACTIONS} onReact={() => wait(600)} />,
}

/** Under a comment: press a pill to add yours or take it away, or add another from the button at the end. */
export const UnderAComment: Story = {
  name: 'Under a comment',
  render: (args) => (
    <article className="flex w-full max-w-[460px] flex-col gap-2 rounded-xl border border-line bg-surface p-4">
      <header className="flex items-baseline gap-2">
        <span className="text-ui font-medium text-fg">Mara Okafor</span>
        <span className="text-ui-sm text-fg-subtle">2 hours ago</span>
      </header>
      <p className="text-ui text-fg">The annual column in the pricing table still shows last year’s discount. Can someone check it against the rate card before this goes to legal?</p>
      <ReactionGroup {...args} defaultValue={REACTIONS} onReact={() => wait(500)} />
    </article>
  ),
}

/** `size="sm"` under chat messages, where rows are dense. */
export const InAChat: Story = {
  name: 'In a chat',
  render: () => (
    <div className="flex w-full max-w-[420px] flex-col gap-3">
      {[
        { who: 'Theo', text: 'Deploy is green. Rolling to the rest of the fleet now.', reactions: [{ emoji: '🚀', count: 3, by: ['Mara', 'Priya', 'Jonas'] }] },
        { who: 'Priya', text: 'Nice. I’ll watch the error rate for the next hour.', reactions: [{ emoji: '👍', count: 1, reacted: true }, { emoji: '❤️', count: 1, by: ['Theo'] }] },
      ].map((message) => (
        <div key={message.who} className="flex flex-col items-start gap-1">
          <div className="max-w-[85%] rounded-xl bg-band px-3 py-2 text-ui text-fg">
            <span className="block text-ui-sm font-medium text-fg-muted">{message.who}</span>
            {message.text}
          </div>
          <ReactionGroup size="sm" defaultValue={message.reactions} />
        </div>
      ))}
    </div>
  ),
}

/** Nobody has reacted yet: only the add button shows. */
export const Empty: Story = {
  render: (args) => <ReactionGroup {...args} />,
}

/** Others react while you watch: counts roll and a new emoji joins at the end. */
export const Live: Story = {
  render: (args) => {
    function Live() {
      const [value, setValue] = useState<ReactionGroupItem[]>(REACTIONS)
      useEffect(() => {
        const names = ['Noor Haddad', 'Lena Fischer', 'Sam Okoye', 'Ada Brooks']
        let step = 0
        const timer = setInterval(() => {
          const name = names[step % names.length]!
          const emoji = ['👀', '🎉', '🚀', '👀'][step % 4]!
          step += 1
          setValue((current) =>
            current.some((item) => item.emoji === emoji)
              ? current.map((item) => (item.emoji === emoji ? { ...item, count: item.count + 1, by: [name, ...(item.by ?? [])] } : item))
              : [...current, { emoji, count: 1, by: [name] }],
          )
        }, 1800)
        return () => clearInterval(timer)
      }, [])
      return <ReactionGroup {...args} value={value} onValueChange={setValue} />
    }
    return <Live />
  },
}

/** `onReact` rejects: the pill shakes back, the count returns and the reason shows under the row until the next press. */
export const Failure: Story = {
  render: (args) => (
    <ReactionGroup
      {...args}
      defaultValue={REACTIONS}
      onReact={async () => {
        await wait(700)
        throw new Error('offline')
      }}
    />
  ),
}

/** How big the emoji is drawn now: 1 at rest, above 1 while it pops. */
const scaleOf = (pill: Element) => {
  const emoji = pill.querySelector<HTMLElement>('[data-slot=reaction-group-emoji]')
  const transform = emoji ? getComputedStyle(emoji).transform : 'none'
  return transform === 'none' ? 1 : new DOMMatrixReadOnly(transform).a
}

/**
 * Every press that turns a reaction on pops its emoji, the ones there from the
 * start included, and one picked from the panel pops as it joins. The play
 * turns 🎉 on, off and on again, then picks 🚀, and checks each one pops and
 * settles back to its size.
 */
export const PopsEachTime: Story = {
  name: 'Pops each time',
  render: (args) => <ReactionGroup {...args} defaultValue={REACTIONS} />,
  play: async ({ canvasElement }) => {
    // Motion's features load lazily, and a press made before they land shows its end state (as it would on a slow first load).
    await preloadMotionFeatures('max')
    const canvas = within(canvasElement)
    const pops = async (pill: Element) => {
      await waitFor(() => expect(scaleOf(pill)).toBeGreaterThan(1.1), { interval: 16 })
      await waitFor(() => expect(scaleOf(pill)).toBe(1), { timeout: 3000 })
    }
    const hooray = canvas.getByRole('button', { name: /^Hooray/ })
    await userEvent.click(hooray)
    await pops(hooray)
    await userEvent.click(hooray)
    await userEvent.click(hooray)
    await pops(hooray)
    await userEvent.click(canvas.getByRole('button', { name: 'Add reaction' }))
    const panel = await within(document.body).findByRole('dialog', { name: 'Add reaction' })
    await userEvent.click(within(panel).getByRole('button', { name: 'Rocket' }))
    await pops(await canvas.findByRole('button', { name: /^Rocket/ }))
  },
}

const MORE = [
  { emoji: '🙌', label: 'Raised hands' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💯', label: 'Hundred points' },
  { emoji: '✅', label: 'Done' },
  { emoji: '🙏', label: 'Thanks' },
  { emoji: '🤔', label: 'Thinking' },
  { emoji: '😂', label: 'Tears of joy' },
  { emoji: '👏', label: 'Clapping' },
]

/** `renderPicker` puts your app's own emoji picker under the choices; it calls `pick` with the emoji and its name. */
export const YourOwnPicker: Story = {
  name: 'Your own picker',
  render: (args) => (
    <ReactionGroup
      {...args}
      defaultValue={REACTIONS}
      renderPicker={(pick) => (
        <div className="flex flex-col gap-1 px-1 pb-1">
          <span className="text-ui-xs font-medium text-fg-subtle">More</span>
          <div className="flex flex-wrap gap-0.5">
            {MORE.map((choice) => (
              <button
                key={choice.emoji}
                type="button"
                aria-label={choice.label}
                title={choice.label}
                onClick={() => pick(choice.emoji, choice.label)}
                className="size-8 rounded-md text-ui-lg hover:bg-hover focus-ring"
              >
                {choice.emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    />
  ),
}

/** `disabled`: the reactions show and still name who reacted, but can't be changed, and there's no add button. */
export const Disabled: Story = {
  render: (args) => <ReactionGroup {...args} disabled defaultValue={REACTIONS} />,
}

/** Reduced motion: counts change in place, with no pop, glide or shake, and the reason appears at once. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <ReactionGroup
        {...args}
        defaultValue={REACTIONS}
        onReact={async (emoji) => {
          await wait(500)
          if (emoji === '👀') throw new Error('offline')
        }}
      />
    </YoujProvider>
  ),
}

const TWELVE = ['👍', '👎', '😄', '🎉', '😕', '❤️', '🚀', '👀', '🙌', '🔥', '✅', '🙏'].map((emoji, i) => ({ emoji, label: `Choice ${i + 1}` }))

/**
 * More choices than a row holds wrap at eight, and the arrow keys move
 * through them as they sit: across, and a row up or down. The play opens the
 * panel and checks it.
 */
export const ChoicesWrap: Story = {
  name: 'Choices wrap',
  render: (args) => <ReactionGroup {...args} choices={TWELVE} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Add reaction' }))
    const panel = await within(document.body).findByRole('dialog', { name: 'Add reaction' })
    const choice = (n: number) => within(panel).getByRole('button', { name: `Choice ${n}` })
    await waitFor(() => expect(choice(1)).toHaveFocus())
    // Eight to a row: the ninth starts the second.
    expect(choice(9).offsetTop).toBeGreaterThan(choice(8).offsetTop)
    await userEvent.keyboard('{ArrowDown}')
    expect(choice(9)).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}{ArrowUp}')
    expect(choice(2)).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(choice(12)).toHaveFocus()
    await userEvent.keyboard('{Escape}')
  },
}
