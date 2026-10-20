import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BottomTabBar, BottomTabBarItem } from './bottom-tab-bar'

function Bar() {
  const [current, setCurrent] = useState('home')
  const tab = (id: string, label: string, badge?: number | boolean) => (
    <BottomTabBarItem
      href={`#${id}`}
      icon={<svg />}
      label={label}
      badge={badge}
      active={current === id}
      onClick={(event) => {
        event.preventDefault()
        setCurrent(id)
      }}
    />
  )
  return (
    <BottomTabBar>
      {tab('home', 'Home')}
      {tab('inbox', 'Inbox', 3)}
      {tab('activity', 'Activity', true)}
      {tab('profile', 'Profile', 120)}
    </BottomTabBar>
  )
}

describe('BottomTabBar', () => {
  test('a named nav of links; the current one is aria-current="page"', () => {
    render(<Bar />)
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(nav.querySelectorAll('li')).toHaveLength(4)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Inbox, 3 new' })).not.toHaveAttribute('aria-current')
  })

  test('badges are read after the label; the visible count caps at 99+', () => {
    render(<Bar />)
    expect(screen.getByRole('link', { name: 'Activity, new' })).toBeInTheDocument()
    const profile = screen.getByRole('link', { name: 'Profile, 120 new' })
    expect(profile.querySelector('[data-slot=bottom-tab-bar-badge]')).toHaveTextContent('99+')
    expect(profile.querySelector('[data-slot=bottom-tab-bar-badge]')).toHaveAttribute('aria-hidden')
  })

  test('keyboard: Tab reaches every tab in order and Enter follows it', async () => {
    const user = userEvent.setup()
    render(<Bar />)
    await user.tab()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: /Inbox/ })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('link', { name: /Inbox/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })

  test('the pill follows the current tab', () => {
    render(<Bar />)
    expect(document.querySelector('[data-slot=bottom-tab-bar-indicator]')).toBeInTheDocument()
  })
})
