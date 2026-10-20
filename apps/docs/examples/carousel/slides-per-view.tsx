'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@youj/react'
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@youj/react/carousel'

const PLANS = [
  { name: 'Starter', for: 'solo builders', price: 0 },
  { name: 'Team', for: 'small teams', price: 12 },
  { name: 'Growth', for: 'growing teams', price: 29 },
  { name: 'Scale', for: 'many teams', price: 59 },
  { name: 'Education', for: 'classrooms', price: 4 },
  { name: 'Non-profit', for: 'charities', price: 6 },
]

export default function CarouselSlidesPerView() {
  return (
    <div className="w-full max-w-xl px-12">
      {/* One card per view on phones, two from sm; each snap moves by a page. */}
      <Carousel opts={{ align: 'start', slidesToScroll: 'auto' }} aria-label="Plans">
        <CarouselContent>
          {PLANS.map((plan) => (
            <CarouselItem key={plan.name} className="sm:basis-1/2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>For {plan.for}.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-[22px] font-semibold text-fg tabular-nums">${plan.price}</p>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
        <CarouselDots className="mt-3" />
      </Carousel>
    </div>
  )
}
