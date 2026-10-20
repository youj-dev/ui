'use client'

import { PlusIcon } from '@youj/icons'
import { Button } from '../../../../components/ui/button'
import { Carousel, CarouselContent, CarouselDots, CarouselItem } from '../../../../components/ui/carousel'
import { cn } from '../../../../lib/utils'
import { CARDS, type PaymentCard } from '../data'
import { Amount } from './amount'

function CardFace({ card, balance, hidden }: { card: PaymentCard; balance: number; hidden: boolean }) {
  const tone = {
    debit: 'bg-fg text-canvas',
    credit: 'border border-line bg-accent-subtle text-fg',
    vault: 'border border-line bg-band text-fg',
  }[card.kind]
  return (
    <div className={cn('flex aspect-[1.586] flex-col justify-between rounded-xl p-5', tone)}>
      <div className="flex items-start justify-between">
        <span className="text-ui font-medium">{card.name}</span>
        <span className="text-ui-sm font-semibold tracking-wide uppercase opacity-80">{card.kind === 'vault' ? 'Savings' : card.kind}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-ui-sm opacity-70">{card.kind === 'credit' ? 'Spent this cycle' : 'Balance'}</span>
        <Amount value={balance} hidden={hidden} className="text-2xl font-semibold tracking-tight" />
      </div>
      <div className="flex items-end justify-between font-mono text-ui-sm">
        <span aria-label={`Card ending ${card.last4}`}>•••• {card.last4}</span>
        <span className="opacity-70">{card.expires}</span>
        <span aria-hidden className="flex">
          <span className="size-5 rounded-full bg-current opacity-60" />
          <span className="-ms-2 size-5 rounded-full bg-current opacity-30" />
        </span>
      </div>
    </div>
  )
}

export function Cards({ balance, hidden }: { balance: number; hidden: boolean }) {
  return (
    <section aria-labelledby="kite-cards" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="kite-cards" className="text-ui-lg font-semibold text-fg">
          Cards
        </h2>
        <Button variant="ghost" size="sm">
          <PlusIcon size={16} /> New card
        </Button>
      </div>
      <Carousel opts={{ align: 'start' }} aria-label="Your cards">
        <CarouselContent>
          {CARDS.map((card) => (
            <CarouselItem key={card.id} className="basis-[86%] sm:basis-[62%] lg:basis-[70%] xl:basis-[58%]">
              <CardFace card={card} balance={card.id === 'everyday' ? balance : card.balance} hidden={hidden} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselDots className="mt-3" aria-label="Choose card" />
      </Carousel>
    </section>
  )
}
