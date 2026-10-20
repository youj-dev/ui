import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import { ItemPager, type ItemPagerProps } from './item-pager'

function Stepper({ start = 4, total = 48, ...props }: Partial<ItemPagerProps> & { start?: number }) {
  const [index, setIndex] = useState(start)
  return <ItemPager index={index} total={total} onIndexChange={setIndex} {...props} />
}

const next = () => screen.getByRole('button', { name: 'Next record' })
const previous = () => screen.getByRole('button', { name: 'Previous record' })

describe('ItemPager', () => {
  test('is a named group with its position, next and previous buttons and their shortcuts', () => {
    render(<Stepper />)
    expect(screen.getByRole('group', { name: 'Records' })).toBeInTheDocument()
    expect(screen.getByText('5 of 48')).toHaveAttribute('aria-live', 'polite')
    expect(next()).toHaveAttribute('aria-keyshortcuts', 'J')
    expect(previous()).toHaveAttribute('aria-keyshortcuts', 'K')
  })

  test('the buttons step down and up the list', async () => {
    const user = userEvent.setup()
    render(<Stepper />)
    await user.click(next())
    expect(screen.getByText('6 of 48')).toBeInTheDocument()
    await user.click(previous())
    await user.click(previous())
    expect(screen.getByText('4 of 48')).toBeInTheDocument()
  })

  test('J, K and the arrows step while focus is in it', async () => {
    const user = userEvent.setup()
    render(<Stepper />)
    next().focus()
    await user.keyboard('j')
    expect(screen.getByText('6 of 48')).toBeInTheDocument()
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(screen.getByText('8 of 48')).toBeInTheDocument()
    await user.keyboard('k{ArrowUp}')
    expect(screen.getByText('6 of 48')).toBeInTheDocument()
  })

  test('at an end its button disables but keeps focus', async () => {
    const user = userEvent.setup()
    render(<Stepper start={46} />)
    next().focus()
    await user.keyboard('j')
    expect(screen.getByText('48 of 48')).toBeInTheDocument()
    expect(next()).toHaveAttribute('aria-disabled', 'true')
    expect(next()).toHaveFocus()
    await user.keyboard('j')
    expect(screen.getByText('48 of 48')).toBeInTheDocument()
  })

  test('shortcuts="global" steps on J and K anywhere but a field, once per key', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Stepper shortcuts="global" />
        <input aria-label="Search" />
      </>,
    )
    await user.keyboard('j')
    expect(screen.getByText('6 of 48')).toBeInTheDocument()
    next().focus()
    await user.keyboard('j')
    expect(screen.getByText('7 of 48')).toBeInTheDocument()
    await user.click(screen.getByRole('textbox', { name: 'Search' }))
    await user.keyboard('jk')
    expect(screen.getByText('7 of 48')).toBeInTheDocument()
  })

  test('the default ignores keys outside it, and none ignores them everywhere', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Stepper />)
    await user.keyboard('j')
    expect(screen.getByText('5 of 48')).toBeInTheDocument()
    unmount()
    render(<Stepper shortcuts="none" />)
    next().focus()
    await user.keyboard('j')
    expect(screen.getByText('5 of 48')).toBeInTheDocument()
    expect(next()).not.toHaveAttribute('aria-keyshortcuts')
  })

  test('formats the position in the locale and speaks the provider labels', () => {
    render(
      <YoujProvider labels={{ recordOf: (position, total) => `${position} von ${total}`, nextRecord: 'Nächster Datensatz' }}>
        <Stepper start={1233} total={4812} locale="de-DE" />
      </YoujProvider>,
    )
    expect(screen.getByText('1.234 von 4.812')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nächster Datensatz' })).toBeInTheDocument()
  })
})
