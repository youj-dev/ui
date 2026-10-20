import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StealthForm, StealthFormFromUrl } from './stealth-form'
import { StealthScreen } from './stealth-screen'
import { PHRASES } from './stealth-phrases'

const codeButton = () => screen.getByRole('button', { name: 'Early access code' })
const codeField = () => screen.findByLabelText(/have an early access code/i)

describe('StealthScreen', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('shows the wordmark, the first phrase and the countdown to the Worker’s launch moment, with the code entry closed', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ launchAt: '2099-01-01T00:00:00.000Z' })))
    render(
      <StealthScreen>
        <StealthForm next="/" />
      </StealthScreen>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Youj is coming soon' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'youj' })).toBeInTheDocument()
    expect(screen.getByText(PHRASES[0])).toBeInTheDocument()
    expect(await screen.findByRole('timer')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith('/launch.json', { cache: 'no-store' })
    expect(codeButton()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('form', { name: 'Early access' })).not.toBeInTheDocument()
  })

  it('shows no countdown when the Worker has no launch moment', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ launchAt: null })))
    render(<StealthScreen>{null}</StealthScreen>)
    await act(async () => {})
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
  })

  it('takes any of its backdrops', () => {
    const { container, rerender } = render(<StealthScreen look={{ backdrop: 'field', mode: 'dark' }}>{null}</StealthScreen>)
    expect(container.querySelector('[data-backdrop="field"]')).not.toBeNull()
    rerender(<StealthScreen look={{ backdrop: 'aurora', mode: 'site' }}>{null}</StealthScreen>)
    expect(container.querySelector('[data-backdrop="aurora"]')).not.toBeNull()
    expect(container.querySelector('main')).not.toHaveAttribute('data-theme')
    rerender(<StealthScreen look={{ backdrop: 'both', mode: 'dark' }}>{null}</StealthScreen>)
    expect(container.querySelector('[data-backdrop="both"]')).not.toBeNull()
    expect(container.querySelector('main')).toHaveAttribute('data-theme', 'dark')
  })
})

describe('the phrases', () => {
  it('are short, distinct and end in an ellipsis', () => {
    expect(new Set(PHRASES).size).toBe(PHRASES.length)
    for (const phrase of PHRASES) {
      expect(phrase.length).toBeLessThanOrEqual(32)
      expect(phrase).toMatch(/^[A-Z][^…]*…$/)
    }
  })
})

describe('StealthForm', () => {
  // The form is a chunk of its own; warm it so the tests time the component, not the first import.
  beforeAll(() => import('./stealth-code-panel'), 20_000)

  it('opens on the button, focuses the field, and posts the code and `next` to the login route', async () => {
    const user = userEvent.setup()
    render(<StealthForm next="/docs/button" />)
    await user.click(codeButton())
    expect(codeButton()).toHaveAttribute('aria-expanded', 'true')
    const form = await screen.findByRole('form', { name: 'Early access' })
    expect(form).toHaveAttribute('method', 'post')
    expect(form).toHaveAttribute('action', '/stealth/login')
    const field = await codeField()
    expect(field).toHaveFocus()
    expect(field).toHaveAttribute('name', 'password')
    expect(form.querySelector('input[type="hidden"][name="next"]')).toHaveValue('/docs/button')
    expect(screen.getByRole('button', { name: /get in/i })).toHaveAttribute('type', 'submit')
  })

  it('closes on Escape and gives focus back to the button', async () => {
    const user = userEvent.setup()
    render(<StealthForm next="/" />)
    await user.click(codeButton())
    await codeField()
    await user.keyboard('{Escape}')
    expect(codeButton()).toHaveAttribute('aria-expanded', 'false')
    expect(codeButton()).toHaveFocus()
    expect(screen.queryByRole('form', { name: 'Early access' })).not.toBeInTheDocument()
  })

  it('closes on a click elsewhere', async () => {
    const user = userEvent.setup()
    render(
      <>
        <p>Elsewhere</p>
        <StealthForm next="/" />
      </>,
    )
    await user.click(codeButton())
    fireEvent.pointerDown(screen.getByText('Elsewhere'))
    expect(codeButton()).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens by itself after a wrong code, with the message', async () => {
    render(<StealthForm next="/" error="wrong" />)
    expect(codeButton()).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByText('That code didn’t work.')).toBeInTheDocument()
    const field = await codeField()
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveFocus()
  })

  it('says when there were too many tries', async () => {
    render(<StealthForm next="/" error="rate" />)
    expect(await screen.findByText('Too many tries. Try again in 15 minutes.')).toBeInTheDocument()
  })

  it('on the static page, reads `next` and `error` from the address bar (only a same-site `next`)', async () => {
    window.history.replaceState(null, '', '/stealth?error=wrong&next=%2F%2Fevil.example')
    await act(async () => {
      render(<StealthFormFromUrl />)
    })
    expect(codeButton()).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByText('That code didn’t work.')).toBeInTheDocument()
    expect(document.querySelector('input[name="next"]')).toHaveValue('/')
    window.history.replaceState(null, '', '/')
  })
})
