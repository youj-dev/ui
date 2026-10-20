import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import { YoujProvider, type YoujLabels } from '@youj/core'
import { Banner } from './banner'
import { Button } from './button'
import { Carousel, CarouselContent, CarouselDots, CarouselItem, CarouselNext, CarouselPrevious } from './carousel'
import { TasksTable } from './data-table/data-table.fixtures'
import { Dialog, DialogContent, DialogTitle } from './dialog'
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from './pagination'

/* The labels layer end to end: a German provider renames the built-in copy,
 * a component's own prop still wins, and without a provider it stays English. */
const de: Partial<YoujLabels> = {
  close: 'Schließen',
  loading: 'Wird geladen',
  pagination: 'Seitennavigation',
  previous: 'Zurück',
  next: 'Weiter',
  goToPreviousPage: 'Zur vorherigen Seite',
  goToNextPage: 'Zur nächsten Seite',
  carousel: 'Karussell',
  previousSlide: 'Vorherige Folie',
  nextSlide: 'Nächste Folie',
  chooseSlide: 'Folie wählen',
  slideNumber: (n) => `Folie ${n}`,
  rowsPerPage: 'Zeilen pro Seite',
  columns: 'Spalten',
  nextPage: 'Nächste Seite',
  pageOf: (page, total) => `Seite ${page} von ${total}`,
}

const German = ({ children }: { children: ReactNode }) => <YoujProvider labels={de}>{children}</YoujProvider>

function Pages() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#1" />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#3" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function Slides() {
  return (
    <Carousel aria-label="Fotos">
      <CarouselContent>
        <CarouselItem>Eins</CarouselItem>
        <CarouselItem>Zwei</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
      <CarouselDots />
    </Carousel>
  )
}

function People() {
  return <TasksTable />
}

const footer = () => document.querySelector('[data-slot=data-table-pagination]') as HTMLElement

describe('built-in labels', () => {
  it('updates a scoped Button label through nested providers and restores English', () => {
    const button = (loading?: string) => (
      <YoujProvider labels={loading ? { loading } : undefined}>
        <YoujProvider labels={{ close: 'Schließen' }}>
          <Button loading>Save</Button>
        </YoujProvider>
      </YoujProvider>
    )
    const { rerender } = render(button('Wird geladen'))
    expect(screen.getByRole('status')).toHaveTextContent('Wird geladen')
    rerender(button('Chargement'))
    expect(screen.getByRole('status')).toHaveTextContent('Chargement')
    rerender(button())
    expect(screen.getByRole('status')).toHaveTextContent('Loading')
  })

  it('names the dialog close button from the provider', () => {
    render(
      <German>
        <Dialog open>
          <DialogContent>
            <DialogTitle>Einstellungen</DialogTitle>
          </DialogContent>
        </Dialog>
      </German>,
    )
    expect(screen.getByRole('button', { name: 'Schließen' })).toBeInTheDocument()
  })

  it('announces a loading button in the provider language, unless loadingLabel is set', () => {
    const { rerender } = render(
      <German>
        <Button loading>Speichern</Button>
      </German>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Wird geladen')
    rerender(
      <German>
        <Button loading loadingLabel="Speichert">
          Speichern
        </Button>
      </German>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Speichert')
  })

  it('translates pagination', () => {
    render(
      <German>
        <Pages />
      </German>,
    )
    expect(screen.getByRole('navigation', { name: 'Seitennavigation' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Zur vorherigen Seite' })).toHaveTextContent('Zurück')
    expect(screen.getByRole('link', { name: 'Zur nächsten Seite' })).toHaveTextContent('Weiter')
  })

  it('translates the carousel controls', () => {
    render(
      <German>
        <Slides />
      </German>,
    )
    expect(screen.getByRole('region', { name: 'Fotos' })).toHaveAttribute('aria-roledescription', 'Karussell')
    expect(screen.getByRole('button', { name: 'Vorherige Folie' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nächste Folie' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Folie wählen' })).toBeInTheDocument()
  })

  it('translates the data table kit’s toolbar and pagination', () => {
    render(
      <YoujProvider labels={de} reducedMotion="always">
        <People />
      </YoujProvider>,
    )
    expect(screen.getByRole('button', { name: /Spalten/ })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Zeilen pro Seite' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nächste Seite' })).toBeInTheDocument()
    expect(footer()).toHaveTextContent('Seite 1 von 3')
  })

  it('merges nested providers', () => {
    render(
      <German>
        <YoujProvider labels={{ next: 'Suivant' }}>
          <Pages />
        </YoujProvider>
      </German>,
    )
    expect(screen.getByRole('link', { name: 'Zur nächsten Seite' })).toHaveTextContent('Suivant')
    expect(screen.getByRole('link', { name: 'Zur vorherigen Seite' })).toHaveTextContent('Zurück')
  })

  it('stays English without a provider', () => {
    render(
      <>
        <Pages />
        <Button loading>Save</Button>
        <Slides />
        <People />
      </>,
    )
    // Pagination and the DataTable footer share the key.
    expect(screen.getAllByRole('navigation', { name: 'Pagination' })).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Go to previous page' })).toHaveTextContent('Previous')
    expect(screen.getByRole('link', { name: 'Go to next page' })).toHaveTextContent('Next')
    expect(within(screen.getByRole('button', { name: /Save/ })).getByRole('status')).toHaveTextContent('Loading')
    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Choose slide' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Rows per page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument()
    expect(footer()).toHaveTextContent('Page 1 of 3')
  })

  test('a German provider names the banner and its dismiss button', () => {
    render(
      <YoujProvider labels={{ announcement: 'Hinweis', dismissAnnouncement: 'Hinweis schließen' }}>
        <Banner onOpenChange={() => {}}>Neu: Speicherplatz verdoppelt</Banner>
      </YoujProvider>,
    )
    expect(screen.getByRole('region', { name: 'Hinweis' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hinweis schließen' })).toBeInTheDocument()
  })
})
