import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowDownIcon, ArrowUpIcon, CornerDownLeftIcon } from '@youj/icons'
import { Kbd, KbdGroup } from './kbd'

const meta: Meta<typeof Kbd> = {
  title: 'UI/Primitives/Kbd',
  component: Kbd,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A keycap: a recessed tint with a hairline and a 1px bottom edge for depth, in 11px medium type on a 20px square minimum. Combinations are nested <kbd> elements (KbdGroup), which is how HTML spells them.',
      },
    },
  },
  args: { children: 'K' },
}
export default meta
type Story = StoryObj<typeof Kbd>

const shortcuts = [
  { label: 'Command menu', keys: ['⌘', 'K'] },
  { label: 'New issue', keys: ['C'] },
  { label: 'Search in view', keys: ['/'] },
  { label: 'Toggle sidebar', keys: ['⌘', '['] },
  { label: 'Go to inbox', keys: ['G', 'I'], sequence: true },
]

/** A shortcuts sheet, and the footer of a command menu. */
export const Hero: Story = {
  render: () => (
    <div className="w-full max-w-[380px] overflow-hidden rounded-xl border border-line bg-surface">
      <ul className="divide-y divide-line">
        {shortcuts.map((s) => (
          <li key={s.label} className="flex items-center justify-between px-4 py-2.5 text-ui text-fg">
            {s.label}
            <KbdGroup>
              {s.keys.map((k, i) => (
                <span key={k} className="inline-flex items-center gap-1">
                  {s.sequence && i > 0 && <span className="text-ui-xs text-fg-muted">then</span>}
                  <Kbd>{k}</Kbd>
                </span>
              ))}
            </KbdGroup>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-4 border-t border-line bg-canvas px-4 py-2 text-ui-sm text-fg-muted">
        <span className="inline-flex items-center gap-1.5">
          <KbdGroup>
            <Kbd>
              <ArrowUpIcon trigger="none" />
            </Kbd>
            <Kbd>
              <ArrowDownIcon trigger="none" />
            </Kbd>
          </KbdGroup>
          navigate
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Kbd>
            <CornerDownLeftIcon trigger="none" />
          </Kbd>
          open
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Kbd>esc</Kbd>
          close
        </span>
      </div>
    </div>
  ),
}

export const Playground: Story = {}
