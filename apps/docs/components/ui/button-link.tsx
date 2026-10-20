import type { ComponentProps } from 'react'
import Link from 'next/link'
import { buttonVariants } from '@youj/react/components/ui/button.variants'
import { cn } from '@/lib/cn'

type Variants = NonNullable<Parameters<typeof buttonVariants>[0]>

/** A link that looks like Youj UI's Button. The variants are a module of their own, so a server component renders it without shipping the Button. */
export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variants['variant']; size?: Variants['size'] }) {
  return <Link prefetch={false} className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
