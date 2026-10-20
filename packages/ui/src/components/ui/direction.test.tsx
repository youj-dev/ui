import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeScope, YoujProvider, type Direction } from '@youj/core'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from './dropdown-menu'
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from './drawer'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { RadioGroup, RadioGroupItem } from './radio-group'
import { Slider } from './slider'
import { Tabs, TabsList, TabsTrigger } from './tabs'

/* The provider's `dir` is the one direction source: @youj/react hands it to
 * Base UI, so keyboard, placement and portals mirror without a Base UI
 * DirectionProvider of the app's own. */

const inDirection = (dir: Direction, ui: ReactNode) => render(<YoujProvider dir={dir}>{ui}</YoujProvider>)

const Steps = () => (
  <Tabs defaultValue="plan">
    <TabsList>
      <TabsTrigger value="plan">Plan</TabsTrigger>
      <TabsTrigger value="build">Build</TabsTrigger>
      <TabsTrigger value="ship">Ship</TabsTrigger>
    </TabsList>
  </Tabs>
)

describe('direction reaches Base UI', () => {
  test.each<[Direction, string]>([
    ['ltr', 'ArrowRight'],
    ['rtl', 'ArrowLeft'],
  ])('tabs (%s): %s moves to the next tab, the one the eye reads next', async (dir, next) => {
    const user = userEvent.setup()
    inDirection(dir, <Steps />)
    await user.click(screen.getByRole('tab', { name: 'Plan' }))
    await user.keyboard(`{${next}}`)
    expect(screen.getByRole('tab', { name: 'Build' })).toHaveFocus()
    expect(screen.getByRole('tab', { name: 'Build' })).toHaveAttribute('aria-selected', 'true')
  })

  test('a ThemeScope dir mirrors its part of an LTR page', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider>
        <ThemeScope dir="rtl">
          <Steps />
        </ThemeScope>
      </YoujProvider>,
    )
    await user.click(screen.getByRole('tab', { name: 'Plan' }))
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Build' })).toHaveFocus()
  })

  test.each<[Direction, string, string]>([
    ['ltr', 'ArrowRight', 'ArrowLeft'],
    ['rtl', 'ArrowLeft', 'ArrowRight'],
  ])('radio group (%s): %s moves forward, %s back', async (dir, forward, back) => {
    const user = userEvent.setup()
    inDirection(
      dir,
      <RadioGroup defaultValue="a" aria-label="Plan">
        <RadioGroupItem value="a" aria-label="Hobby" />
        <RadioGroupItem value="b" aria-label="Pro" />
        <RadioGroupItem value="c" aria-label="Team" />
      </RadioGroup>,
    )
    await user.click(screen.getByRole('radio', { name: 'Hobby' }))
    await user.keyboard(`{${forward}}`)
    expect(screen.getByRole('radio', { name: 'Pro' })).toHaveFocus()
    await user.keyboard(`{${back}}`)
    expect(screen.getByRole('radio', { name: 'Hobby' })).toHaveFocus()
  })

  test.each<[Direction, string, string]>([
    ['ltr', '51', '49'],
    ['rtl', '49', '51'],
  ])('slider (%s): ArrowRight moves the thumb right, so its value goes to %s (ArrowLeft: %s)', async (dir, right, left) => {
    const user = userEvent.setup()
    inDirection(dir, <Slider defaultValue={50} aria-label="Volume" />)
    // jsdom can't measure the thumb, so Base UI keeps it hidden from the accessibility tree.
    const thumb = screen.getByRole('slider', { hidden: true })
    thumb.focus()
    await user.keyboard('{ArrowRight}')
    expect(thumb).toHaveAttribute('aria-valuenow', right)
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(thumb).toHaveAttribute('aria-valuenow', left)
  })

  test.each<[Direction, string, string]>([
    ['ltr', 'ArrowRight', 'right'],
    ['rtl', 'ArrowLeft', 'left'],
  ])('submenu (%s): %s opens it, on the %s of its row', async (dir, open, side) => {
    const user = userEvent.setup()
    inDirection(
      dir,
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Design</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    const row = await screen.findByRole('menuitem', { name: 'Move to' })
    row.focus()
    await user.keyboard(`{${open}}`)
    const item = await screen.findByRole('menuitem', { name: 'Design' })
    // inline-end: placed by the sideOffset (8px) past the row's end, which is its left edge under RTL. jsdom has no layout, so the row is 0px wide.
    await waitFor(() => expect(item.closest<HTMLElement>('[style*="--anchor-width"]')?.style.transform).toBe(side === 'right' ? 'translate(8px, 0px)' : 'translate(-8px, 0px)'))
  })

  test('overlays carry the direction onto their portal', async () => {
    const user = userEvent.setup()
    inDirection(
      'rtl',
      <Popover>
        <PopoverTrigger>Filters</PopoverTrigger>
        <PopoverContent>Only open issues</PopoverContent>
      </Popover>,
    )
    await user.click(screen.getByRole('button', { name: 'Filters' }))
    const popup = await screen.findByText('Only open issues')
    expect(popup.closest('[dir]')).toHaveAttribute('dir', 'rtl')
    expect(document.body.contains(popup.closest('[dir]'))).toBe(true)
  })

  test.each<[Direction, 'start' | 'end', string]>([
    ['ltr', 'start', 'left'],
    ['rtl', 'start', 'right'],
    ['rtl', 'end', 'left'],
  ])('a drawer (%s) set to %s sits on the %s edge', async (dir, edge, physical) => {
    const user = userEvent.setup()
    inDirection(
      dir,
      <Drawer swipeDirection={edge}>
        <DrawerTrigger>Filters</DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Filters</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    )
    await user.click(screen.getByRole('button', { name: 'Filters' }))
    const drawer = await screen.findByRole('dialog')
    expect(drawer).toHaveAttribute('data-swipe-direction', physical)
    expect(drawer).toHaveClass(`yj-sheet-${physical}`)
  })
})
