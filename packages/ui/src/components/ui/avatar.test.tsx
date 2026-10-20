import { render, screen } from '@testing-library/react'
import { Avatar, AvatarFallback, AvatarImage, avatarColor } from './avatar'

describe('Avatar', () => {
  test('shows the fallback until an image has loaded', () => {
    render(
      <Avatar>
        <AvatarImage src="/ada.png" alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    )
    // jsdom never loads images, which is exactly the "not loaded yet" case.
    expect(screen.getByText('AL')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Ada Lovelace' })).not.toBeInTheDocument()
  })

  test('colorSeed tints the fallback with the same chart colour for the same seed', () => {
    render(
      <>
        <Avatar>
          <AvatarFallback colorSeed="mira@example.com">MK</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback colorSeed="mira@example.com">MK</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>JO</AvatarFallback>
        </Avatar>
      </>,
    )
    const [a, b] = screen.getAllByText('MK')
    const color = avatarColor('mira@example.com')
    expect(color).toMatch(/^chart-[1-5]$/)
    expect(a!.className).toContain(`[--ui--avatar-color:var(--color-${color})]`)
    expect(b!.className).toBe(a!.className)
    expect(screen.getByText('JO').className).not.toContain('--ui--avatar-color')
  })

  test('different seeds spread across the palette', () => {
    const colors = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].map(avatarColor))
    expect(colors.size).toBeGreaterThan(2)
  })
})
