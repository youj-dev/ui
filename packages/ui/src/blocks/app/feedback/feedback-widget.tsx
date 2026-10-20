'use client'

import { useState } from 'react'
import { MessageSparkleIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '../../../components/ui/popover'
import type { FeedbackEntry, FeedbackCopy } from './data'
import { FeedbackForm } from './feedback-form'

/* The floating "Feedback" button, pinned to the inline-end corner above the
 * page. It opens the form in a Popover that grows up out of the button (yj-pop
 * from its anchor); focus lands on the type switch, Escape closes it and focus
 * returns to the button. */

interface FeedbackWidgetProps {
  onSend: (feedback: FeedbackEntry) => Promise<unknown>
  defaultOpen?: boolean
  copy: FeedbackCopy
  product: string
}

function FeedbackWidget({ onSend, defaultOpen = false, copy, product }: FeedbackWidgetProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button size="lg" className="fixed end-5 bottom-5 z-40 shadow-lg" />}>
        <MessageSparkleIcon size={18} active={open || undefined} />
        {copy.widgetButton}
      </PopoverTrigger>
      <PopoverContent side="top" align="end" sideOffset={10} className="w-[min(25rem,calc(100vw-2rem))] gap-0 p-4">
        <FeedbackForm
          onSend={onSend}
          onClose={() => setOpen(false)}
          copy={copy}
          product={product}
          header={
            <PopoverHeader>
              <PopoverTitle>{copy.formTitle}</PopoverTitle>
              <PopoverDescription>{copy.widgetDescription(product)}</PopoverDescription>
            </PopoverHeader>
          }
        />
      </PopoverContent>
    </Popover>
  )
}

export { FeedbackWidget }
