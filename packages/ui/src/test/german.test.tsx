import { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Calendar } from '../components/ui/calendar'
import { DataTablePagination } from '../components/ui/data-table'

/* The German pack on real components: one provider prop translates them. */

function German({ children }: { children: React.ReactNode }) {
  return (
    <YoujProvider locale="de-DE" labels={de} reducedMotion="always">
      {children}
    </YoujProvider>
  )
}

function Pages() {
  const [page, setPage] = useState(0)
  return <DataTablePagination pageIndex={page} pageSize={10} pageCount={124} rowCount={1234} onPageChange={setPage} onPageSizeChange={() => {}} />
}

test('The data table pagination speaks German, with German number formatting', async () => {
  const user = userEvent.setup()
  render(
    <German>
      <Pages />
    </German>,
  )
  const footer = document.querySelector('[data-slot=data-table-pagination]') as HTMLElement
  expect(footer).toHaveTextContent('1–10 von 1.234 Zeilen')
  expect(footer).toHaveTextContent('Zeilen pro Seite')
  expect(within(footer).getByRole('button', { name: 'Vorherige Seite' })).toHaveAttribute('aria-disabled', 'true')
  await user.click(within(footer).getByRole('button', { name: 'Nächste Seite' }))
  expect(footer).toHaveTextContent('11–20 von 1.234 Zeilen')
})

test('Dialog’s close button is named in German', async () => {
  const user = userEvent.setup()
  render(
    <German>
      <Dialog>
        <DialogTrigger>Öffnen</DialogTrigger>
        <DialogContent>
          <DialogTitle>Projekt umbenennen</DialogTitle>
        </DialogContent>
      </Dialog>
    </German>,
  )
  await user.click(screen.getByRole('button', { name: 'Öffnen' }))
  expect(await screen.findByRole('button', { name: 'Schließen' })).toBeInTheDocument()
})

test('Calendar names its month buttons and days in German', () => {
  render(
    <German>
      <Calendar mode="single" defaultMonth={new Date(2026, 8, 1)} selected={new Date(2026, 8, 15)} />
    </German>,
  )
  expect(screen.getByRole('button', { name: 'Zum nächsten Monat' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Zum vorherigen Monat' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /15.*ausgewählt$/ })).toBeInTheDocument()
})
