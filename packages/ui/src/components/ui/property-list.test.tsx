import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  PropertyAge,
  PropertyDate,
  PropertyList,
  PropertyListItem,
  PropertyMoney,
  PropertyPerson,
  PropertyProgress,
  PropertyStatus,
  PropertyTag,
  PropertyText,
} from './property-list'

const NOW = Date.UTC(2026, 9, 5, 9, 30)
const DAY = 86_400_000

describe('PropertyList', () => {
  test('is a description list: each row a term and its value', () => {
    render(
      <PropertyList>
        <PropertyListItem icon={<svg data-testid="icon" />} label="Owner">
          <PropertyPerson name="Noor Haddad" />
        </PropertyListItem>
        <PropertyListItem label="Deal">
          <PropertyText>Inference platform expansion</PropertyText>
        </PropertyListItem>
      </PropertyList>,
    )
    const list = document.querySelector('dl')!
    const terms = within(list).getAllByRole('term')
    const values = within(list).getAllByRole('definition')
    expect(terms.map((t) => t.textContent)).toEqual(['Owner', 'Deal'])
    // The avatar is decorative: its initials are drawn, so the value reads as the name.
    expect(values[0]).toHaveTextContent('Noor Haddad')
    expect(values[0]!.querySelector('[data-yj-initials]')).toHaveAttribute('data-yj-initials', 'NH')
    expect(values[1]).toHaveTextContent('Inference platform expansion')
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true')
  })

  test('rows stack below 20rem unless stack={false} keeps them side by side', () => {
    const { rerender } = render(
      <PropertyList>
        <PropertyListItem label="Owner">Noor</PropertyListItem>
      </PropertyList>,
    )
    const row = () => document.querySelector('[data-slot=property-list-item]')!
    expect(row().className).toContain('@max-xs:grid-cols-1')
    rerender(
      <PropertyList stack={false}>
        <PropertyListItem label="Owner">Noor</PropertyListItem>
      </PropertyList>,
    )
    expect(row().className).not.toContain('@max-xs:grid-cols-1')
  })

  test('a row with onEdit has an edit button named for its label', async () => {
    const user = userEvent.setup()
    const edit = vi.fn()
    render(
      <PropertyList>
        <PropertyListItem label="Stage" onEdit={edit}>
          <PropertyStatus tone="warning">Proposal</PropertyStatus>
        </PropertyListItem>
        <PropertyListItem label="Age">
          <PropertyAge since={NOW - 12 * DAY} now={NOW} />
        </PropertyListItem>
      </PropertyList>,
    )
    expect(screen.getAllByRole('button')).toHaveLength(1)
    await user.tab()
    expect(screen.getByRole('button', { name: 'Edit Stage' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(edit).toHaveBeenCalledTimes(1)
  })

  test('progress is a progressbar named by its row', () => {
    render(
      <PropertyList>
        <PropertyListItem label="Probability">
          <PropertyProgress value={62} />
        </PropertyListItem>
      </PropertyList>,
    )
    const bar = screen.getByRole('progressbar', { name: 'Probability' })
    expect(bar).toHaveAttribute('aria-valuenow', '62')
    expect(bar).toHaveTextContent('62%')
  })

  test('money, dates and ages are written in the locale', () => {
    render(
      <PropertyList>
        <PropertyListItem label="Value">
          <PropertyMoney value={324_000} />
        </PropertyListItem>
        <PropertyListItem label="Wert">
          <PropertyMoney value={48_250.5} currency="EUR" locale="de-DE" />
        </PropertyListItem>
        <PropertyListItem label="Closes">
          <PropertyDate value="2026-11-30T12:00:00.000Z" />
        </PropertyListItem>
        <PropertyListItem label="Age">
          <PropertyAge since={NOW - 12 * DAY} now={NOW} />
        </PropertyListItem>
        <PropertyListItem label="Older">
          <PropertyAge since={NOW - 95 * DAY} now={NOW} />
        </PropertyListItem>
      </PropertyList>,
    )
    expect(screen.getByText('$324,000')).toBeInTheDocument()
    expect(screen.getByText(/48\.250,50\s€/)).toBeInTheDocument()
    expect(screen.getByText('Nov 30, 2026')).toHaveAttribute('dateTime', '2026-11-30T12:00:00.000Z')
    expect(screen.getByText('12 days')).toBeInTheDocument()
    expect(screen.getByText('3 months')).toBeInTheDocument()
  })

  test('a tag is a quiet badge and a status keeps its label as the meaning', () => {
    render(
      <PropertyList>
        <PropertyListItem label="Industry">
          <PropertyTag>AI</PropertyTag>
        </PropertyListItem>
        <PropertyListItem label="Stage">
          <PropertyStatus tone="success">Won</PropertyStatus>
        </PropertyListItem>
      </PropertyList>,
    )
    expect(screen.getByText('AI')).toHaveAttribute('data-slot', 'property-tag')
    const status = screen.getByText('Won').parentElement!
    expect(status.querySelector('[aria-hidden]')).toHaveStyle({ '--status-tone': 'var(--color-success)' })
  })
})
