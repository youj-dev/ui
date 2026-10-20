import { fireEvent, render, screen } from '@testing-library/react'
import { InboxIcon } from '@youj/icons/components/youj/icons/inbox'
import { PlusIcon } from '@youj/icons/components/youj/icons/plus'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Button } from './button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './empty'

function Inbox() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon />
        </EmptyMedia>
        <EmptyTitle>You're all caught up</EmptyTitle>
        <EmptyDescription>New mentions will land here.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>
          <PlusIcon />
          New issue
        </Button>
      </EmptyContent>
    </Empty>
  )
}

const icon = (name: string) => document.querySelector(`[data-icon=${name}]`)!
const header = () => document.querySelector('[data-slot=empty-header]')!

describe('EmptyState', () => {
  test('title, description and actions; the art is decorative', () => {
    render(<Inbox />)
    expect(screen.getByText("You're all caught up")).toBeInTheDocument()
    expect(screen.getByText('New mentions will land here.').tagName).toBe('P')
    expect(screen.getByRole('button', { name: 'New issue' })).toBeInTheDocument()
    const media = document.querySelector('[data-slot=empty-icon]')!
    for (const plate of media.querySelectorAll(':scope > span[aria-hidden]')) expect(plate).toHaveAttribute('aria-hidden', 'true')
    expect(icon('inbox')).toHaveAttribute('aria-hidden', 'true')
  })

  test('hovering the header plays the youj icon inside it, and only that one', () => {
    render(<Inbox />)
    expect(header()).toHaveAttribute('data-yj-trigger')
    expect(icon('inbox')).toHaveAttribute('data-state', 'rest')
    fireEvent.pointerEnter(header())
    expect(icon('inbox')).toHaveAttribute('data-state', 'active')
    // The action's icon belongs to its button, not the header.
    expect(icon('plus')).toHaveAttribute('data-state', 'rest')
    fireEvent.pointerLeave(header())
    expect(icon('inbox')).toHaveAttribute('data-state', 'rest')
  })

  test('under reduced motion nothing plays and the plates hold still', () => {
    render(
      <YoujProvider reducedMotion="always">
        <Inbox />
      </YoujProvider>,
    )
    expect(document.querySelector('[data-slot=empty-icon]')).toHaveAttribute('data-reduced-motion')
    fireEvent.pointerEnter(header())
    expect(icon('inbox')).toHaveAttribute('data-state', 'rest')
  })

  test('the default media variant is a plain slot', () => {
    render(
      <EmptyMedia>
        <img alt="" src="data:," />
      </EmptyMedia>,
    )
    const media = document.querySelector('[data-slot=empty-icon]')!
    expect(media).toHaveAttribute('data-variant', 'default')
    expect(media.querySelectorAll('span[aria-hidden]')).toHaveLength(0)
  })
})
