'use client'

import { useId, useState } from 'react'
import {
  AsyncButton,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldLabel,
  Rating,
  Textarea,
} from '@youj/react'

const WORDS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

export default function RatingDemo() {
  const [rating, setRating] = useState(0)
  const [preview, setPreview] = useState<number | null>(null)
  const shown = preview ?? rating
  const labelId = useId()

  return (
    <Card className="w-full max-w-[380px]">
      <CardHeader>
        <CardTitle>How was your stay?</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field>
          <FieldLabel id={labelId}>Overall</FieldLabel>
          <div className="flex items-center gap-3">
            <Rating
              aria-labelledby={labelId}
              value={rating}
              onValueChange={setRating}
              onPreviewChange={setPreview}
              allowHalf
              size="lg"
            />
            {/* What a click would set while the pointer hovers, then what's set. */}
            <span aria-hidden className={`text-ui tabular-nums transition-colors yj-duration-fast ease-standard ${preview === null ? 'text-fg' : 'text-fg-muted'}`}>
              {shown ? (
                <>
                  {shown} <span className="text-fg-subtle">of 5</span> · {WORDS[Math.ceil(shown)]}
                </>
              ) : (
                <span className="text-fg-subtle">Tap to rate</span>
              )}
            </span>
          </div>
        </Field>
        <Field>
          <FieldLabel>Anything to add?</FieldLabel>
          <Textarea placeholder="The view, the breakfast, the bed…" />
          <FieldDescription>Reviews are public and show your first name.</FieldDescription>
        </Field>
      </CardContent>
      <CardFooter className="justify-end">
        <AsyncButton disabled={!rating} onAction={() => new Promise((resolve) => setTimeout(resolve, 800))} successLabel="Thanks!">
          Post review
        </AsyncButton>
      </CardFooter>
    </Card>
  )
}
